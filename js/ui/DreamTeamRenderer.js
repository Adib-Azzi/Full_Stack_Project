/**
 * DreamTeamRenderer.js
 * -----------------------------------------------------------------------
 * Manages the Dream 11 Team Builder page:
 *   - Renders an SVG football pitch with 11 position slots
 *   - Supports 3 formations: 4-3-3 | 4-4-2 | 3-5-2
 *   - Each slot opens a search modal (legends + live players)
 *   - Filled slots show player photo, name, remove button
 *   - Squad is stored in memory; can be reset at any time
 * -----------------------------------------------------------------------
 */
import { LEGENDS } from '../data/legends-data.js';

// Formation slot definitions — each entry is { label, x, y } where
// x/y are percentages of the pitch container (0,0 = top-left / GK end)
const FORMATIONS = {
  '4-3-3': [
    { label: 'GK',  x: 50, y: 88 },
    { label: 'LB',  x: 12, y: 68 }, { label: 'CB', x: 35, y: 68 },
    { label: 'CB',  x: 65, y: 68 }, { label: 'RB', x: 88, y: 68 },
    { label: 'LCM', x: 20, y: 46 }, { label: 'CM', x: 50, y: 46 },
    { label: 'RCM', x: 80, y: 46 },
    { label: 'LW',  x: 15, y: 22 }, { label: 'ST', x: 50, y: 18 },
    { label: 'RW',  x: 85, y: 22 },
  ],
  '4-4-2': [
    { label: 'GK',  x: 50, y: 88 },
    { label: 'LB',  x: 12, y: 68 }, { label: 'CB', x: 35, y: 68 },
    { label: 'CB',  x: 65, y: 68 }, { label: 'RB', x: 88, y: 68 },
    { label: 'LM',  x: 12, y: 46 }, { label: 'CM', x: 35, y: 46 },
    { label: 'CM',  x: 65, y: 46 }, { label: 'RM', x: 88, y: 46 },
    { label: 'ST',  x: 33, y: 20 }, { label: 'ST', x: 67, y: 20 },
  ],
  '3-5-2': [
    { label: 'GK',  x: 50, y: 88 },
    { label: 'CB',  x: 22, y: 68 }, { label: 'CB', x: 50, y: 68 },
    { label: 'CB',  x: 78, y: 68 },
    { label: 'LM',  x: 10, y: 46 }, { label: 'CM', x: 30, y: 46 },
    { label: 'CM',  x: 50, y: 46 }, { label: 'CM', x: 70, y: 46 },
    { label: 'RM',  x: 90, y: 46 },
    { label: 'ST',  x: 33, y: 20 }, { label: 'ST', x: 67, y: 20 },
  ],
};

// Maps every possible slot label (across all formations) to the broad
// position category used by both the LEGENDS dataset and the API-Football
// live search results ('Goalkeeper' | 'Defender' | 'Midfielder' | 'Attacker').
const SLOT_POSITION_MAP = {
  GK:  'Goalkeeper',
  LB:  'Defender',  CB: 'Defender', RB: 'Defender',
  LM:  'Midfielder', CM: 'Midfielder', RM: 'Midfielder',
  LCM: 'Midfielder', RCM: 'Midfielder',
  LW:  'Attacker',  ST: 'Attacker', RW: 'Attacker',
};

export class DreamTeamRenderer {
  constructor(elementIds, apiService) {
    this._api           = apiService;
    this._pitchEl       = document.getElementById(elementIds.pitch);
    this._formationEl   = document.getElementById(elementIds.formationSelect);
    this._resetBtn      = document.getElementById(elementIds.resetBtn);
    this._teamNameEl    = document.getElementById(elementIds.teamName);
    this._modal         = null;
    this._modalBody     = null;
    this._activeSlot    = null;   // index of the slot being filled
    this._activeCategory = null; // required position category for the active slot
    this._legendsQuery  = '';    // local search text for the Legends tab (no API call)
    this._formation     = '4-3-3';
    this._squad         = new Array(11).fill(null); // 11 player slots

    if (!this._pitchEl) { console.error('DreamTeamRenderer: pitch element not found.'); return; }

    this._injectModal();
    this._bindControls();
    this._renderPitch();
  }

