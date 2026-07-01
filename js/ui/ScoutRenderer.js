/**
 * ScoutRenderer.js
 * -----------------------------------------------------------------------
 * Owns all visual output on live-scout.html.
 *
 * Changes from previous version:
 *   - Search is name-only (no league required) — TheSportsDB handles it
 *   - Position filter is now a client-side pill bar (not a dropdown)
 *   - Clicking a player card expands an inline fixtures panel showing
 *     last 5 results + next 5 upcoming matches for the player's team
 * -----------------------------------------------------------------------
 */
import { animateCards, initLazyImages } from './animations.js';

export class ScoutRenderer {
  static RESULTS_PER_PAGE = 9;

  constructor(apiService, elementIds) {
    this._api        = apiService;
    this._form       = document.getElementById(elementIds.form);
    this._input      = document.getElementById(elementIds.input);
    this._posFilter  = document.getElementById(elementIds.posFilter);
    this._grid       = document.getElementById(elementIds.grid);
    this._loading    = document.getElementById(elementIds.loading);
    this._error      = document.getElementById(elementIds.error);
    this._empty      = document.getElementById(elementIds.empty);
    this._pagination = document.getElementById(elementIds.pagination);

    this._allResults    = [];
    this._filtered      = [];
    this._currentPage   = 1;
    this._lastQuery     = '';
    this._expandedCardId = null; // tracks which card has fixtures open

    if (!this._form || !this._grid) { console.error('ScoutRenderer: elements missing.'); return; }

    this._bindEvents();
    this._showWelcome();
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
      this._expandedCardId = null;
      await this._performSearch(query);
    });

    // Client-side position filter — pill buttons rendered in HTML
    this._posFilter?.addEventListener('click', (e) => {
      const btn = e.target.closest('.scout-pos-btn');
      if (!btn) return;
      this._posFilter.querySelectorAll('.scout-pos-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      this._currentPage = 1;
      this._applyFilterAndRender();
    });
  }

  _activePosition() {
    const active = this._posFilter?.querySelector('.scout-pos-btn.is-active');
    return active?.dataset.pos || '';
  }

  // ─────────────────────────────────────────
  // Search + Filter pipeline
  // ─────────────────────────────────────────

  async _performSearch(query) {
    this._showLoading();
    try {
      this._allResults = await this._api.searchPlayers(query);
      this._applyFilterAndRender();
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
    this._bindCardClicks();
    this._buildPagination();
    animateCards('.scout-card');
    initLazyImages();
    this._grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  _buildPlayerCard(player) {
    const pos      = player.position || '—';
    const posClass = pos !== '—' ? pos.toLowerCase().replace(/\s+/g, '-') : 'unknown';
    const age      = player.age ? `${player.age} yrs` : '';

    return `
      <article class="scout-card" data-player-id="${player.id}" data-team-id="${player.rawTeamId || ''}"
        role="listitem" aria-label="${player.name}, ${player.nationality} ${pos}">
        <div class="scout-card__header">
          <div class="scout-card__photo-wrap">
            <img src="${player.photo}" alt="Photo of ${player.name}" class="scout-card__photo" loading="lazy"
              onerror="this.src='https://placehold.co/80x80/0B6E4F/F7F7F2?text=${encodeURIComponent(player.name.charAt(0))}'"/>
          </div>
          <div class="scout-card__title">
            <h3 class="scout-card__name">${player.name}</h3>
            <p class="scout-card__meta">${player.nationality}${age ? ' · ' + age : ''}</p>
            <span class="legend-card__pos legend-card__pos--${posClass}">${pos}</span>
          </div>
        </div>

        <div class="scout-card__team">
          <span class="scout-card__team-name">⚽ ${player.team}</span>
        </div>

        <div class="scout-card__detail-row">
          ${player.height ? `<span>📏 ${player.height}</span>` : ''}
          ${player.weight ? `<span>⚖️ ${player.weight}</span>` : ''}
          ${player.born   ? `<span>🗓️ ${player.born}</span>`   : ''}
        </div>

        <!-- Fixtures toggle button -->
        ${player.rawTeamId ? `
          <button class="scout-card__fixtures-btn" data-team-id="${player.rawTeamId}"
            aria-expanded="false" aria-label="Show fixtures for ${player.team}">
            📅 Show Fixtures
          </button>
          <div class="scout-card__fixtures-panel" data-panel-id="${player.id}" hidden></div>
        ` : ''}
      </article>`;
  }

  // ── Fixtures inline expansion ──
  _bindCardClicks() {
    this._grid.querySelectorAll('.scout-card__fixtures-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const card      = btn.closest('.scout-card');
        const panel     = card.querySelector('.scout-card__fixtures-panel');
        const teamId    = btn.dataset.teamId;
        const isOpen    = btn.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          panel.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
          btn.textContent = '📅 Show Fixtures';
          return;
        }

        // Load fixtures
        btn.textContent = '⏳ Loading…';
        btn.disabled    = true;

        try {
          const [past, next] = await Promise.all([
            this._api.getTeamLastFixtures(teamId),
            this._api.getTeamNextFixtures(teamId),
          ]);
          panel.innerHTML  = this._buildFixturesPanel(past, next);
          panel.hidden     = false;
          btn.setAttribute('aria-expanded', 'true');
          btn.textContent  = '📅 Hide Fixtures';
        } catch {
          panel.innerHTML = `<p class="fixtures-error">Could not load fixtures.</p>`;
          panel.hidden    = false;
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  /**
   * Build the fixtures panel HTML — last 5 results + next 5 upcoming.
   */
  _buildFixturesPanel(past, next) {
    const renderFixture = (f, isResult) => {
      const scored = f.homeScore !== null && f.awayScore !== null;
      return `
        <div class="fixture-row">
          <span class="fixture-row__date">${f.date}</span>
          <span class="fixture-row__teams">${f.homeTeam} vs ${f.awayTeam}</span>
          ${isResult && scored
            ? `<span class="fixture-row__score">${f.homeScore} – ${f.awayScore}</span>`
            : `<span class="fixture-row__time">${f.time || 'TBC'}</span>`}
        </div>`;
    };

    const pastHTML = past.length
      ? past.slice(0, 5).map(f => renderFixture(f, true)).join('')
      : '<p class="fixtures-empty">No recent results available.</p>';

    const nextHTML = next.length
      ? next.slice(0, 5).map(f => renderFixture(f, false)).join('')
      : '<p class="fixtures-empty">No upcoming fixtures available.</p>';

    return `
      <div class="fixtures-panel">
        <div class="fixtures-section">
          <h5 class="fixtures-section__title">📊 Last 5 Results</h5>
          ${pastHTML}
        </div>
        <div class="fixtures-section">
          <h5 class="fixtures-section__title">🗓️ Next 5 Fixtures</h5>
          ${nextHTML}
        </div>
      </div>`;
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
    this._error.innerHTML = `
      <p class="state-panel__icon">⚠️</p>
      <p class="state-panel__title">Something went wrong</p>
      <p class="state-panel__msg">${msg}</p>
      <button class="btn-primary" id="retryBtn" style="margin-top:1rem">Try Again</button>`;
    this._error.querySelector('#retryBtn')?.addEventListener('click', () => {
      if (this._lastQuery) this._performSearch(this._lastQuery);
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
