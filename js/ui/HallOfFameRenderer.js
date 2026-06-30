/**
 * HallOfFameRenderer
 * -----------------------------------------------------------------------
 * Responsible for ALL visual output on hall-of-fame.html:
 *   - Dynamically builds and injects the filter button bar (position + era)
 *   - Renders the full grid of 15 legend cards from our curated dataset
 *   - Handles client-side filtering (no page reload needed)
 *   - Manages the empty state when a filter combo returns zero results
 *
 * This class has a single responsibility: read data → write DOM.
 * It never fetches from a network (that is ApiService's job in Phase 5).
 * -----------------------------------------------------------------------
 */
import { LEGENDS, getPositions, getEras } from '../data/legends-data.js';

export class HallOfFameRenderer {
  /**
   * @param {string} gridId      — id of the <div> that receives legend cards
   * @param {string} filtersId   — id of the <div> that receives filter buttons
   */
  constructor(gridId, filtersId) {
    this.gridEl = document.getElementById(gridId);
    this.filtersEl = document.getElementById(filtersId);

    // Active filter state — null means "show all"
    this._activePosition = null;
    this._activeEra = null;

    if (!this.gridEl || !this.filtersEl) {
      console.error('HallOfFameRenderer: target elements not found.');
      return;
    }

    this._buildFilters();
    this._render(LEGENDS); // initial full render
  }

  // ─────────────────────────────────────────
  // PRIVATE — Filter UI
  // ─────────────────────────────────────────

  /**
   * Dynamically build the filter bar from the unique values inside our dataset.
   * This means adding a new legend automatically updates the filter options.
   */
  _buildFilters() {
    const positions = getPositions();
    const eras = getEras();

    this.filtersEl.innerHTML = `
      <div class="hof-filters__group">
        <span class="hof-filters__label">Position</span>
        <div class="hof-filters__btns" data-filter-group="position">
          <button class="hof-filter-btn is-active" data-value="">All</button>
          ${positions.map((p) => `<button class="hof-filter-btn" data-value="${p}">${p}</button>`).join('')}
        </div>
      </div>
      <div class="hof-filters__group">
        <span class="hof-filters__label">Era</span>
        <div class="hof-filters__btns" data-filter-group="era">
          <button class="hof-filter-btn is-active" data-value="">All</button>
          ${eras.map((e) => `<button class="hof-filter-btn" data-value="${e}">${e}</button>`).join('')}
        </div>
      </div>
    `;

    // Bind filter button clicks via event delegation on each group container
    this.filtersEl.querySelectorAll('[data-filter-group]').forEach((group) => {
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('.hof-filter-btn');
        if (!btn) return;

        const filterType = group.dataset.filterGroup; // 'position' or 'era'
        const value = btn.dataset.value || null;      // null = "All"

        // Update active state on buttons within this group
        group.querySelectorAll('.hof-filter-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        // Store the new filter and re-render
        if (filterType === 'position') this._activePosition = value;
        if (filterType === 'era') this._activeEra = value;

        this._applyFilters();
      });
    });
  }

  /**
   * Filter the master LEGENDS array by active position + era,
   * then pass the result to _render().
   */
  _applyFilters() {
    const filtered = LEGENDS.filter((legend) => {
      const positionMatch = !this._activePosition || legend.position === this._activePosition;
      const eraMatch = !this._activeEra || legend.era === this._activeEra;
      return positionMatch && eraMatch;
    });

    this._render(filtered);
  }

  // ─────────────────────────────────────────
  // PRIVATE — Card Rendering
  // ─────────────────────────────────────────

  /**
   * Render an array of legend objects as cards into the grid element.
   * Shows an empty state message if the array is empty.
   *
   * @param {Array} legends — filtered or full LEGENDS array
   */
  _render(legends) {
    if (legends.length === 0) {
      this._showEmpty();
      return;
    }

    // Build all card HTML strings, join, inject in one DOM write (performance best practice)
    this.gridEl.innerHTML = legends.map((l) => this._buildCard(l)).join('');
  }

  /**
   * Build the HTML string for a single legend card.
   * Each card is a <article> for semantic correctness (it's self-contained content).
   *
   * @param   {Object} legend — a single entry from LEGENDS
   * @returns {string}         — HTML string
   */
  _buildCard(legend) {
    // Render stars for World Cup wins (max 3 possible)
    const wcStars = '★'.repeat(legend.worldCups) + '☆'.repeat(Math.max(0, 3 - legend.worldCups));

    // Render Ballon d'Or count as a styled badge
    const bdorBadge = legend.ballonDors > 0
      ? `<span class="legend-badge legend-badge--gold">🏆 ${legend.ballonDors} Ballon d'Or</span>`
      : `<span class="legend-badge legend-badge--muted">No Ballon d'Or</span>`;

    return `
      <article class="legend-card" role="listitem" aria-label="${legend.name}, ${legend.nationality} ${legend.position}">
        <div class="legend-card__img-wrap">
          <img
            src="${legend.image}"
            alt="Photo of ${legend.name}"
            class="legend-card__img"
            loading="lazy"
            onerror="this.src='https://placehold.co/400x300/0B6E4F/F7F7F2?text=${encodeURIComponent(legend.name)}'"
          />
          <span class="legend-card__flag" aria-label="${legend.nationality}">${legend.flag}</span>
        </div>

        <div class="legend-card__body">
          <h3 class="legend-card__name">${legend.name}</h3>

          <div class="legend-card__meta">
            <span class="legend-card__pos legend-card__pos--${legend.position.toLowerCase()}">${legend.position}</span>
            <span class="legend-card__club">${legend.club}</span>
          </div>

          <p class="legend-card__years">${legend.years}</p>

          <div class="legend-card__stats">
            <div class="legend-card__stat">
              <span class="legend-card__stat-label">Caps</span>
              <span class="legend-card__stat-value">${legend.caps}</span>
            </div>
            <div class="legend-card__stat">
              <span class="legend-card__stat-label">Int. Goals</span>
              <span class="legend-card__stat-value">${legend.goals}</span>
            </div>
            <div class="legend-card__stat">
              <span class="legend-card__stat-label">World Cups</span>
              <span class="legend-card__stat-value legend-card__stat-value--stars" aria-label="${legend.worldCups} World Cup wins">${wcStars}</span>
            </div>
          </div>

          <div class="legend-card__badges">
            ${bdorBadge}
          </div>

          <p class="legend-card__legacy">
            <strong>Legacy stat:</strong> ${legend.legacyStat}
          </p>

          <p class="legend-card__bio">${legend.bio}</p>
        </div>
      </article>
    `;
  }

  /**
   * Show the empty state when no legends match the active filters.
   */
  _showEmpty() {
    this.gridEl.innerHTML = `
      <div class="state-panel state-panel--empty">
        <p class="state-panel__icon">🔍</p>
        <p class="state-panel__title">No legends found</p>
        <p class="state-panel__msg">Try adjusting the position or era filters above.</p>
      </div>
    `;
  }
}
