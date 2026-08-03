# Operational workflow acceptance

## Status and boundary

The L1-L5 operational workspaces are a complete connected local reference implementation.
They are not static mockups: authorized account types can create records, edit
owned lifecycle stages, satisfy required-field validation, advance or return
records, attach and retrieve evidence, add attributable notes, inspect audit
history, open and resolve support cases, save preferences, and export or restore
the workspace with its file contents.

The implementation uses the temporary backend when it is available and retains
the browser-local reference as an offline fallback because the deployed GitHub
Pages application is static. It is suitable for product validation and
deterministic acceptance testing with public-safe records. It is not an
authoritative grant management system and must not receive confidential or real
applicant data.

## Account journeys in scope

| Account | Complete local journey |
| --- | --- |
| Programme Assistant | Intake, proposal preparation, grant administration support, monitoring, results evidence, knowledge nomination, support, profile, backup and restore |
| TAG Reviewer | Assigned application visibility, conflict declaration, evidence review, independent recommendation, monitoring evidence, support, profile, backup and restore |
| NSC Member / Chair | Proposal and review visibility, meeting package, conflicts, quorum, decision, attestation, AMR oversight, analytics, support and profile |
| National Coordinator | Funding windows, complete grant applications and supporting materials, TAG coordination, decision preparation, grant, monitoring, results, AMR, knowledge, analytics, support and profile |
| CPMT programme user | Assignment-scoped proposal and grant oversight, results, AMR, programme health, corrections, knowledge, analytics, support and profile |
| Agency Administrator | Programme visibility, agreements, assurance, finance, safeguards, reporting exchange, knowledge, support, profile, and agency administration |

Project proponents, CSOs, grantee organizations, community groups and
beneficiaries remain domain records or external actors. The National
Coordinator or delegated Programme Assistant creates and manages their records.

## Functional contract

Every workflow family has:

- a typed record definition and four canonical lifecycle stages;
- role visibility, record-creation permission and stage-owner permission as
  separate controls;
- required fields and typed inputs, including confirmation fields;
- deterministic transition and return validation;
- attributable, append-only notes and lifecycle audit events;
- backend-persisted metadata and evidence plus a browser/IndexedDB fallback;
- queue search, stage filters, live counts and JSON export;
- durable support cases and account preferences; and
- a versioned full-workspace JSON backup containing evidence bytes.

Read access does not confer mutation authority. A record in a visible workflow
renders read-only when another account type owns its current stage. Store
actions enforce the same rule independently of the rendered controls.

## Acceptance exit criteria

The local reference implementation is accepted only when all of the following
remain true:

1. Every one of the 16 workflow families has a definition, seed record,
   lifecycle, required fields, visibility roles, creation roles and stage owners.
2. All six L1-L5 account types reach an overview, every permitted queue,
   Saved and AI History, Profile, and Support through the shared workspace.
3. Unauthorized roles cannot create or mutate a record; read-only stage state
   is visible and store-level enforcement returns a denial.
4. Incomplete records cannot advance. Complete records can advance once, can
   return with a mandatory reason, and preserve both operations in history.
5. Evidence can be uploaded, downloaded, removed, retained after reload, and
   reconstructed by workspace export/import.
6. Notes, support cases and preferences survive reload and remain account scoped
   in both connected and offline-fallback modes.
7. Malformed imports cannot replace current state.
8. Public contact requests receive a durable local reference and survive reload.
9. English and all six translated locales pass the interface catalogue audit;
   Arabic remains RTL.
10. Unit, route-contract, browser, accessibility, data validation and production
    build checks pass without console errors or horizontal overflow.
11. Figma operational flows show the same queues, owned/read-only stages,
    validation, evidence, audit, support and recovery states as the application.
12. External dependencies are labelled as integration gates, not represented as
    completed local transactions.

## Production integration gates

Production completion requires services that cannot be implemented inside a
GitHub Pages bundle:

- enterprise identity, MFA, account lifecycle and server-side sessions;
- policy evaluation over agency, assignment, geography, field, record, action,
  classification and expiry;
- authoritative transactional storage, optimistic concurrency and immutable
  audit infrastructure;
- encrypted document storage, malware scanning, retention and legal holds;
- email and notification delivery, service-desk routing and escalation;
- UNDP native grant services and governed FAO/CI synchronization;
- production telemetry, recovery, backup and incident operations; and
- privacy, security, accessibility and programme-owner acceptance.

Until these gates are delivered, only public-safe test data may be used.

## Executable evidence

