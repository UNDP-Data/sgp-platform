# Configuration

## Supported environment

- Node.js 22 is the pinned CI and local default in `.nvmrc`; the temporary
  backend requires the built-in SQLite module introduced in Node 22.
- `package.json` accepts maintained Node versions from 22 through 24.
- Dependency installation is reproducible through `npm ci` and
  `package-lock.json`.

## Build-time variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_PATH` | `/` | Vite public base for assets and client-side navigation |
| `SOURCE_MAPS` | `false` | Set to `true` only for a diagnostic production build |
| `SGP_DATA_PIPELINE_DIR` | workspace-relative fallback | Pipeline checkout used only by `sync:data` |
| `SGP_PIPELINE_API` | derived from pipeline directory | Direct path to compatible API exports |
| `SGP_BACKEND_HOST` | `127.0.0.1` | Temporary backend bind address; keep loopback-only |
| `SGP_BACKEND_PORT` | `8787` | Temporary backend port |
| `SGP_BACKEND_DATA_DIR` | `.local/backend` | SQLite and evidence parent directory |
| `SGP_BACKEND_DB` | `.local/backend/sgp-platform.sqlite3` | SQLite database path |
| `SGP_BACKEND_FILES` | `.local/backend/evidence` | Evidence byte storage |
| `SGP_BACKEND_MAX_FILE_BYTES` | `8388608` | Per-file upload limit |
| `SGP_BACKEND_SESSION_HOURS` | `12` | Development session lifetime |
| `SGP_PUBLIC_API_KEY` | development value | Public partner API test key |
| `SGP_AGENCY_API_KEY` | development value | Authenticated partner API test key |
| `SGP_CONTROLLED_API_KEY` | development value | Controlled partner API test key |
| `SGP_BACKEND_URL` | `http://127.0.0.1:8787` | Vite development proxy target |
| `VITE_SGP_BACKEND_ENABLED` | unset / `false` | Set to `true` for connected adapters; `dev:full` does this automatically |
| `VITE_SGP_BACKEND_URL` | `/api` | Browser backend base path |
| `VITE_SGP_AI_API_BASE` | environment-dependent | Assistant adapter base path |
| `VITE_SGP_PARTNER_API_BASE` | current origin `/api/v1` | API documentation example base |

The Pages workflow sets `BASE_PATH=/sgp-platform/`. These variables are build
inputs, not browser secrets. Do not place credentials in a Vite variable,
committed `.env` file, public JSON, or GitHub Pages build.

## External AI service

Development requests use Vite's `/api/sgp-ai` proxy. Production requests go
directly to the HTTPS service configured in `src/services/ai.ts`. The service
must allow browser requests from the deployed Pages origin.

`public/api/openapi-indicative.yaml` documents the intended integration
surface. Some API documentation screens are explicitly indicative and should
not be interpreted as proof that every partner endpoint is live.

To change the production AI host:

1. Confirm the service contract and data-source names.
2. Update `src/services/ai.ts`.
3. Verify status, relevance map, streaming answer, citations, abort behavior,
   and localized prompts.
4. Confirm CORS for local development and the Pages origin.
5. Update this document and the API specification where applicable.

## Temporary backend and browser fallback

`npm run dev:full` starts the frontend and temporary backend. Connected state is
stored under `.local/backend`; locale and small caches remain in browser
storage. If the backend is unavailable, operational records and evidence fall
back to the versioned Zustand and IndexedDB reference implementation.

Temporary sessions and API keys are development controls, not production
identity. Full configuration and replacement requirements are documented in
[Temporary backend](TEMPORARY_BACKEND.md).

## Source maps

Production source maps are disabled by default to reduce artifact size and
avoid unnecessary source disclosure. For a time-bound diagnostic build:

```bash
SOURCE_MAPS=true BASE_PATH=/sgp-platform/ npm run build
```

Do not deploy diagnostic maps unless the operational owner has accepted that
exposure.
