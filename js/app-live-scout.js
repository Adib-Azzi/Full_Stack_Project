/**
 * app-live-scout.js
 * Entry point for live-scout.html.
 */
import { NavController }  from './ui/NavController.js';
import { ApiService }     from './services/ApiService.js';
import { ScoutRenderer }  from './ui/ScoutRenderer.js';

new NavController();

const api = new ApiService();

new ScoutRenderer(api, {
  form:         'scoutSearchForm',
  input:        'scoutSearchInput',
  leagueSelect: 'scoutLeagueSelect',
  posFilter:    'scoutPositionFilter',
  grid:         'scoutResultsGrid',
  loading:      'scoutLoadingState',
  error:        'scoutErrorState',
  empty:        'scoutEmptyState',
  pagination:   'scoutPagination',
});
