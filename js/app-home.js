/**
 * app-home.js
 * Entry point for index.html.
 * Picks 3 "featured" legends from the curated dataset and renders
 * them as preview cards in the home page grid.
 */
import { NavController } from './ui/NavController.js';
import { HallOfFameRenderer } from './ui/HallOfFameRenderer.js';
import { LEGENDS } from './data/legends-data.js';

new NavController();

// Pick 3 iconic legends to feature on the home page (Pelé, Maradona, Messi)
const FEATURED_IDS = ['pele', 'maradona', 'messi'];
const featuredLegends = LEGENDS.filter((l) => FEATURED_IDS.includes(l.id));

// Reuse HallOfFameRenderer in "no filters" mode — just pass an empty filters container ID
// We create a throw-away instance purely to call its _buildCard method via the grid.
// Simpler: just re-use the render logic by instantiating and letting it target our home grid.
// Since HallOfFameRenderer reads from LEGENDS directly, we temporarily swap the data approach:
const featuredGrid = document.getElementById('featuredGrid');
if (featuredGrid) {
  // Build cards inline using same template approach as HallOfFameRenderer._buildCard
  // (duplicating the template here keeps app-home.js self-contained for this preview)
  featuredGrid.innerHTML = featuredLegends.map((legend) => {
    const wcStars = '★'.repeat(legend.worldCups) + '☆'.repeat(Math.max(0, 3 - legend.worldCups));
    return `
      <article class="legend-card" role="listitem" aria-label="${legend.name}, ${legend.nationality} ${legend.position}">
        <div class="legend-card__img-wrap">
          <img src="${legend.image}" alt="Photo of ${legend.name}" class="legend-card__img" loading="lazy"
            onerror="this.src='https://placehold.co/400x300/0B6E4F/F7F7F2?text=${encodeURIComponent(legend.name)}'" />
          <span class="legend-card__flag" aria-label="${legend.nationality}">${legend.flag}</span>
        </div>
        <div class="legend-card__body">
          <h3 class="legend-card__name">${legend.name}</h3>
          <div class="legend-card__meta">
            <span class="legend-card__pos legend-card__pos--${legend.position.toLowerCase()}">${legend.position}</span>
            <span class="legend-card__club">${legend.club}</span>
          </div>
          <div class="legend-card__stats">
            <div class="legend-card__stat">
              <span class="legend-card__stat-label">Caps</span>
              <span class="legend-card__stat-value">${legend.caps}</span>
            </div>
            <div class="legend-card__stat">
              <span class="legend-card__stat-label">Int. Goals</span>
              <span class="legend-card__stat-value">${legend.goals}</span>
            </div>
            <div class="legend-card__stat">
              <span class="legend-card__stat-label">World Cups</span>
              <span class="legend-card__stat-value legend-card__stat-value--stars">${wcStars}</span>
            </div>
          </div>
          <p class="legend-card__bio">${legend.bio.substring(0, 160)}…</p>
          <a href="hall-of-fame.html" class="btn-primary" style="margin-top: auto; text-align:center; display:block;">Full Profile →</a>
        </div>
      </article>
    `;
  }).join('');
}
