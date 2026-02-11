// Lightweight client-side validation helper and accessibility improvements
(function(){
  function ensureAnnouncer(){
    if(!document.getElementById('form-announcer')){
      const a=document.createElement('div'); a.id='form-announcer'; a.setAttribute('aria-live','assertive'); a.className='sr-only'; document.body.appendChild(a);
    }
  }
  function showError(input, message){
    input.setAttribute('aria-invalid','true');
    let help = input.closest('.form-group')?.querySelector('.field-help');
    if(!help){
      help = document.createElement('div'); help.className='field-help error';
      const container = input.closest('.form-group') || input.parentElement || document.body;
      if(container && container.appendChild) container.appendChild(help);
    }
    help.textContent = message;
    ensureAnnouncer(); document.getElementById('form-announcer').textContent = message;
  }
  function clearError(input){
    input.removeAttribute('aria-invalid');
    const help = input.closest('.form-group')?.querySelector('.field-help') || input.parentElement?.querySelector('.field-help');
    if(help) help.textContent='';
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn-primary');
    if(!btn) return;
    // try to validate inputs within the nearest form-grid or section
    const container = btn.closest('.form-grid, .section, form');
    if(!container) return;
    const required = Array.from(container.querySelectorAll('[required]'));
    let firstInvalid = null;
    required.forEach(input => {
      const val = (input.value || '').toString().trim();
      if(!val){ showError(input, 'This field is required'); firstInvalid = firstInvalid || input; }
      else { clearError(input); }
    });
    if(firstInvalid){ e.preventDefault(); firstInvalid.focus(); }
  });

  // Progressive enhancement: intercept submit on forms too
  document.addEventListener('submit', (e)=>{
    const form = e.target; if(!form || !form.matches('form')) return;
    const required = Array.from(form.querySelectorAll('[required]'));
    let firstInvalid = null;
    required.forEach(input => { const val=(input.value||'').toString().trim(); if(!val){ showError(input,'This field is required'); firstInvalid = firstInvalid || input; } else { clearError(input); } });
    if(firstInvalid){ e.preventDefault(); firstInvalid.focus(); }
  });

  // Inject accessible skip link for keyboard users
  document.addEventListener('DOMContentLoaded', ()=>{
    if(!document.querySelector('.skip-link')){
      const a=document.createElement('a'); a.href='#main-content'; a.className='skip-link'; a.textContent='Skip to main content'; document.body.insertBefore(a, document.body.firstChild);
    }
    // Ensure main content has id for skipping
    if(!document.getElementById('main-content')){
      const main = document.querySelector('main, .clean-content'); if(main) main.id='main-content';
    }
  });
})();