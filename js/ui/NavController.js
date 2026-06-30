/**
 * NavController
 * -----------------------------------------------------------------------
 * Handles all interactive behavior for the sticky top navigation bar:
 *   - Toggling the mobile slide-down menu open/closed
 *   - Syncing the aria-expanded attribute for screen reader accessibility
 *   - Closing the menu automatically when a link is clicked (mobile UX)
 *   - Closing the menu if the user clicks/taps outside of it
 *
 * Used on every page via each page's app-*.js entry point.
 * -----------------------------------------------------------------------
 */
export class NavController {
  constructor() {
    this.toggleBtn = document.getElementById('navToggleBtn');
    this.navLinks = document.getElementById('primaryNavLinks');

    // Guard clause: if this page somehow doesn't have a nav, fail silently
    // rather than throwing — keeps every app-*.js entry point safe to call.
    if (!this.toggleBtn || !this.navLinks) {
      console.warn('NavController: nav elements not found on this page.');
      return;
    }

    this._bindEvents();
  }

  _bindEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggleMenu());

    // Close the mobile menu after a link is tapped, so it doesn't stay
    // open when the new page loads / user navigates.
    this.navLinks.querySelectorAll('.navbar-custom__link').forEach((link) => {
      link.addEventListener('click', () => this.closeMenu());
    });

    // Click-outside-to-close
    document.addEventListener('click', (event) => {
      const clickedInsideNav = this.navLinks.contains(event.target) ||
        this.toggleBtn.contains(event.target);
      if (!clickedInsideNav && this.isOpen()) {
        this.closeMenu();
      }
    });
  }

  isOpen() {
    return this.navLinks.classList.contains('is-open');
  }

  toggleMenu() {
    this.isOpen() ? this.closeMenu() : this.openMenu();
  }

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
