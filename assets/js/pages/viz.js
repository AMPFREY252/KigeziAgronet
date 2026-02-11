document.addEventListener('DOMContentLoaded', async ()=>{
  if(window.lucide){ lucide.createIcons(); }
  await dataApi.seedIfEmpty();
  const target=document.querySelector('.section > div');
  const series=await dataApi.getPriceHistory('Maize','Kabale');
  const labels=series.map(s=>s.date.slice(5));
  const data=series.map(s=>s.price);
  if(!window.Chart){
    const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/chart.js';
    await new Promise(r=>{ s.onload=r; document.head.appendChild(s); });
  }
  const canvas=document.createElement('canvas'); target.innerHTML=''; target.appendChild(canvas);
  new Chart(canvas,{type:'bar',data:{labels,datasets:[{label:'Maize (Kabale)',data,backgroundColor:'rgba(22,101,52,.6)'}]},options:{maintainAspectRatio:false}});
});
