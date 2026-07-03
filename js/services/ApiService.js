/**
 * ApiService.js
 * -----------------------------------------------------------------------
 * Bzzoiro Sports Data (BSD) — https://sports.bzzoiro.com/
 * Free football REST API — player search, team rosters, per-match stats.
 *
 * BSD's /players/ endpoint returns identity + contract data only (no
 * season goals/assists/cards/rating). To rebuild the "season stat line"
 * the UI expects, we sample each player's recent per-match rows from
 * /players/{id}/stats/ and sum/average them client-side. Team names are
 * resolved via /teams/{id}/ and cached in memory since the same club
 * often shows up for several players in one search. Photos and crests
 * don't need an API call at all — BSD serves them straight off numeric
 * IDs via the public /img/ proxy.
 * -----------------------------------------------------------------------
 */
import {
  API_KEY,
  API_BASE_URL,
  IMG_BASE_URL,
  STATS_SAMPLE_SIZE,
  SEARCH_RESULTS_LIMIT,
} from '../../config/config.js';

export class ApiService {
  constructor() {
    this._base    = API_BASE_URL;
    this._img     = IMG_BASE_URL;
    this._headers = { Authorization: `Token ${API_KEY}` };
    this._teamCache = new Map(); // teamId -> { name, country }
  }

  // ─────────────────────────────────────────
  // PUBLIC
  // ─────────────────────────────────────────

  /**
   * Search players by name.
   * (The `season` argument is accepted for backwards compatibility with
   * the season selector in the UI, but BSD's player search isn't
   * season-scoped, so it's currently unused.)
   *
   * @param  {string} name — player name, min 3 chars
   * @returns {Promise<Array>}
   */
  async searchPlayers(name /*, season */) {
    const query = (name || '').trim();
    if (query.length < 3) {
      throw new Error('Please enter at least 3 characters to search.');
    }
    if (API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('NO_KEY');
    }

    const raw = await this._fetch(
      `${this._base}/players/?name=${encodeURIComponent(query)}&limit=${SEARCH_RESULTS_LIMIT}`
    );

    if (!raw.length) return [];

    const enriched = await Promise.all(raw.map(p => this._buildPlayer(p)));

    // Sort: highest rated first (players with no sampled matches sink to the bottom)
    enriched.sort((a, b) => {
      const rA = a.rating ? parseFloat(a.rating) : -1;
      const rB = b.rating ? parseFloat(b.rating) : -1;
      return rB - rA;
    });

    return enriched;
  }

  /**
   * Search players by team name (used by Dream Team builder).
   * @param  {string} teamName
   * @returns {Promise<Array>}
   */
  async searchPlayersByTeam(teamName) {
    const query = (teamName || '').trim();
    if (query.length < 3) return [];
    if (API_KEY === 'YOUR_API_KEY_HERE') return [];

    // Resolve team name -> team ID
    const teams = await this._fetch(
      `${this._base}/teams/?name=${encodeURIComponent(query)}&limit=1`
    ).catch(() => []);

    if (!teams.length) return [];
    const team = teams[0];

    // Fetch the roster for that team
    const squad = await this._requestRaw(
      `${this._base}/teams/${team.id}/squad/`
    ).catch(() => null);

    const players = squad?.players || [];
    return players.map(p => this._normaliseSquadPlayer(p, team));
  }

  // ─────────────────────────────────────────
  // PRIVATE — building a full player record
  // ─────────────────────────────────────────

  async _buildPlayer(p) {
    const [team, stats] = await Promise.all([
      p.current_team_id ? this._getTeam(p.current_team_id) : Promise.resolve(null),
      this._getPlayerStatLine(p.id),
    ]);

    return {
      id:           p.id            ?? '',
      name:         p.name          || 'Unknown',
      nationality:  p.nationality   || '—',
      position:     this._mapPosition(p.position),
      specificPosition: p.specific_position || '',
      team:         team?.name      || '—',
      teamLogo:     p.current_team_id ? `${this._img}/team/${p.current_team_id}/` : '',
      rawTeamId:    p.current_team_id || null,
      league:       '',
      leagueLogo:   '',
      height:       p.height_cm     ? `${p.height_cm}` : '',
      weight:       p.weight_kg     ? `${p.weight_kg}` : '',
      born:         p.date_of_birth || '',
      photo:        `${this._img}/player/${p.id}/`,
      age:          this._ageFromDob(p.date_of_birth),
      appearances:  stats.appearances,
      rating:       stats.rating,
      goals:        stats.goals,
      assists:      stats.assists,
      yellowCards:  stats.yellowCards,
      redCards:     stats.redCards,
    };
  }

  _normaliseSquadPlayer(p, team) {
    return {
      id:           p.id ?? '',
      name:         p.name || 'Unknown',
      nationality:  p.nationality || '—',
      position:     this._mapPosition(p.position),
      team:         team?.name || '—',
      teamLogo:     `${this._img}/team/${team.id}/`,
      rawTeamId:    team.id,
      league:       '',
      leagueLogo:   '',
      height:       '',
      weight:       '',
      born:         p.date_of_birth || '',
      photo:        `${this._img}/player/${p.id}/`,
      age:          this._ageFromDob(p.date_of_birth),
      appearances:  '—',
      rating:       null,
      goals:        '—',
      assists:      '—',
      yellowCards:  '—',
      redCards:     '—',
    };
  }

