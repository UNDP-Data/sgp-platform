# Routing and localization

## Route contract

`src/sitemap.json` is the canonical 99-pattern route catalogue.
`scripts/generate-runtime-sitemap.mjs` creates
`src/runtime-sitemap.json` during build. Unknown paths resolve to the
application not-found screen, while documented legacy paths redirect to their
canonical destination.

Use `AppLink` for internal links and the helpers in
`src/lib/browser/navigation.ts` for imperative navigation. Direct calls to
`history.pushState` should remain inside that browser boundary.

## Public grant routes

Each open opportunity has one canonical, shareable route:

```text
/funding
/funding/grants/:grantId
```

The map’s detail panel, global search results, and matching applicant
application records all link to the same grant page. The page and panel render
the same grant detail component so eligibility, funding, deadline, agency
handoff, and application actions remain consistent.

## Operational workspace routes

Country programme, review, committee, CPMT and participating-agency accounts
share one assignment-scoped Workspace shell. Record detail routes remain under
their parent operational area:

```text
/workspace
/workspace/intake
/workspace/intake/:intakeId
/workspace/proposals
/workspace/proposals/:proposalId
/workspace/reviews
/workspace/reviews/:reviewId
/workspace/decisions
/workspace/decisions/:decisionId
/workspace/grants
/workspace/grants/:grantId
/workspace/monitoring
/workspace/monitoring/:monitoringId
/workspace/results
/workspace/results/:resultId
/workspace/amr
/workspace/amr/:amrId
/workspace/knowledge
/workspace/knowledge/:documentId
/workspace/analytics
/workspace/analytics/:viewId
/workspace/programmes
/workspace/programmes/:programmeId
/workspace/corrections
/workspace/corrections/:correctionId
/workspace/agreements
/workspace/agreements/:agreementId
/workspace/finance
/workspace/finance/:financeId
/workspace/safeguards
/workspace/safeguards/:caseId
/workspace/data-exchange
/workspace/data-exchange/:exchangeId
/workspace/support
/workspace/support/:requestId
/workspace/learning
/workspace/saved
/workspace/profile
```

Editing states, evidence, comments, decisions, corrections, external handoffs,
and AI context remain within their parent record. The selected preview role and
active assignment determine visible navigation. Production services must
enforce the same agency, geography, programme, record, field, lifecycle,
classification, purpose and expiry scope; route visibility alone is not an
authorization boundary. Retired application, visit, report, notification and
standalone AI-history URLs redirect to their consolidated destinations.

## Project-site base

GitHub Pages serves this repository below `/sgp-platform/`.
`import.meta.env.BASE_URL` is therefore part of both navigation and asset
resolution:

```text
Application route: /portfolio
English browser URL: /sgp-platform/portfolio
French browser URL: /sgp-platform/fr/portfolio
```

Route matching strips the Vite base before resolving the optional locale.
`publicAssetUrl` and `OptimizedImage` apply the same base to committed public
files.

## SPA fallback

The build copies `index.html` to `404.html`. On an unknown static file request,
GitHub Pages serves that fallback while retaining the requested browser URL;
the client router then resolves the route. Any host replacing GitHub Pages must
provide equivalent fallback behavior.

## Languages

Supported route locales are:

| Code | Language | URL behavior |
| --- | --- | --- |
| `en` | English | Unprefixed |
| `pt` | Portuguese | `/pt/...` |
| `fr` | French | `/fr/...` |
| `es` | Spanish | `/es/...` |
| `ru` | Russian | `/ru/...` |
| `zh` | Chinese | `/zh/...` |
| `ar` | Arabic | `/ar/...` |

Selecting a language changes the URL and preserves the application path, query,
and hash. A prefixed URL is authoritative when opened directly. Without a
prefix, the first visit may use the stored or browser locale; English remains
unprefixed.

Arabic content uses RTL text direction where appropriate, while the dashboard
and grants page preserve their established overall interface geometry.

## Translation maintenance

Canonical English strings and their six translations live in `src/i18n.tsx`
and the glossary/completion catalogues. Feature-specific strongly typed
messages may live alongside their feature, such as `src/api-i18n.ts` and
`src/i18n-operational-workspaces.ts`.

For every user-facing change:

1. Add all seven language values.
2. Preserve official programme and agency terminology from the glossary.
3. Test long Russian, French, and Portuguese labels at narrow widths.
4. Test Chinese line breaking and Arabic text direction.
5. Run `npm run audit:i18n` and `npm run check`.

Do not localize URLs, machine identifiers, record codes, API payload fields, or
official marks unless the approved glossary explicitly provides that form.
