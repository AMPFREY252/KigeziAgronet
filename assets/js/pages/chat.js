document.addEventListener('DOMContentLoaded', async ()=>{
  if(window.lucide){ lucide.createIcons(); }
  await dataApi.seedIfEmpty();
  const list=document.getElementById('messages');
  const input=document.getElementById('input');
  const sendBtn=document.getElementById('send');
  async function load(){
    const msgs=await db.all('messages');
    msgs.sort((a,b)=>a.ts-b.ts);
    list.innerHTML='';
    msgs.forEach(m=>{
      const li=document.createElement('li');
      const time=new Date(m.ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      li.innerHTML=`<span>${m.author}: ${m.text}</span><span>${time}</span>`;
      list.appendChild(li);
    });
  }
  async function send(){
    const text=input.value.trim(); if(!text) return;
    const m={id:'m-'+Date.now(), author:'You', text, ts:Date.now()};
    await db.put('messages',m);
    input.value='';
    await load();
  }
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') send(); });
  await load();
});
