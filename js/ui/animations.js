/**
 * animations.js
 * -----------------------------------------------------------------------
 * Shared utility: animates cards into view using the IntersectionObserver
 * API for a smooth scroll-in effect when they enter the viewport.
 *
 * Usage: call animateCards() after any render that injects .legend-card
 * or .scout-card elements into the DOM.
 *
 * Falls back gracefully (adds .no-observer to <body>) in browsers that
 * don't support IntersectionObserver — those browsers see cards immediately.
 * -----------------------------------------------------------------------
 */

export function animateCards(selector = '.legend-card, .scout-card') {
  // Graceful degradation: if IntersectionObserver isn't available, make
  // all cards visible immediately so nothing is ever hidden.
  if (!('IntersectionObserver' in window)) {
    document.body.classList.add('no-observer');
    return;
  }

  const cards = document.querySelectorAll(selector);
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // animate once, then stop watching
        }
      });
    },
    {
      threshold: 0.08,   // trigger when 8% of the card is visible
      rootMargin: '0px 0px -40px 0px', // slight offset from bottom of viewport
    }
  );

  cards.forEach((card) => observer.observe(card));
}

/**
 * Lazy-load images: adds .is-loaded once each image has fully loaded,
 * triggering the CSS opacity fade-in transition defined in components.css.
 */
export function initLazyImages() {
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    if (img.complete) {
      img.classList.add('is-loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('is-loaded'));
    }
  });
}
