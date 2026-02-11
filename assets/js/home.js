document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (window.dataApi && typeof window.dataApi.seedIfEmpty === 'function') {
      await window.dataApi.seedIfEmpty();
    }
  } catch (e) { /* no-op */ }

  async function getCurrentUserId(){
    // Try settings prefs, then localStorage fallback
    try{
      const prefs = await db.get('settings','prefs');
      if(prefs && prefs.currentUserId) return prefs.currentUserId;
    }catch{}
    const fallback = localStorage.getItem('agronet-current-user-id');
    if(fallback) return fallback;
    // set a demo user id for now (first farmer)
    localStorage.setItem('agronet-current-user-id','farmer-1');
    return 'farmer-1';
  }

  async function seedProfilesIfEmpty() {
    try{
      const existing = await db.all('profiles');
      if (existing.length > 0) return;
      const now = Date.now();
      const samples = [
      {id:'farmer-1', role:'farmer', ownerId:'farmer-1', name:'Kato Farms', headline:'Fresh Maize for sale', crop:'Maize', quantity:'2 tons', contact:'+256 700 123456', date:now-3600_000, image:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop'},
      {id:'farmer-2', role:'farmer', ownerId:'farmer-2', name:'Ninsiima Ruth', headline:'Beans ready for market', crop:'Beans', quantity:'800 Kg', contact:'+256 772 111222', date:now-7200_000},
      {id:'buyer-1', role:'buyer', ownerId:'buyer-1', name:'Kabale Foods Ltd', headline:'Looking for Bananas', crop:'Bananas', quantity:'500 Bunches', contact:'+256 701 555777', date:now-5400_000},
      {id:'log-1', role:'logistics', ownerId:'log-1', name:'Rwenzori Transporters', headline:'Truck available Kabale ▶ Kampala', category:'Haulage', contact:'+256 703 999888', date:now-1800_000},
      {id:'other-1', role:'extension', ownerId:'officer-1', name:'District Officer', headline:'Pest management clinic Friday', category:'Announcement', contact:'DoA Kabale', date:now-900_000}
      ];
      for (const s of samples) await db.put('profiles', s);
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to seed profiles'); } }
  }

  async function getProfiles() {
    try {
      await seedProfilesIfEmpty();
      const all = await db.all('profiles');
      return Array.isArray(all) ? all.sort((a,b)=> (b.date||0)-(a.date||0)) : [];
    } catch (err){ console.error(err); if(window.notify){ notify.toast('Failed to load profiles'); } return []; }
  }

  let CURRENT_USER_ID = await getCurrentUserId();

  function renderList(containerId, items, icon) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!items || items.length === 0) {
      el.innerHTML = '<li class="empty">No posts yet</li>';
      return;
    }
    const cap = limits[containerId] ?? 6;
    el.innerHTML = items.slice(0, cap).map(p => {
      const img = p.image || (window.uiHelpers ? window.uiHelpers.getCropImage(p.crop || p.category || p.headline || 'farm') : '');
      const qty = p.quantity ? ` (${p.quantity})` : '';
      const canDelete = (p.role||'').toLowerCase() === 'farmer' && (p.ownerId||p.id) === CURRENT_USER_ID;
      const locLine = [p.district||'', (p.lat&&p.lng)?`(${p.lat}, ${p.lng})`:'' ].filter(Boolean).join(' ');
      return `
      <li>
        <img class="thumb" loading="lazy" fetchpriority="low" src="${img}" alt="${(p.crop||p.category||'Post')} image"/>
        <div class="post-meta">
          <span class="material-symbols-outlined">${icon}</span>
          <div>
            <strong>${p.headline || p.name || 'Post'}</strong>
            <div class="muted">${p.contact || ''} ${locLine?`• ${locLine}`:''}</div>
          </div>
        </div>
        <div class="post-right">${p.crop || p.category || ''}${qty}</div>
        <div class="post-actions">
          ${canDelete ? `<button class="btn icon danger" data-action="delete" data-id="${p.id}" title="Delete"><span class="material-symbols-outlined">delete</span></button>` : ''}
        </div>
      </li>
    }).join('');
  }

  const limits = { 'posts-farmers': 6, 'posts-buyers': 6, 'posts-logistics': 6, 'posts-others': 6 };

  function segment(profiles){
    const farmers = profiles.filter(p => (p.role||'').toLowerCase() === 'farmer');
    const buyers = profiles.filter(p => (p.role||'').toLowerCase() === 'buyer');
    const logistics = profiles.filter(p => (p.role||'').toLowerCase() === 'logistics');
    const others = profiles.filter(p => !['farmer','buyer','logistics'].includes((p.role||'').toLowerCase()));
    return {farmers,buyers,logistics,others};
  }

  async function renderAll(){
    try{
      const profiles = await getProfiles();
      const {farmers,buyers,logistics,others} = segment(profiles);
      renderList('posts-farmers', farmers, 'agriculture');
      renderList('posts-buyers', buyers, 'shopping_bag');
      renderList('posts-logistics', logistics, 'local_shipping');
      renderList('posts-others', others, 'campaign');
      bindActions({farmers,buyers,logistics,others});
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to render lists'); } }
  }

  function bindActions(groups){
    document.querySelectorAll('.show-more').forEach(btn=>{
      btn.onclick = () => {
        try{
          const target = btn.getAttribute('data-target');
          limits[target] = (limits[target]||6) + 6;
          const all = { 'posts-farmers': groups.farmers, 'posts-buyers': groups.buyers, 'posts-logistics': groups.logistics, 'posts-others': groups.others };
          const iconMap = { 'posts-farmers':'agriculture','posts-buyers':'shopping_bag','posts-logistics':'local_shipping','posts-others':'campaign' };
          renderList(target, all[target]||[], iconMap[target]);
          bindDeleteHandlers();
        }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to load more'); } }
      };
    });
    bindDeleteHandlers();
  }

  function bindDeleteHandlers(){
    document.querySelectorAll('button[data-action="delete"]').forEach(btn=>{
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        try {
          const rec = await db.get('profiles', id);
          if(!rec || (rec.ownerId||rec.id) !== CURRENT_USER_ID){
            if(window.notify){ notify.toast('You cannot delete this post'); }
            return;
          }
          await db.del('profiles', id);
          await renderAll();
          if(window.notify){ notify.toast('Post deleted'); }
        } catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to delete'); } }
      };
    });
  }

  await renderAll();

  // Announcements + Posts updates grid
  async function getAnnouncements(){
    try{ return (await db.all('announcements')) || []; }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to load announcements'); } return []; }
  }

  function mediaBadge(item){
    if(!item || !item.media || !item.media.length) return '';
    const m = item.media[0];
    const t = (m.type||'').toLowerCase();
    const icon = t==='video' ? 'movie' : t==='audio' ? 'audio_file' : t==='doc' ? 'description' : 'image';
    return `<span class="badge media"><span class="material-symbols-outlined">${icon}</span> ${t||'file'}</span>`;
  }

  function mediaEmbed(item){
    if(!item || !item.media || !item.media.length) return '';
    const m = item.media[0];
    const t = (m.type||'').toLowerCase();
    const src = m.url||m.src||'';
    if(!src) return '';
if(t==='audio') return `<audio class="upd-player" controls src="${src}"></audio>`;
    if(t==='video') return `<video class="upd-player" controls preload="metadata" playsinline muted poster="${item.img||''}" src="${src}"></video>`;
    if(t==='doc') return `<a class="upd-doc" href="${src}" target="_blank" rel="noopener">Open document</a>`;
    return '';
  }

  async function renderUpdatesGrid(){
    try{
      const [profiles, anns] = [await getProfiles(), await getAnnouncements()];
      const updates = [];
      profiles.forEach(p=> updates.push({
        id:'p-'+p.id, kind:'post', role:p.role, title:p.headline||p.name||'Post', sub:p.contact||'', img: p.image || (window.uiHelpers?window.uiHelpers.getCropImage(p.crop||p.category||p.headline||'farm'):''), date:p.date||0, media:p.media||[]
      }));
      anns.forEach(a=> updates.push({
        id:'a-'+(a.id||a.ts), kind:'announcement', role:'announcement', title:a.title, sub:a.body||'', img: 'https://images.unsplash.com/photo-1520975922203-b2f28e93cbec?q=80&w=800&auto=format&fit=crop', date:a.date||a.ts||0, type:a.type||'notice', media:a.media||[]
      }));
      updates.sort((a,b)=> (b.date||0)-(a.date||0));
      const grid = document.getElementById('updates-grid');
      if(!grid) return;
      const max = 25;
      grid.innerHTML = updates.slice(0,max).map(u=>{
        const tag = u.kind==='announcement' ? 'Announcement' : (u.role||'').toString().charAt(0).toUpperCase()+ (u.role||'').toString().slice(1);
        const badge = u.kind==='announcement' ? `<span class="badge ann">${u.type||'Notice'}</span>` : '';
        return `
        <article class="upd-card fade-in" tabindex="0">
          <div class="upd-media" style="background-image:url('${u.img}')"></div>
          <div class="upd-body">
            <div class="upd-top"><span class="badge role">${tag}</span>${badge}${mediaBadge(u)}</div>
            <h4 class="upd-title">${u.title}</h4>
            <p class="upd-sub">${u.sub}</p>
            ${mediaEmbed(u)}
          </div>
        </article>`;
      }).join('');
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to render updates'); } }
  }

  await renderUpdatesGrid();
  // Periodically refresh updates to approximate real-time
  setInterval(renderUpdatesGrid, 8000);
  try{
    if(window.fb && window.fb.db){
      window.fb.db.collection('announcements').onSnapshot(()=>{
        try{ renderUpdatesGrid(); }catch(err){ console.error(err); }
      }, (err)=>{ console.error(err); });
    }
  }catch(err){ console.error(err); }
  // Initialize map if present
  async function initMap(){
    const mapEl = document.getElementById('map');
    if(!mapEl || !window.L) return;
    try{
      const map = L.map('map');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
      const meta = document.getElementById('map-meta');
      function updateMeta(lat,lng,acc){ if(meta){ meta.textContent = `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}${acc?` • ±${Math.round(acc)}m`:''}`; } }
      let marker;
      function setMarker(lat,lng){ if(marker){ marker.setLatLng([lat,lng]); } else { marker=L.marker([lat,lng]).addTo(map); } }
      function setView(lat,lng){ map.setView([lat,lng], 13); }
      if(navigator.geolocation){
        const opts={enableHighAccuracy:true, maximumAge:0, timeout:10000};
        navigator.geolocation.getCurrentPosition(pos=>{
          const {latitude:lat, longitude:lng, accuracy:acc} = pos.coords;
          setView(lat,lng); setMarker(lat,lng); updateMeta(lat,lng,acc);
        }, (err)=>{
          console.error(err);
          if(window.notify){ notify.toast('Location unavailable. Please enable GPS and permissions'); }
        }, opts);
        try{
          navigator.geolocation.watchPosition(pos=>{
            const {latitude:lat, longitude:lng, accuracy:acc} = pos.coords;
            setMarker(lat,lng); updateMeta(lat,lng,acc);
          }, (err)=>{ console.error(err); }, opts);
        }catch(_){ /* ignore */ }
      } else {
        if(window.notify){ notify.toast('Geolocation not supported on this device'); }
      }
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Map failed to load'); } }
  }
  await initMap();
});