  // ─────────────────────────────────────────
  // CONTROLS
  // ─────────────────────────────────────────

  _bindControls() {
    this._formationEl?.addEventListener('change', (e) => {
      this._formation = e.target.value;
      this._squad     = new Array(11).fill(null); // reset squad on formation change
      this._renderPitch();
    });

    this._resetBtn?.addEventListener('click', () => {
      this._squad = new Array(11).fill(null);
      this._renderPitch();
    });
  }

  // ─────────────────────────────────────────
  // PITCH RENDERING
  // ─────────────────────────────────────────

  _renderPitch() {
    const slots    = FORMATIONS[this._formation];
    const filled   = this._squad.filter(Boolean).length;

    this._pitchEl.innerHTML = `
      <!-- SVG pitch markings -->
      <div class="pitch__markings" aria-hidden="true">
        <div class="pitch__centre-circle"></div>
        <div class="pitch__centre-line"></div>
        <div class="pitch__penalty-top"></div>
        <div class="pitch__penalty-bottom"></div>
        <div class="pitch__goal-top"></div>
        <div class="pitch__goal-bottom"></div>
      </div>

      <!-- Player slots -->
      ${slots.map((slot, i) => this._buildSlot(slot, i)).join('')}

      <!-- Squad counter -->
      <div class="pitch__counter" aria-live="polite">
        ${filled}/11 Players Selected
      </div>
    `;

    // Bind slot clicks
    this._pitchEl.querySelectorAll('.pitch-slot').forEach(slotEl => {
      slotEl.addEventListener('click', () => {
        const idx = parseInt(slotEl.dataset.slotIndex, 10);
        if (this._squad[idx]) {
          this._removePlayer(idx);
        } else {
          this._openSearchModal(idx, slots[idx].label);
        }
      });
    });
  }

  _buildSlot(slot, index) {
    const player = this._squad[index];
    const style  = `left:${slot.x}%;top:${slot.y}%`;

    if (player) {
      const isLivePlayer = player.photo && (player.photo.includes('api-sports') || player.photo.includes('api-football'));
      
      const playerImage = isLivePlayer ? player.photo : `images/DreamTeam/${player.id}.jpg`;
      return `
        <div class="pitch-slot pitch-slot--filled" style="${style}"
          data-slot-index="${index}" role="button" tabindex="0"
          aria-label="Remove ${player.name} from ${slot.label}">
          <div class="pitch-slot__avatar">
            <img
              src="${playerImage}"
              alt="${player.name}"
              class="pitch-slot__img"
              onerror="this.src='https://placehold.co/60x60/0B6E4F/F7F7F2?text=${encodeURIComponent(player.name.charAt(0))}'"
            />
            <span class="pitch-slot__remove" aria-hidden="true">✕</span>
          </div>
          <span class="pitch-slot__name">${player.name.split(' ').pop()}</span>
          <span class="pitch-slot__label">${slot.label}</span>
        </div>`;
    }

    return `
      <div class="pitch-slot pitch-slot--empty" style="${style}"
        data-slot-index="${index}" role="button" tabindex="0"
        aria-label="Add player to ${slot.label} position">
        <div class="pitch-slot__add">+</div>
        <span class="pitch-slot__label">${slot.label}</span>
      </div>`;
  }

  _removePlayer(index) {
    this._squad[index] = null;
    this._renderPitch();
  }

  // ─────────────────────────────────────────
  // SEARCH MODAL
  // ─────────────────────────────────────────

