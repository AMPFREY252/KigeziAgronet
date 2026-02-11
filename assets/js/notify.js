function toast(msg){
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); },2500);
}
async function requestNotifyPermission(){
  if(!('Notification' in window)) { toast('Notifications not supported'); return false; }
  if(Notification.permission==='granted') return true;
  const p=await Notification.requestPermission();
  if(p==='granted'){ new Notification('Notifications enabled'); return true; }
  toast('Notifications blocked'); return false;
}
window.notify={toast,requestNotifyPermission};
