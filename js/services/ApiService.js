/**
 * ApiService.js
 * -----------------------------------------------------------------------
 * API-Football v3 (api-sports.io) — player search + fixtures
 *
 * PLAYER SEARCH STRATEGY — parallel multi-league, single season:
 * API-Football requires a league ID and a season alongside any player name search.
 * Instead of forcing the user to pick a league, we fire requests across all
 * SEARCH_LEAGUES simultaneously via Promise.all for one given season,
 * then merge, sort, and deduplicate the results by player ID.
 *
 * FIXTURES:
 * Uses the team ID returned with each player's statistics to fetch
 * last 5 and next 5 fixtures for that player's club.
 * -----------------------------------------------------------------------
 */
import { API_KEY, API_BASE_URL, SEARCH_LEAGUES, DEFAULT_SEASON } from '../../config/config.js';

export class ApiService {
  constructor() {
    this._base    = API_BASE_URL;
    this._headers = { 'x-apisports-key': API_KEY };
  }

  // ─────────────────────────────────────────
  // PUBLIC
  // ─────────────────────────────────────────

  /**
   * Search players by name across all configured leagues, for one season, in parallel.
   * Returns a deduplicated, normalised array sorted by rating (best first).
   *
   * @param  {string} name — player name, min 3 chars
   * @param  {number|string} [season] — season to search, defaults to DEFAULT_SEASON
   * @returns {Promise<Array>}
   */
  async searchPlayers(name, season = DEFAULT_SEASON) {
    const query = (name || '').trim();
    if (query.length < 3) {
      throw new Error('Please enter at least 3 characters to search.');
    }
    if (API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('NO_KEY');
    }

    // Build one url per league, all for the same season
    const requests = SEARCH_LEAGUES.map(league => ({
      url: `${this._base}/players?search=${encodeURIComponent(query)}&league=${league.id}&season=${season}`,
      label: `${league.name} ${season}`
    }));

    // Fire all requests in parallel — capture data and track error logs per lookup block
    const settled = await Promise.all(
      requests.map(req =>
        this._fetch(req.url)
          .then(data => ({ data, error: null, label: req.label }))
          .catch(err => ({ data: [], error: err.message, label: req.label }))
      )
    );

    // Separate successes from failures
    const successes = settled.filter(r => r.data.length > 0);
    const failures  = settled.filter(r => r.error !== null);

    // If EVERY request failed, throw the first concrete informative error to the user interface
    if (successes.length === 0 && failures.length === requests.length) {
      const primaryError = failures.find(f => !f.error.includes('Network')) || failures[0];
      throw new Error(primaryError.error);
    }

    // Merge and deduplicate by unique player ID across overlapping season matrices
    const seen   = new Set();
    const merged = [];
    successes.flatMap(r => r.data).forEach(item => {
      const pid = item?.player?.id;
      if (pid && !seen.has(pid)) {
        seen.add(pid);
        merged.push(item);
      }
    });

    // Sort: highest rated players first based on performance scales
    merged.sort((a, b) => {
      const rA = parseFloat(a?.statistics?.[0]?.games?.rating || 0);
      const rB = parseFloat(b?.statistics?.[0]?.games?.rating || 0);
      return rB - rA;
    });

    return merged.map(this._normalisePlayer);
  }

  /**
   * Fetch last 5 completed fixtures for a team.
   * @param  {string|number} teamId — API-Football team ID
   * @returns {Promise<Array>}
   */
  async getTeamLastFixtures(teamId) {
    if (!teamId) return [];
    const raw = await this._fetch(
      `${this._base}/fixtures?team=${teamId}&last=5`
    ).catch(() => []);
    return raw.map(this._normaliseFixture);
  }

  /**
   * Fetch next 5 upcoming fixtures for a team.
   * @param  {string|number} teamId — API-Football team ID
   * @returns {Promise<Array>}
   */
  async getTeamNextFixtures(teamId) {
    if (!teamId) return [];
    const raw = await this._fetch(
      `${this._base}/fixtures?team=${teamId}&next=5`
    ).catch(() => []);
    return raw.map(this._normaliseFixture);
  }

