/**
 * app-dream-team.js — Entry point for dream-team.html
 */
import { NavController }      from './ui/NavController.js';
import { ApiService }         from './services/ApiService.js';
import { DreamTeamRenderer }  from './ui/DreamTeamRenderer.js';

new NavController();

const api = new ApiService();

new DreamTeamRenderer(
  {
    pitch:           'dreamPitch',
    formationSelect: 'formationSelect',
    resetBtn:        'resetTeamBtn',
    teamName:        'teamNameInput',
  },
  api
);
