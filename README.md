# ⚽ Legends XI

A football hall of fame and live player scouting web application, built as an academic front-end development project.

**Live site:** *(add your GitHub Pages URL here after deployment)*
**Repository:** *(add your GitHub repo URL here)*

---

## 📋 Project Overview

Legends XI has two core features:

1. **Hall of Fame** — 15 in-depth, originally written profiles of legendary footballers, filterable client-side by position and era, rendered dynamically from a curated JavaScript dataset.
2. **Live Scout** — a real-time player search and filter tool powered by the API-Football v3 API, with client-side position filtering, paginated results, and full loading/error/empty state handling.

---

## 🛠️ Technology Stack

| Layer        | Technology                                                  |
|--------------|-------------------------------------------------------------|
| Markup       | Semantic HTML5 (4 pages)                                    |
| Styling      | Hand-written CSS3 — Flexbox, CSS Custom Properties, media queries |
| UI Framework | Bootstrap 5.3 (grid + utility classes only)                 |
| JavaScript   | Vanilla ES6 — classes, modules (import/export), async/await |
| Fonts        | Google Fonts — Bebas Neue (headings) + Inter (body)         |
| API          | API-Football v3 (api-sports.io) — free tier, 100 req/day   |
| Version Control | Git / GitHub                                             |

**No jQuery. No frameworks (React, Vue, etc.). No build tools.**

---

## 📁 Project Structure

```
legends-xi/
│
├── index.html              # Home page
├── hall-of-fame.html       # Curated 15 legends grid + filter
├── live-scout.html         # Live API player search
├── about.html              # Project methodology + API setup
│
├── css/
│   ├── variables.css       # CSS Custom Properties design token system
│   ├── base.css            # Resets, typography, global elements
│   ├── components.css      # All UI components (nav, cards, states, etc.)
│   └── responsive.css      # Media query breakpoints
│
├── js/
│   ├── data/
│   │   └── legends-data.js         # 15 curated legend objects (ES6 export)
│   ├── services/
│   │   └── ApiService.js           # API-Football fetch class
│   ├── ui/
│   │   ├── NavController.js        # Sticky nav behaviour
│   │   ├── HallOfFameRenderer.js   # Renders legend cards + filters
│   │   ├── ScoutRenderer.js        # Renders live results + states + pagination
│   │   └── animations.js           # IntersectionObserver card animations
│   ├── app-home.js                 # Entry point — index.html
│   ├── app-hall-of-fame.js         # Entry point — hall-of-fame.html
│   ├── app-live-scout.js           # Entry point — live-scout.html
│   └── app-about.js                # Entry point — about.html
│
├── config/
│   └── config.js           # API key placeholder + base URL
│
└── assets/
    └── images/             # Static assets
```

---

## 🚀 Running the Project

> **Important:** ES6 modules require an HTTP server — `file://` will be blocked by the browser's CORS policy.

### Option 1 — VS Code Live Server (recommended)
1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `index.html` → **Open with Live Server**
3. Site runs at `http://127.0.0.1:5500`

### Option 2 — Python
```bash
python -m http.server 8080
# then open http://localhost:8080
```

---

## 🔑 API Key Setup

The Live Scout page requires a free API-Football key:

