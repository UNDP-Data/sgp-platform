# Architecture

## Runtime shape

The platform is a browser-only React 18 single-page application. Vite compiles
TypeScript, React, CSS, and static imports into `dist/`; GitHub Pages serves
that immutable artifact. There is no application server in this repository.

```text
Browser
  ├─ React UI and client-side router
  ├─ committed portfolio and knowledge JSON
  ├─ committed geographic data and optimized media
  ├─ local browser state for the MVP session
  └─ HTTPS requests to the external SGP AI service
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
- `src/auth/` and `src/workspace/` express the MVP role and workspace model.

## Data flow

Portfolio, map, archive, and editorial data are generated before deployment and
committed under `public/generated/`. Browser loaders fetch those files from the
configured Vite base path. `public/generated/provenance.json` records source
artifact names, record counts, validation state, and SHA-256 hashes.

Images are served locally. Responsive images use generated WebP variants and
`OptimizedImage`; public-directory URLs pass through `publicAssetUrl` at the
browser boundary. This distinction is required for a project site hosted at
`/sgp-platform/`.

The AI assistant calls the externally hosted service described in
`public/api/openapi-indicative.yaml`. Its responses are streamed as NDJSON.
Failure of that service should degrade the assistant, not the static portfolio,
grants, stories, or library experience.

## State and persistence

The URL owns route, locale prefix, query parameters, and hashes. Small MVP
preferences such as selected role, saved items, locale, and assistant state use
browser storage. None of this client-side state is a secure source of identity,
authorization, audit, or programme records.

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
