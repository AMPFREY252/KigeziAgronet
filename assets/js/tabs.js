// Accessible tabs behavior
document.addEventListener('DOMContentLoaded', () => {
  const tabContainers = document.querySelectorAll('.tabs[role="tablist"]');
  tabContainers.forEach(container => {
    const tabs = Array.from(container.querySelectorAll('.tab[role="tab"]'));

    function activateTab(tab) {
      tabs.forEach(t => {
        const tabId = t.getAttribute('data-tab');
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        const panelId = t.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        if (panel) {
          if (t === tab) { panel.removeAttribute('hidden'); panel.setAttribute('aria-hidden','false'); }
          else { panel.setAttribute('hidden',''); panel.setAttribute('aria-hidden','true'); }
        }
      });
      tab.focus();
    }

    // Ensure tab buttons have ids matching aria-labelledby expectation
    tabs.forEach(t => {
      const dt = t.getAttribute('data-tab');
      if (!t.id) t.id = dt + '-tab';
    });

    // Wire clicks
    tabs.forEach(t => { t.addEventListener('click', (ev) => { ev.preventDefault(); activateTab(t); }); });

    // Keyboard nav
    container.addEventListener('keydown', (ev) => {
      const cur = document.activeElement;
      const idx = tabs.indexOf(cur);
      if (idx === -1) return;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); activateTab(tabs[(idx + 1) % tabs.length]); }
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); activateTab(tabs[(idx - 1 + tabs.length) % tabs.length]); }
      if (ev.key === 'Home') { ev.preventDefault(); activateTab(tabs[0]); }
      if (ev.key === 'End') { ev.preventDefault(); activateTab(tabs[tabs.length - 1]); }
    });

    // Activate first selected or first tab
    const first = tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0];
    if (first) activateTab(first);
  });
});