  _injectModal() {
    const overlay = document.createElement('div');
    overlay.className = 'dt-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Select a player');
    overlay.innerHTML = `
      <div class="dt-modal">
        <div class="dt-modal__header">
          <h3 class="dt-modal__title">Select a Player</h3>
          <button class="hof-modal__close" aria-label="Close">&times;</button>
        </div>

        <!-- Source tabs: Legends vs Live -->
        <div class="dt-modal__tabs">
          <button class="dt-tab is-active" data-tab="legends">⭐ Legends</button>
          <button class="dt-tab" data-tab="live">🌐 Live Players</button>
        </div>

        <!-- Search bar (visible on Legends tab) -->
        <div class="dt-modal__search" id="dtLegendsSearch">
          <input type="text" id="dtLegendsSearchInput" class="scout-search-form__input"
            placeholder="Search legends by name…" autocomplete="off" />
        </div>

        <!-- Search bar (visible on Live tab) -->
        <div class="dt-modal__search" id="dtLiveSearch" hidden>
          <input type="text" id="dtSearchInput" class="scout-search-form__input"
            placeholder="Search player name…" autocomplete="off" />
          <button class="btn-primary" id="dtSearchBtn">Search</button>
        </div>

        <!-- Results body -->
        <div class="dt-modal__body" id="dtModalBody"></div>
      </div>`;

    document.body.appendChild(overlay);
    this._modal     = overlay;
    this._modalBody = overlay.querySelector('#dtModalBody');

