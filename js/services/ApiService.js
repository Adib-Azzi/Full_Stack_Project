/**
 * ApiService.js
 * -----------------------------------------------------------------------
 * PRIMARY: TheSportsDB v1 (free, no key, flexible name-only search)
 *   searchPlayers(name)         → /searchplayers.php?p={name}
 *   getTeamLastFixtures(teamId) → /eventslast.php?id={teamId}
 *   getTeamNextFixtures(teamId) → /eventsnext.php?id={teamId}
 * -----------------------------------------------------------------------
 */
import { SPORTSDB_BASE_URL } from '../../config/config.js';

export class ApiService {
  constructor() {
    this._base = SPORTSDB_BASE_URL;
  }

  async searchPlayers(name) {
    if (!name || name.trim().length < 3) {
      throw new Error('Please enter at least 3 characters to search.');
    }
    const url  = `${this._base}/searchplayers.php?p=${encodeURIComponent(name.trim())}`;
    const raw  = await this._fetch(url);
    const players = raw.player || [];
    return players.map(this._normalisePlayer);
  }

  async getTeamLastFixtures(teamId) {
    if (!teamId) return [];
    const raw = await this._fetch(`${this._base}/eventslast.php?id=${teamId}`);
    return (raw.results || []).map(this._normaliseFixture);
  }

  async getTeamNextFixtures(teamId) {
    if (!teamId) return [];
    const raw = await this._fetch(`${this._base}/eventsnext.php?id=${teamId}`);
    return (raw.events || []).map(this._normaliseFixture);
  }

  async searchPlayersByTeam(teamName) {
    if (!teamName || teamName.trim().length < 3) return [];
    const raw = await this._fetch(`${this._base}/searchplayers.php?t=${encodeURIComponent(teamName.trim())}`);
    return (raw.player || []).map(this._normalisePlayer);
  }

  _normalisePlayer = (p) => ({
    id:          p.idPlayer       || '',
    name:        p.strPlayer      || 'Unknown',
    nationality: p.strNationality || '—',
    position:    p.strPosition    || '—',
    team:        p.strTeam        || '—',
    rawTeamId:   p.idTeam         || null,
    height:      p.strHeight      || '',
    weight:      p.strWeight      || '',
    born:        p.dateBorn       || '',
    photo:       p.strThumb       || p.strCutout || '',
    description: p.strDescriptionEN || '',
    age: p.dateBorn
      ? Math.floor((Date.now() - new Date(p.dateBorn)) / (1000 * 60 * 60 * 24 * 365.25))
      : null,
  });

  _normaliseFixture = (e) => ({
    id:        e.idEvent           || '',
    homeTeam:  e.strHomeTeam       || '—',
    awayTeam:  e.strAwayTeam       || '—',
    homeScore: e.intHomeScore      ?? null,
    awayScore: e.intAwayScore      ?? null,
    date:      e.dateEvent         || '',
    time:      e.strTime           || '',
    league:    e.strLeague         || '',
    venue:     e.strVenue          || '',
    status:    e.strStatus         || '',
    homeBadge: e.strHomeTeamBadge  || '',
    awayBadge: e.strAwayTeamBadge  || '',
  });

  async _fetch(url) {
    let res;
    try { res = await fetch(url); }
    catch { throw new Error('Network error — please check your internet connection.'); }
    if (!res.ok) throw new Error(`Request failed (HTTP ${res.status}). Please try again.`);
    return res.json();
  }
}
