document.addEventListener('DOMContentLoaded', async ()=>{
  if(window.lucide){ lucide.createIcons(); }
  await dataApi.seedIfEmpty();
  const list=document.querySelector('ul.list');
  const btn=document.querySelector('button.btn.primary');
  const cropInput=document.querySelector('input.input');
  const districtSel=document.querySelector('select.input');
  const chartEl=document.getElementById('chart');
  const allList=document.getElementById('all-market');

  async function renderToday(){
    try{
      const items=await dataApi.getTodayPrices();
      list.innerHTML='';
      items.forEach(x=>{
        const li=document.createElement('li');
        const img=uiHelpers.getCropImage(x.crop);
        li.innerHTML=`<img loading="lazy" class="avatar" alt="${x.crop}" src="${img}"/>`+
          `<div style=\"flex:1 1 auto\"><div style=\"font-weight:600\">${x.crop} <span class=\"badge\">${x.unit}</span></div>`+
          `<div class=\"small\" style=\"color:#475569\">${x.district}</div></div>`+
          `<span class=\"badge\" style=\"font-weight:700\">UGX ${x.price.toLocaleString()}</span>`;
        list.appendChild(li);
      });
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to load today\'s prices'); } }
  }

  async function renderAllMarket(){
    try{
      if(!allList) return;
      const all = await db.all('market');
      all.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
      allList.innerHTML = all.map(x=>{
        const img=uiHelpers.getCropImage(x.crop);
        const date = x.date||'';
        return `
          <li>
            <img loading=\"lazy\" class=\"avatar\" alt=\"${x.crop}\" src=\"${img}\"/>
            <div style=\"flex:1 1 auto\">
              <div style=\"font-weight:600\">${x.crop} <span class=\"badge\">${x.unit}</span></div>
              <div class=\"small\" style=\"color:#475569\">${x.district} • ${date}</div>
            </div>
            <span class=\"badge\" style=\"font-weight:700\">UGX ${x.price.toLocaleString()}</span>
          </li>`;
      }).join('');
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to load market data'); } }
  }

  async function renderChart(){
    try{
      const crop=cropInput.value||'Maize';
      const district=districtSel.value||'Kabale';
      const series=await dataApi.getPriceHistory(crop,district);
      const labels=series.map(s=>s.date.slice(5));
      const data=series.map(s=>s.price);
      if(!window.Chart){
        const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/chart.js';
        await new Promise(r=>{ s.onload=r; document.head.appendChild(s); });
      }
      if(chartEl._chart){ chartEl._chart.destroy(); }
      const ctx=document.createElement('canvas'); chartEl.innerHTML=''; chartEl.appendChild(ctx);
      chartEl._chart=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:`${crop} (${district})`,data,borderColor:'#166534',backgroundColor:'rgba(22,101,52,.2)',tension:.25}]},options:{maintainAspectRatio:false,plugins:{legend:{display:true}},scales:{y:{beginAtZero:false}}}});
    }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to render chart'); } }
  }

  btn.addEventListener('click',async()=>{ try{ await renderChart(); notify.toast('Updated'); }catch(err){ console.error(err); if(window.notify){ notify.toast('Failed to update chart'); } } });

  try{ await renderToday(); }catch(_){}
  try{ await renderChart(); }catch(_){}
  try{ await renderAllMarket(); }catch(_){}
  // Firestore realtime subscription for market list
  try{
    if(window.fb && window.fb.db){
      window.fb.db.collection('market').onSnapshot(()=>{
        try{ renderAllMarket(); }catch(err){ console.error(err); }
      }, (err)=>{ console.error(err); });
    }
  }catch(err){ console.error(err); }
});
