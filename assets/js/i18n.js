const I18N_STORAGE_KEY='agronet-lang';
let dict={};
async function loadLocale(lang){
  const res=await fetch(`/assets/i18n/${lang}.json`);
  dict=await res.json();
  localStorage.setItem(I18N_STORAGE_KEY,lang);
  // set html lang attribute for accessibility
  try{ document.documentElement.setAttribute('lang', lang); }catch(_){ }
  applyI18n();
}
function t(key){ return dict[key]||key; }
function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n'); el.textContent=t(k); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ const k=el.getAttribute('data-i18n-placeholder'); el.setAttribute('placeholder', t(k)); });
}
function initI18n(){
  const lang=localStorage.getItem(I18N_STORAGE_KEY)||'en';
  loadLocale(lang);
}
window.i18n={loadLocale,t,initI18n};
