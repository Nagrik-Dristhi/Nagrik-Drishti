# Architecture (static demo → future backend)

Layers (all plain JS, loaded with <script> tags; no build step):

| Layer | Files | Notes |
|---|---|---|
| Localization | `js/translations*.js`, `js/layout.js` | one dictionary per language; `data-i18n` attributes |
| Theme | `js/theme.js` | light/dark, system detection, persisted |
| Catalog (static reference data) | `js/catalog.js` | categories, subcategories, departments, statuses |
| Geographic data | `js/nepal-data.js`, optional `js/data/local-levels.js` | approximate centres only |
| Data service | `js/demo-store.js` | the ONLY module that touches storage; swap for a REST client later |
| Map utilities | `js/basemaps.js`, `js/map.js` | provider layers, civic map |
| Pages | `js/report.js`, `js/track.js`, ... | UI logic only; call `NDStore` |

## Backend migration plan
`NDStore` exposes a small, promise-free API today (`all`, `get`, `create`, `advance`, `reset`).
For a real backend, keep the same method names but make them async and implement them with REST calls
(NestJS + PostgreSQL/PostGIS suggested). Authentication, role checks, audit logging, private evidence
storage and server-side validation must be implemented server-side; none of that exists in this demo.

## Draft API contract (future)
- `GET  /api/reports?province=&district=&category=&status=&from=&to=` → public, approximate locations only
- `GET  /api/reports/{ref}` → public fields; evidence only if permitted
- `POST /api/reports` → validated server-side, returns `{ref}`
- `POST /api/reports/{ref}/events` → authorized officers only (verify, assign, progress, resolve, reject)
