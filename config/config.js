/**
 * config.js
 * -----------------------------------------------------------------------
 * API-Football v3 (api-sports.io) — primary API for player search + fixtures
 *
 * HOW TO GET YOUR FREE KEY:
 * 1. Go to https://dashboard.api-football.com/register
 * 2. Create a free account (no credit card needed)
 * 3. Copy your API key from the dashboard home screen
 * 4. Paste it below replacing 'YOUR_API_KEY_HERE'
 *
 * FREE TIER LIMITS: 100 requests / day · 10 requests / minute
 * Each search fires (leagues × seasons) parallel requests.
 * -----------------------------------------------------------------------
 */
export const API_KEY      = 'd453897e75911e8f2010c46dc234e90e';
export const API_BASE_URL = 'https://v3.football.api-sports.io';

/**
 * Leagues searched in parallel on every player name query.
 * Covers the top 5 European leagues — enough to find virtually
 * any prominent professional player without requiring user input.
 */
export const SEARCH_LEAGUES = [
  { id: 39,  name: 'Premier League'  },
  { id: 140, name: 'La Liga'         },
  { id: 78,  name: 'Bundesliga'      },
  { id: 135, name: 'Serie A'         },
  { id: 61,  name: 'Ligue 1'         },
];

// Search both current and previous season to handle mid-season / transfer gaps seamlessly
export const SEARCH_SEASONS = [2024, 2023];