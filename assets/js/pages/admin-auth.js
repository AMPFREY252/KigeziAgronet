document.addEventListener('DOMContentLoaded', async ()=>{
  if(window.lucide){ lucide.createIcons(); }
  const pinInput=document.getElementById('pin');
  const loginBtn=document.getElementById('login');
  async function getPin(){
    const s=await db.get('settings','admin');
    return (s && s.pin) || '1234';
  }
  function setSession(){
    localStorage.setItem('admin-auth', JSON.stringify({ok:true,ts:Date.now()}));
  }
  loginBtn.addEventListener('click', async ()=>{
    const correct=await getPin();
    const entered=pinInput.value.trim();
    if(entered===correct){
      setSession();
      notify.toast('Welcome admin');
      location.href='admin.html';
    } else {
      notify.toast('Invalid PIN');
    }
  });
});
