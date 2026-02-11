document.addEventListener('DOMContentLoaded', ()=>{
  const username=document.getElementById('username');
  const first=document.getElementById('first');
  const last=document.getElementById('last');
  const email=document.getElementById('email');
  const password=document.getElementById('password');
  const role=document.getElementById('role');
  const photo=document.getElementById('photo');
  const photoPreview=document.getElementById('photoPreview');
  const createBtn=document.getElementById('create');

  function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
  photo?.addEventListener('change', async (e)=>{
    try{ const f=e.target.files[0]; if(!f) return; const data=await readFileAsDataURL(f); photoPreview.src=data; }catch(err){ console.error(err); if(window.notify) notify.toast('Failed to read photo'); }
  });

  createBtn.addEventListener('click', async ()=>{
    try{
      const payload={ username:username.value.trim(), firstName:first.value.trim(), lastName:last.value.trim(), email:email.value.trim(), password:password.value, role:role.value, photo:photoPreview.src };
      const user=await window.auth.createUser(payload);
      if(!user){ if(window.notify) notify.toast('Registration failed'); return; }
      if(window.notify) notify.toast('Account created');
      // redirect based on role to fill profile
      const target = user.role==='farmer' ? 'farmer.html' : user.role==='buyer' ? 'buyer.html' : user.role==='logistics' ? 'logistics.html' : '../index.html';
      location.href = target;
    }catch(err){ console.error(err); if(window.notify) notify.toast(err.message||'Registration error'); }
  });
});
