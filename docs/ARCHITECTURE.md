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
- `src/workspace/CommunityWorkspace.tsx` owns the continuous applicant-to-
  grantee experience; `communityWorkspaceData.ts` supplies linked organization,
  application, grant, visit, report, and support demonstration records.
- `src/workspace/CommunityWorkspaceStore.tsx` is the replaceable client-side
  repository for the interactive preview. It scopes selectors by active
  organization and owns application creation, narrative and structured OP8
  data, attachments, comments, section assignments, requested-change
  revisions, validation, submission snapshots, support cases, lifecycle
  transitions, and demonstration audit events.
- `src/workspace/communityWorkspace.css` contains the desktop, mobile, recovery,
  and RTL presentation rules for that experience.

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

The community-workspace prototype stores a versioned, public-safe mock
repository locally to demonstrate organization switching, autosave,
interruption recovery, application creation, validation, submission snapshots,
locked post-submission records, requested-change revisions, and durable support
threads. Identifiers for newly created applications include both organization
and opportunity scope. Version 4 migrates compatible version 3 narrative state
and seeds missing structured records; incompatible browser state returns to
the public-safe demonstration data.

This persistence is a product simulation, not an authorization or programme
record. Comments, assignments, file metadata, change responses, and support
mutations persist in the browser so the complete workflow can be tested.
Selected file bytes are deliberately not retained; only safe demonstration
metadata is stored. Production implementations must replace the repository
adapter with authorized services, server-side policy checks, optimistic
versioning, secure document storage and scanning, and immutable audit events.

## Community record model

The community experience keeps a continuous record chain:

```text
Organization
  -> Opportunity
  -> Application
     -> Narrative sections, results rows, budget rows, attachments and comments
  -> Submission snapshot and decision
     -> Requested changes and controlled resubmission
  -> Grant
  -> Field visits and reports
  -> Candidate knowledge contribution
```

Support requests, notifications, saved resources, comments, and AI
conversations reference the relevant organization or operational record
without becoming part of an official submission automatically. UNDP-managed
records demonstrate a native workflow. FAO-, CI-, and other agency-managed
records use explicit external handoffs and do not imply that the KLP owns the
operational record.

Every submission snapshot freezes the narrative values, result rows, budget
rows, and attachment identifiers for that version. A requested-change response
must be resolved before resubmission; the next submission is recorded as a new
version and the working record is locked again.

The assistant keeps browser conversations in organization-scoped storage while
the user is in a community workspace. The current live knowledge service still
receives only the user question and locale; the interface therefore states
that it does not read or modify the application record.

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
