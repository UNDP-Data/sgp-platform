# Access and roles

## Important MVP boundary

The current account selector is an interactive product-validation mechanism.
A visitor can select a public-safe test account. The temporary backend issues a
development session and independently enforces role, assignment and lifecycle
rules; the browser implementation remains an offline fallback. This is useful
authorization behavior for testing, but selecting a role is not identity proof
and cannot protect confidential data or authorize a production operation.

GitHub Pages is a public static host. Only content safe for anonymous public
delivery may be committed to this repository, build artifact, browser bundle,
or generated JSON.

## Demonstrated roles

| Level | Role | Demonstrated area |
| ---: | --- | --- |
| L0 | Public visitor | Cleared public platform |
| L1 | Programme Assistant | Delegated country records, documents, monitoring, and reporting preparation |
| L2 | TAG Reviewer | Time-bound technical reviews, protected evidence, independent recommendations, and assigned visits |
| L3 | NSC Member / Chair | Country committee packs, conflicts, quorum, decisions, and oversight |
| L4 | National Coordinator | Grant opportunities, complete applications, review coordination, grants, monitoring, results, AMR, and knowledge nomination |
| L5 | CPMT programme user | Assignment-scoped regional, global, M&E, correction, knowledge, or analytics work |
| L6 | Agency administrator | Assignment-scoped agency programme operations, agreements, finance, safeguards, reporting, users, integrations, content, data, AI, and configuration |
| L9 | IT administrator | Frontend delivery plus purpose-bound backend, data, identity, document, and AI operations, separated inside the technical workspace |
| L10 | Platform administrator | Cross-agency oversight, identity, access policy, global configuration, feature controls, audit, and emergency access |

Project proponents, applicant organizations, grantee organizations, community
groups, and beneficiaries are domain records and external actors. They do not
receive a direct account in the current product model. The NC or delegated PA
records proposals received through the authorized country process.

The route policy is defined in `src/routing/access.ts`; role metadata is in
`src/auth/roles.ts`; operational workspace composition is in
`src/workspace/workspaceConfig.ts`; privileged-area definitions are in
`src/admin/adminConfig.ts`.

Executable acceptance criteria are maintained in
`docs/OPERATIONAL_WORKFLOW_ACCEPTANCE.md`.

## Operational workspace model

The five programme account types and the merged Agency Administrator use the
same Workspace shell: Overview,
role-specific work pages, Saved and AI History, Profile, and Support. The
active role and assignment determine the records, fields, actions, metrics,
and navigation available to the user.

- **Programme Assistant:** prepares records and evidence delegated by the NC;
  the PA does not approve proposals or attest decisions.
- **TAG Reviewer:** declares conflicts, reviews a fixed application version,
  requests clarification, and submits a recommendation; the reviewer does not
  make the NSC decision.
- **NSC:** reviews meeting packs and records conflicts, quorum, conditions, and
  decisions; NSC access is limited by committee appointment and term.
- **National Coordinator:** owns the end-to-end country programme workflow,
  including funding windows and complete grant application materials for
  organization eligibility, outcomes, workplan, budget and cofinancing,
  safeguards, supporting documents, validation and controlled submission. The
  NC can edit every application section, manage structured planning rows and
  section evidence, resolve validation, attest the complete package, create a
  locked submission snapshot and open an attributable controlled revision. The
  NC confirms delegated PA work, coordinates TAG assignments and clarification,
  and prepares NSC packages without replacing independent TAG recommendations
  or NSC decision authority.
- **CPMT:** one account type and one interface serves regional, global, M&E,
  knowledge, and correction work. Each assignment grants only its named
  geography, function, datasets, fields, cases, actions, and expiry. A CPMT
  label never grants automatic global access.
- **Agency Administrator:** combines assigned operational agency functions with
  agency-scoped administration in one account and navigation area. Programme
  permissions remain assignment-specific and never confer cross-agency access
  or NSC decision authority.

## Agency operating modes

Agency Administrators support three integration modes:

1. **UNDP native:** approved country records can continue through agreement,
   assurance, finance, safeguards, reporting, and closure workflows in KLP.
2. **FAO/CI federated:** the agency system remains authoritative; KLP exposes
   governed status, metadata, exceptions, evidence links, and handoffs without
   recreating the agency-owned transaction workflow.
3. **Shared public and knowledge:** only cleared metadata, publications,
   portfolio evidence, API records, and AI-eligible material cross into the
   shared public layer.

Agency Administrator is one shared L6 account type whose active assignment
supplies the agency boundary. It combines assigned programme workflows with
agency user administration, integration credentials, mappings, governed
configuration, and administrative audit. Individual functions still require
explicit assignment and do not become available merely because the account is
associated with an agency.

## Shareable local-reference routes

Permissioned local-reference URLs include the selected test role as a `role` query
parameter, for example
`/workspace/grants/KEN-GRT-014?role=national-coordinator`. Opening a shared URL
selects that preview role before the client-side guard runs, and workspace
links retain the role alongside other query parameters or anchors. Legacy
`applicant`, `grantee`, and `national` values resolve to National Coordinator
only to preserve old preview links; they are not current account types. Legacy
`fao-admin`, `ci-admin`, and `undp-admin` values resolve to Agency Admin, while
`super-admin` and `klp-admin` resolve to Platform Admin. Legacy `it-frontend`
and `it-backend` values resolve to the unified IT Administrator. Their former
route families remain available as separately grouped frontend and backend
technical areas under `/it-admin`.

Legacy `agency-programme` values resolve to Agency Administrator. Existing
workflow records retain `agency-programme` as an internal provenance label so
their assignments and audit history do not need to be rewritten.

The current MVP uses one IT account type for testing. Its navigation enforces a
clear visual and functional boundary: frontend operations use sanitized,
data-minimized telemetry, while backend operations cover protected systems and
require purpose-bound, time-limited, audited access. A production authorization
service must preserve these separate entitlements even when one person can be
assigned both.

This routing parameter is local test state. The backend still enforces the role
named in its temporary session, but neither the route parameter nor the
development session is authentication, identity proof or a production sharing
mechanism.

## Production authorization

Every protected read and action must evaluate the intersection of:

- identity, MFA status, account state, agency, and employment relationship;
- role and explicit assignment;
- country, region, programme, organization, record, field, and document scope;
- lifecycle state and permitted action;
- information classification, publication status, AI/API eligibility, and
  purpose of use; and
- delegation, approval, separation-of-duties, and expiry constraints.

A production restricted workspace also requires server-side sessions and
policy evaluation, tenant-scoped data services, immutable audit events, secure
document storage and malware controls, access reviews, retention/deletion,
incident response, and denial by default when policy services are unavailable.
Visible navigation is only an orientation aid.

## Contribution rule

Do not commit passwords, tokens, applicant records, unpublished grant
decisions, personal data, confidential documents, or internal diagnostics.
Follow [SECURITY.md](../SECURITY.md) for vulnerability reporting.
