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
| L1 | Grant applicant | Organization overview, applications, and support |
| L2 | Reviewer | Assigned reviews |
| L3 | Grantee partner | Application history, grants, reports, visits, and support |
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

## Community workspace scope

Applicant and grantee users share one organization-centred workspace. The
visible primary tabs progress with the demonstrated role and record stage:

- Applicants see Overview, Applications, and Support. Grants appears when the
  selected organization has a visible conditional award or award-preparation
  record.
- Grantees retain Applications as history and also see Grants, Field Visits,
  Reports, and Support.
- Notifications, saved resources, AI chat history, and profile controls remain
  available as workspace utilities.
- Reviewer-only notes and decisions are not exposed in community routes.
- External agency records provide a labelled handoff instead of reproducing an
  agency-owned application or grant workflow.
- Switching organization immediately re-scopes applications, grants, visits,
  reports, support requests, notifications, members, and applicant AI history.
- Application drafts include persistent narrative sections, structured results
  and budget rows, section ownership, comments, selected-file metadata, and
  reviewer change responses. A submitted or resubmitted version is read-only.
- Support requests, replies, and selected-file metadata are scoped to the
  active organization and remain available after a browser reload.
- A missing or cross-organization record identifier returns a scoped
  unavailable state; it never falls back to another organization’s record or
  an unfiltered list.

In production, authorization for every read and action must evaluate the
intersection of identity, platform role, organization membership, agency and
programme scope, record ownership or assignment, lifecycle state, information
classification, permitted action, and any approval or expiry. Visible
navigation is only an orientation aid.

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