1. Register at [dashboard.api-football.com/register](https://dashboard.api-football.com/register)
2. Copy your API key from the dashboard
3. Open `config/config.js` and replace the placeholder:
   ```js
   export const API_KEY = 'your_actual_key_here';
   ```
4. The Hall of Fame page works without a key (all data is local)

**API constraints (free tier):**
- 100 requests per day
- The `/players` endpoint requires a `league` ID alongside any name search
- Season defaults to 2024 (2024/25)

---

## ✨ Key Features

### Sticky Navigation
- `position: sticky` nav with 4 internal links (Home, Hall of Fame, Live Scout, About)
- Animated underline hover effect on desktop
- Collapses to hamburger menu at ≤768px with smooth slide-down panel
- `aria-expanded` synced for screen readers; closes on Escape key and click-outside
- Scroll shadow intensifies as user scrolls down the page

### Hall of Fame
- 15 originally written biographical profiles
- Client-side filtering by **position** (Goalkeeper / Defender / Midfielder / Attacker) and **era** (1960s–2010s)
- Filter buttons built dynamically from the dataset — add a 16th legend and filters update automatically
- Empty state shown when filter combination returns zero results
- IntersectionObserver scroll-in card animations

### Live Scout
- Search players by name across 7 leagues: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, World Cup
- Client-side position filter applied over returned results (no extra API call)
- Pagination: 9 results per page with smart page-number range, Prev/Next controls
- Three UI states: spinning football loader, user-friendly error with retry, empty state
- API key missing → dedicated setup guidance state (not a generic error)

### Design System
- CSS Custom Properties token system: 2 font families, 11 colours, 6 spacing steps, 3 radii, 3 shadow levels, 2 transitions
- Mobile-first responsive across 4 breakpoints (576px, 768px, 992px, 1400px)
- Print stylesheet strips navigation and interactive elements

---

## ♿ Accessibility

- Skip-to-content link on every page
- `aria-label` on nav, `role="list"` on card grids, `role="listitem"` on cards
- `aria-live="polite"` on search results container for screen reader announcements
- `aria-expanded` synced on mobile nav toggle
- `aria-current="page"` on pagination active button
- `:focus-visible` gold focus ring on all interactive elements
- `alt` text on all images; `onerror` fallback for failed image loads
- Colour contrast ratios pass WCAG AA for all text/background pairings

---

## 🌿 Git Commit History

| # | Commit Message |
|---|---------------|
| 1 | `chore: scaffold project structure and index.html boilerplate with sticky nav skeleton` |
| 2 | `feat: build out Hall of Fame, Live Scout, and About pages; implement fully responsive sticky nav with NavController class` |
| 3 | `feat: add 15 curated legend profiles (legends-data.js), HallOfFameRenderer class with position/era filtering, and home page featured section` |
| 4 | `feat: implement ApiService and ScoutRenderer with live API search, client-side position filtering, pagination, and loading/error/empty states` |
| 5 | `fix: resolve API-Football player search error by adding required league selector; update ApiService, ScoutRenderer, and live-scout.html` |
| 6 | `feat: Phase 6 — responsive CSS audit, scroll animations, accessibility polish, and README` |

---

## 🤖 AI Use Appendix

*As required by the academic brief, this section documents AI tool usage throughout the project.*

### Tool Used
Claude (Anthropic) — used as an interactive senior front-end engineering mentor throughout all phases of the project.

### How It Was Used
The project was built interactively and phase-by-phase. Claude proposed concepts, I selected the topic, and we built each file together with explanations at each step. I reviewed and approved every phase before Claude proceeded to the next.

### What Claude Contributed
- Project architecture proposal and directory structure design
- HTML boilerplate, nav semantic structure, and ARIA attribute guidance
- CSS design token system (color palette, typography, spacing scale)
- NavController, HallOfFameRenderer, ApiService, ScoutRenderer ES6 class implementations
- Responsive breakpoint strategy and media query rules

### What I Contributed
- Topic selection and creative direction (Legends XI concept)
- Technology decisions (ES6 modules, multi-page architecture)
- Approval and testing of each implementation phase
- Bug report: API-Football `/players` endpoint error ("League or Team field is required") — identified during live testing, communicated to Claude for diagnosis and fix

### Bugs Encountered & Fixed
| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| `API error: The League or Team field is required` | API-Football free tier `/players` endpoint requires `league` or `team` ID parameter alongside `search`; bare name search not supported | Added league selector dropdown to `live-scout.html`; updated `ApiService.searchPlayers()` to accept and pass `leagueId`; updated `ScoutRenderer` to read and validate the league field before submitting |

### Prompts Used
Detailed prompts are documented in the Claude conversation transcript. Key prompt themes:
- "Propose 3 creative Football/World Cup themed website concepts..."
- "Continue" (to proceed between phases after reviewing and testing)
- Specific bug report: pasting the exact API error message for diagnosis

---

## 📄 Data Sources

- **Hall of Fame biographical data:** Originally written for this project. Statistical data (caps, goals, Ballon d'Or counts) sourced from publicly available Wikipedia historical records.
- **Player images:** Wikimedia Commons (public domain / freely licensed)
- **Live player data:** API-Football v3 (api-sports.io)

---

*Built for academic purposes — University Front-End Development module, 2026.*
