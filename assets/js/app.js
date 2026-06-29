/**
 * NON-VENATUS — SHARED APP JAVASCRIPT
 * Navigation, scroll reveal, mobile menu, nav highlight
 */

(function () {
  'use strict';

  /* ── Mobile nav toggle ─────────────────────────────────── */
  const toggle    = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('is-open');
      }
    });
  }

  /* ── Nav scroll behaviour ──────────────────────────────── */
  const nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        nav.style.background = 'rgba(7,13,42,.96)';
      } else {
        nav.style.background = 'rgba(7,13,42,.82)';
      }
    }, { passive: true });
  }

  /* ── Active nav link highlighting ──────────────────────── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const hrefFile = href.split('/').pop() || 'index.html';
    if (hrefFile === currentPath || (currentPath === '' && hrefFile === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── Intersection Observer: scroll reveal ──────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach(el => observer.observe(el));
  }

  /* ── Keyboard accessibility for cover flip ─────────────── */
  document.querySelectorAll('.sidebar__cover-flipper').forEach(el => {
    const wrap = el.closest('.sidebar__cover-wrap');
    if (wrap) {
      wrap.setAttribute('tabindex', '0');
      wrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          el.style.transform = el.style.transform === 'rotateY(180deg)'
            ? '' : 'rotateY(180deg)';
        }
      });
    }
  });

})();
