document.addEventListener('DOMContentLoaded', async ()=>{
  if(window.lucide){ lucide.createIcons(); }
  await dataApi.seedIfEmpty();
  const list=document.querySelector('ul.list');
  const items=await dataApi.getPestAlerts();
  list.innerHTML='';
  items.forEach(x=>{
    const li=document.createElement('li');
    const lvl=(x.level||'').toLowerCase();
    const cls=lvl==='high'?'badge high':(lvl==='medium'?'badge medium':'badge low');
    li.innerHTML=`<span>${x.title}</span><span class="${cls}">${x.level}</span>`;
    list.appendChild(li);
  });
});
