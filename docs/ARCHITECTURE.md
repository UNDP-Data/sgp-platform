# Architecture

## Runtime shape

The repository has two runtime modes. GitHub Pages serves the immutable React
frontend and public prepared data. Local integration testing adds the temporary
Node and SQLite backend; frontend adapters fall back to browser persistence when
that backend is unavailable.

```text
Browser
  ├─ React UI and client-side router
  ├─ committed portfolio and knowledge JSON
  ├─ committed geographic data and optimized media
  ├─ temporary backend adapters with offline browser fallback
  └─ local or external SGP AI adapter

Temporary backend
  ├─ Node HTTP API and server-side role/lifecycle checks
  ├─ SQLite WAL state, sessions, support, audit, settings and overrides
  ├─ local evidence file storage
  ├─ prepared content and lexical retrieval adapters
  └─ temporary partner and administration APIs
```

## Main code boundaries

- `src/App.tsx` resolves the current path, access policy, shared shell, and page
  family.
- `src/Pages.tsx` composes the public product journeys.
- `src/components/` contains shared and feature-level UI.
- `src/PortfolioDashboard.tsx` and `src/lib/dashboard/` own portfolio analysis.
- `src/components/OpenGrantsExplorer.tsx` and `src/lib/grants/` own the grants
  map, filters, and grant detail behavior.
- `src/routing.ts`, `src/routing/`, and `src/sitemap.json` define route
  matching, redirects, and access policy.
- `src/i18n.tsx` and the generated translation catalogues own UI localization.
- `src/services/ai.ts` is the live AI adapter.
- `src/services/content.ts` and `src/lib/data/` load committed runtime content.
- `src/auth/roles.ts` owns account-type metadata, access levels, and legacy
  preview aliases.
- `src/workspace/workspaceConfig.ts` composes the operational PA, TAG Reviewer,
  NSC, NC, CPMT, and merged Agency Administrator navigation, assignment scope,
  metrics, and action queues.
- `src/workspace/workflowDefinitions.ts` owns the 16 typed workflow families,
  validation rules, creation permissions, and lifecycle stage ownership.
- `src/workspace/workflowStore.ts` owns browser-persisted records, transitions,
  audit, notes, support cases, preferences, and versioned import validation.
- `src/workspace/workflowFiles.ts` owns local IndexedDB evidence storage.
- `src/workspace/OperationalWorkflow.tsx` renders queues, record forms,
  read-only stage boundaries, evidence, support, profile, and backup/restore.
- `src/workspace/operationalWorkspacePresentation.ts` maps every authorized
  role/workflow pair to operating focus, control gates and detailed NC, CPMT,
  and agency workbench variants; it also derives live queue metrics.
- `src/workspace/OperationalWorkbench.tsx` renders the shared role-specific
  metric, lifecycle, control and priority-record layer above each queue.
- `src/workspace/roleAreaPresentation.ts` maps account levels to the shared
  role-area presentation tokens.
- `src/admin/adminConfig.ts` owns privileged agency, platform, and technical
  administration page families.
- `src/services/backend.ts` and `src/workspace/workflowBackend.ts` own connected
  session, hydration, mutation and offline-fallback behavior.
- `src/i18n-grant-workbench.ts` supplies the seven-locale catalogue for the
  structured grant editor and operational workbench UI.
- `server/app.ts` owns HTTP routing and response boundaries.
- `server/domain.ts` owns server-enforced workflow and account operations.
- `server/database.ts` owns SQLite schema, persistence and audit.
- `server/content.ts` owns read-only prepared content and local retrieval.

## Data flow

Portfolio, map, archive, and editorial data are generated before deployment and
committed under `public/generated/`. Browser loaders fetch those files from the
configured Vite base path. `public/generated/provenance.json` records source
artifact names, record counts, validation state, and SHA-256 hashes.

Images are served locally. Responsive images use generated WebP variants and
`OptimizedImage`; public-directory URLs pass through `publicAssetUrl` at the
browser boundary. This distinction is required for a project site hosted at
`/sgp-platform/`.

During `dev:full`, content and AI requests use the temporary backend through the
Vite proxy. The assistant streams NDJSON from local grounded retrieval. A
production build can use the externally hosted service through
`VITE_SGP_AI_API_BASE`. Failure of either adapter degrades the assistant without
blocking portfolio, grants, stories or library content.

## State and persistence

The URL owns route, locale prefix, query parameters and hashes. With the
temporary backend available, operational records, notes, audit, support,
preferences, saved items, assistant history and evidence are server persisted.
The browser retains locale, session-token cache and an offline versioned Zustand
and IndexedDB fallback. Export/import serializes state and evidence so recovery
is testable in either mode.

The backend makes connected product behavior testable and independently applies
role and lifecycle rules. Its development role selector, SQLite storage and
local files still do not constitute production identity, authoritative records,
secure document custody or immutable audit. The replacement map is maintained
in [Temporary backend](TEMPORARY_BACKEND.md).

## Operational record model

The target services must preserve a continuous, governed record chain:

```text
Country funding cycle and authorized external intake
  -> Organization and proposal record
  -> Immutable review version and recommendations
  -> NSC meeting, conditions, decision, and attestation
  -> Agreement and active grant
  -> Monitoring, evidence, results, and closure
  -> Country AMR and CPMT validation
  -> Rights-cleared knowledge, API, and AI eligibility decisions
```

Proponents and grantee organizations are records, not direct account types.
NCs and delegated PAs manage the country chain; TAG Reviewers recommend; NSC
decides; CPMT and Agency Administrators act only through applicable programme
assignments. UNDP can use a native workflow. FAO and CI can retain an external
authoritative system with explicit synchronized handoffs.

Support items and notifications remain linked to their source record. Saved
resources and permitted AI conversations share one account area but do not
become part of an official operational record automatically.

## Static-hosting guarantees

- `BASE_PATH` configures Vite asset and navigation URLs.
- `dist/404.html` is an exact copy of `dist/index.html`, allowing GitHub Pages
  to boot the SPA for deep links.
- English routes are unprefixed; six translated locales use a URL prefix.
- Build auditing rejects legacy repository references and domain-root asset
  URLs in a project-site build.
- Production source maps are off unless explicitly enabled.

## Extension rules

1. Add canonical routes to `src/sitemap.json`, then run `npm run sync:routes`.
2. Use `AppLink` or the browser navigation helpers for internal navigation.
3. Use `publicAssetUrl` or `OptimizedImage` for public-directory files.
4. Update every locale for new user-facing strings and run `npm run audit:i18n`.
5. Keep generated data immutable at runtime and refresh it through the sync
   script.
6. Add tests for policy, parsing, routing, visualization, or data-contract
   changes.
