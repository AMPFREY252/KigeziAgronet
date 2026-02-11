// Simple client-side auth using IndexedDB 'users' store
// Stores: users: {id, username, firstName, lastName, email, role, passwordHash, photo, createdAt}
// Session: settings/auth -> {id:'auth', currentUserId}
(function(){
  async function sha256(text){
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function getUserByUsername(username){
    const all = await db.all('users');
    return (all||[]).find(u => (u.username||'').toLowerCase() === (username||'').toLowerCase()) || null;
  }
  async function getUserByEmail(email){
    const all = await db.all('users');
    return (all||[]).find(u => (u.email||'').toLowerCase() === (email||'').toLowerCase()) || null;
  }
  async function createUser({username, firstName, lastName, email, password, role='farmer', photo}){
    username = (username||'').trim(); email = (email||'').trim();
    if(!username || !email || !password){ throw new Error('Missing required fields'); }
    if(await getUserByUsername(username)) throw new Error('Username already exists');
    if(await getUserByEmail(email)) throw new Error('Email already exists');
    const id = 'user-'+Date.now();
    const passwordHash = await sha256(password);
    const user = { id, username, firstName:firstName||'', lastName:lastName||'', email, role, passwordHash, photo:photo||'', createdAt:Date.now() };
    await db.put('users', user);
    await setCurrentUserId(id);
    return user;
  }
  async function login(username, password){
    const u = await getUserByUsername((username||'').trim());
    if(!u) throw new Error('User not found');
    const h = await sha256(password||'');
    if(u.passwordHash !== h) throw new Error('Invalid password');
    await setCurrentUserId(u.id);
    return u;
  }
  async function logout(){
    try{ const s = (await db.get('settings','auth'))||{id:'auth'}; s.currentUserId=null; await db.put('settings',s); }catch(_){ }
    try{ localStorage.removeItem('agronet-current-user-id'); }catch(_){ }
  }
  async function setCurrentUserId(id){
    try{ const s=(await db.get('settings','auth'))||{id:'auth'}; s.currentUserId=id; await db.put('settings',s); }catch(_){ }
    try{ localStorage.setItem('agronet-current-user-id', id); }catch(_){ }
  }
  async function getCurrentUser(){
    try{ const s=await db.get('settings','auth'); if(s && s.currentUserId){ const u=await db.get('users', s.currentUserId); if(u) return u; } }catch(_){ }
    const id = localStorage.getItem('agronet-current-user-id'); if(id){ try{ const u=await db.get('users', id); if(u) return u; }catch(_){ } }
    return null;
  }
  async function requireRole(roles){
    const u = await getCurrentUser();
    if(!u) return null;
    const list = Array.isArray(roles)? roles.map(r=>r.toLowerCase()): [String(roles||'').toLowerCase()];
    return list.includes(String(u.role||'').toLowerCase()) ? u : null;
  }
  async function seedAdmin(){
    try{
      const all = await db.all('users');
      if((all||[]).some(u=> (u.role||'')==='admin')) return;
      const admin = { id:'user-admin', username:'admin', firstName:'Admin', lastName:'User', email:'admin@example.com', role:'admin', passwordHash: await sha256('1234'), photo:'', createdAt:Date.now() };
      await db.put('users', admin);
    }catch(_){ }
  }
  window.auth = { sha256, createUser, login, logout, getCurrentUser, setCurrentUserId, requireRole, seedAdmin };
})();
