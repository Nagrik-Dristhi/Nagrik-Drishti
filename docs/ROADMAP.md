# Nagarik Drishti — Roadmap & Checklist

Independent civic-technology DEMONSTRATION. Not affiliated with, endorsed by, or connected to any
government body. All reports, statistics, departments and updates are simulated DEMO DATA.

## Decision: stay on static HTML/CSS/JS
The existing v3/v4 site is ~1,400 lines of dependency-light vanilla JS and works on GitHub Pages
as-is. A React/Next migration is not justified yet. Instead the code is being separated into layers
(see ARCHITECTURE.md) so a backend can replace the demo data layer later.

## Audit of existing project (before Stage 1)
Kept: header/footer + EN/NE switch (`layout.js`, `translations*.js`), light/dark theme (`theme.js`),
Nepal province/district data (`nepal-data.js`, centres are approximate), Leaflet map with
OpenFreeMap / Esri street / Esri satellite / OSM layers (`map.js`), honest placeholders.
Problems found: map layer code embedded in `map.js` (not reusable); 6 hard-coded sample pins;
no data layer; statistics/login pages are placeholders; header nav could not hold the new pages.

## Stages
- [x] Stage 0 — Static site, i18n, theme, map, satellite, dark map
- [x] **Stage 1 — Foundation + citizen reporting** (this stage)
  - [x] Shared basemap module, shared catalog (categories, departments, statuses)
  - [x] Demo data layer (localStorage, seeded reports, reset / clear-my-reports)
  - [x] Global DEMO MODE banner + demo data tools
  - [x] Report an Issue (validation, map picker, address search, device location, photo preview,
        duplicate warning, reference number, confirmation)
  - [x] Track Reports (search by reference, timeline, demo "advance" simulation)
  - [x] Civic Map now reads demo reports; approximate public locations; View Details link
  - [ ] Verified municipality (753) / ward datasets — NOT bundled: needs an official, licensed source.
        UI already accepts `window.ND_LOCAL_LEVELS`; falls back to free text until supplied.
- [x] **Stage 2 — Civic Map upgrade** (partly)
  - [x] Issue type / status / period filters, live count, marker clustering, heatmap (with "concentration is not condition" note)
  - [x] Approximate public locations, "View details" link to Track Reports
  - [ ] Municipality and ward navigation (needs verified dataset), administrative boundary layer (needs sourced geometry), terrain layer
- [x] **Stage 3 — Public statistics** (partly)
  - [x] Dashboard with filters, 6 indicators, monthly trend, province / district / category bars, status donut,
        days-to-resolution histogram, recurring-issue detection, table view for every chart, metric definitions
  - [ ] Civic Insights page: Ward Watch, before/after resolution evidence, issue-trend comparison
- [x] **UI redesign v2** — new design system (see below), dot-map hero, redesigned header/footer, light + dark themes
- [ ] Stage 4 — Government Portal (demo login, roles, inbox, assignment, resolution review, audit log)
- [ ] Stage 5 — Citizen dashboard + notification centre
- [ ] Stage 6 — Government Directory, Project Tracker, Open Data (CSV/JSON export)
- [ ] Stage 7 — GitHub Pages workflow, SECURITY + DATABASE docs, accessibility audit, browser-automation tests

## Design notes (v2)
Palette from the logo: ink navy, Terai green, pin red, Himalayan mist (never party colours). System fonts only,
so no visitor data goes to a font server; a serif for page titles and a humanist sans for everything else.
Ruled ledger rows and a drawn four-step path replace the repeated rounded-card pattern. One motion moment
(districts sweep in on the home page); everything else answers a click. `prefers-reduced-motion` is respected.
The home hero is a dot map of 77 district centres. It is a schematic and deliberately draws no national border.
Optional improvement: self-host a Devanagari-capable font (e.g. Mukta, SIL OFL) in `assets/fonts` and add an `@font-face`.

## Test status
No browser tests have been run (the build environment has no browser or network). What HAS been run:
- Node tests of the demo data layer (35 checks) and of the Home and Statistics scripts against a DOM stand-in (29 checks)
- English/Nepali key coverage, element-id cross-checks, local-link and script-order checks, stray-character scan
Visual layout, map rendering, theme appearance and mobile behaviour still need manual testing.
