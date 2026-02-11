document.addEventListener('DOMContentLoaded', async ()=>{
  const nameEl=document.getElementById('name');
  const contactEl=document.getElementById('contact');
  const districtEl=document.getElementById('district');
  const latEl=document.getElementById('lat');
  const lngEl=document.getElementById('lng');
  const geoBtn=document.getElementById('geo');
  const saveBtn=document.getElementById('save');

  // Require login with logistics role
  let currentUser=null;
  try{
    if(!window.auth){ location.href='login.html'; return; }
    currentUser = await window.auth.requireRole('logistics');
    if(!currentUser){ location.href='login.html'; return; }
  }catch(_){ location.href='login.html'; return; }

  const POST_ID = `post-${currentUser.id}`;

  async function load(){
    const prof=await db.get('profiles', POST_ID);
    if(prof){
      nameEl.value=prof.name||'';
      contactEl.value=prof.contact||'';
      districtEl.value=prof.district||'';
      latEl.value=prof.lat||'';
      lngEl.value=prof.lng||'';
    }
  }

  geoBtn.addEventListener('click',()=>{
    if(!navigator.geolocation){ if(window.notify) notify.toast('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(pos=>{
      latEl.value=pos.coords.latitude.toFixed(6);
      lngEl.value=pos.coords.longitude.toFixed(6);
    },()=>{ if(window.notify) notify.toast('Unable to get location'); });
  });

  saveBtn.addEventListener('click', async ()=>{
    const prof={
      id: POST_ID, role:'logistics', ownerId: currentUser.id,
      name:nameEl.value.trim(), contact:contactEl.value.trim(),
      district:districtEl.value.trim(), lat:latEl.value.trim(), lng:lngEl.value.trim(),
      date:Date.now()
    };
    await db.put('profiles', prof);
    if(window.notify) notify.toast('Logistics profile saved');
  });

  await load();
});
