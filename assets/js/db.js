const DB_NAME='agronet-db';
const DB_VERSION=4;
const STORES=['market','weather','pests','settings','messages','announcements','profiles','users'];
function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=e=>{
      const db=e.target.result;
      STORES.forEach(s=>{ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'}); });
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function dbPut(store,value){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(store,'readwrite'); tx.objectStore(store).put(value); tx.oncomplete=()=>res(true); tx.onerror=()=>rej(tx.error); }); }
async function dbGet(store,id){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(store,'readonly'); const r=tx.objectStore(store).get(id); r.onsuccess=()=>res(r.result||null); r.onerror=()=>rej(r.error); }); }
async function dbAll(store){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(store,'readonly'); const req=tx.objectStore(store).getAll(); req.onsuccess=()=>res(req.result||[]); req.onerror=()=>rej(req.error); }); }
async function dbDel(store,id){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(store,'readwrite'); tx.objectStore(store).delete(id); tx.oncomplete=()=>res(true); tx.onerror=()=>rej(tx.error); }); }
async function dbClear(store){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(store,'readwrite'); tx.objectStore(store).clear(); tx.oncomplete=()=>res(true); tx.onerror=()=>rej(tx.error); }); }
window.db={put:dbPut,get:dbGet,all:dbAll,del:dbDel,clear:dbClear};
