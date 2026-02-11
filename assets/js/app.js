document.addEventListener('DOMContentLoaded',()=>{
  if(window.lucide){ window.lucide.createIcons(); }
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  if(window.i18n){ window.i18n.initI18n(); }
  if('serviceWorker' in navigator){
    setTimeout(()=>{ if(window.notify){ notify.toast('Ready for offline use'); } },600);
  }
  // seed admin account locally if missing
  try{ if(window.auth && window.auth.seedAdmin){ window.auth.seedAdmin(); } }catch(_){ }
  function basePath(){
    try{
      if(location.hostname.endsWith('github.io')){
        const parts=location.pathname.split('/').filter(Boolean);
        if(parts.length>0){ return '/' + parts[0] + '/'; }
      }
    }catch(_){ }
    return '/';
  }
  function prefix(p){
    try{
      const bp=basePath();
      if(bp==='/' ) return p;
      const clean=p.startsWith('/')? p.slice(1):p;
      return bp + clean;
    }catch(_){ return p; }
  }
  function setupDataSync(){
    if(!window.fb || !window.fb.db || !window.db){ return; }
    const fsdb=window.fb.db;
    async function upsert(collection, id, data){
      try{
        const docRef = id ? fsdb.collection(collection).doc(id) : fsdb.collection(collection).doc();
        const newId = id || docRef.id;
        const uid = (window.fb && window.fb.auth && window.fb.auth.currentUser) ? window.fb.auth.currentUser.uid : null;
        const payload = { id:newId, ownerId: (data && data.ownerId) ? data.ownerId : uid, ...data, _pending:false };
        await docRef.set(payload, { merge:true });
        try{ await window.db.put(collection, payload); }catch(_){ /* ignore */ }
        return newId;
      }catch(err){
        console.error(err);
        const uid = (window.fb && window.fb.auth && window.fb.auth.currentUser) ? window.fb.auth.currentUser.uid : null;
        const fallback = { id: id || (data && data.id) || String(Date.now()), ownerId: (data && data.ownerId) ? data.ownerId : uid, ...data, _pending:true };
        try{ await window.db.put(collection, fallback); }catch(_){ /* ignore */ }
        if(window.notify){ notify.toast('Saved locally, will sync when online'); }
        return fallback.id;
      }
    }
    async function remove(collection, id){
      try{
        await fsdb.collection(collection).doc(id).delete();
        try{ await window.db.del(collection, id); }catch(_){ /* ignore */ }
        return true;
      }catch(err){
        console.error(err);
        // mark tombstone pending
        try{ await window.db.put(collection, { id, _deleted:true, _pending:true }); }catch(_){ /* ignore */ }
        if(window.notify){ notify.toast('Delete saved locally, will sync later'); }
        return false;
      }
    }
    async function retryPending(){
      try{
        const stores=['announcements','market'];
        for(const store of stores){
          let all=[]; try{ all=await window.db.all(store); }catch(_){ all=[]; }
          for(const item of all){
            if(!item || !item._pending) continue;
            try{
              if(item._deleted){ await fsdb.collection(store).doc(item.id).delete(); await window.db.del(store, item.id); }
              else { const {_pending,_deleted, ...clean}=item; await fsdb.collection(store).doc(item.id).set({id:item.id, ...clean, _pending:false}, {merge:true}); await window.db.put(store, {id:item.id, ...clean, _pending:false}); }
            }catch(err){ /* stay pending */ }
          }
        }
      }catch(err){ console.error(err); }
    }
    window.dataSync={ upsert, remove, retryPending };
    window.addEventListener('online', ()=>{ try{ retryPending(); }catch(_){ } });
  }

  // Initialize Firebase (compat) using CDN scripts
  async function loadFirebase(){
    try{
      if(window.firebase && window.firebase.app){ return await initFirebase(); }
      const urls=[
      'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics-compat.js',
      'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js',
      'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage-compat.js',
      'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js'
    ];
      for(const src of urls){ await injectScript(src); }
      await initFirebase();
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to load Firebase'); } }
  }
  function injectScript(src){
    return new Promise((resolve,reject)=>{
      if(document.querySelector(`script[src="${src}"]`)) return resolve();
      const s=document.createElement('script'); s.src=src; s.defer=true; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
    });
  }
  async function initFirebase(){
    if(window.fb && window.fb.app) return window.fb;
    const firebaseConfig={
      apiKey:"AIzaSyBCV6OtQAD_unS_d6QlquH3E7reluOKB1I",
      authDomain:"hostelhub-8da49.firebaseapp.com",
      projectId:"hostelhub-8da49",
      storageBucket:"hostelhub-8da49.appspot.com",
      messagingSenderId:"879992046053",
      appId:"1:879992046053:web:38a8f8dca95dff273aef0c",
      measurementId:"G-NJYVEBMZ43"
    };
    try{
      const app=firebase.initializeApp(firebaseConfig);
      let analytics=null; try{ analytics=firebase.analytics(); }catch(_){ /* analytics optional */ }
      const db=firebase.firestore();
      try{ await firebase.firestore().enablePersistence({synchronizeTabs:true}); }catch(err){ console.warn('Persistence failed or already enabled', err); }
      const storage=firebase.storage();
      const auth=firebase.auth();
      // Ensure we have an authenticated user (anonymous) for rules that require auth
      try{
        if(!auth.currentUser){ await auth.signInAnonymously(); }
      }catch(err){ console.warn('Anonymous sign-in failed', err); }
      window.fb={app, analytics, db, storage, auth};
      try{ startFirestoreMirrors(); }catch(err){ console.warn('Mirror start failed', err); }
      try{ setupDataSync(); }catch(err){ console.warn('DataSync setup failed', err); }
      return window.fb;
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to init Firebase'); } return null; }
  }
  function startFirestoreMirrors(){
    if(!window.fb || !window.fb.db){ return; }
    const {db:fsdb}=window.fb;
    if(!window.db){ return; }
    // Announcements mirror
    try{
      fsdb.collection('announcements').onSnapshot(async (snap)=>{
        try{
          const changes=snap.docChanges();
          for(const ch of changes){
            const id=ch.doc.id; const data={id, ...ch.doc.data()};
            if(ch.type==='removed'){ try{ await window.db.del('announcements', id); }catch(_){} }
            else { try{ await window.db.put('announcements', data); }catch(_){} }
          }
        }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to mirror announcements'); } }
      }, (err)=>{ console.error(err); });
    }catch(err){ console.error(err); }
    // Market mirror
    try{
      fsdb.collection('market').onSnapshot(async (snap)=>{
        try{
          const changes=snap.docChanges();
          for(const ch of changes){
            const id=ch.doc.id; const data={id, ...ch.doc.data()};
            if(ch.type==='removed'){ try{ await window.db.del('market', id); }catch(_){} }
            else { try{ await window.db.put('market', data); }catch(_){} }
          }
        }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to mirror market'); } }
      }, (err)=>{ console.error(err); });
    }catch(err){ console.error(err); }
  }
  loadFirebase().catch(err=>{ console.error(err); if(window.notify){ notify.toast('Firebase error'); } });

  // Load accessibility helpers
  try{ await injectScript(prefix('assets/js/tabs.js')); }catch(_){ }
  try{ await injectScript(prefix('assets/js/form-validate.js')); }catch(_){ }

  // Initialize AOS (animations) unless user prefers reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  async function initAOS(){
    if(prefersReduced) return;
    try{ await injectScript('https://unpkg.com/aos@2.3.1/dist/aos.js'); if(window.AOS){ AOS.init({ duration: 600, once: true, disable: prefersReduced }); } }catch(err){ console.warn('AOS failed to load', err); }
  }
  initAOS();

  // Count-up animation for stat numbers (respects reduced motion)
  function animateCount(el, target, duration=1100){
    if(prefersReduced){ el.textContent = target.toLocaleString(); return; }
    const start = 0; const startTime = performance.now();
    function step(now){ const progress = Math.min((now - startTime)/duration, 1); const value = Math.floor(progress * (target - start) + start); el.textContent = value.toLocaleString(); if(progress < 1) requestAnimationFrame(step); else el.textContent = target.toLocaleString(); }
    requestAnimationFrame(step);
  }
  const countObserver = new IntersectionObserver(entries=>{ entries.forEach(entry=>{ if(entry.isIntersecting){ const el=entry.target; const target = Number(el.dataset.count) || 0; if(!el.dataset.animated){ animateCount(el, target); el.dataset.animated = '1'; } } }); }, { threshold: 0.45 });
  document.querySelectorAll('.stat-number[data-count]').forEach(el=>countObserver.observe(el));

  // Accessibility toolbar (font scale and contrast)
  function applyFontScale(scale){ document.documentElement.style.fontSize = (16 * scale) + 'px'; localStorage.setItem('fontScale', scale); }
  function applyHighContrast(enabled){ document.documentElement.classList.toggle('theme-high-contrast', !!enabled); localStorage.setItem('highContrast', enabled ? '1' : ''); }
  // restore preferences
  try{ const fs = parseFloat(localStorage.getItem('fontScale')) || 1; applyFontScale(fs); const hc = localStorage.getItem('highContrast') === '1'; applyHighContrast(hc); }catch(_){ }
  // bind buttons
  const inc = document.getElementById('a11y-increase'); const dec = document.getElementById('a11y-decrease'); const con = document.getElementById('a11y-contrast');
  if(inc) inc.addEventListener('click', ()=>{ let s = parseFloat(localStorage.getItem('fontScale')) || 1; s = Math.min(1.3, +(s + 0.05).toFixed(2)); applyFontScale(s); });
  if(dec) dec.addEventListener('click', ()=>{ let s = parseFloat(localStorage.getItem('fontScale')) || 1; s = Math.max(0.85, +(s - 0.05).toFixed(2)); applyFontScale(s); });
  if(con) con.addEventListener('click', ()=>{ const cur = localStorage.getItem('highContrast') === '1'; applyHighContrast(!cur); con.setAttribute('aria-pressed', (!cur).toString()); });

  // Language selector injection
  function createLangSelector(){
    const container = document.querySelector('.nav-menu') || document.querySelector('.page-menu');
    if(!container) return;
    if(document.getElementById('lang-select') || document.querySelector('.lang-select-wrap')) return;
    const wrap = document.createElement('div'); wrap.className = 'lang-select-wrap'; wrap.style.display = 'flex'; wrap.style.alignItems = 'center'; wrap.style.gap = '0.4rem';
    const select = document.createElement('select'); select.id = 'lang-select'; select.className = 'lang-select'; select.setAttribute('aria-label', 'Language');
    const opts = [ ['en','English'], ['rr','Runyankore/Rukiga'], ['lg','Luganda'] ];
    const current = localStorage.getItem('agronet-lang') || 'en';
    opts.forEach(([v,label])=>{ const o = document.createElement('option'); o.value=v; o.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('lang_'+v) || label : label; select.appendChild(o); });
    select.value = current;
    select.addEventListener('change', (e)=>{ const val = e.target.value; try{ localStorage.setItem('agronet-lang', val); }catch(_){ } if(window.i18n && window.i18n.loadLocale){ window.i18n.loadLocale(val); } });
    wrap.appendChild(select);
    container.appendChild(wrap);
    // Update option labels when i18n applied (so names are localized)
    const mo = new MutationObserver(()=>{ document.querySelectorAll('#lang-select option').forEach(o=>{ const vv=o.value; const tkey='lang_'+vv; try{ o.textContent = (window.i18n && window.i18n.t) ? window.i18n.t(tkey) || o.textContent : o.textContent; }catch(_){ } }); });
    mo.observe(document.documentElement, { attributes: true });
  }
  // create language selector once translations are loaded
  try{ createLangSelector(); }catch(_){ }

  /* Additional controls behavior added for homepage */
  function applyThemeChoice(choice){
    // Handle 'system' by checking prefers-color-scheme
    if(choice === 'system'){
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('theme-dark', prefersDark);
      applyHighContrast(false);
      localStorage.setItem('agronet-theme', 'system');
      return;
    }
    document.documentElement.classList.remove('theme-dark');
    if(choice === 'dark') document.documentElement.classList.add('theme-dark');
    if(choice === 'high-contrast') applyHighContrast(true); else applyHighContrast(false);
    localStorage.setItem('agronet-theme', choice);
  }

  // Restore theme and animation preferences
  try{
    const theme = localStorage.getItem('agronet-theme') || 'system';
    const anim = localStorage.getItem('agronet-animations');
    // always apply theme (system will be evaluated inside)
    if(theme) applyThemeChoice(theme);
    // animations: default on; if stored '0' turn them off
    if(anim === '0'){
      document.documentElement.classList.add('no-animations');
      const at = document.getElementById('anim-toggle'); if(at) at.checked = false;
    } else {
      const at = document.getElementById('anim-toggle'); if(at) at.checked = true;
    }
  }catch(_){ }
  
  // Restore notification toggle state if permission already granted or stored
  try{
    const nt = document.getElementById('notify-toggle');
    if(nt){ const stored = localStorage.getItem('agronet-notifications'); const granted = (typeof Notification !== 'undefined' && Notification.permission === 'granted'); if(granted || stored === '1'){ nt.setAttribute('aria-pressed','true'); } else { nt.setAttribute('aria-pressed','false'); } }
  }catch(_){ }


  // Bind new header controls
  const themeSelect = document.getElementById('theme-select'); if(themeSelect){ themeSelect.value = localStorage.getItem('agronet-theme') || 'system'; themeSelect.addEventListener('change', (e)=>{ applyThemeChoice(e.target.value); }); }

  const animToggle = document.getElementById('anim-toggle'); if(animToggle){ animToggle.addEventListener('change', (e)=>{ const enabled = e.target.checked; localStorage.setItem('agronet-animations', enabled ? '1' : '0'); if(!enabled){ document.documentElement.classList.add('no-animations'); if(window.AOS && window.AOS.refresh) window.AOS.refresh(); } else { document.documentElement.classList.remove('no-animations'); if(window.AOS && window.AOS.init) window.AOS.init({ duration: 600, once: true }); } }); }

  const notifyToggle = document.getElementById('notify-toggle'); if(notifyToggle){ notifyToggle.addEventListener('click', async ()=>{ try{ if(!('Notification' in window)) return alert('Notifications not supported'); if(Notification.permission === 'granted'){ localStorage.setItem('agronet-notifications','1'); notifyToggle.setAttribute('aria-pressed','true'); if(window.notify) notify.toast('Notifications already granted'); } else { const p = await Notification.requestPermission(); if(p === 'granted'){ localStorage.setItem('agronet-notifications','1'); notifyToggle.setAttribute('aria-pressed','true'); new Notification('Kigezi Agronet', { body: 'Notifications enabled' }); if(window.notify) notify.toast('Notifications enabled'); } else { localStorage.removeItem('agronet-notifications'); notifyToggle.setAttribute('aria-pressed','false'); if(window.notify) notify.toast('Notifications blocked'); } } }catch(err){ console.error(err); } }); }

  // Save favorites
  const saveFav = document.getElementById('save-fav'); if(saveFav){ saveFav.addEventListener('click', ()=>{ try{ const q = document.getElementById('market-search-input').value || ''; const crop = document.getElementById('crop-filter').value || ''; const district = document.getElementById('district-filter').value || ''; const label = q || (crop + (district ? ' — '+district : '')) || (crop || district) || 'Quick search'; const favs = JSON.parse(localStorage.getItem('agronet-favorites')||'[]'); favs.push({label, q, crop, district, id: Date.now()}); localStorage.setItem('agronet-favorites', JSON.stringify(favs)); if(window.notify) notify.toast('Saved favorite'); }catch(err){ console.error(err); } }); }

  // Feedback modal
  const fbOpen = document.getElementById('open-feedback'); const fbModal = document.getElementById('feedback-modal'); if(fbOpen && fbModal){ function closeModal(){ fbModal.setAttribute('aria-hidden','true'); fbModal.classList.remove('active'); try{ fbOpen.focus(); }catch(_){ } }
    document.querySelectorAll('.modal-close').forEach(b=>b.addEventListener('click', closeModal)); fbOpen.addEventListener('click', ()=>{ fbModal.setAttribute('aria-hidden','false'); fbModal.classList.add('active'); document.getElementById('fb-name').focus(); });
    // close on Escape
    fbModal.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ closeModal(); } });
    // click backdrop to close
    fbModal.addEventListener('click', (e)=>{ if(e.target === fbModal) closeModal(); });
    document.getElementById('feedback-form').addEventListener('submit', (e)=>{ e.preventDefault(); const name = document.getElementById('fb-name').value || 'Anonymous'; const email = document.getElementById('fb-email').value || ''; const msg = document.getElementById('fb-msg').value || ''; // simple optimization: open mailto
      const subject = encodeURIComponent('Kigezi Agronet Feedback from ' + name);
      const body = encodeURIComponent('Feedback:\n' + msg + '\n\nContact: ' + email);
      window.location.href = 'mailto:feedback@kigeziagronet.example?subject=' + subject + '&body=' + body;
      closeModal(); if(window.notify) notify.toast('Opening email client to send feedback'); }); }

  // Reset preferences
  const resetBtn = document.getElementById('reset-prefs'); if(resetBtn){ resetBtn.addEventListener('click', ()=>{ ['fontScale','highContrast','agronet-theme','agronet-animations','agronet-notifications','agronet-favorites','agronet-lang'].forEach(k=>localStorage.removeItem(k)); applyFontScale(1); applyHighContrast(false); document.documentElement.classList.remove('no-animations'); document.documentElement.classList.remove('theme-dark'); if(window.notify) notify.toast('Preferences reset'); try{ if(document.getElementById('theme-select')) document.getElementById('theme-select').value='system'; if(document.getElementById('anim-toggle')) document.getElementById('anim-toggle').checked=true; if(document.getElementById('notify-toggle')) document.getElementById('notify-toggle').setAttribute('aria-pressed','false'); }catch(_){ } }); }

  // Favorites dropdown (simple header display)
  (function renderFavs(){ const header = document.querySelector('.header-controls'); if(!header) return; const wrap = document.createElement('div'); wrap.className='favs-dropdown'; wrap.style.marginLeft='6px'; const btn = document.createElement('button'); btn.className='btn btn-sm btn-outline'; btn.textContent='★'; btn.title='Favorites'; btn.setAttribute('aria-expanded','false'); const menu = document.createElement('div'); menu.className='favs-list'; const update = ()=>{ const favs = JSON.parse(localStorage.getItem('agronet-favorites')||'[]'); menu.innerHTML=''; if(!favs.length){ const p = document.createElement('p'); p.className='favs-empty'; p.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('fav_empty') || 'No favorites' : 'No favorites'; menu.appendChild(p); } else { favs.slice(-6).reverse().forEach(f=>{ const p = document.createElement('p'); const a = document.createElement('a'); a.href='pages/market.html?'+ new URLSearchParams({ q:f.q||'', crop:f.crop||'', district:f.district||'' }).toString(); a.textContent = f.label; a.style.textDecoration='none'; a.style.color='var(--primary)'; p.appendChild(a); menu.appendChild(p); }); }
      };
    btn.addEventListener('click', ()=>{ menu.classList.toggle('active'); btn.setAttribute('aria-expanded', menu.classList.contains('active').toString()); update(); });
    // close favorites when clicking outside
    document.addEventListener('click', (e)=>{ if(!e.target.closest('.favs-dropdown')){ menu.classList.remove('active'); btn.setAttribute('aria-expanded','false'); } });
    wrap.appendChild(btn); wrap.appendChild(menu); header.appendChild(wrap); })();

});
