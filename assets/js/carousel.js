// Simple carousel for the hero
document.addEventListener('DOMContentLoaded', function () {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.slide'));
  const indicators = Array.from(carousel.querySelectorAll('.indicator'));
  const prevBtn = carousel.querySelector('.nav-btn.left');
  const nextBtn = carousel.querySelector('.nav-btn.right');
  let current = slides.findIndex(s => s.classList.contains('active'));
  if (current < 0) current = 0;
  let timer = null;
  const interval = 6000;

  function goTo(index) {
    // normalize
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === current) return;
    // remove current
    slides[current] && slides[current].classList.remove('active');
    indicators[current] && indicators[current].classList.remove('active');
    // set next
    slides[nextIndex].classList.add('active');
    indicators[nextIndex] && indicators[nextIndex].classList.add('active');
    current = nextIndex;
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  nextBtn && nextBtn.addEventListener('click', function () { next(); resetTimer(); });
  prevBtn && prevBtn.addEventListener('click', function () { prev(); resetTimer(); });

  indicators.forEach(ind => {
    ind.addEventListener('click', function () {
      const i = Number(this.getAttribute('data-index'));
      goTo(i);
      resetTimer();
    });
  });

  function startTimer() {
    timer = setInterval(next, interval);
  }
  function stopTimer() { clearInterval(timer); }
  function resetTimer() { stopTimer(); startTimer(); }

  carousel.addEventListener('mouseenter', stopTimer);
  carousel.addEventListener('focusin', stopTimer);
  carousel.addEventListener('mouseleave', startTimer);

  startTimer();
});
