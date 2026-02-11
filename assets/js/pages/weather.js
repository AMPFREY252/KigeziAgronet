document.addEventListener('DOMContentLoaded', async ()=>{
  if(window.lucide){ lucide.createIcons(); }
  await dataApi.seedIfEmpty();
  const grid=document.querySelector('.grid');
  async function render(){
    const cards=await dataApi.getWeatherCards();
    if(!grid) return;
    grid.innerHTML='';
    cards.forEach(c=>{
      const div=document.createElement('div');
      div.className='card';
      div.innerHTML=`<h3>${c.district}</h3><p>${c.summary}, ${c.max}°C / ${c.min}°C</p>`;
      grid.appendChild(div);
    });
  }
  await render();
});
