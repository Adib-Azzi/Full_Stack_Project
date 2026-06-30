/**
 * ScoutRenderer.js
 * -----------------------------------------------------------------------
 * Owns all visual output on live-scout.html.
 * Pipeline: form submit → validate inputs → call ApiService →
 *           store results → client-side position filter → paginate → render
 * -----------------------------------------------------------------------
 */
export class ScoutRenderer {
  static RESULTS_PER_PAGE = 9;

  constructor(apiService, elementIds) {
    this._api = apiService;

    this._form       = document.getElementById(elementIds.form);
    this._input      = document.getElementById(elementIds.input);
    this._leagueEl   = document.getElementById(elementIds.leagueSelect);
    this._posFilter  = document.getElementById(elementIds.posFilter);
    this._grid       = document.getElementById(elementIds.grid);
    this._loading    = document.getElementById(elementIds.loading);
    this._error      = document.getElementById(elementIds.error);
    this._empty      = document.getElementById(elementIds.empty);
    this._pagination = document.getElementById(elementIds.pagination);

    this._allResults  = [];
    this._filtered    = [];
    this._currentPage = 1;
    this._lastQuery   = '';
    this._lastLeague  = '';

    if (!this._form || !this._grid) {
      console.error('ScoutRenderer: required elements not found.');
      return;
    }

    this._bindEvents();
    this._showWelcome();
  }

  // ─────────────────────────────────────────
  // Event Binding
  // ─────────────────────────────────────────

