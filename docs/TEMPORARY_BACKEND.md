# Temporary backend

## Purpose

The repository includes a temporary local backend so the complete MVP can be
tested as a connected system instead of a collection of browser-only screens.
It persists operational workflows, evidence files, support, preferences, saved
knowledge, assistant history, administration actions and configuration. It
also serves prepared content, local grounded retrieval and the indicative
partner API.

This is an integration and acceptance runtime. It is not a production security
boundary. Its role selector, sessions and API keys are deliberately simple and
must not be used with confidential, applicant or otherwise restricted data.

## Run the complete system

Node.js 22 is recommended because the backend uses the built-in SQLite module.
From the repository root:

```bash
npm ci
npm run dev:full
```

Open:

- frontend: `http://127.0.0.1:5173/`
- backend health: `http://127.0.0.1:8787/api/health`
- OpenAPI document: `http://127.0.0.1:8787/api/v1/openapi.json`

`Ctrl+C` stops both processes. `dev:full` enables the connected adapters for
its Vite process. `npm run dev` still runs the frontend alone;
when the backend is unavailable, the UI deliberately falls back to its
browser-persisted reference state.

## Data locations

The default runtime directory is excluded from Git:

```text
.local/backend/
  sgp-platform.sqlite3
  sgp-platform.sqlite3-wal
  sgp-platform.sqlite3-shm
  evidence/
```

SQLite runs in WAL mode. The database contains structured state and audit
records; evidence bytes are stored as separate files and referenced from the
database. Stop the backend before copying `.local/backend/` as a filesystem
backup. The workspace Profile page also exports and restores a portable JSON
snapshot containing record state and evidence bytes.

Useful commands:

```bash
npm run backend:doctor
npm run backend:seed
npm run backend:reset
npm run test:backend
npm run test:e2e:backend
```

`backend:reset` deletes temporary sessions, evidence, support requests,
configuration and content overrides, then restores the seeded workflow state.
It is destructive and should be used only for test data.

## Persisted domains

| Domain | Storage | Enforcement |
| --- | --- | --- |
| 16 operational workflow families | SQLite state document | Assignment visibility, creation roles and lifecycle-stage ownership |
| Evidence | Files plus SQLite metadata | Record read/write policy and file identifier isolation |
| Support cases and public requests | SQLite | Account scope or request email |
| Saved items and assistant history | SQLite state document | Account-role scope |
| Preferences and workspace snapshots | SQLite state document | Account-role scope and import validation |
| Admin actions, settings and overrides | SQLite tables | Minimum role access levels and audit events |
| Portfolio, archive, editorial and grants content | Validated `public/generated` files | Read-only prepared content |

All workflow mutation rules are shared with the frontend definitions, but the
backend applies authorization and transition validation independently of the
rendered controls.

## API groups

| Prefix | Purpose |
| --- | --- |
| `/api/health`, `/api/openapi.json` | Runtime health and contract discovery |
| `/api/auth` | Temporary role sessions |
| `/api/workspace`, `/api/workflows` | Snapshot, create, edit, transition, note and evidence operations |
| `/api/support`, `/api/public/support` | Signed-in and public support requests |
| `/api/preferences`, `/api/saved`, `/api/assistant/history` | Account state |
| `/api/content` | Prepared public runtime data |
| `/api/sgp-ai` | Frontend-compatible local retrieval and NDJSON responses |
| `/api/v1` | Temporary partner search, projects, datasets, assistant and embed-session contracts |
| `/api/admin` | Live metrics, audit, section data, actions, settings and content overrides |

Every response includes `X-Request-Id`. Errors use an HTTP status, a concise
message, optional validation details and the same request identifier.

## Development authentication

The frontend requests a temporary session for the selected account type. The
server then enforces that role and its access level. This makes permission and
lifecycle testing meaningful, but it is not identity proof: anyone with local
access can select any role.

The active administration model uses one assignment-scoped `agency-admin`, one
L9 `it-admin`, and one L10 `platform-admin`. The Agency Administrator combines
agency programme workflows and administration in one account. Legacy Agency
Programme, FAO, CI, UNDP, Super Admin, IT Frontend, and IT Backend preview
values are normalized to the current roles; the SQLite schema-v5 migration
preserves saved items, operational records, evidence ownership, assistant
history, and active sessions. The unified IT workspace
keeps frontend and backend operations in separately colored navigation groups
and retains both route families. TAG Reviewer remains a separate L2 operational
role, while the National Coordinator owns the complete grant-application record
and coordinates its review and decision handoffs.

The partner routes accept `X-API-Key`. Defaults are:

- public: `sgp-public-dev`
- authenticated agency: `sgp-agency-dev`
- controlled technical: `sgp-controlled-dev`

Override them with the variables in `.env.example`. Do not put a long-lived
production key in a `VITE_` variable or browser bundle.

## Configuration

Copy `.env.example` to `.env` only when local overrides are needed. The runtime
does not require an environment file for the default loopback setup. Important
controls include backend host/port, database and evidence paths, maximum upload
size, session duration, development API keys and frontend adapter URLs.

Keep `SGP_BACKEND_HOST=127.0.0.1`. Binding this service to a network interface
would expose development authentication and is unsupported.

## Production replacement map

| Temporary implementation | Production service requirement |
| --- | --- |
| Role selector and opaque local tokens | Enterprise identity, MFA, directory lifecycle and federated claims |
| Role and stage checks | Central policy service covering agency, assignment, geography, classification, action and expiry |
| SQLite state document | Transactional relational domain model with migrations and optimistic concurrency |
| Local evidence directory | Encrypted object storage, malware scanning, retention, legal hold and signed access |
| SQLite audit table | Immutable centralized audit and security monitoring |
| Local support table | Service desk integration, notifications, escalation and ownership |
| Prepared-file search | Governed search index with privacy-cleaned derivatives and clearance state |
| Lexical local assistant | Approved production retrieval, model gateway, evaluations, citations, telemetry and safety controls |
| Development API keys | Managed gateway credentials, scopes, rotation, revocation, rate limits and usage audit |
| Local process | Managed runtime, secrets, observability, backups, disaster recovery and deployment environments |

The temporary API intentionally keeps these boundaries visible. A production
implementation should replace adapters behind the existing frontend and API
contracts, not weaken the controls because a local path already works.
