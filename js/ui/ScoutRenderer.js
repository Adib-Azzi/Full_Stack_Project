/**
 * ScoutRenderer.js
 * -----------------------------------------------------------------------
 * Owns all visual output on live-scout.html:
 *
 *   1. Listens for search form submissions
 *   2. Delegates the actual fetch to ApiService (passed in via constructor)
 *   3. Manages three UI states: loading → results (or empty) / error
 *   4. Applies client-side position filtering over the returned results
 *   5. Paginates the filtered results (RESULTS_PER_PAGE items at a time)
 *   6. Renders player result cards from API response data
 *
 * This class has NO knowledge of how data is fetched — it only knows
 * what ApiService gives it and how to display it.
 * -----------------------------------------------------------------------
 */
export class ScoutRenderer {
  static RESULTS_PER_PAGE = 9; // 9 cards = clean 3-column grid on desktop

  /**
   * @param {ApiService} apiService — injected dependency (no tight coupling)
   * @param {Object} elementIds     — map of DOM element IDs this renderer controls
   */
  constructor(apiService, elementIds) {
    this._api = apiService;

    // Grab all controlled DOM elements by ID
    this._form        = document.getElementById(elementIds.form);
    this._input       = document.getElementById(elementIds.input);
    this._posFilter   = document.getElementById(elementIds.posFilter);
    this._grid        = document.getElementById(elementIds.grid);
    this._loading     = document.getElementById(elementIds.loading);
    this._error       = document.getElementById(elementIds.error);
    this._empty       = document.getElementById(elementIds.empty);
    this._pagination  = document.getElementById(elementIds.pagination);

    // Internal state
    this._allResults    = [];  // raw results from the last API call
    this._filtered      = [];  // results after position filter applied
    this._currentPage   = 1;
    this._lastQuery     = '';

    if (!this._form || !this._grid) {
      console.error('ScoutRenderer: required elements not found.');
      return;
    }

    this._bindEvents();
    this._showWelcome(); // show a helpful prompt before any search
  }

  // ─────────────────────────────────────────
  // PRIVATE — Event Binding
  // ─────────────────────────────────────────