  _bindEvents() {
    this._form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const query    = this._input.value.trim();
      const leagueId = this._leagueEl.value;

      // Client-side validation before hitting the API
      if (!query || query.length < 3) {
        this._showError('Please enter at least 3 characters to search.');
        return;
      }
      if (!leagueId) {
        this._showError('Please select a league from the dropdown before searching.');
        return;
      }

      this._lastQuery  = query;
      this._lastLeague = leagueId;
      this._currentPage = 1;
      await this._performSearch(query, leagueId);
    });

    // Position filter: re-filter in-memory results, no extra API call needed
    this._posFilter.addEventListener('change', () => {
      this._currentPage = 1;
      this._applyFilterAndRender();
    });
  }

  // ─────────────────────────────────────────
  // Search & Filter Pipeline
  // ─────────────────────────────────────────

  async _performSearch(query, leagueId) {
    this._showLoading();
    try {
      this._allResults = await this._api.searchPlayers(query, leagueId);
      this._applyFilterAndRender();
    } catch (err) {
      this._showError(err.message);
    }
  }

  _applyFilterAndRender() {
    const selectedPosition = this._posFilter.value;

    if (selectedPosition) {
      this._filtered = this._allResults.filter((item) => {
        const pos = item?.statistics?.[0]?.games?.position || '';
        return pos.toLowerCase().includes(selectedPosition.toLowerCase());
      });
    } else {
      this._filtered = [...this._allResults];
    }

    if (this._filtered.length === 0) {
      const msg = this._allResults.length > 0
        ? `No ${this._posFilter.value.toLowerCase()}s found in these results — try a different position filter.`
        : `No players found for "${this._lastQuery}" in this league. Try a different name or league.`;
      this._showEmpty(msg);
      return;
    }

    this._renderPage();
  }

  // ─────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────

  _renderPage() {
    this._hideAllStates();

    const start     = (this._currentPage - 1) * ScoutRenderer.RESULTS_PER_PAGE;
    const pageItems = this._filtered.slice(start, start + ScoutRenderer.RESULTS_PER_PAGE);

    this._grid.innerHTML = pageItems.map((item) => this._buildPlayerCard(item)).join('');
    this._buildPagination();
    this._grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  _buildPlayerCard(item) {
    const p      = item.player                  || {};
    const stat   = (item.statistics || [])[0]   || {};
    const team   = stat.team    || {};
    const league = stat.league  || {};
    const games  = stat.games   || {};
    const goals  = stat.goals   || {};
    const cards  = stat.cards   || {};

    const name        = p.name          || 'Unknown Player';
    const photo       = p.photo         || '';
    const age         = p.age           || '—';
    const nationality = p.nationality   || '—';
    const height      = p.height        || '';
    const position    = games.position  || '—';
    const appearances = games.appearances ?? '—';
    const rating      = games.rating ? parseFloat(games.rating).toFixed(1) : '—';
    const goalsTotal  = goals.total   ?? '—';
    const assists     = goals.assists  ?? '—';
    const yellowCards = cards.yellow   ?? '—';

    const posClass    = position !== '—' ? position.toLowerCase().replace(/\s+/g, '-') : 'unknown';
    let   ratingClass = '';
    if (rating !== '—') {
      const r = parseFloat(rating);
      ratingClass = r >= 7 ? 'rating--good' : r >= 6 ? 'rating--avg' : 'rating--poor';
    }

    return `
      <article class="scout-card" role="listitem" aria-label="${name}, ${nationality} ${position}">
        <div class="scout-card__header">
          <div class="scout-card__photo-wrap">
            <img src="${photo}" alt="Photo of ${name}" class="scout-card__photo" loading="lazy"
              onerror="this.src='https://placehold.co/80x80/0B6E4F/F7F7F2?text=${encodeURIComponent(name.charAt(0))}'" />
          </div>
          <div class="scout-card__title">
            <h3 class="scout-card__name">${name}</h3>
            <p class="scout-card__meta">${nationality} · ${age} yrs</p>
            <span class="legend-card__pos legend-card__pos--${posClass}">${position}</span>
          </div>
          ${rating !== '—' ? `<span class="scout-card__rating ${ratingClass}" aria-label="Rating ${rating}">${rating}</span>` : ''}
        </div>

        <div class="scout-card__team">
          ${team.logo ? `<img src="${team.logo}" alt="${team.name} crest" class="scout-card__team-logo" />` : ''}
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
          <span class="scout-card__height">${height ? `📏 ${height}` : ''}</span>
          ${league.logo ? `<img src="${league.logo}" alt="${league.name}" class="scout-card__league-logo" />` : ''}
        </div>
      </article>
    `;
  }

  _buildPagination() {
    const totalPages = Math.ceil(this._filtered.length / ScoutRenderer.RESULTS_PER_PAGE);
    if (totalPages <= 1) { this._pagination.innerHTML = ''; return; }

    const buttons = [];

    buttons.push(`<button class="pagination-btn ${this._currentPage === 1 ? 'is-disabled' : ''}"
      data-page="${this._currentPage - 1}" aria-label="Previous page"
      ${this._currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`);

    this._pageRange(this._currentPage, totalPages).forEach((p) => {
      if (p === '…') {
        buttons.push(`<span class="pagination-ellipsis">…</span>`);
      } else {
        buttons.push(`<button class="pagination-btn ${p === this._currentPage ? 'is-active' : ''}"
          data-page="${p}" aria-label="Page ${p}" aria-current="${p === this._currentPage ? 'page' : 'false'}">${p}</button>`);
      }
    });

    buttons.push(`<button class="pagination-btn ${this._currentPage === totalPages ? 'is-disabled' : ''}"
      data-page="${this._currentPage + 1}" aria-label="Next page"
      ${this._currentPage === totalPages ? 'disabled' : ''}>Next ›</button>`);

    const start = (this._currentPage - 1) * ScoutRenderer.RESULTS_PER_PAGE + 1;
    const end   = Math.min(this._currentPage * ScoutRenderer.RESULTS_PER_PAGE, this._filtered.length);

    this._pagination.innerHTML = `
      <p class="pagination-summary">Showing ${start}–${end} of ${this._filtered.length} results</p>
      <div class="pagination-controls">${buttons.join('')}</div>
    `;

    this._pagination.querySelectorAll('.pagination-btn:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._currentPage = parseInt(btn.dataset.page, 10);
        this._renderPage();
      });
    });
  }

  _pageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (current > 3) pages.push('…');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('…');
    pages.push(total);
    return pages;
  }

  // ─────────────────────────────────────────
  // UI State Management
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

    const isNoKey = message === 'NO_KEY';
    this._error.innerHTML = isNoKey
      ? `
        <p class="state-panel__icon">🔑</p>
        <p class="state-panel__title">API Key Required</p>
        <p class="state-panel__msg">
          Add your free API-Football key to <code>config/config.js</code>.<br/>
          See the <a href="about.html">About page</a> for setup instructions.
        </p>`
      : `
        <p class="state-panel__icon">⚠️</p>
        <p class="state-panel__title">Something went wrong</p>
        <p class="state-panel__msg">${message}</p>
        <button class="btn-primary" id="retryBtn" style="margin-top:1rem;">Try Again</button>`;

    const retryBtn = this._error.querySelector('#retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        if (this._lastQuery && this._lastLeague) {
          this._performSearch(this._lastQuery, this._lastLeague);
        }
      });
    }
  }

  _showEmpty(message = 'No results found. Try a different name or league.') {
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
          Select a league, enter a player name, and hit Search.<br/>
          Try <strong>Saka</strong> in the Premier League, or <strong>Vinicius</strong> in La Liga.
        </p>
      </div>
    `;
  }
}
