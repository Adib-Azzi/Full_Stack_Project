/**
 * NavController
 * -----------------------------------------------------------------------
 * Handles all interactive behavior for the sticky top navigation bar:
 *   - Mobile hamburger menu toggle (open/close)
 *   - aria-expanded sync for screen readers
 *   - Click-outside-to-close
 *   - Auto-close on nav link click
 *   - Scroll shadow: adds .is-scrolled to navbar when page is scrolled
 * -----------------------------------------------------------------------
 */
export class NavController {
  constructor() {
    this.navbar    = document.querySelector('.navbar-custom');
    this.toggleBtn = document.getElementById('navToggleBtn');
    this.navLinks  = document.getElementById('primaryNavLinks');

    if (!this.toggleBtn || !this.navLinks || !this.navbar) {
      console.warn('NavController: nav elements not found.');
      return;
    }

    this._bindEvents();
    this._initScrollShadow();
  }

  _bindEvents() {
    // Hamburger toggle
    this.toggleBtn.addEventListener('click', () => this.toggleMenu());

    // Close menu when any nav link is clicked
    this.navLinks.querySelectorAll('.navbar-custom__link').forEach((link) => {
      link.addEventListener('click', () => this.closeMenu());
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      const inside = this.navLinks.contains(e.target) || this.toggleBtn.contains(e.target);
      if (!inside && this.isOpen()) this.closeMenu();
    });

    // Close on Escape key for accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.closeMenu();
        this.toggleBtn.focus();
      }
    });
  }

  // Adds a deeper shadow to the navbar once the user scrolls down
  _initScrollShadow() {
    const onScroll = () => {
      this.navbar.classList.toggle('is-scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load in case page is already scrolled
  }

  isOpen()     { return this.navLinks.classList.contains('is-open'); }
  toggleMenu() { this.isOpen() ? this.closeMenu() : this.openMenu(); }

  openMenu() {
    this.navLinks.classList.add('is-open');
    this.toggleBtn.classList.add('is-open');
    this.toggleBtn.setAttribute('aria-expanded', 'true');
  }

  closeMenu() {
    this.navLinks.classList.remove('is-open');
    this.toggleBtn.classList.remove('is-open');
    this.toggleBtn.setAttribute('aria-expanded', 'false');
  }
}
