/**
 * ApiService.js
 * -----------------------------------------------------------------------
 * PRIMARY: TheSportsDB v1 (free, no key required)
 *
 * SEARCH STRATEGY — multi-query merge:
 *   A bare surname search like "mbappe" on TheSportsDB returns only the
 *   most prominent player (Kylian). To surface ALL matching players
 *   (Ethan, Wilfried, etc.) we:
 *     1. Run the full query as typed
 *     2. Also run each individual word (≥3 chars) as its own query
 *     3. Merge all response arrays, deduplicating by idPlayer
 *
 *   Example: "mbappe"        → queries: ["mbappe"]
 *            "kylian mbappe" → queries: ["kylian mbappe", "kylian", "mbappe"]
 *
 *   This is done via Promise.all so all queries fire in parallel —
 *   no added latency beyond the slowest individual request.
 * -----------------------------------------------------------------------
 */
import { SPORTSDB_BASE_URL } from '../../config/config.js';

export class ApiService {
  constructor() {
    this._base = SPORTSDB_BASE_URL;
  }

  // ─────────────────────────────────────────
  // PUBLIC
  // ─────────────────────────────────────────

  /**
   * Search players by name using a multi-query strategy.
   * Returns a deduplicated, merged array of normalised player objects.
   *
   * @param  {string} name — player name (min 3 chars)
   * @returns {Promise<Array>}
   */
  async searchPlayers(name) {
    const query = (name || '').trim();
    if (query.length < 3) {
      throw new Error('Please enter at least 3 characters to search.');
    }

    // Build unique set of search terms: full query + individual words ≥ 3 chars
    const terms = new Set([query]);
    query.split(/\s+/).forEach(word => {
      if (word.length >= 3) terms.add(word.toLowerCase());
    });

    // Fire all queries in parallel
    const responses = await Promise.all(
      [...terms].map(term =>
        this._fetch(
          `${this._base}/searchplayers.php?p=${encodeURIComponent(term)}`
        ).then(raw => raw.player || [])
         .catch(() => [])  // one failed query never kills the whole search
      )
    );

    // Merge + deduplicate by player ID
    const seen   = new Set();
    const merged = [];
    responses.flat().forEach(p => {
      if (p.idPlayer && !seen.has(p.idPlayer)) {
        seen.add(p.idPlayer);
        merged.push(p);
      }
    });

    if (merged.length === 0) return []; // caller handles empty state

    // Sort: put the closest name match first (e.g. "Kylian Mbappé" before
    // "Ethan Mbappé" when searching "mbappe" — most relevant at top)
    const lc = query.toLowerCase();
    merged.sort((a, b) => {
      const aName = (a.strPlayer || '').toLowerCase();
      const bName = (b.strPlayer || '').toLowerCase();
      const aStarts = aName.startsWith(lc) ? 0 : 1;
      const bStarts = bName.startsWith(lc) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      // Secondary sort: exact surname match
      const aSurname = aName.split(' ').pop();
      const bSurname = bName.split(' ').pop();
      const aExact   = aSurname === lc ? 0 : 1;
      const bExact   = bSurname === lc ? 0 : 1;
      return aExact - bExact;
    });

    return merged.map(this._normalisePlayer);
  }

  /**
   * Fetch last 5 completed matches for a team.
   * @param  {string} teamId — TheSportsDB team ID
   */
  async getTeamLastFixtures(teamId) {
    if (!teamId) return [];
    const raw = await this._fetch(`${this._base}/eventslast.php?id=${teamId}`);
    return (raw.results || []).map(this._normaliseFixture);
  }

  /**
   * Fetch next 5 upcoming matches for a team.
   * @param  {string} teamId — TheSportsDB team ID
   */
  async getTeamNextFixtures(teamId) {
    if (!teamId) return [];
    const raw = await this._fetch(`${this._base}/eventsnext.php?id=${teamId}`);
    return (raw.events || []).map(this._normaliseFixture);
  }

  /**
   * Search players by team name (used by Dream Team builder).
   * @param  {string} teamName
   */
  async searchPlayersByTeam(teamName) {
    if (!teamName || teamName.trim().length < 3) return [];
    const raw = await this._fetch(
      `${this._base}/searchplayers.php?t=${encodeURIComponent(teamName.trim())}`
    );
    return (raw.player || []).map(this._normalisePlayer);
  }

  // ─────────────────────────────────────────
  // PRIVATE — Normalisers
  // ─────────────────────────────────────────

  _normalisePlayer = (p) => ({
    id:          p.idPlayer        || '',
    name:        p.strPlayer       || 'Unknown',
    nationality: p.strNationality  || '—',
    position:    p.strPosition     || '—',
    team:        p.strTeam         || '—',
    rawTeamId:   p.idTeam          || null,
    height:      p.strHeight       || '',
    weight:      p.strWeight       || '',
    born:        p.dateBorn        || '',
    photo:       p.strThumb        || p.strCutout || '',
    description: p.strDescriptionEN || '',
    age: p.dateBorn
      ? Math.floor(
          (Date.now() - new Date(p.dateBorn)) / (1000 * 60 * 60 * 24 * 365.25)
        )
      : null,
  });

  _normaliseFixture = (e) => ({
    id:        e.idEvent          || '',
    homeTeam:  e.strHomeTeam      || '—',
    awayTeam:  e.strAwayTeam      || '—',
    homeScore: e.intHomeScore     ?? null,
    awayScore: e.intAwayScore     ?? null,
    date:      e.dateEvent        || '',
    time:      e.strTime          || '',
    league:    e.strLeague        || '',
    venue:     e.strVenue         || '',
    status:    e.strStatus        || '',
    homeBadge: e.strHomeTeamBadge || '',
    awayBadge: e.strAwayTeamBadge || '',
  });

  // ─────────────────────────────────────────
  // PRIVATE — Core fetch
  // ─────────────────────────────────────────

  async _fetch(url) {
    let res;
    try {
      res = await fetch(url);
    } catch {
      throw new Error('Network error — please check your internet connection.');
    }
    if (!res.ok) {
      throw new Error(`Request failed (HTTP ${res.status}). Please try again.`);
    }
    return res.json();
  }
}
