/**
 * ApiService.js
 * -----------------------------------------------------------------------
 * Handles every network request to API-Football (v3).
 *
 * IMPORTANT NOTE ON API CONSTRAINTS:
 * The /players endpoint requires EITHER a `league` OR `team` ID parameter
 * alongside any `search` query. A bare name search alone returns an error:
 * "The League or Team field is required with the Search field."
 * We therefore require a leagueId to be passed with every player search.
 * -----------------------------------------------------------------------
 */
import { API_KEY, API_BASE_URL } from '../../config/config.js';

export class ApiService {
  constructor() {
    this._baseUrl = API_BASE_URL;
    this._headers = {
      'x-apisports-key': API_KEY,
    };
  }

  /**
   * Search for players by name within a specific league.
   *
   * @param {string} query    — player name (min 3 chars)
   * @param {string} leagueId — API-Football league ID (e.g. '39' for Premier League)
   * @param {number} season   — season year (e.g. 2024 = 2024/25)
   * @returns {Promise<Array>}
   */
  async searchPlayers(query, leagueId, season = 2024) {
    if (!query || query.trim().length < 3) {
      throw new Error('Please enter at least 3 characters to search.');
    }
    if (!leagueId) {
      throw new Error('Please select a league before searching.');
    }
    if (API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('NO_KEY');
    }

    const url = `${this._baseUrl}/players?search=${encodeURIComponent(query.trim())}&league=${leagueId}&season=${season}`;
    return this._fetch(url);
  }

  /**
   * Core fetch wrapper — attaches auth headers, validates HTTP + API-level errors.
   */
  async _fetch(url) {
    let response;
    try {
      response = await fetch(url, { headers: this._headers });
    } catch {
      throw new Error('Network error — please check your internet connection and try again.');
    }

    if (!response.ok) {
      if (response.status === 429) throw new Error('Rate limit reached — the free plan allows 100 requests/day. Try again tomorrow.');
      if (response.status === 401 || response.status === 403) throw new Error('Invalid API key — please check your key in config/config.js.');
      throw new Error(`API request failed (HTTP ${response.status}). Please try again later.`);
    }

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      const firstError = Object.values(data.errors)[0];
      throw new Error(`API error: ${firstError}`);
    }

    return data.response || [];
  }
}
