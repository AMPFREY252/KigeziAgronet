document.addEventListener('DOMContentLoaded', async ()=>{
  const nameEl=document.getElementById('name');
  const contactEl=document.getElementById('contact');
  const interestEl=document.getElementById('interest');
  const districtEl=document.getElementById('district');
  const latEl=document.getElementById('lat');
  const lngEl=document.getElementById('lng');
  const geoBtn=document.getElementById('geo');
  const saveBtn=document.getElementById('save');

  // Require login with buyer role
  let currentUser=null;
  try{
    if(!window.auth){ location.href='login.html'; return; }
    currentUser = await window.auth.requireRole('buyer');
    if(!currentUser){ location.href='login.html'; return; }
  }catch(_){ location.href='login.html'; return; }

  const POST_ID = `post-${currentUser.id}`;

  async function load(){
    try{
      const prof=await db.get('profiles', POST_ID);
      if(prof){
        nameEl.value=prof.name||'';
        contactEl.value=prof.contact||'';
        interestEl.value=prof.interest||'';
        districtEl.value=prof.district||'';
        latEl.value=prof.lat||'';
        lngEl.value=prof.lng||'';
      }
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to load buyer profile'); } }
  }

  geoBtn.addEventListener('click',()=>{
    try{
      if(!navigator.geolocation){ if(window.notify) notify.toast('Geolocation not supported'); return; }
      navigator.geolocation.getCurrentPosition(pos=>{
        latEl.value=pos.coords.latitude.toFixed(6);
        lngEl.value=pos.coords.longitude.toFixed(6);
      },()=>{ if(window.notify) notify.toast('Unable to get location'); });
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Location error'); } }
  });

  saveBtn.addEventListener('click', async ()=>{
    try{
      const prof={
        id: POST_ID, role:'buyer', ownerId: currentUser.id,
        name:nameEl.value.trim(), contact:contactEl.value.trim(), interest:interestEl.value.trim(),
        district:districtEl.value.trim(), lat:latEl.value.trim(), lng:lngEl.value.trim(),
        date:Date.now()
      };
      await db.put('profiles', prof);
      if(window.notify) notify.toast('Buyer profile saved');
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to save buyer profile'); } }
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
