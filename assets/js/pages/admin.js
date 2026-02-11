document.addEventListener('DOMContentLoaded', async ()=>{
  if(window.lucide){ lucide.createIcons(); }
  // Guard: require admin-auth flag
  const sess=localStorage.getItem('admin-auth');
  if(!sess){ location.href='admin-login.html'; return; }

  // Tabs (accessible): set aria-selected and use hidden/aria-hidden on panels
  const tabs=[...document.querySelectorAll('.tab')];
  function showTab(id){
    const panelId = id + '-panel';
    tabs.forEach(t=>{
      const isSelected = t.dataset.tab===id;
      t.classList.toggle('active', isSelected);
      t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
    document.querySelectorAll('main > section.section').forEach(s=>{
      const isActive = s.id === panelId;
      if(isActive){ s.removeAttribute('hidden'); s.setAttribute('aria-hidden', 'false'); }
      else { s.setAttribute('hidden', ''); s.setAttribute('aria-hidden', 'true'); }
    });
    // Move focus into panel for keyboard users (first interactive control)
    const panel = document.getElementById(panelId);
    if(panel){ const first = panel.querySelector('input, select, textarea, button, [tabindex]'); if(first) first.focus({preventScroll:true}); }
  }
  tabs.forEach(t=>t.addEventListener('click',()=>showTab(t.dataset.tab)));
  // Default to first tab (market if present)
  const defaultTab = (tabs.find(t=>t.dataset.tab==='market') || tabs[0]);
  if(defaultTab) showTab(defaultTab.dataset.tab);

  // MARKET CRUD
  const mFields={
    crop:document.getElementById('m-crop'), unit:document.getElementById('m-unit'), district:document.getElementById('m-district'), price:document.getElementById('m-price'), date:document.getElementById('m-date')
  };
  const mAdd=document.getElementById('m-add');
  const mTable=document.querySelector('#m-table tbody');
  const mExport=document.getElementById('m-export');
  const mImport=document.getElementById('m-import');

  let mEditId=null;
  async function loadMarket(){
    const rows=await db.all('market');
    rows.sort((a,b)=>a.date.localeCompare(b.date));
    mTable.innerHTML='';
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${r.id}</td><td>${r.crop}</td><td>${r.unit}</td><td>${r.district}</td><td>${r.price}</td><td>${r.date}</td>
        <td style="display:flex;gap:.25rem;flex-wrap:wrap">
          <button data-action="edit" data-id="${r.id}" class="btn"><i data-lucide="pencil"></i>Edit</button>
          <button data-action="del" data-id="${r.id}" class="btn"><i data-lucide="trash"></i>Delete</button>
        </td>`;
      mTable.appendChild(tr);
    });
    if(window.lucide) lucide.createIcons();
  }
  function mkMarketId(row){
    const d=(row.date||new Date().toISOString().slice(0,10));
    return `${(row.crop||'').toLowerCase()}-${d}`;
  }
  mAdd.addEventListener('click', async ()=>{
    const row={crop:mFields.crop.value.trim(), unit:mFields.unit.value.trim(), district:mFields.district.value.trim(), price:Number(mFields.price.value||0), date:mFields.date.value||new Date().toISOString().slice(0,10)};
    if(!row.crop){ notify.toast('Crop required'); return; }
    if(mEditId){
      // keep existing id unless crop/date changed
      row.id=mEditId;
      try{ await dataSync.upsert('market', row.id, row); }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to save'); } }
      notify.toast('Updated');
      mEditId=null; mAdd.innerHTML='<span class="material-symbols-outlined">add</span>Add';
    } else {
      row.id=mkMarketId(row);
      try{ await dataSync.upsert('market', row.id, row); }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to save'); } }
      notify.toast('Saved');
    }
    await loadMarket();
  });
  mTable.addEventListener('click', async (e)=>{
    const btn=e.target.closest('button[data-id]'); if(!btn) return;
    const action=btn.dataset.action;
    const id=btn.dataset.id;
    if(action==='del'){
      try{ await dataSync.remove('market', id); }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to delete'); } }
      await loadMarket();
      return;
    }
    if(action==='edit'){
      const rec=await db.get('market', id); if(!rec) return;
      mFields.crop.value=rec.crop||'';
      mFields.unit.value=rec.unit||'';
      mFields.district.value=rec.district||'';
      mFields.price.value=rec.price||'';
      mFields.date.value=rec.date||'';
      mEditId=rec.id;
      mAdd.innerHTML='<span class="material-symbols-outlined">save</span>Update';
    }
  });
  mExport.addEventListener('click', async ()=>{
    const rows=await db.all('market');
    const header=['id','crop','unit','district','price','date'];
    const csv=[header.join(',')].concat(rows.map(r=>header.map(h=>`"${(r[h]??'').toString().replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='market.csv'; a.click();
  });
  mImport.addEventListener('change', async (e)=>{
    const file=e.target.files[0]; if(!file) return;
    const text=await file.text();
    const lines=text.trim().split(/\r?\n/); const header=lines.shift().split(',').map(s=>s.replace(/^"|"$/g,''));
    for(const line of lines){
      const cols=line.split(',').map(s=>s.replace(/^"|"$/g,'').replace(/""/g,'"'));
      const obj={}; header.forEach((h,i)=>obj[h]=cols[i]);
      obj.price=Number(obj.price||0);
      try{ await dataSync.upsert('market', obj.id, obj); }catch(err){ console.error(err); }
    }
    notify.toast('Imported');
    await loadMarket();
    e.target.value='';
  });

  // WEATHER CRUD
  const wFields={id:document.getElementById('w-id'), district:document.getElementById('w-district'), summary:document.getElementById('w-summary'), min:document.getElementById('w-min'), max:document.getElementById('w-max')};
  const wAdd=document.getElementById('w-add');
  const wTable=document.querySelector('#w-table tbody');
  const wExport=document.getElementById('w-export');
  const wImport=document.getElementById('w-import');

  async function loadWeather(){
    const rows=await db.all('weather');
    wTable.innerHTML='';
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${r.id}</td><td>${r.district}</td><td>${r.summary}</td><td>${r.min}</td><td>${r.max}</td>
        <td><button data-id="${r.id}" class="btn"><i data-lucide="trash"></i>Delete</button></td>`;
      wTable.appendChild(tr);
    });
    if(window.lucide) lucide.createIcons();
  }
  wAdd.addEventListener('click', async ()=>{
    const row={id:wFields.id.value.trim(), district:wFields.district.value.trim(), summary:wFields.summary.value.trim(), min:Number(wFields.min.value||0), max:Number(wFields.max.value||0)};
    if(!row.id){ notify.toast('ID required'); return; }
    await db.put('weather',row); notify.toast('Saved'); await loadWeather();
  });
  wTable.addEventListener('click', async (e)=>{ const btn=e.target.closest('button[data-id]'); if(!btn) return; await db.del('weather',btn.dataset.id); await loadWeather(); });
  wExport.addEventListener('click', async ()=>{
    const rows=await db.all('weather'); const header=['id','district','summary','min','max'];
    const csv=[header.join(',')].concat(rows.map(r=>header.map(h=>`"${(r[h]??'').toString().replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='weather.csv'; a.click();
  });
  wImport.addEventListener('change', async (e)=>{
    const file=e.target.files[0]; if(!file) return; const text=await file.text();
    const lines=text.trim().split(/\r?\n/); const header=lines.shift().split(',').map(s=>s.replace(/^"|"$/g,''));
    for(const line of lines){ const cols=line.split(',').map(s=>s.replace(/^"|"$/g,'').replace(/""/g,'"')); const obj={}; header.forEach((h,i)=>obj[h]=cols[i]); obj.min=Number(obj.min||0); obj.max=Number(obj.max||0); await db.put('weather',obj); }
    notify.toast('Imported'); await loadWeather(); e.target.value='';
  });

  // PESTS CRUD
  const pFields={id:document.getElementById('p-id'), title:document.getElementById('p-title'), level:document.getElementById('p-level')};
  const pAdd=document.getElementById('p-add');
  const pTable=document.querySelector('#p-table tbody');
  const pExport=document.getElementById('p-export');
  const pImport=document.getElementById('p-import');
  async function loadPests(){
    const rows=await db.all('pests'); pTable.innerHTML='';
    rows.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.id}</td><td>${r.title}</td><td>${r.level}</td><td><button data-id="${r.id}" class="btn"><i data-lucide="trash"></i>Delete</button></td>`; pTable.appendChild(tr); }); if(window.lucide) lucide.createIcons();
  }
  pAdd.addEventListener('click', async ()=>{ const row={id:pFields.id.value.trim(), title:pFields.title.value.trim(), level:pFields.level.value}; if(!row.id){ notify.toast('ID required'); return; } await db.put('pests',row); notify.toast('Saved'); await loadPests(); });
  pTable.addEventListener('click', async (e)=>{ const btn=e.target.closest('button[data-id]'); if(!btn) return; await db.del('pests',btn.dataset.id); await loadPests(); });
  pExport.addEventListener('click', async ()=>{ const rows=await db.all('pests'); const header=['id','title','level']; const csv=[header.join(',')].concat(rows.map(r=>header.map(h=>`"${(r[h]??'').toString().replace(/"/g,'""')}"`).join(','))).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pests.csv'; a.click(); });
  pImport.addEventListener('change', async (e)=>{ const file=e.target.files[0]; if(!file) return; const text=await file.text(); const lines=text.trim().split(/\r?\n/); const header=lines.shift().split(',').map(s=>s.replace(/^"|"$/g,'')); for(const line of lines){ const cols=line.split(',').map(s=>s.replace(/^"|"$/g,'').replace(/""/g,'"')); const obj={}; header.forEach((h,i)=>obj[h]=cols[i]); await db.put('pests',obj); } notify.toast('Imported'); await loadPests(); e.target.value=''; });

  // MESSAGES view/clear
  const msgList=document.getElementById('msg-list'); const msgClear=document.getElementById('msg-clear');
  async function loadMsgs(){ const msgs=await db.all('messages'); msgs.sort((a,b)=>b.ts-a.ts); msgList.innerHTML=''; msgs.forEach(m=>{ const li=document.createElement('li'); const time=new Date(m.ts).toLocaleString(); li.innerHTML=`<span>${m.author||'User'}: ${m.text}</span><span>${time}</span>`; msgList.appendChild(li); }); }
  msgClear.addEventListener('click', async ()=>{ await db.clear('messages'); await loadMsgs(); notify.toast('Cleared'); });

  // USERS management (admin)
  const uTable=document.querySelector('#u-table tbody');
  const uAddBtn=document.getElementById('u-add');
  const uFields={ username:document.getElementById('u-username'), first:document.getElementById('u-first'), last:document.getElementById('u-last'), email:document.getElementById('u-email'), role:document.getElementById('u-role'), password:document.getElementById('u-password') };
  async function loadUsers(){
    try{
      const users=await db.all('users');
      uTable.innerHTML='';
      (users||[]).forEach(u=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${u.id}</td><td>${u.username}</td><td>${u.firstName||''}</td><td>${u.lastName||''}</td><td>${u.email||''}</td><td>${u.role||''}</td><td><button class="btn" data-uact="del" data-id="${u.id}"><i data-lucide="trash"></i>Delete</button></td>`;
        uTable.appendChild(tr);
      });
      if(window.lucide) lucide.createIcons();
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to load users'); } }
  }
  uAddBtn?.addEventListener('click', async ()=>{
    try{
      const payload={ username:uFields.username.value.trim(), firstName:uFields.first.value.trim(), lastName:uFields.last.value.trim(), email:uFields.email.value.trim(), password:uFields.password.value, role:uFields.role.value };
      const user=await window.auth.createUser(payload);
      if(user){ notify.toast('User added'); await loadUsers(); }
    }catch(err){ console.error(err); if(window.notify){ notify.toast(err.message||'Failed to add user'); } }
  });
  uTable?.addEventListener('click', async (e)=>{
    const btn=e.target.closest('button[data-uact]'); if(!btn) return;
    const id=btn.dataset.id;
    try{ await db.del('users', id); notify.toast('User deleted'); await loadUsers(); }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to delete user'); } }
  });

  // ANNOUNCEMENTS
  const aTitle=document.getElementById('a-title'); const aBody=document.getElementById('a-body'); const aMediaInput=document.getElementById('a-media'); const aAdd=document.getElementById('a-add'); const aList=document.getElementById('a-list');
  let aMediaFiles=[]; let aEditId=null; let aEditPrevMedia=[];
  aMediaInput?.addEventListener('change', (e)=>{ aMediaFiles=[...e.target.files||[]]; });
  function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
  function inferType(file){ const t=(file.type||'').toLowerCase(); if(t.startsWith('image/')) return 'image'; if(t.startsWith('audio/')) return 'audio'; if(t.startsWith('video/')) return 'video'; return 'doc'; }
  async function loadAnnouncements(){ const all=await db.all('announcements'); all.sort((a,b)=>b.ts-a.ts); aList.innerHTML=''; all.forEach(a=>{ const li=document.createElement('li'); const time=new Date(a.ts).toLocaleString(); li.innerHTML=`<span>${a.title}</span><span class="badge">${time}</span><span style="margin-left:auto;display:flex;gap:.25rem"><button class="btn" data-a="edit" data-id="${a.id}"><i data-lucide="pencil"></i>Edit</button><button class="btn" data-a="del" data-id="${a.id}"><i data-lucide="trash"></i>Delete</button></span>`; aList.appendChild(li); }); if(window.lucide) lucide.createIcons(); }
  async function uploadMediaFiles(files, annId){
    const out=[]; if(!files || !files.length) return out;
    for(const f of files){
      try{
        const t=inferType(f); const path=`announcements/${annId}/${Date.now()}-${(f.name||'file').replace(/\s+/g,'_')}`;
        const ref=window.fb?.storage?.ref(path); if(!ref) throw new Error('No storage');
        await ref.put(f);
        const url=await ref.getDownloadURL();
        out.push({type:t, url, name:f.name, storagePath:path});
      }catch(err){
        try{ const url=await fileToDataUrl(f); out.push({type:inferType(f), url, name:f.name}); }catch(_){ }
      }
    }
    return out;
  }
  async function broadcast(title,body){
    if('serviceWorker' in navigator){ const reg=await navigator.serviceWorker.getRegistration(); if(reg && Notification.permission==='granted'){ try{ await reg.showNotification(title,{body}); }catch(_){} } }
  }
  aAdd.addEventListener('click', async ()=>{
    const t=aTitle.value.trim(); const b=aBody.value.trim(); if(!t||!b){ notify.toast('Title and body required'); return; }
    try{
      const id=aEditId || ('a-'+Date.now());
      let media=[];
      const uploaded=await uploadMediaFiles(aMediaFiles, id);
      if(aEditId && aEditPrevMedia && aEditPrevMedia.length && uploaded.length===0){ media=aEditPrevMedia; }
      else { media=uploaded; }
      const rec={id, title:t, body:b, ts:Date.now(), media};
      await dataSync.upsert('announcements', rec.id, rec);
      await loadAnnouncements();
      notify.toast(aEditId ? 'Updated' : 'Published');
      await broadcast('Agronet Announcement', t);
      aTitle.value=''; aBody.value=''; if(aMediaInput) aMediaInput.value=''; aMediaFiles=[]; aEditId=null; aEditPrevMedia=[]; aAdd.innerHTML='<span class="material-symbols-outlined">add</span>Add';
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to publish'); } }
  });
  aList.addEventListener('click', async (e)=>{
    const btn=e.target.closest('button[data-a]'); if(!btn) return;
    const id=btn.dataset.id; const act=btn.dataset.a;
    if(act==='edit'){
      try{ const rec=await db.get('announcements', id); if(!rec) return; aTitle.value=rec.title||''; aBody.value=rec.body||''; aEditId=rec.id; aEditPrevMedia=rec.media||[]; aAdd.innerHTML='<span class="material-symbols-outlined">save</span>Update'; }catch(err){ console.error(err); }
      return;
    }
    if(act==='del'){
      try{
        const rec=await db.get('announcements', id);
        try{ await dataSync.remove('announcements', id); }catch(err){ console.error(err); }
        if(rec && rec.media && rec.media.length && window.fb?.storage){
          for(const m of rec.media){ if(m.storagePath){ try{ await window.fb.storage.ref(m.storagePath).delete(); }catch(_){ } } }
        }
        await loadAnnouncements(); notify.toast('Deleted');
      }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to delete'); } }
    }
  });

  // ADMIN SETTINGS
  const sPin=document.getElementById('s-pin'); const sSave=document.getElementById('s-save'); const sLogout=document.getElementById('s-logout');
  async function savePin(){ const cfg=(await db.get('settings','admin'))||{id:'admin'}; cfg.pin=sPin.value.trim()||'1234'; await db.put('settings',cfg); notify.toast('PIN saved'); }
  sSave.addEventListener('click', savePin);
  sLogout.addEventListener('click', ()=>{ localStorage.removeItem('admin-auth'); location.href='/pages/admin-login.html'; });

  // one-time migration to Firestore for existing local data
  async function migrateLocalToFirestore(){
    try{
      const mk=['market','announcements'];
      for(const store of mk){
        let rows=[]; try{ rows=await db.all(store); }catch(_){ rows=[]; }
        for(const r of rows){
          try{ await dataSync.upsert(store, r.id, r); }catch(err){ console.error('migrate fail', store, r.id, err); }
        }
      }
    }catch(err){ console.error(err); }
  }
  // initial loads
  await Promise.all([loadMarket(), loadWeather(), loadPests(), loadMsgs(), loadAnnouncements(), loadUsers()]);
  // fire-and-forget migration
  try{ migrateLocalToFirestore(); }catch(_){ }
});
