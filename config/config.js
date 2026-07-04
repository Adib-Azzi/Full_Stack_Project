/**
 * config.js
 * -----------------------------------------------------------------------
 * Bzzoiro Sports Data (BSD) — free football API for player search + stats
 *
 * HOW TO GET YOUR FREE KEY:
 * 1. Go to https://sports.bzzoiro.com/register/
 * 2. Create a free account (no credit card needed)
 * 3. Copy your API token from your account page
 * 4. Paste it below replacing 'YOUR_API_KEY_HERE'
 *
 * FREE TIER: football REST endpoints have no published rate limit,
 * no daily quota, and require no credit card.
 * -----------------------------------------------------------------------
 */
export const API_KEY      = '8d70069af086107028487456f380677648ca34e6';
export const API_BASE_URL = 'https://sports.bzzoiro.com/api/v2';
export const IMG_BASE_URL = 'https://sports.bzzoiro.com/img';

// How many per-match stat rows to sample per player when building the
// "season" totals (goals/assists/cards/appearances) shown on scout cards.
export const STATS_SAMPLE_SIZE = 40;

// How many players to pull back per name search.
export const SEARCH_RESULTS_LIMIT = 24;
