# SGP Knowledge and Learning Platform

The integrated frontend for the GEF Small Grants Programme Knowledge and
Learning Platform. This repository contains the public journeys, grants
explorer, portfolio dashboard, Innovation Library, stories, role-aware
workspaces, administration, localized routing, and the shared AI assistant
experience. A temporary SQLite backend supports connected end-to-end testing.

The application is a React and TypeScript single-page application built with
Vite. All data and media required by the static public experience are committed
in this repository. The temporary Node backend is used locally for workflow,
file, account, support, administration, content, search and AI integration
testing; GitHub Pages still deploys the static frontend only.

## Current status

- Repository: `UNDP-Data/sgp-platform`
- Deployment target: `https://undp-data.github.io/sgp-platform/`
- Runtime route catalogue: 99 patterns
- Locales: English, Portuguese, French, Spanish, Russian, Chinese, and Arabic
- Node.js: 22 (versions 22 through 24 are accepted)
- Hosting: GitHub Pages through GitHub Actions

This is an MVP and local reference implementation. The operational workspaces
are functionally executable against the temporary backend with durable records,
stage validation, evidence, audit, support and recovery, plus an offline browser
fallback. Role selection and development API keys do not provide production
authentication or authorization. See [Temporary backend](docs/TEMPORARY_BACKEND.md),
[Operational workflow acceptance](docs/OPERATIONAL_WORKFLOW_ACCEPTANCE.md) and
[Access and roles](docs/ACCESS_AND_ROLES.md) before treating any workspace as
protected.

## Start locally

```bash
npm ci
npm run dev:full
```

Open `http://127.0.0.1:5173/`. Backend health is available at
`http://127.0.0.1:8787/api/health`. Use `npm run dev` only when intentionally
testing the offline browser fallback.

Useful commands:

```bash
npm run verify
npm run check
npm run test:backend
npm run test:e2e
npm run build
npm run preview
```

`verify` runs source, translation, documentation, TypeScript, unit-test, and
data-contract checks. `check` also creates and audits a production build.

## GitHub Pages deployment

Every push to `main` runs the complete verification and deployment workflow in
[deploy-pages.yml](.github/workflows/deploy-pages.yml). The build uses
`BASE_PATH=/sgp-platform/`, uploads `dist/`, and deploys only after all checks
pass.

One repository setting must be enabled by an administrator before the first
deployment:

1. Open **Settings → Pages** in `UNDP-Data/sgp-platform`.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push or merge to `main`, or run **Deploy GitHub Pages** manually from the
   Actions tab.

No Pages branch, committed `dist/` directory, secret, or custom domain is
required. For the full release and rollback procedure, see
[Deployment](docs/DEPLOYMENT.md).

## Repository map

| Path | Purpose |
| --- | --- |
| `src/` | React application, routing, translations, role policy, and UI |
| `server/` | Temporary SQLite backend, API, authorization and local retrieval |
| `public/generated/` | Validated portfolio and knowledge runtime artifacts |
| `public/media/` | Local optimized image variants |
| `public/brand/` | Platform and partner brand assets |
| `scripts/` | Data, route, documentation, localization, and build audits |
| `tests/` | Unit, contract, accessibility, responsive, and journey tests |
| `docs/` | Maintained product and operational documentation |
| `.github/workflows/` | Pull-request verification and Pages deployment |

## Data refresh

The deployed app never reads a sibling repository. Runtime data is packaged
under `public/generated/` and includes checksums in
`public/generated/provenance.json`.

To refresh from a compatible pipeline checkout:

```bash
SGP_DATA_PIPELINE_DIR=/absolute/path/to/pipeline npm run sync:data
npm run validate:data
npm run check
```

`SGP_PIPELINE_API` may instead point directly to the pipeline API export
directory. Do not hand-edit generated artifacts. See
[Data and content](docs/DATA_AND_CONTENT.md).

## Documentation

Start with the [central platform reference](docs/PLATFORM_REFERENCE.md). It
consolidates the complete sitemap, implemented and target feature set, users,
programme lifecycle, record families, data scope, metadata strategy, technical
architecture, governance, acceptance, and delivery approach. The
[documentation index](docs/README.md) links the focused implementation and
operating guides:

- [Central platform reference](docs/PLATFORM_REFERENCE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Temporary backend](docs/TEMPORARY_BACKEND.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Configuration](docs/CONFIGURATION.md)
- [Routing and localization](docs/ROUTING_AND_LOCALIZATION.md)
- [Data and content](docs/DATA_AND_CONTENT.md)
- [Access and roles](docs/ACCESS_AND_ROLES.md)
- [Operational workflow acceptance](docs/OPERATIONAL_WORKFLOW_ACCEPTANCE.md)
- [Operations](docs/OPERATIONS.md)

Contributors should also read [CONTRIBUTING.md](CONTRIBUTING.md) and
[SECURITY.md](SECURITY.md).

## Licensing

No license file was present in the destination repository at migration time.
Repository owners should add the UNDP-approved license or usage terms before
representing the code or bundled media as licensed for external reuse.
