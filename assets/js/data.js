async function seedIfEmpty(){
  const m=await db.all('market'); if(m.length===0){
    const today=new Date().toISOString().slice(0,10);
    const items=[
      {id:'maize-'+today, crop:'Maize', unit:'Kg', district:'Kabale', price:1200, date:today},
      {id:'beans-'+today, crop:'Beans', unit:'Kg', district:'Kabale', price:2100, date:today},
      {id:'bananas-'+today, crop:'Bananas', unit:'Bunch', district:'Kabale', price:18000, date:today}
    ];
    for(const it of items) await db.put('market',it);
    const hist=[...Array(12)].map((_,i)=>({id:'maize-2025-'+(i+1), crop:'Maize', unit:'Kg', district:'Kabale', price:1000+Math.round(Math.random()*400), date:`2025-${String(i+1).padStart(2,'0')}-01`}));
    for(const it of hist) await db.put('market',it);
  }
  const w=await db.get('weather','kabale-today'); if(!w){
    await db.put('weather',{id:'kabale-today', district:'Kabale', summary:'Partly cloudy', min:14, max:22});
    await db.put('weather',{id:'kabale-1', district:'Kabale', summary:'Light rain', min:13, max:21});
    await db.put('weather',{id:'kabale-2', district:'Kabale', summary:'Sunny spells', min:12, max:23});
  }
  const p=await db.all('pests'); if(p.length===0){
    await db.put('pests',{id:'fa-maize', title:'Fall Armyworm – Maize', level:'High'});
    await db.put('pests',{id:'bbw', title:'Banana Bacterial Wilt', level:'Medium'});
    await db.put('pests',{id:'bean-rust', title:'Bean rust', level:'Low'});
  }
  const a=await db.all('announcements'); if(a.length===0){
    const now=Date.now();
    await db.put('announcements',{id:'ann-1', title:'Market day extended hours', body:'Kabale main market will open until 8pm this Friday.', date:now-3600_000, type:'notice'});
    await db.put('announcements',{id:'ann-2', title:'Training: Post-harvest handling', body:'Free training at DoA Hall, Sat 10:00.', date:now-7200_000, type:'training'});
    await db.put('announcements',{id:'ann-3', title:'Weather alert', body:'Heavy rains expected Sunday. Cover harvest.', date:now-5400_000, type:'alert'});
  }
}
// simple crop image map (royalty-free placeholders)
const CROP_IMAGES={
  'maize':'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=1200&auto=format&fit=crop',
  'beans':'https://images.unsplash.com/photo-1604335399105-c9b1f50f7b1a?q=80&w=1200&auto=format&fit=crop',
  'bananas':'https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=1200&auto=format&fit=crop'
};
function getCropImage(name){ if(!name) return 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop'; const k=name.toLowerCase(); return CROP_IMAGES[k]||`https://source.unsplash.com/1200x800/?${encodeURIComponent(k)}`; }
async function getTodayPrices(){
  const all=await db.all('market');
  const today=new Date().toISOString().slice(0,10);
  return all.filter(x=>x.date===today);
}
async function getPriceHistory(crop='Maize',district='Kabale'){
  const all=await db.all('market');
  return all.filter(x=>x.crop===crop && x.district===district).sort((a,b)=>a.date.localeCompare(b.date));
}
async function getWeatherCards(){
  const today=await db.get('weather','kabale-today');
  const d1=await db.get('weather','kabale-1');
  const d2=await db.get('weather','kabale-2');
  return [today,d1,d2].filter(Boolean);
}
async function getPestAlerts(){ return db.all('pests'); }
window.dataApi={seedIfEmpty,getTodayPrices,getPriceHistory,getWeatherCards,getPestAlerts};
window.uiHelpers={getCropImage};
