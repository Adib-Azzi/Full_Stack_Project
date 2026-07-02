/**
 * HallOfFameRenderer.js
 * -----------------------------------------------------------------------
 * Renders the Hall of Fame page:
 *   - Compact cards (photo + name only initially)
 *   - Click any card → animated modal with full player details
 *   - Filter bar: Position AND Era — both fixed and robust
 * -----------------------------------------------------------------------
 */
import { LEGENDS, getPositions, getEras } from '../data/legends-data.js';
import { animateCards, initLazyImages  } from './animations.js';

export class HallOfFameRenderer {
  constructor(gridId, filtersId) {
    this.gridEl    = document.getElementById(gridId);
    this.filtersEl = document.getElementById(filtersId);

    this._activePosition = null;
    this._activeEra      = null;

    // Modal is a single element injected into <body> once
    this._modal      = null;
    this._modalInner = null;

    if (!this.gridEl || !this.filtersEl) {
      console.error('HallOfFameRenderer: target elements not found.');
      return;
    }

    this._injectModal();
    this._buildFilters();
    this._render(LEGENDS);
  }

  // ─────────────────────────────────────────
  // MODAL (injected once into body)
  // ─────────────────────────────────────────

  _injectModal() {
    const overlay = document.createElement('div');
    overlay.className = 'hof-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Player details');
    overlay.innerHTML = `
      <div class="hof-modal">
        <button class="hof-modal__close" aria-label="Close player details">&times;</button>
        <div class="hof-modal__inner"></div>
      </div>`;
    document.body.appendChild(overlay);

