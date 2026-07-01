/**
 * app-home.js — Entry point for index.html
 */
import { NavController }         from './ui/NavController.js';
import { LEGENDS }               from './data/legends-data.js';
import { animateCards, initLazyImages } from './ui/animations.js';

new NavController();

// ---- Featured Legends (Pelé, Maradona, Messi) ----
const FEATURED_IDS   = ['pele', 'maradona', 'messi'];
const featuredLegends = LEGENDS.filter((l) => FEATURED_IDS.includes(l.id));
const featuredGrid    = document.getElementById('featuredGrid');

if (featuredGrid) {
  featuredGrid.innerHTML = featuredLegends.map((legend) => {
    const wcStars = '★'.repeat(legend.worldCups) + '☆'.repeat(Math.max(0, 3 - legend.worldCups));
    return `
      <article class="legend-card" role="listitem" aria-label="${legend.name}, ${legend.nationality} ${legend.position}">
        <div class="legend-card__img-wrap">
          <img src="images/${legend.id}.jpg" alt="Photo of ${legend.name}" class="legend-card__img" loading="lazy"
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
              <span class="legend-card__stat-value legend-card__stat-value--stars" aria-label="${legend.worldCups} World Cup wins">${wcStars}</span>
            </div>
          </div>
          <p class="legend-card__bio">${legend.bio.substring(0, 160)}…</p>
          <a href="hall-of-fame.html" class="btn-primary" style="margin-top:auto;text-align:center;display:block;">Full Profiles →</a>
        </div>
      </article>`;
  }).join('');

  // Animate cards into view and lazy-load images
  animateCards();
  initLazyImages();
}