    // Close
    overlay.querySelector('.hof-modal__close').addEventListener('click', () => this._closeModal());
    overlay.addEventListener('click', e => { if (e.target === overlay) this._closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._modal.classList.contains('is-open')) this._closeModal();
    });

    // Tabs
    overlay.querySelectorAll('.dt-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        overlay.querySelectorAll('.dt-tab').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const isLive = tab.dataset.tab === 'live';
        const liveSearchEl = overlay.querySelector('#dtLiveSearch');
        const legendsSearchEl = overlay.querySelector('#dtLegendsSearch');
        if (isLive) {
            liveSearchEl.classList.remove('is-hidden');
            legendsSearchEl.classList.add('is-hidden');
            this._renderLiveSearchPrompt();
        } else {
            liveSearchEl.classList.add('is-hidden');
            legendsSearchEl.classList.remove('is-hidden');
            this._renderLegendsGrid();
        }
      });
    });

    // Live search
    overlay.querySelector('#dtSearchBtn').addEventListener('click', async () => {
      const q = overlay.querySelector('#dtSearchInput').value.trim();
      if (q.length < 3) return;
      await this._runLiveSearch(q);
    });

    overlay.querySelector('#dtSearchInput').addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (q.length >= 3) await this._runLiveSearch(q);
      }
    });

    // Legends search — purely local, filters the static LEGENDS array, no API call
    overlay.querySelector('#dtLegendsSearchInput').addEventListener('input', (e) => {
      this._legendsQuery = e.target.value.trim();
      this._renderLegendsGrid();
    });
  }

  _openSearchModal(slotIndex, slotLabel) {
    this._activeSlot     = slotIndex;
    this._activeCategory = SLOT_POSITION_MAP[slotLabel] || null;
    this._modal.querySelector('.dt-modal__title').textContent =
      `Select Player — ${slotLabel}${this._activeCategory ? ` (${this._activeCategory}s only)` : ''}`;

    // Reset to Legends tab
    this._modal.querySelectorAll('.dt-tab').forEach(t => t.classList.remove('is-active'));
    this._modal.querySelector('[data-tab="legends"]').classList.add('is-active');
    this._modal.querySelector('#dtLiveSearch').hidden    = true;
    this._modal.querySelector('#dtLegendsSearch').hidden = false;
    this._legendsQuery = '';
    this._modal.querySelector('#dtLegendsSearchInput').value = '';

    this._renderLegendsGrid();
    this._modal.classList.add('is-open');
    document.body.classList.add('modal-open');
  }

  _closeModal() {
    this._modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    this._activeSlot     = null;
    this._activeCategory = null;
  }

  // ─────────────────────────────────────────
  // LEGENDS TAB
  // ─────────────────────────────────────────

  _renderLegendsGrid() {
    let eligible = this._activeCategory
      ? LEGENDS.filter(l => l.position === this._activeCategory)
      : LEGENDS;

    const q = (this._legendsQuery || '').toLowerCase();
    if (q.length >= 1) {
      eligible = eligible.filter(l => l.name.toLowerCase().includes(q));
    }

    if (!eligible.length) {
      this._modalBody.innerHTML = `
        <p class="dt-search-prompt">No legends found${q ? ` for "${this._legendsQuery}"` : ' for this position'}.</p>`;
      return;
    }

    this._modalBody.innerHTML = `
      ${this._activeCategory ? `<p class="dt-position-hint">Showing ${this._activeCategory}s only</p>` : ''}
      <div class="dt-player-grid">
        ${eligible.map(l => `
          <button class="dt-player-pick" data-source="legend" data-id="${l.id}"
            aria-label="Select ${l.name}">
            <img src="images/DreamTeam/${l.id}.jpg" alt="${l.name}"
              onerror="this.src='https://placehold.co/52x52/0B6E4F/F7F7F2?text=${encodeURIComponent(l.name.charAt(0))}'"/>
            <span class="dt-player-pick__name">${l.name}</span>
            <span class="dt-player-pick__pos">${l.position}</span>
          </button>`).join('')}
      </div>`;

    this._bindPickButtons();
  }

  // ─────────────────────────────────────────
  // LIVE SEARCH TAB
  // ─────────────────────────────────────────

  _renderLiveSearchPrompt() {
    this._modalBody.innerHTML = `
      <p class="dt-search-prompt">Enter a player name above to search live football data.</p>`;
  }

  async _runLiveSearch(query) {
    this._modalBody.innerHTML = `
      <div class="spinner" role="status"><div class="spinner__ball"></div></div>`;
    try {
      // Free API-Football plans only cover seasons 2022–2024, so the
      // Dream Team live search is pinned to the latest supported season (2024).
      const allPlayers = await this._api.searchPlayers(query, 2024);

      // Only keep players whose position matches the slot we're filling.
      // API-Football's `games.position` field uses the same category
      // strings as our LEGENDS dataset (Goalkeeper/Defender/Midfielder/Attacker),
      // so we can filter directly on that.
      const players = this._activeCategory
        ? allPlayers.filter(p => p.position === this._activeCategory)
        : allPlayers;

      if (!players.length) {
        const positionNote = this._activeCategory
          ? ` who play as ${this._activeCategory}`
          : '';
        this._modalBody.innerHTML = `<p class="dt-search-prompt">No players found for "${query}"${positionNote}.</p>`;
        return;
      }
      this._modalBody.innerHTML = `
        ${this._activeCategory ? `<p class="dt-position-hint">Showing ${this._activeCategory}s only</p>` : ''}
        <div class="dt-player-grid">
          ${players.slice(0, 20).map(p => `
            <button class="dt-player-pick" data-source="live" data-id="${p.id}"
              data-player='${JSON.stringify(p).replace(/'/g, "&#39;")}' aria-label="Select ${p.name}">
              <img src="${p.photo}" alt="${p.name}"
                onerror="this.src='https://placehold.co/52x52/0B6E4F/F7F7F2?text=${encodeURIComponent(p.name.charAt(0))}'"/>
              <span class="dt-player-pick__name">${p.name}</span>
              <span class="dt-player-pick__pos">${p.position} · ${p.team}</span>
            </button>`).join('')}
        </div>`;
      this._bindPickButtons();
    } catch (err) {
      this._modalBody.innerHTML = `<p class="dt-search-prompt">Error: ${err.message}</p>`;
    }
  }

  // ─────────────────────────────────────────
  // PICKING A PLAYER
  // ─────────────────────────────────────────

  _bindPickButtons() {
    this._modalBody.querySelectorAll('.dt-player-pick').forEach(btn => {
      btn.addEventListener('click', () => {
        let player;

        if (btn.dataset.source === 'legend') {
          player = LEGENDS.find(l => l.id === btn.dataset.id);
        } else {
          try { player = JSON.parse(btn.dataset.player); } catch { return; }
        }

        if (!player) return;

        // Safety net: even though the grids are pre-filtered, never allow a
        // player whose position doesn't match the slot to be placed.
        if (this._activeCategory && player.position !== this._activeCategory) {
          return;
        }

        // Check not already in squad
        const alreadyIn = this._squad.some(s => s && (s.id === player.id));
        if (alreadyIn) {
          btn.textContent = '✓ Already in squad';
          btn.disabled    = true;
          return;
        }

        this._squad[this._activeSlot] = player;
        this._closeModal();
        this._renderPitch();
      });
    });
  }
}