    this._modal      = overlay;
    this._modalInner = overlay.querySelector('.hof-modal__inner');

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeModal();
    });

    // Close on × button
    overlay.querySelector('.hof-modal__close').addEventListener('click', () => this._closeModal());

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._modal.classList.contains('is-open')) this._closeModal();
    });
  }

  _openModal(legend) {
    this._modalInner.innerHTML = this._buildModalContent(legend);
    this._modal.classList.add('is-open');
    document.body.classList.add('modal-open');
    // Focus the close button for keyboard accessibility
    this._modal.querySelector('.hof-modal__close').focus();
  }

  _closeModal() {
    this._modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  // ─────────────────────────────────────────
  // FILTER BAR — fixed event binding
  // ─────────────────────────────────────────

  _buildFilters() {
    const positions = getPositions();
    const eras      = getEras();

    this.filtersEl.innerHTML = `
      <div class="hof-filters__group">
        <span class="hof-filters__label">Position</span>
        <div class="hof-filters__btns" data-filter-group="position">
          <button class="hof-filter-btn is-active" data-value="">All</button>
          ${positions.map(p => `<button class="hof-filter-btn" data-value="${p}">${p}</button>`).join('')}
        </div>
      </div>
      <div class="hof-filters__group">
        <span class="hof-filters__label">Era</span>
        <div class="hof-filters__btns" data-filter-group="era">
          <button class="hof-filter-btn is-active" data-value="">All</button>
          ${eras.map(e => `<button class="hof-filter-btn" data-value="${e}">${e}</button>`).join('')}
        </div>
      </div>
      <button class="hof-filter-btn hof-filter-btn--reset" id="hofResetFilters">↺ Reset</button>
    `;

    // ── FILTER FIX: bind on the CONTAINER (event delegation), not individual buttons
    //    This survives any re-renders and never loses its binding.
    this.filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.hof-filter-btn');
      if (!btn) return;

      // Reset button
      if (btn.id === 'hofResetFilters') {
        this._activePosition = null;
        this._activeEra      = null;
        this.filtersEl.querySelectorAll('.hof-filter-btn').forEach(b => b.classList.remove('is-active'));
        this.filtersEl.querySelectorAll('[data-value=""]').forEach(b => b.classList.add('is-active'));
        this._render(LEGENDS);
        return;
      }

      const group = btn.closest('[data-filter-group]');
      if (!group) return;

      // Update active class within this group only
      group.querySelectorAll('.hof-filter-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const value      = btn.dataset.value || null;
      const filterType = group.dataset.filterGroup;

      if (filterType === 'position') this._activePosition = value;
      if (filterType === 'era')      this._activeEra      = value;

      this._applyFilters();
    });
  }

  _applyFilters() {
    const filtered = LEGENDS.filter(l => {
      const posMatch = !this._activePosition || l.position === this._activePosition;
      const eraMatch = !this._activeEra      || l.era      === this._activeEra;
      return posMatch && eraMatch;
    });
    this._render(filtered);
  }

  // ─────────────────────────────────────────
  // CARD RENDERING — compact (photo + name only)
  // ─────────────────────────────────────────

  _render(legends) {
    if (legends.length === 0) {
      this.gridEl.innerHTML = `
        <div class="state-panel state-panel--empty">
          <p class="state-panel__icon">🔍</p>
          <p class="state-panel__title">No legends found</p>
          <p class="state-panel__msg">Try adjusting the position or era filters above.</p>
        </div>`;
      return;
    }

    this.gridEl.innerHTML = legends.map(l => this._buildCompactCard(l)).join('');

    // Bind click → open modal with full details
    this.gridEl.querySelectorAll('.legend-card--compact').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.legendId;
        const legend = LEGENDS.find(l => l.id === id);
        if (legend) this._openModal(legend);
      });

      // Keyboard: Enter or Space also opens modal
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    animateCards('.legend-card--compact');
    initLazyImages();
  }

  /**
   * Compact card — photo + name + position badge + "View Profile" hint.
   * All detailed info lives inside the modal.
   */
  _buildCompactCard(legend) {
    return `
      <article
        class="legend-card legend-card--compact"
        role="button"
        tabindex="0"
        data-legend-id="${legend.id}"
        aria-label="View profile: ${legend.name}"
      >
        <div class="legend-card__img-wrap">
          <img
            src="images/${legend.id}.jpg"
            alt="Photo of ${legend.name}"
            class="legend-card__img"
            loading="lazy"
            onerror="this.src='https://placehold.co/400x320/0B6E4F/F7F7F2?text=${encodeURIComponent(legend.name)}'"
          />
          <div class="legend-card__overlay">
            <span class="legend-card__overlay-text">View Profile</span>
          </div>
        </div>
        <div class="legend-card__compact-body">
          <h3 class="legend-card__name">${legend.name}</h3>
          <span class="legend-card__pos legend-card__pos--${legend.position.toLowerCase()}">${legend.position}</span>
        </div>
      </article>`;
  }

  // ─────────────────────────────────────────
  // MODAL CONTENT — full player detail
  // ─────────────────────────────────────────

  _buildModalContent(l) {
    const wcStars  = '★'.repeat(l.worldCups) + '☆'.repeat(Math.max(0, 3 - l.worldCups));
    const bdorText = l.ballonDors > 0
      ? `<span class="legend-badge legend-badge--gold">🏆 ${l.ballonDors} Ballon d'Or</span>`
      : `<span class="legend-badge legend-badge--muted">No Ballon d'Or</span>`;

    return `
      <div class="hof-modal__hero">
        <img
          src="images/${l.id}.jpg"
          alt="Photo of ${l.name}"
          class="hof-modal__photo"
          onerror="this.src='https://placehold.co/280x320/0B6E4F/F7F7F2?text=${encodeURIComponent(l.name)}'"
        />
        <div class="hof-modal__title-block">
          <span class="hof-modal__flag">${l.flag}</span>
          <h2 class="hof-modal__name">${l.name}</h2>
          <p class="hof-modal__sub">${l.nationality} · ${l.club} · ${l.years}</p>
          <div class="hof-modal__badges">
            <span class="legend-card__pos legend-card__pos--${l.position.toLowerCase()}">${l.position}</span>
            ${bdorText}
            <span class="legend-badge legend-badge--era">${l.era}</span>
          </div>
        </div>
      </div>

      <div class="hof-modal__stats-row">
        <div class="hof-modal__stat">
          <span class="hof-modal__stat-val">${l.caps}</span>
          <span class="hof-modal__stat-label">Caps</span>
        </div>
        <div class="hof-modal__stat">
          <span class="hof-modal__stat-val">${l.goals}</span>
          <span class="hof-modal__stat-label">Int. Goals</span>
        </div>
        <div class="hof-modal__stat">
          <span class="hof-modal__stat-val legend-card__stat-value--stars" aria-label="${l.worldCups} World Cups">${wcStars}</span>
          <span class="hof-modal__stat-label">World Cups</span>
        </div>
        <div class="hof-modal__stat">
          <span class="hof-modal__stat-val">${l.ballonDors}</span>
          <span class="hof-modal__stat-label">Ballon d'Or</span>
        </div>
      </div>

      <div class="hof-modal__section">
        <h4 class="hof-modal__section-title">⚡ Legacy Stat</h4>
        <p class="hof-modal__legacy">${l.legacyStat}</p>
      </div>

      <div class="hof-modal__section">
        <h4 class="hof-modal__section-title">📖 Biography</h4>
        <p class="hof-modal__bio">${l.bio}</p>
      </div>
    `;
  }
}
