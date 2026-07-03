/**
 * ScoutRenderer.js
 * -----------------------------------------------------------------------
 * Owns all visual output on live-scout.html.
 *
 * Changes from previous version:
 *   - Search is name-only (no league required) — TheSportsDB handles it
 *   - Position filter is now a client-side pill bar (not a dropdown)
 * -----------------------------------------------------------------------
 */
import { animateCards, initLazyImages } from './animations.js';

// sessionStorage key used to persist the last search across page
// navigations (this is a multi-page site, so clicking another nav link is
// a full page load and would otherwise wipe the search results).
const STORAGE_KEY = 'liveScout:lastSearch';

export class ScoutRenderer {
  static RESULTS_PER_PAGE = 9;

  constructor(apiService, elementIds) {
    this._api        = apiService;
    this._form         = document.getElementById(elementIds.form);
    this._input        = document.getElementById(elementIds.input);
    this._seasonSelect = document.getElementById(elementIds.seasonSelect);
    this._posFilter    = document.getElementById(elementIds.posFilter);
    this._grid       = document.getElementById(elementIds.grid);
    this._loading    = document.getElementById(elementIds.loading);
    this._error      = document.getElementById(elementIds.error);
    this._empty      = document.getElementById(elementIds.empty);
    this._pagination = document.getElementById(elementIds.pagination);

    this._allResults    = [];
    this._filtered      = [];
    this._currentPage   = 1;
    this._lastQuery     = '';

    if (!this._form || !this._grid) { console.error('ScoutRenderer: elements missing.'); return; }

    this._bindEvents();

    if (!this._restoreState()) {
      this._showWelcome();
    }
  }

  // ─────────────────────────────────────────
  // PERSISTENCE — keeps the last search across page navigations
  // ─────────────────────────────────────────

