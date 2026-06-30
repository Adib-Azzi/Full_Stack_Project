/**
 * app-live-scout.js
 * Entry point for live-scout.html.
 * Instantiates NavController, ApiService, and ScoutRenderer,
 * then injects ApiService into ScoutRenderer (dependency injection —
 * ScoutRenderer never imports ApiService directly, keeping classes decoupled).
 */
import { NavController }  from './ui/NavController.js';
import { ApiService }     from './services/ApiService.js';
import { ScoutRenderer }  from './ui/ScoutRenderer.js';

new NavController();

const api = new ApiService();

new ScoutRenderer(api, {
  form:      'scoutSearchForm',
  input:     'scoutSearchInput',
  posFilter: 'scoutPositionFilter',
  grid:      'scoutResultsGrid',
  loading:   'scoutLoadingState',
  error:     'scoutErrorState',
  empty:     'scoutEmptyState',
  pagination:'scoutPagination',
});
