document.addEventListener('DOMContentLoaded', async ()=>{
  if(window.lucide){ lucide.createIcons(); }
  const langSel=document.getElementById('lang');
  const notifChk=document.getElementById('notif');
  const saveBtn=document.getElementById('save');
  // load saved prefs
  const prefs=(await db.get('settings','prefs'))||{id:'prefs',lang:localStorage.getItem('agronet-lang')||'en',notif:false};
  langSel.value=prefs.lang||'en';
  notifChk.checked=!!prefs.notif;
  async function save(){
    const newPrefs={id:'prefs',lang:langSel.value,notif:notifChk.checked};
    await db.put('settings',newPrefs);
    await i18n.loadLocale(newPrefs.lang);
    if(newPrefs.notif){ await notify.requestNotifyPermission(); }
    notify.toast('Settings saved');
  }
  saveBtn.addEventListener('click', save);
});
