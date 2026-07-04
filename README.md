# ⚽ Legends XI

A football hall of fame and live player scouting web application, built as an academic front-end development project.

**Author:** *(add your name here)*
**Live site:** *(add your GitHub Pages / Netlify / Vercel URL here after deployment)*
**Repository:** *(add your GitHub repo URL here)*

---

## 📋 Project Overview

Legends XI has three core features:

1. **Hall of Fame** — 15 in-depth, originally written profiles of legendary footballers, filterable client-side by position and era, rendered dynamically from a curated JavaScript dataset.
2. **Live Scout** — a real-time player search and filter tool powered by the Bzzoiro Sports Data (BSD) API, with client-side position filtering, paginated results, and full loading/error/empty state handling.
3. **Dream Team** — an interactive team-builder page that lets you assemble a starting XI from the Hall of Fame legends, filterable by position.

---

## 🛠️ Technology Stack

| Layer        | Technology                                                  |
|--------------|-------------------------------------------------------------|
| Markup       | Semantic HTML5 (5 pages)                                    |
| Styling      | Hand-written CSS3 — Flexbox, CSS Custom Properties, media queries |
| UI Framework | Bootstrap 5.3 (grid + utility classes only)                 |
| JavaScript   | Vanilla ES6 — classes, modules (import/export), async/await |
| Fonts        | Google Fonts — Bebas Neue (headings) + Inter (body)         |
| API          | Bzzoiro Sports Data (BSD) — free tier, no published rate limit |
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
├── dream-team.html         # Interactive team-builder page
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
│   │   └── ApiService.js           # BSD API fetch class
│   ├── ui/
│   │   ├── NavController.js        # Sticky nav behaviour
│   │   ├── HallOfFameRenderer.js   # Renders legend cards + filters
│   │   ├── ScoutRenderer.js        # Renders live results + states + pagination
│   │   ├── DreamTeamRenderer.js    # Renders the Dream Team builder page
│   │   └── animations.js           # IntersectionObserver card animations
│   ├── app-home.js                 # Entry point — index.html
│   ├── app-hall-of-fame.js         # Entry point — hall-of-fame.html
│   ├── app-live-scout.js           # Entry point — live-scout.html
│   ├── app-dream-team.js           # Entry point — dream-team.html
│   └── app-about.js                # Entry point — about.html
│
├── config/
│   └── config.js           # API key placeholder + base URL
│
├── images/                 # Static assets (players, Dream Team, icons)
│
└── evidence/
    └── screenshots/        # Mobile / tablet / desktop screenshots (add before submitting)
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

The Live Scout page requires a free Bzzoiro Sports Data (BSD) key:

1. Register at [sports.bzzoiro.com/register](https://sports.bzzoiro.com/register/)
2. Copy your API token from your account page
3. Open `config/config.js` and replace the placeholder:
   ```js
   export const API_KEY = 'your_actual_key_here';
   ```
4. The Hall of Fame page works without a key (all data is local)

**API constraints (free tier):**
- No published rate limit or daily quota, no credit card required
- Name-only player search across supported leagues

> ⚠️ **Security note:** `config/config.js` is not committed with a real key in this repository — if you clone this project, generate your own key and paste it locally. Never commit a live API key to a public repo.

---

## ✨ Key Features

### Sticky Navigation *(Custom Requirement)*
- `position: sticky` nav with 5 internal links (Home, Hall of Fame, Live Scout, Dream Team, About) — meets the "sticky nav with at least 4 internal links" custom requirement
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

### Dream Team
- Interactive team-builder page: assign Hall of Fame legends to starting XI positions
- Position-based filtering when selecting a legend for a slot

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
| 6 | `feat: Phase 6 — responsive CSS audit, scroll animations, accessibility polish, skip links, and comprehensive README with AI use appendix` |
| 7 | `feat: overhaul API to Bzzoiro Sports Data (name-only search), compact HoF cards with modal, filter bug fix, Dream Team builder page, inline fixtures on scout cards, 5-link nav` |
| 8 | `padding fix` |
| 9 | `fix: Dream Team formation + name` |
| 10 | `fix: adding images` |
| 11 | `fix: ModalContent images` |
| 12 | `image fix` |
| 13 | `home tab images` |
| 14 | `legend theme` |
| 15 | `live scout search fix` |
| 16 | `football icon and dream team filtering by position` |
| 17 | `fixed hof images after filtering` |
| 18 | `scout teaser style` |
| 19 | `dream team images and hof positions` |
| 20 | `fixing legends card on the home page` |
| 21 | `fixing dream team build` |
| 22 | `changed position Forward to Attacker to match the API` |
| 23 | `saving progress in live scout and dream team builder` |
| 24 | `removed the show fixtures feature` |
| 25 | `using different api` |
| 26 | `removed season filtering from live scout` |
| 27 | `added league filtering` |
| 28 | `final fixture UI fix` |

The project was switched from an API-Football-based integration (commits 1–6) to the Bzzoiro Sports Data API (commit 7 onward) after hitting free-tier limitations, with iterative fixes and the Dream Team feature added across the later commits.

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
- NavController, HallOfFameRenderer, ApiService, ScoutRenderer, DreamTeamRenderer ES6 class implementations
- Responsive breakpoint strategy and media query rules
- Guidance on migrating the Live Scout integration from API-Football to Bzzoiro Sports Data after hitting free-tier limitations

### What I Contributed
- Topic selection and creative direction (Legends XI concept)
- Technology decisions (ES6 modules, multi-page architecture)
- Approval and testing of each implementation phase
- Bug report: API-Football `/players` endpoint error ("League or Team field is required") — identified during live testing, communicated to Claude for diagnosis and fix
- Decision to drop API-Football in favor of Bzzoiro Sports Data, plus design and testing of the Dream Team builder feature

### Bugs Encountered & Fixed
| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| `API error: The League or Team field is required` | API-Football free tier `/players` endpoint requires `league` or `team` ID parameter alongside `search`; bare name search not supported | Added league selector dropdown to `live-scout.html`; updated `ApiService.searchPlayers()` to accept and pass `leagueId`; updated `ScoutRenderer` to read and validate the league field before submitting |
| Player position values from the new API used "Forward" instead of the "Attacker" label used across Hall of Fame filters | Inconsistent position naming between the two data sources | Normalized incoming API position values to "Attacker" in `ApiService`/`ScoutRenderer` so filters stay consistent across Hall of Fame and Live Scout |

### Prompts Used
Detailed prompts are documented in the Claude conversation transcript. Key prompt themes:
- "Propose 3 creative Football/World Cup themed website concepts..."
- "Continue" (to proceed between phases after reviewing and testing)
- Specific bug report: pasting the exact API error message for diagnosis
- "The API-Football free tier is too limited for name-only search, help me migrate to an API that supports it"

---

## 📄 Data Sources

- **Hall of Fame biographical data:** Originally written for this project. Statistical data (caps, goals, Ballon d'Or counts) sourced from publicly available Wikipedia historical records.
- **Player images:** Wikimedia Commons (public domain / freely licensed)
- **Live player data:** Bzzoiro Sports Data (BSD) API

---

*Built for academic purposes — University Front-End Development module, 2026.*
