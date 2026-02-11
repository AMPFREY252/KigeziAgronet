document.addEventListener('DOMContentLoaded', async ()=>{
  try{
    if(!window.auth){ location.href='login.html'; return; }
    const u = await window.auth.getCurrentUser();
    if(!u){ location.href='login.html'; return; }
    document.getElementById('photo').src = u.photo || 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=200&auto=format&fit=crop';
    document.getElementById('name').textContent = [u.firstName||'', u.lastName||''].join(' ').trim() || u.username || 'User';
    document.getElementById('role').textContent = (u.role||'').toString();
    document.getElementById('email').textContent = u.email || '';
    document.getElementById('username').textContent = u.username || '';
    const edit = document.getElementById('edit-link');
    const role = (u.role||'').toLowerCase();
    const target = role==='farmer' ? 'farmer.html' : role==='buyer' ? 'buyer.html' : role==='logistics' ? 'logistics.html' : '../index.html';
    edit.href = target;
    document.getElementById('logout').addEventListener('click', async ()=>{ try{ await window.auth.logout(); location.href = 'login.html'; }catch(_){ location.href='login.html'; } });
  }catch(err){ console.error(err); try{ if(window.notify) notify.toast('Failed to load profile'); }catch(_){} }
});
