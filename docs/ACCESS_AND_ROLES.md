# Access and roles

## Important MVP boundary

The current role system is an interactive product preview. A visitor can select
a test role, and that value is persisted in browser storage. Client-side route
guards tailor navigation and demonstrate scoped workspaces, but they cannot
protect confidential data or authorize an operation.

GitHub Pages is a public static host. Only content safe for anonymous public
delivery may be committed to the repository, build artifact, browser bundle,
or generated JSON.

## Demonstrated roles

| Level | Role | Demonstrated area |
| ---: | --- | --- |
| L0 | Public visitor | Public platform |
| L1 | Grant applicant | Applications and support |
| L2 | Reviewer | Assigned reviews |
| L3 | Grantee partner | Grants, reports, and visits |
| L4 | National programme user | Country programme operations |
| L5 | Agency administrator | Agency-scoped administration |
| L6 | UNDP administrator | UNDP-scoped administration |
| L7 | Platform administrator | Cross-agency governance |
| L8 | IT frontend operator | Frontend delivery and diagnostics |
| L9 | IT backend operator | Backend, data, identity, and AI operations |
| L10 | Super administrator | Global policy and controlled configuration |

The route policy is defined in `src/routing/access.ts`; role metadata is in
`src/auth/roles.ts`; workspace composition is in
`src/workspace/workspaceConfig.ts`; privileged-area definitions are in
`src/admin/adminConfig.ts`.

## Requirements before real restricted use

A production restricted workspace requires, outside this static frontend:

- authoritative identity with MFA and lifecycle management;
- server-side session validation;
- server-side authorization on every protected read and write;
- tenant, agency, country, and assignment scopes;
- least-privilege API credentials;
- immutable audit events;
- secure document storage and malware controls;
- data classification, retention, and deletion policies;
- consent, privacy, incident, and access-review processes;
- denial-by-default behavior when policy services are unavailable.

Frontend route hiding may complement these controls but must never replace
them. Until those services exist and pass security review, restricted screens
must use public-safe demonstration records only.

## Contribution rule

Do not commit passwords, tokens, applicant records, unpublished grant
decisions, personal data, confidential documents, or internal diagnostics.
Follow [SECURITY.md](../SECURITY.md) for vulnerability reporting.
