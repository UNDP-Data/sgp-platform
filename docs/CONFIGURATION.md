# Configuration

## Supported environment

- Node.js 20 is the pinned CI and local default in `.nvmrc`.
- `package.json` accepts maintained Node versions from 20 through 24.
- Dependency installation is reproducible through `npm ci` and
  `package-lock.json`.

## Build-time variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_PATH` | `/` | Vite public base for assets and client-side navigation |
| `SOURCE_MAPS` | `false` | Set to `true` only for a diagnostic production build |
| `SGP_DATA_PIPELINE_DIR` | workspace-relative fallback | Pipeline checkout used only by `sync:data` |
| `SGP_PIPELINE_API` | derived from pipeline directory | Direct path to compatible API exports |

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

## Browser persistence

MVP session state is stored locally in the browser. Clearing site data resets
role preview, saved items, locale preference, and assistant state. There is no
server-side session, cross-device synchronization, or secure token storage in
this repository.

## Source maps

Production source maps are disabled by default to reduce artifact size and
avoid unnecessary source disclosure. For a time-bound diagnostic build:

```bash
SOURCE_MAPS=true BASE_PATH=/sgp-platform/ npm run build
```

Do not deploy diagnostic maps unless the operational owner has accepted that
exposure.
