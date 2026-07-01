/**
 * app-hall-of-fame.js — Entry point for hall-of-fame.html
 */
import { NavController }              from './ui/NavController.js';
import { HallOfFameRenderer }         from './ui/HallOfFameRenderer.js';
import { animateCards, initLazyImages } from './ui/animations.js';

new NavController();

// HallOfFameRenderer renders all 15 cards synchronously on construction,
// so we can call animateCards() immediately after.
new HallOfFameRenderer('legendsGrid', 'hofFilters');
animateCards();
initLazyImages();
