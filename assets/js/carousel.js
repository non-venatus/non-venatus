/**
 * NON-VENATUS — CAROUSEL + EVENT POPUP
 * Engagements page carousel with dot navigation and event modals
 */

(function () {
  'use strict';

  const track    = document.getElementById('carouselTrack');
  const dotsWrap = document.getElementById('carouselDots');
  const prevBtn  = document.getElementById('prevSlide');
  const nextBtn  = document.getElementById('nextSlide');
  const counter  = document.getElementById('slideCounter');

  if (!track) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const dots   = dotsWrap ? dotsWrap.querySelectorAll('.carousel-dot') : [];
  const total  = slides.length;
  let current  = 0;
  let autoPlay = null;

  /* ── Go to slide ─────────────────────────────────────── */
  function goTo(index) {
    current = ((index % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;

    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
    if (counter) counter.textContent = `${current + 1} / ${total}`;
  }

  /* ── Arrow buttons ────────────────────────────────────── */
  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetAutoplay(); });

  /* ── Dot navigation ───────────────────────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetAutoplay(); });
  });

  /* ── Keyboard navigation ─────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAutoplay(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAutoplay(); }
  });

  /* ── Touch/swipe ─────────────────────────────────────── */
  let startX = 0;
  track.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) {
      goTo(dx < 0 ? current + 1 : current - 1);
      resetAutoplay();
    }
  }, { passive: true });

  /* ── Autoplay ─────────────────────────────────────────── */
  function startAutoplay() {
    autoPlay = setInterval(() => goTo(current + 1), 6000);
  }
  function resetAutoplay() {
    clearInterval(autoPlay);
    startAutoplay();
  }
  startAutoplay();

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoPlay));
  track.addEventListener('mouseleave', startAutoplay);

  /* ── Event Card Popup ─────────────────────────────────── */
  const modal    = document.getElementById('eventModal');
  const closeBtn = document.getElementById('closeEventModal');
  const modalBox = document.getElementById('eventModalBox');

  function openEventModal(id) {
    if (typeof EVENTS_DATA === 'undefined') return;
    const ev = EVENTS_DATA.find(e => e.id === id);
    if (!ev) return;

    const imgEl   = document.getElementById('eventModalImg');
    const tagsEl  = document.getElementById('eventModalTags');
    const titleEl = document.getElementById('eventModalTitle');
    const metaEl  = document.getElementById('eventModalMeta');
    const textEl  = document.getElementById('eventModalText');

    imgEl.src = ev.image;
    imgEl.alt = ev.title;

    tagsEl.innerHTML = (ev.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
    titleEl.textContent = ev.title;
    metaEl.innerHTML = `<span>${ev.date}</span><span>${ev.venue}</span>`;
    textEl.textContent = ev.text;

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeEventModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Click handlers for event cards
  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', () => openEventModal(card.dataset.event));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openEventModal(card.dataset.event);
    });
  });

  if (closeBtn)  closeBtn.addEventListener('click', closeEventModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (!modalBox.contains(e.target)) closeEventModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEventModal();
  });

  // Init
  goTo(0);

})();