  _bindEvents() {
    // Search form submit
    this._form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = this._input.value.trim();
      if (!query) return;

      this._lastQuery = query;
      this._currentPage = 1;
      await this._performSearch(query);
    });

    // Position filter dropdown — re-filters without another API call
    this._posFilter.addEventListener('change', () => {
      this._currentPage = 1;
      this._applyFilterAndRender();
    });
  }

  // ─────────────────────────────────────────
  // PRIVATE — Search & Filter Pipeline
  // ─────────────────────────────────────────

  /**
   * Full search pipeline:
   * show loading → call API → store results → filter → render
   */
  async _performSearch(query) {
    this._showLoading();

    try {
      this._allResults = await this._api.searchPlayers(query);
      this._applyFilterAndRender();
    } catch (err) {
      this._showError(err.message);
    }
  }

  /**
   * Client-side filter: reads the position dropdown value,
   * filters this._allResults, then renders the current page.
   */
  _applyFilterAndRender() {
    const selectedPosition = this._posFilter.value;

    if (selectedPosition) {
      // API-Football returns position as player.statistics[0].games.position
      // We normalise it to match our dropdown values
      this._filtered = this._allResults.filter((item) => {
        const pos = item?.statistics?.[0]?.games?.position || '';
        return pos.toLowerCase().includes(selectedPosition.toLowerCase());
      });
    } else {
      this._filtered = [...this._allResults];
    }

    if (this._filtered.length === 0) {
      this._showEmpty(this._allResults.length > 0
        ? `No ${this._posFilter.value.toLowerCase()}s found — try a different position filter.`
        : `No players found for "${this._lastQuery}". Try a different name.`
      );
      return;
    }

    this._renderPage();
  }

  // ─────────────────────────────────────────
  // PRIVATE — Rendering
  // ─────────────────────────────────────────

  /**
   * Slice the filtered results for the current page and render them.
   * Then rebuild pagination controls.
   */
  _renderPage() {
    this._hideAllStates();

    const start = (this._currentPage - 1) * ScoutRenderer.RESULTS_PER_PAGE;
    const end   = start + ScoutRenderer.RESULTS_PER_PAGE;
    const pageItems = this._filtered.slice(start, end);

    this._grid.innerHTML = pageItems.map((item) => this._buildPlayerCard(item)).join('');
    this._buildPagination();

    // Smooth scroll to results top
    this._grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Build HTML string for a single API-Football player result card.
   * API-Football player object structure:
   * {
   *   player: { id, name, firstname, lastname, age, nationality, photo, height, weight }
   *   statistics: [{
   *     team:   { name, logo },
   *     league: { name, country, logo },
   *     games:  { position, rating, appearances },
   *     goals:  { total, assists },
   *     cards:  { yellow, red }
   *   }]
   * }
   *
   * @param   {Object} item — single response item from API-Football /players endpoint
   * @returns {string}       — HTML string
   */
  _buildPlayerCard(item) {
    const p    = item.player     || {};
    const stat = (item.statistics && item.statistics[0]) || {};
    const team   = stat.team   || {};
    const league = stat.league || {};
    const games  = stat.games  || {};
    const goals  = stat.goals  || {};
    const cards  = stat.cards  || {};

    const name        = p.name        || 'Unknown Player';
    const photo       = p.photo       || '';
    const age         = p.age         || '—';
    const nationality = p.nationality || '—';
    const height      = p.height      || '—';
    const position    = games.position    || '—';
    const rating      = games.rating
      ? parseFloat(games.rating).toFixed(1)
      : '—';
    const appearances = games.appearances ?? '—';
    const goalsTotal  = goals.total   ?? '—';
    const assists     = goals.assists  ?? '—';
    const yellowCards = cards.yellow  ?? '—';

    // Normalise position string to our CSS class naming
    const posClass = position !== '—'
      ? position.toLowerCase().replace(/\s+/g, '-')
      : 'unknown';

    // Rating colour: green ≥ 7, amber 6–7, red < 6
    let ratingClass = '';
    if (rating !== '—') {
      const r = parseFloat(rating);
      ratingClass = r >= 7 ? 'rating--good' : r >= 6 ? 'rating--avg' : 'rating--poor';
    }

    return `
      <article class="scout-card" role="listitem" aria-label="${name}, ${nationality} ${position}">
        <div class="scout-card__header">
          <div class="scout-card__photo-wrap">
            <img
              src="${photo}"
              alt="Photo of ${name}"
              class="scout-card__photo"
              loading="lazy"
              onerror="this.src='https://placehold.co/80x80/0B6E4F/F7F7F2?text=${encodeURIComponent(name.charAt(0))}'"
            />
          </div>
          <div class="scout-card__title">
            <h3 class="scout-card__name">${name}</h3>
            <p class="scout-card__meta">${nationality} · ${age} yrs</p>
            <span class="legend-card__pos legend-card__pos--${posClass}">${position}</span>
          </div>
          ${rating !== '—' ? `<span class="scout-card__rating ${ratingClass}" aria-label="Rating ${rating}">${rating}</span>` : ''}
        </div>

        <div class="scout-card__team">
          ${team.logo ? `<img src="${team.logo}" alt="${team.name} logo" class="scout-card__team-logo" />` : ''}
          <span class="scout-card__team-name">${team.name || '—'}</span>
          <span class="scout-card__league">${league.name || ''}</span>
        </div>

        <div class="scout-card__stats">
          <div class="scout-card__stat">
            <span class="scout-card__stat-val">${appearances}</span>
            <span class="scout-card__stat-label">Apps</span>
          </div>
          <div class="scout-card__stat">
            <span class="scout-card__stat-val">${goalsTotal}</span>
            <span class="scout-card__stat-label">Goals</span>
          </div>
          <div class="scout-card__stat">
            <span class="scout-card__stat-val">${assists}</span>
            <span class="scout-card__stat-label">Assists</span>
          </div>
          <div class="scout-card__stat">
            <span class="scout-card__stat-val">${yellowCards}</span>
            <span class="scout-card__stat-label">🟨</span>
          </div>
        </div>

        <div class="scout-card__footer">
          <span class="scout-card__height">${height !== '—' ? `📏 ${height}` : ''}</span>
          ${league.logo ? `<img src="${league.logo}" alt="${league.name}" class="scout-card__league-logo" />` : ''}
        </div>
      </article>
    `;
  }

  /**
   * Build prev / page numbers / next pagination controls.
   */
  _buildPagination() {
    const totalPages = Math.ceil(this._filtered.length / ScoutRenderer.RESULTS_PER_PAGE);

    if (totalPages <= 1) {
      this._pagination.innerHTML = '';
      return;
    }

    const buttons = [];

    // Prev button
    buttons.push(`
      <button
        class="pagination-btn ${this._currentPage === 1 ? 'is-disabled' : ''}"
        data-page="${this._currentPage - 1}"
        aria-label="Previous page"
        ${this._currentPage === 1 ? 'disabled' : ''}
      >‹ Prev</button>
    `);

    // Page number buttons — show at most 5 page numbers around current
    const range = this._pageRange(this._currentPage, totalPages);
    range.forEach((p) => {
      if (p === '…') {
        buttons.push(`<span class="pagination-ellipsis">…</span>`);
      } else {
        buttons.push(`
          <button
            class="pagination-btn ${p === this._currentPage ? 'is-active' : ''}"
            data-page="${p}"
            aria-label="Page ${p}"
            aria-current="${p === this._currentPage ? 'page' : 'false'}"
          >${p}</button>
        `);
      }
    });

    // Next button
    buttons.push(`
      <button
        class="pagination-btn ${this._currentPage === totalPages ? 'is-disabled' : ''}"
        data-page="${this._currentPage + 1}"
        aria-label="Next page"
        ${this._currentPage === totalPages ? 'disabled' : ''}
      >Next ›</button>
    `);

    this._pagination.innerHTML = `
      <p class="pagination-summary">
        Showing ${Math.min((this._currentPage - 1) * ScoutRenderer.RESULTS_PER_PAGE + 1, this._filtered.length)}–${Math.min(this._currentPage * ScoutRenderer.RESULTS_PER_PAGE, this._filtered.length)}
        of ${this._filtered.length} results
      </p>
      <div class="pagination-controls">${buttons.join('')}</div>
    `;

    // Bind page button clicks
    this._pagination.querySelectorAll('.pagination-btn:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._currentPage = parseInt(btn.dataset.page, 10);
        this._renderPage();
      });
    });
  }

  /**
   * Generate an array of page numbers (with '…' ellipsis) around the current page.
   */
  _pageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [1];
    if (current > 3) pages.push('…');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('…');
    pages.push(total);
    return pages;
  }

  // ─────────────────────────────────────────
  // PRIVATE — UI State Management
  // ─────────────────────────────────────────

  _hideAllStates() {
    [this._loading, this._error, this._empty].forEach((el) => {
      if (el) el.classList.add('state-panel--hidden');
    });
    this._grid.innerHTML = '';
    this._pagination.innerHTML = '';
  }

  _showLoading() {
    this._hideAllStates();
    this._loading.classList.remove('state-panel--hidden');
    this._loading.innerHTML = `
      <div class="spinner" role="status" aria-label="Loading results">
        <div class="spinner__ball"></div>
      </div>
      <p class="state-panel__msg">Scouting players…</p>
    `;
  }

  _showError(message) {
    this._hideAllStates();
    this._error.classList.remove('state-panel--hidden');

    // Special case: no API key yet — show a helpful setup message
    const isNoKey = message === 'NO_KEY';
    this._error.innerHTML = isNoKey
      ? `
        <p class="state-panel__icon">🔑</p>
        <p class="state-panel__title">API Key Required</p>
        <p class="state-panel__msg">
          To use Live Scout, add your free API-Football key to
          <code>config/config.js</code>.<br/>
          See the <a href="about.html">About page</a> for setup instructions.
        </p>
      `
      : `
        <p class="state-panel__icon">⚠️</p>
        <p class="state-panel__title">Something went wrong</p>
        <p class="state-panel__msg">${message}</p>
        <button class="btn-primary" id="retryBtn">Try Again</button>
      `;

    // Wire up retry button
    const retryBtn = this._error.querySelector('#retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        if (this._lastQuery) this._performSearch(this._lastQuery);
      });
    }
  }

  _showEmpty(message = 'No results found. Try a different search term.') {
    this._hideAllStates();
    this._empty.classList.remove('state-panel--hidden');
    this._empty.innerHTML = `
      <p class="state-panel__icon">🔍</p>
      <p class="state-panel__title">No Results</p>
      <p class="state-panel__msg">${message}</p>
    `;
  }

  _showWelcome() {
    this._grid.innerHTML = `
      <div class="scout-welcome">
        <p class="scout-welcome__icon">⚽</p>
        <h2 class="scout-welcome__title">Ready to Scout</h2>
        <p class="scout-welcome__text">
          Enter a player name above to search live football data.<br/>
          Try searching for <strong>Mbappe</strong>, <strong>Haaland</strong>, or <strong>Bellingham</strong>.
        </p>
      </div>
    `;
  }
}
