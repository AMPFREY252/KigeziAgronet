// Small accessible navigation toggle for mobile
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.top-nav');
  if (!toggle || !nav) return;

  function setExpanded(val) {
    toggle.setAttribute('aria-expanded', String(val));
    nav.classList.toggle('open', val);
    // reflect state on toggle for CSS-driven animation
    toggle.classList.toggle('open', val);
    if (val) {
      const firstLink = nav.querySelector('.nav-link');
      firstLink && firstLink.focus();
    }
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    setExpanded(!expanded);
  });

  // Close menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setExpanded(false);
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      setExpanded(false);
    }
  });
});
