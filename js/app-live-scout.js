import { NavController }  from './ui/NavController.js';
import { ApiService }     from './services/ApiService.js';
import { ScoutRenderer }  from './ui/ScoutRenderer.js';

new NavController();

new ScoutRenderer(new ApiService(), {
  form:         'scoutSearchForm',
  input:        'scoutSearchInput',
  posFilter:    'scoutPositionFilter',
  grid:         'scoutResultsGrid',
  loading:      'scoutLoadingState',
  error:        'scoutErrorState',
  empty:        'scoutEmptyState',
  pagination:   'scoutPagination',
});