  /**
   * BSD returns short position codes (GK/DF/MF/FW, with specific_position
   * like CB/AM/RW for detail). The UI's position filter pills and the
   * player-card badge expect the full-word category API-Football used
   * to send ("Goalkeeper"/"Defender"/"Midfielder"/"Forward"), so map it.
   */
  _mapPosition(code) {
    const map = { GK: 'Goalkeeper', G: 'Goalkeeper',
      CB: 'Defender', D: 'Defender', LB: 'Defender', LWB: 'Defender', RB: 'Defender', RWB: 'Defender', 
      AM: 'Midfielder', CM: 'Midfielder', LM: 'Midfielder', M: 'Midfielder', RM: 'Midfielder', 
      F: 'Forward', FW: 'Forward', LW: 'Forward', RW: 'Forward', SS: 'Forward', ST: 'Forward'};
    return map[code] || code || '—';
  }



  _ageFromDob(dob) {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }

  // ─────────────────────────────────────────
  // PRIVATE — team + stats lookups (cached / sampled)
  // ─────────────────────────────────────────

  async _getTeam(teamId) {
    if (this._teamCache.has(teamId)) return this._teamCache.get(teamId);
    const team = await this._requestRaw(`${this._base}/teams/${teamId}/`).catch(() => null);
    this._teamCache.set(teamId, team);
    return team;
  }

  /**
   * Pulls a recent sample of per-match stat rows for a player and rolls
   * them up into the season-style line the UI cards expect.
   */
  async _getPlayerStatLine(playerId) {
    const empty = { appearances: '—', goals: '—', assists: '—', yellowCards: '—', redCards: '—', rating: null };
    const rows = await this._fetch(
      `${this._base}/players/${playerId}/stats/?limit=${STATS_SAMPLE_SIZE}`
    ).catch(() => []);

    if (!rows.length) return empty;

    const sum   = (key) => rows.reduce((acc, r) => acc + (r[key] || 0), 0);
    const rated = rows.filter(r => typeof r.rating === 'number');
    const avgRating = rated.length
      ? (rated.reduce((acc, r) => acc + r.rating, 0) / rated.length).toFixed(1)
      : null;

    return {
      appearances: rows.length,
      goals:       sum('goals'),
      assists:     sum('goal_assist'),
      yellowCards: sum('yellow_card'),
      redCards:    sum('red_card'),
      rating:      avgRating,
    };
  }

  /**
   * Last 5 played fixtures (from the player's own match log), for the
   * "Show Fixtures" expand panel.
   *
   * @param  {number|string} playerId
   * @param  {number|string|null} teamId — the player's current_team_id (unused, kept for call-site compatibility)
   * @returns {Promise<{past: Array}>}
   */
  async getPlayerFixtures(playerId, teamId) {
    const statRows = await this._fetch(
      `${this._base}/players/${playerId}/stats/?limit=5`
    ).catch(() => []);

    const pastEvents = await Promise.all(
      statRows.map(row => this._requestRaw(`${this._base}/events/${row.event_id}/`).catch(() => null))
    );

    return {
      past: pastEvents.filter(Boolean).map(e => this._normaliseFixture(e)),
    };
  }

  _normaliseFixture(e) {
    return {
      id:           e.id,
      date:         e.event_date || '',
      status:       e.status || '',
      homeTeam:     e.home_team || '—',
      awayTeam:     e.away_team || '—',
      homeTeamLogo: e.home_team_id ? `${this._img}/team/${e.home_team_id}/` : '',
      awayTeamLogo: e.away_team_id ? `${this._img}/team/${e.away_team_id}/` : '',
      homeScore:    Number.isInteger(e.home_score) ? e.home_score : null,
      awayScore:    Number.isInteger(e.away_score) ? e.away_score : null,
      league:       e.league_name || '',
    };
  }

  // ─────────────────────────────────────────
  // PRIVATE — Core fetch
  // ─────────────────────────────────────────

  /** Fetch a paginated list endpoint and return just the `results` array. */
  async _fetch(url) {
    const data = await this._requestRaw(url);
    return data?.results || [];
  }

  /** Fetch any endpoint and return the raw parsed JSON. */
  async _requestRaw(url) {
    let res;
    try {
      res = await fetch(url, { headers: this._headers });
    } catch {
      throw new Error('Network error — please check your internet connection.');
    }

    if (!res.ok) {
      if (res.status === 404) return null;
      if (res.status === 429) throw new Error('Rate limit reached — please try again shortly.');
      if (res.status === 401 || res.status === 403) throw new Error('Invalid API key — check your key in config/config.js.');
      throw new Error(`Request failed (HTTP ${res.status}).`);
    }

    return res.json();
  }
}
