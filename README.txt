NAGARIK DRISHTI — independent civic-technology site (static HTML / CSS / JS)

LIVE MODE: see backend/SETUP.md — reports are stored in Google Sheets and managed from the hidden Control Room.
With js/config.js API_URL left empty the site runs as an offline DEMO (data in the browser only).


This is NOT an official government service. All reports, statuses, departments and
updates are simulated DEMO DATA stored only in your browser (localStorage).

RUN
- Open index.html, or for the map pages run a tiny local server:
    cd nd-static && python3 -m http.server 8000     then open http://localhost:8000
- Map pages need internet (map library, tiles, place search).
- Reset: footer buttons "Clear my reports" / "Restore original demo dataset".

PAGES
index (home), report (Report an Issue), map (Civic Map: filters, clustering, heatmap), track (Track Reports),
statistics (dashboard),
about, how-it-works, safety-privacy, contact, login (placeholder)

CODE LAYERS (see docs/ARCHITECTURE.md)
js/translations*.js   English + Nepali text          js/theme.js    light/dark
js/catalog.js         categories, departments, statuses
js/nepal-data.js      7 provinces + 77 districts (approximate centres, NOT boundaries)
js/demo-store.js      demo data layer (the only module touching storage)
js/basemaps.js        shared map layers   js/map.js  civic map   js/report.js   js/track.js   js/layout.js
js/home.js            dot map + indicators      js/stats.js  statistics dashboard (plain HTML/CSS charts)

DOCS: docs/ROADMAP.md (checklist), docs/ARCHITECTURE.md, docs/DATA-SOURCES.md
NOT YET BUILT: see the roadmap (statistics, government portal, notifications, directory, open data...)
