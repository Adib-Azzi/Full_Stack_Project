/**
 * config.js
 * -----------------------------------------------------------------------
 * Central configuration for all external APIs.
 *
 * PRIMARY API: TheSportsDB (free, no key required for v1 endpoints)
 *   - Flexible player search by name only — no league ID required
 *   - Returns position, team, nationality, photo, description
 *   - Also provides last 5 / next 5 fixtures per team (free tier)
 *   - Docs: https://www.thesportsdb.com/api.php
 *
 * SECONDARY API: API-Football (optional, requires free key)
 *   - Still used if you have a key and want deeper stats
 *   - Set API_FOOTBALL_KEY below once you have one
 * -----------------------------------------------------------------------
 */

// TheSportsDB — public free tier (key "3" is their public test key)
export const SPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

// API-Football — optional, set your key here if you have one
// Leave as 'YOUR_API_KEY_HERE' and the app will fall back to TheSportsDB only
export const API_KEY      = 'YOUR_API_KEY_HERE';
export const API_BASE_URL = 'https://v3.football.api-sports.io';
