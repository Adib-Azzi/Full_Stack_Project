/**
 * ApiService.js
 * -----------------------------------------------------------------------
 * A dedicated ES6 class that handles every network request to API-Football.
 * Nothing else in the codebase calls fetch() — all API logic is isolated here.
 *
 * Responsibilities:
 *   - Attaching the required API key header to every request
 *   - Performing player and team searches via the v3 API-Football endpoints
 *   - Throwing typed, descriptive errors so the UI layer can respond clearly
 *
 * API-Football (api-sports.io) — free tier:
 *   - 100 requests / day
 *   - Requires header: x-apisports-key
 *   - Base URL: https://v3.football.api-sports.io
 *
 * Endpoint we use: GET /players?search={query}&season={year}
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

  // ─────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────

  /**
   * Search for players by name.
   * Returns an array of player result objects from the API.
   *
   * API-Football requires a `season` parameter alongside a player search.
   * We default to the most recent completed season (2024).
   *
   * @param   {string} query  — the player name to search (min 3 chars recommended)
   * @param   {number} season — the football season year (e.g. 2024 = 2024/25 season)
   * @returns {Promise<Array>} — array of player objects from API response
   * @throws  {Error}          — descriptive error if fetch or API fails
   */
  async searchPlayers(query, season = 2024) {
    if (!query || query.trim().length < 3) {
      throw new Error('Please enter at least 3 characters to search.');
    }

    if (API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('NO_KEY');
    }

    const url = `${this._baseUrl}/players?search=${encodeURIComponent(query.trim())}&season=${season}`;
    return this._fetch(url);
  }

  /**
   * Search for teams by name.
   *
   * @param   {string} query — the team name to search
   * @returns {Promise<Array>} — array of team objects from API response
   */
  async searchTeams(query) {
    if (!query || query.trim().length < 3) {
      throw new Error('Please enter at least 3 characters to search.');
    }

    if (API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('NO_KEY');
    }

    const url = `${this._baseUrl}/teams?search=${encodeURIComponent(query.trim())}`;
    return this._fetch(url);
  }

  // ─────────────────────────────────────────
  // PRIVATE — Core fetch wrapper
  // ─────────────────────────────────────────

  /**
   * Internal fetch wrapper. Attaches auth headers, validates HTTP status,
   * checks the API's own `errors` field, and returns the `response` array.
   *
   * API-Football always returns:
   * {
   *   "errors": [],           // array — non-empty means API-level error
   *   "results": 10,          // number of items in response
   *   "response": [...]       // the actual data array we care about
   * }
   *
   * @param   {string} url — fully constructed endpoint URL
   * @returns {Promise<Array>}
   */
  async _fetch(url) {
    let response;

    try {
      response = await fetch(url, { headers: this._headers });
    } catch (networkError) {
      // Network-level failure (offline, DNS failure, CORS block, etc.)
      throw new Error(
        'Network error — please check your internet connection and try again.'
      );
    }

    // HTTP-level error (4xx, 5xx)
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit reached — the free API plan allows 100 requests per day. Please try again tomorrow.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key — please check your key in config/config.js.');
      }
      throw new Error(`API request failed with status ${response.status}. Please try again later.`);
    }

    const data = await response.json();

    // API-Football-level error (valid HTTP response but the API reports an error)
    if (data.errors && Object.keys(data.errors).length > 0) {
      const firstError = Object.values(data.errors)[0];
      throw new Error(`API error: ${firstError}`);
    }

    // Return the data array (may be empty — that is NOT an error, it's an empty state)
    return data.response || [];
  }
}
