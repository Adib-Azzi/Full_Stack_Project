/**
 * app-hall-of-fame.js
 * Entry point for hall-of-fame.html.
 * Instantiates NavController and HallOfFameRenderer, passing in the
 * DOM element IDs defined in the HTML. This file stays intentionally thin —
 * all logic lives inside the class files it imports.
 */
import { NavController } from './ui/NavController.js';
import { HallOfFameRenderer } from './ui/HallOfFameRenderer.js';

new NavController();
new HallOfFameRenderer('legendsGrid', 'hofFilters');