  /**
   * Search players by team name (used by Dream Team builder).
   * @param  {string} teamName
   * @returns {Promise<Array>}
   */
  async searchPlayersByTeam(teamName) {
    if (!teamName || teamName.trim().length < 3) return [];
    if (API_KEY === 'YOUR_API_KEY_HERE') return [];

    // First resolve team name → team ID
    const teams = await this._fetch(
      `${this._base}/teams?search=${encodeURIComponent(teamName.trim())}`
    ).catch(() => []);

    if (!teams.length) return [];
    const teamId = teams[0]?.team?.id;
    if (!teamId) return [];

    // Fetch roster data using the default season
    const raw = await this._fetch(
      `${this._base}/players?team=${teamId}&season=${DEFAULT_SEASON}`
    ).catch(() => []);

    return raw.map(this._normalisePlayer);
  }

  // ─────────────────────────────────────────
  // PRIVATE — Normalisers
  // ─────────────────────────────────────────

  _normalisePlayer = (item) => {
    const p    = item?.player                 || {};
    const stat = (item?.statistics || [])[0]  || {};
    const team = stat?.team                   || {};
    const games = stat?.games                 || {};
    const goals = stat?.goals                 || {};
    const cards = stat?.cards                 || {};

    return {
      id:           p.id            || '',
      name:         p.name          || 'Unknown',
      nationality:  p.nationality   || '—',
      position:     games.position  || p.position || '—',
      team:         team.name       || '—',
      teamLogo:     team.logo       || '',
      rawTeamId:    team.id         || null,
      league:       stat?.league?.name || '',
      leagueLogo:   stat?.league?.logo || '',
      height:       p.height        || '',
      weight:       p.weight        || '',
      born:         p.birth?.date   || '',
      photo:        p.photo         || '',
      age:          p.age           || null,
      appearances:  games.appearances ?? '—',
      rating:       games.rating ? parseFloat(games.rating).toFixed(1) : null,
      goals:        goals.total    ?? '—',
      assists:      goals.assists   ?? '—',
      yellowCards:  cards.yellow   ?? '—',
      redCards:     cards.red      ?? '—',
    };
  };

  _normaliseFixture = (item) => {
    const fixture = item?.fixture  || {};
    const teams   = item?.teams    || {};
    const goals   = item?.goals    || {};
    const league  = item?.league   || {};

    const dateObj = fixture.date ? new Date(fixture.date) : null;
    const date    = dateObj
      ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    const time    = dateObj
      ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '';

    return {
      id:        fixture.id        || '',
      homeTeam:  teams.home?.name  || '—',
      awayTeam:  teams.away?.name  || '—',
      homeBadge: teams.home?.logo  || '',
      awayBadge: teams.away?.logo  || '',
      homeScore: goals.home        ?? null,
      awayScore: goals.away        ?? null,
      date,
      time,
      league:    league.name       || '',
      venue:     fixture.venue?.name || '',
      status:    fixture.status?.short || '',
    };
  };

  // ─────────────────────────────────────────
  // PRIVATE — Core fetch
  // ─────────────────────────────────────────

  async _fetch(url) {
    let res;
    try {
      res = await fetch(url, { headers: this._headers });
    } catch {
      throw new Error('Network error — please check your internet connection.');
    }

    if (!res.ok) {
      if (res.status === 429) throw new Error('Rate limit reached — 100 requests/day on the free plan. Try again tomorrow.');
      if (res.status === 401 || res.status === 403) throw new Error('Invalid API key — check your key in config/config.js.');
      throw new Error(`Request failed (HTTP ${res.status}).`);
    }

    const data = await res.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      const msg = Object.values(data.errors)[0];
      throw new Error(`API error: ${msg}`);
    }

    return data.response || [];
  }
}