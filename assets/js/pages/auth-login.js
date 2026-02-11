document.addEventListener('DOMContentLoaded', ()=>{
  const u=document.getElementById('username');
  const p=document.getElementById('password');
  const btn=document.getElementById('login');
  btn.addEventListener('click', async ()=>{
    try{
      const user = await window.auth.login(u.value.trim(), p.value);
      if(window.notify) notify.toast('Logged in');
      const role=(user.role||'').toLowerCase();
      const target = role==='farmer' ? 'farmer.html' : role==='buyer' ? 'buyer.html' : role==='logistics' ? 'logistics.html' : '../index.html';
      location.href = target;
    }catch(err){ console.error(err); if(window.notify) notify.toast(err.message||'Login failed'); }
  });
});