```bash
npm run check
npm run test:backend
npm run test:e2e
```

The workflow contracts are in `tests/workflow-store.test.ts` and
`tests/grant-application.test.ts`. The National Coordinator browser transaction
in `tests/e2e/principal-journeys.spec.ts` opens the complete ten-section grant
application editor, edits and saves structured application data, records a
section-scoped note, attaches and downloads section evidence, reloads persisted
state, validates every section, creates a controlled submission snapshot, opens
a governed revision, and verifies binary-complete backup and restore. The
connected-backend transaction in `tests/e2e/backend-connected.spec.ts` repeats
the save, evidence and reload boundary against the temporary API.

The Figma source is the `Operational Workspaces · Implemented MVP` section on
the `03 - Operational Workspaces` page. It contains 67 operational screens,
organized as one horizontal row per account type:

- 12 editable captures of the implemented application: Programme Assistant
  overview and application queue; TAG overview and assigned review; NSC
  overview and decision package; National Coordinator overview, application
  queue and complete application editor; CPMT overview and country programme
  queue; and Agency Administrator overview.
- Nine detailed product-definition wireframes derived from the 30 July 2026
  Yasu/Lu meeting findings: National Coordinator AMR preparation and project
  results/evidence; and CPMT proposals/decisions, grants/delivery, results/AMR,
  data quality/corrections, knowledge/publication, analytics/exports, and
  assignments/support.
- 46 functional placeholder screens covering every remaining listed role tab.
  Each placeholder retains the account-specific application shell, complete
  left navigation and active-tab treatment, and contains only a concise
  description of the intended function. The application counterpart is a
  functional role workbench and queue even where the Figma frame intentionally
  remains a low-detail sitemap wireframe.

The implemented captures preserve the actual role-generated rail, fixture
content, lifecycle state, forms, evidence, notes, and access-level treatment
from the running MVP. The meeting-derived views are now implemented through the
same durable workflow engine: each view adds role-specific metrics, operating
focus, control gates, lifecycle coverage and linked priority records above the
editable queue. No summary card duplicates or bypasses record permissions,
validation, evidence or audit history.

## Meeting-derived operational design coverage

| Figma screen | Operational contract represented |
| --- | --- |
| NC Prepare Annual Monitoring Report | Cycle context, project selection, evidence readiness, contribution review, duplication controls, and submission gates |
| NC Project Results and Evidence | Indicator values, qualitative results, project-linked evidence, completion documents, and controlled completion gates |
| CPMT Proposals and Decisions | Portfolio exception queue, lifecycle evidence, approval-date checks, signed-MoA activation, and decision readiness |
| CPMT Grants and Delivery | Delivery progress, enterprise financial reconciliation, variances, and controlled corrections |
| CPMT Results and AMR | Country readiness, project-to-indicator traceability, evidence coverage, and validation decisions |
| CPMT Data Quality and Corrections | Duplicate identifiers, coordinate and taxonomy checks, before/after correction, audit trail, and separation of duties |
| CPMT Knowledge and Publication | Project-linked curation, rights and consent, public visibility, AI eligibility, and publication destinations |
| CPMT Analytics and Exports | Visible filters, portfolio preview, saved export definitions, and asynchronous export job status |
| CPMT Assignments and Support | Assignment scope, support queue, reversal cases, reference data, taxonomy controls, and accountable administration |

These screens operationalize the meeting requirements for project-level
traceability, lifecycle gates, required tagged documents, financial
reconciliation, audited correction and reversal, migration provenance,
location quality assurance, publication curation, multilingual operation, and
long-running asynchronous exports. Grantees remain external actors: National
Coordinators and delegated Programme Assistants maintain programme records.

The shared implementation contract lives in
`src/workspace/operationalWorkspacePresentation.ts`; rendering lives in
`src/workspace/OperationalWorkbench.tsx`. Contract tests enumerate every
operational rail destination for all six account types and require a valid
role-aware workbench, workflow permission and page description. Detailed
coverage is explicit for NC results and AMR; CPMT programmes, proposals,
grants, results, AMR, corrections, knowledge and analytics; and Agency
Administrator agreements, finance, safeguards and data exchange.

The final Figma audit found all 67 screens inside the operational section: 10
Programme Assistant, seven TAG Reviewer, seven NSC, 15 National Coordinator,
12 CPMT, and 16 Agency Administrator screens. Every account type occupies one
horizontal row. The audit found 46 complete functional placeholders, 766 valid
prototype destinations, no invalid reactions, no overlapping screens, and no
out-of-bounds content.