  _saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        query:       this._lastQuery,
        season:      this._activeSeason(),
        position:    this._activePosition(),
        page:        this._currentPage,
        allResults:  this._allResults,
      }));
    } catch (err) {
      console.warn('ScoutRenderer: could not save search progress.', err);
    }
  }

  _restoreState() {
    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      saved = null;
    }
    if (!saved || !Array.isArray(saved.allResults) || saved.allResults.length === 0) {
      return false;
    }

    this._lastQuery   = saved.query || '';
    this._allResults  = saved.allResults;
    this._currentPage = saved.page || 1;

    if (this._input) this._input.value = this._lastQuery;
    if (this._seasonSelect && saved.season) this._seasonSelect.value = saved.season;

    if (this._posFilter && saved.position) {
      this._posFilter.querySelectorAll('.scout-pos-btn').forEach(b => {
        b.classList.toggle('is-active', b.dataset.pos === saved.position);
      });
    }

    this._applyFilterAndRender();
    return true;
  }

  // ─────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────

  _bindEvents() {
    this._form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = this._input.value.trim();
      if (query.length < 3) {
        this._showError('Please enter at least 3 characters to search.');
        return;
      }
      this._lastQuery   = query;
      this._currentPage = 1;
      await this._performSearch(query, this._activeSeason());
    });

    // Client-side position filter — pill buttons rendered in HTML
    this._posFilter?.addEventListener('click', (e) => {
      const btn = e.target.closest('.scout-pos-btn');
      if (!btn) return;
      this._posFilter.querySelectorAll('.scout-pos-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      this._currentPage = 1;
      this._applyFilterAndRender();
      this._saveState();
    });
  }

  _activePosition() {
    const active = this._posFilter?.querySelector('.scout-pos-btn.is-active');
    return active?.dataset.pos || '';
  }

  _activeSeason() {
    return this._seasonSelect?.value || '2025';
  }

  // ─────────────────────────────────────────
  // Search + Filter pipeline
  // ─────────────────────────────────────────

  async _performSearch(query, season) {
    this._showLoading();
    try {
      this._allResults = await this._api.searchPlayers(query, season);
      this._applyFilterAndRender();
      this._saveState();
    } catch (err) {
      this._showError(err.message);
    }
  }

  _applyFilterAndRender() {
    const pos = this._activePosition();
    this._filtered = pos
      ? this._allResults.filter(p => (p.position || '').toLowerCase().includes(pos.toLowerCase()))
      : [...this._allResults];

    if (this._filtered.length === 0) {
      const msg = this._allResults.length > 0
        ? `No ${pos.toLowerCase()}s in these results — try a different position filter.`
        : `No players found for "${this._lastQuery}". Try a different spelling or name.`;
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

    this._grid.innerHTML = pageItems.map(p => this._buildPlayerCard(p)).join('');
    this._buildPagination();
    animateCards('.scout-card');
    initLazyImages();
    this._grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  _buildPlayerCard(player) {
    const pos      = player.position || '—';
    const posClass = pos !== '—' ? pos.toLowerCase().replace(/\s+/g, '-') : 'unknown';
    const age      = player.age ? `${player.age} yrs` : '';

    // Fix #2: only render a value when we actually have one — no bare dashes.
    const statVal = (v) => (v === '—' || v === null || v === undefined || v === '') ? '' : v;

    return `
      <article class="scout-card" data-player-id="${player.id}" data-team-id="${player.rawTeamId || ''}"
        role="listitem" aria-label="${player.name}, ${player.nationality} ${pos}">

        <div class="scout-card__header">
          <div class="scout-card__photo-wrap">
            <img src="${player.photo}" alt="Photo of ${player.name}" class="scout-card__photo" loading="lazy"
              onerror="this.src='https://placehold.co/80x80/1A1A1A/F2B705?text=${encodeURIComponent(player.name.charAt(0))}'"/>
          </div>
          <div class="scout-card__title">
            <h3 class="scout-card__name">${player.name}</h3>
            <p class="scout-card__meta">${player.nationality}${age ? ' · ' + age : ''}</p>
            <span class="legend-card__pos legend-card__pos--${posClass}">${pos}</span>
          </div>
        </div>

        <div class="scout-card__team">
          ${player.teamLogo ? `<img src="${player.teamLogo}" alt="${player.team}" class="scout-card__team-logo" />` : ''}
          <span class="scout-card__team-name">${player.team}</span>
          ${player.leagueLogo ? `<img src="${player.leagueLogo}" alt="${player.league}" class="scout-card__league-logo" />` : ''}
        </div>

        <p class="scout-card__stats-label">League Stats</p>
        <div class="scout-card__stats">
          <div class="scout-card__stat">
            <span class="scout-card__stat-val">${statVal(player.appearances)}</span>
            <span class="scout-card__stat-label">Apps</span>
          </div>
          <div class="scout-card__stat">
            <span class="scout-card__stat-val">${statVal(player.goals)}</span>
            <span class="scout-card__stat-label">Goals</span>
          </div>
          <div class="scout-card__stat">
            <span class="scout-card__stat-val">${statVal(player.assists)}</span>
            <span class="scout-card__stat-label">Assists</span>
          </div>
          <div class="scout-card__stat">
            <span class="scout-card__stat-val">${statVal(player.yellowCards)}</span>
            <span class="scout-card__stat-label">🟨</span>
          </div>
        </div>

        <div class="scout-card__detail-row">
          ${player.height ? `<span>height: ${player.height} cm</span>` : ''}
          ${player.born   ? `<span>🗓️ ${player.born}</span>`   : ''}
        </div>

      </article>`;
  }

  // ─────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────

  _buildPagination() {
    const total = Math.ceil(this._filtered.length / ScoutRenderer.RESULTS_PER_PAGE);
    if (total <= 1) { this._pagination.innerHTML = ''; return; }

    const btns = [];
    btns.push(`<button class="pagination-btn" data-page="${this._currentPage - 1}"
      aria-label="Previous page" ${this._currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`);

    this._pageRange(this._currentPage, total).forEach(p => {
      if (p === '…') { btns.push(`<span class="pagination-ellipsis">…</span>`); return; }
      btns.push(`<button class="pagination-btn ${p === this._currentPage ? 'is-active' : ''}"
        data-page="${p}" aria-current="${p === this._currentPage ? 'page' : 'false'}">${p}</button>`);
    });

    btns.push(`<button class="pagination-btn" data-page="${this._currentPage + 1}"
      aria-label="Next page" ${this._currentPage === total ? 'disabled' : ''}>Next ›</button>`);

    const s = (this._currentPage - 1) * ScoutRenderer.RESULTS_PER_PAGE + 1;
    const e = Math.min(this._currentPage * ScoutRenderer.RESULTS_PER_PAGE, this._filtered.length);

    this._pagination.innerHTML = `
      <p class="pagination-summary">Showing ${s}–${e} of ${this._filtered.length} results</p>
      <div class="pagination-controls">${btns.join('')}</div>`;

    this._pagination.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        this._currentPage = parseInt(btn.dataset.page, 10);
        this._renderPage();
        this._saveState();
      });
    });
  }

  _pageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const p = [1];
    if (cur > 3) p.push('…');
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) p.push(i);
    if (cur < total - 2) p.push('…');
    p.push(total);
    return p;
  }

  // ─────────────────────────────────────────
  // State management
  // ─────────────────────────────────────────

  _hideAllStates() {
    [this._loading, this._error, this._empty].forEach(el => el?.classList.add('state-panel--hidden'));
    this._grid.innerHTML        = '';
    this._pagination.innerHTML  = '';
  }

  _showLoading() {
    this._hideAllStates();
    this._loading.classList.remove('state-panel--hidden');
    this._loading.innerHTML = `
      <div class="spinner" role="status" aria-label="Loading"><div class="spinner__ball"></div></div>
      <p class="state-panel__msg">Scouting players…</p>`;
  }

  _showError(msg) {
    this._hideAllStates();
    this._error.classList.remove('state-panel--hidden');

    const isNoKey = msg === 'NO_KEY';
    this._error.innerHTML = isNoKey
      ? `<p class="state-panel__icon">🔑</p>
         <p class="state-panel__title">API Key Required</p>
         <p class="state-panel__msg">
           Add your free API-Football key to <code>config/config.js</code>.<br/>
           See the <a href="about.html" style="color:var(--color-accent)">About page</a> for setup instructions.
         </p>`
      : `<p class="state-panel__icon">⚠️</p>
         <p class="state-panel__title">Something went wrong</p>
         <p class="state-panel__msg">${msg}</p>
         <button class="btn-primary" id="retryBtn" style="margin-top:1rem">Try Again</button>`;

    this._error.querySelector('#retryBtn')?.addEventListener('click', () => {
      if (this._lastQuery) this._performSearch(this._lastQuery, this._activeSeason());
    });
  }

  _showEmpty(msg = 'No results found.') {
    this._hideAllStates();
    this._empty.classList.remove('state-panel--hidden');
    this._empty.innerHTML = `
      <p class="state-panel__icon">🔍</p>
      <p class="state-panel__title">No Results</p>
      <p class="state-panel__msg">${msg}</p>`;
  }

  _showWelcome() {
    this._grid.innerHTML = `
      <div class="scout-welcome">
        <p class="scout-welcome__icon">⚽</p>
        <h2 class="scout-welcome__title">Ready to Scout</h2>
        <p class="scout-welcome__text">
          Enter any player name — no league selection needed.<br/>
          Try <strong>Bellingham</strong>, <strong>Haaland</strong>, or <strong>Salah</strong>.
        </p>
      </div>`;
  }
}
