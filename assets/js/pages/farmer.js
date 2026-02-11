document.addEventListener('DOMContentLoaded', async ()=>{
  if(window.lucide){ lucide.createIcons(); }
  const nameEl=document.getElementById('name');
  const districtEl=document.getElementById('district');
  const cropsEl=document.getElementById('crops');
  const latEl=document.getElementById('lat');
  const lngEl=document.getElementById('lng');
  const photoInput=document.getElementById('photo');
  const photoPreview=document.getElementById('photoPreview');
  const geoBtn=document.getElementById('geo');
  const saveBtn=document.getElementById('save');

  // Require login and farmer role
  let currentUser=null;
  try{
    if(!window.auth){ location.href='login.html'; return; }
    currentUser = await window.auth.requireRole('farmer');
    if(!currentUser){ location.href='login.html'; return; }
  }catch(_){ location.href='login.html'; return; }

  const POST_ID = `post-${currentUser.id}`;

  async function load(){
    try{
      const prof=await db.get('profiles', POST_ID);
      if(prof){
        nameEl.value=prof.name||'';
        districtEl.value=prof.district||'';
        cropsEl.value=prof.crops||prof.crop||'';
        if(prof.photo){ photoPreview.src=prof.photo; }
        latEl.value=prof.lat||'';
        lngEl.value=prof.lng||'';
      }
    }catch(err){ console.error(err); if(window.notify) notify.toast('Failed to load farmer profile'); }
  }
  function readFileAsDataURL(file){
    return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
  }
  photoInput.addEventListener('change', async (e)=>{
    try{
      const f=e.target.files[0]; if(!f) return;
      const data=await readFileAsDataURL(f);
      photoPreview.src=data;
    }catch(err){ console.error(err); if(window.notify) notify.toast('Failed to read photo'); }
  });
  geoBtn.addEventListener('click',()=>{
    try{
      if(!navigator.geolocation){ if(window.notify) notify.toast('Geolocation not supported'); return; }
      navigator.geolocation.getCurrentPosition(pos=>{
        latEl.value=pos.coords.latitude.toFixed(6);
        lngEl.value=pos.coords.longitude.toFixed(6);
      },()=>{ if(window.notify) notify.toast('Unable to get location'); });
    }catch(err){ console.error(err); if(window.notify) notify.toast('Location error'); }
  });

  saveBtn.addEventListener('click', async ()=>{
    try{
      const prof={
        id: POST_ID, role:'farmer', ownerId: currentUser.id,
        name:nameEl.value.trim(), district:districtEl.value.trim(), crops:cropsEl.value.trim(), crop: cropsEl.value.trim(),
        lat:latEl.value.trim(), lng:lngEl.value.trim(),
        photo:photoPreview.src, date:Date.now()
      };
      await db.put('profiles', prof);
      if(window.notify) notify.toast('Profile saved');
    }catch(err){ console.error(err); if(window.notify) notify.toast('Failed to save profile'); }
  });

  await load();
  // Auto-capture geolocation if empty
  if(navigator.geolocation && !latEl.value && !lngEl.value){
    try{ navigator.geolocation.getCurrentPosition(pos=>{
      latEl.value=pos.coords.latitude.toFixed(6);
      lngEl.value=pos.coords.longitude.toFixed(6);
    },()=>{}); }catch(err){ console.error(err); }
  }
});
