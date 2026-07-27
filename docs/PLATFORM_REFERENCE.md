# SGP Knowledge and Learning Platform reference

**Status:** Central product, information, and architecture reference  
**Evidence baseline:** 27 July 2026  
**Primary use:** Product planning, procurement, implementation handoff, and
future revisions of the Platform Architecture and Experience Concept  
**Related concept:** *SGP KLP Deliverable 2.1 — Platform Architecture and
Experience Concept*, v1.11

## 1. Purpose and interpretation

This document is the single consolidated reference for the SGP Knowledge and
Learning Platform (KLP). It joins the implemented demonstrator evidence in this
repository with the proposed future platform scope in the architecture and
experience concept. The focused documents in this directory remain useful
implementation guides, but this document is the cross-cutting source for the
product boundary, sitemap, features, users, records, metadata, data scope,
architecture, governance, and delivery strategy.

The reference uses four scope labels:

| Label | Meaning |
| --- | --- |
| **Implemented demonstrator** | Working, public-safe behavior evidenced in this repository. It may use static, migrated, curated, or browser-local data and is not automatically production-ready. |
| **Connected demonstrator** | Working interface connected to an external service, currently limited to the cited AI service. |
| **Target platform** | Proposed future capability that still requires validation, procurement, implementation, security review, and operating ownership. |
| **External authoritative system** | A participating agency or programme system that remains the system of record; the KLP discovers, exchanges, or links to it without silently taking ownership. |

Route labels such as `prototype`, `migrated-source`, `live-service`, and
`placeholder-undp` describe the demonstrator's evidence source. They are not
security, maturity, data-quality, or programme-approval claims.

The current deployment is a public static demonstrator. Its role picker, route
guards, local persistence, curated opportunities, sample records, and
administration screens must never be treated as production authorization,
official programme records, or an approved live call for proposals.

## 2. Product intent and outcomes

The target KLP should provide one coherent way to:

1. discover open SGP opportunities and continue through the responsible agency;
2. understand the global portfolio and trace aggregate claims to source data;
3. find, compare, and reuse thirty years of community-led project evidence;
4. ask multilingual, cited questions across explicitly approved corpora;
5. support a continuous applicant-to-grantee journey where the KLP owns the
   operational workflow;
6. exchange approved metadata, records, and links with agency-owned systems;
7. support national, agency, global, technical, and governance users without
   collapsing their responsibilities;
8. publish only information that has passed data, rights, consent, sensitivity,
   and publication checks; and
9. preserve provenance, correction, withdrawal, and audit throughout the
   information lifecycle.

The experience should feel like one platform, but its public information,
protected operations, agency integrations, data pipelines, and AI service are
separate trust and failure domains.

## 3. Experience principles

- **One front door, clear ownership.** A person may discover any approved
  opportunity through the KLP, but the interface must identify the managing
  agency and the authoritative next step.
- **Evidence before assertion.** Portfolio metrics, search results, AI answers,
  and public narratives should retain source, coverage, freshness, and
  qualification.
- **Continuous records.** Organization, application, decision, grant,
  implementation, reporting, and knowledge records should be related rather
  than recreated at each phase.
- **Public and protected are different zones.** Public discovery must not share
  an implicit authorization boundary with restricted programme operations.
- **Intersection-based access.** Identity, role, organization, agency, country,
  assignment, record, lifecycle state, action, information classification,
  approval, and expiry all matter.
- **Multilingual by design.** Seven demonstrator locales establish the
  interface baseline; target content workflows must also manage source
  language, translations, glossary authority, review, and version alignment.
- **Human responsibility remains visible.** AI may retrieve, synthesize,
  translate, and flag evidence. It does not determine eligibility, scores,
  safeguards, approval, disbursement, closure, evaluation findings, or
  publication clearance.
- **Progressive operation.** Public discovery should remain useful on mobile,
  low-bandwidth, or partially degraded connections. Protected workflows should
  support recovery, draft durability, and explicit external handoffs.
- **Accessible and observable.** Accessibility, performance, data quality,
  security, and service health are acceptance criteria, not later decoration.

## 4. Complete route sitemap

`src/sitemap.json` is the implemented canonical catalogue. It contains **85
route patterns**, including the wildcard not-found route. English routes are
unprefixed; Portuguese, French, Spanish, Russian, Chinese, and Arabic add
`/pt`, `/fr`, `/es`, `/ru`, `/zh`, or `/ar` before the same application path.
Localized variants do not create separate sitemap records.

### 4.1 Public discovery, knowledge, stories, community, and help

| Route | Page | Evidence state | Audience |
| --- | --- | --- | --- |
| `/` | Home | `prototype` | Public and signed-in |
| `/funding` | Open Grants | `prototype` | Public and signed-in |
| `/funding/grants/:grantId` | Grant Opportunity | `prototype` | Public and signed-in |
| `/portfolio` | Portfolio Dashboard | `migrated-source` | Public and signed-in |
| `/knowledge` | Knowledge and AI | `prototype` | Public and signed-in |
| `/knowledge/studio` | AI Knowledge Studio | `live-service` | Public and signed-in |
| `/knowledge/library` | Innovation Library | `migrated-source` | Public and signed-in |
| `/knowledge/resources/:resourceId` | Knowledge Resource | `migrated-source` | Public and signed-in |
| `/knowledge/saved` | Saved Knowledge | `prototype` | Signed-in |
| `/stories` | Stories and Voices | `migrated-source` | Public and signed-in |
| `/stories/:contentId` | Story or Voice | `migrated-source` | Public and signed-in |
| `/community` | Community Events | `prototype` | Public and signed-in |
| `/community/events/:eventId` | Event | `prototype` | Public and signed-in |
| `/help` | Help | `prototype` | Public and signed-in |
| `/help/applicants` | Applicant Guidance | `prototype` | Public and applicant |
| `/help/faq` | Frequently Asked Questions | `prototype` | Public and signed-in |
| `/help/templates` | Templates | `prototype` | Public and signed-in |
| `/help/contact` | Contact | `prototype` | Public and signed-in |

### 4.2 Community and programme workspaces

| Route | Page | Evidence state | Audience |
| --- | --- | --- | --- |
| `/workspace` | Overview | `prototype` | Signed-in |
| `/workspace/applications` | Applications | `prototype` | Signed-in, role-scoped |
| `/workspace/applications/:applicationId` | Application workspace | `prototype` | Signed-in, record-scoped |
| `/workspace/grants` | Grants | `prototype` | Signed-in, role-scoped |
| `/workspace/grants/:grantId` | Grant workspace | `prototype` | Signed-in, record-scoped |
| `/workspace/reviews` | Reviews | `placeholder-undp` | Assigned reviewer or programme role |
| `/workspace/reviews/:reviewId` | Review workspace | `placeholder-undp` | Assigned reviewer or programme role |
| `/workspace/visits` | Field Visits | `prototype` | Relevant signed-in roles |
| `/workspace/visits/:visitId` | Field Visit | `prototype` | Relevant signed-in roles |
| `/workspace/reports` | Reports | `prototype` | Relevant signed-in roles |
| `/workspace/reports/:reportId` | Report workspace | `prototype` | Relevant signed-in roles |
| `/workspace/support` | Support | `prototype` | Signed-in |
| `/workspace/support/:requestId` | Support Request | `prototype` | Signed-in, record-scoped |
| `/workspace/notifications` | Notifications | `prototype` | Signed-in |
| `/workspace/saved` | Saved | `prototype` | Signed-in |
| `/workspace/ai-chat-history` | AI Chat History | `prototype` | Signed-in |
| `/workspace/profile` | Profile | `prototype` | Signed-in |

### 4.3 Agency and UNDP administration

| Route | Page | Evidence state | Audience |
| --- | --- | --- | --- |
| `/admin` | Agency Overview | `prototype` | Agency administrator |
| `/admin/documents` | Document Management | `prototype` | Agency administrator |
| `/admin/data` | Data Management | `prototype` | Agency administrator |
| `/admin/site-content` | Site Content | `prototype` | Agency administrator |
| `/admin/ai` | AI Management | `prototype` | Agency administrator |
| `/admin/integrations` | API Access and Integrations | `prototype` | Agency administrator |
| `/admin/users` | User Management | `prototype` | Agency administrator |
| `/admin/undp` | UNDP Administration | `placeholder-undp` | UNDP administrator |
| `/admin/undp/documents` | UNDP Document Management | `placeholder-undp` | UNDP administrator |
| `/admin/undp/data` | UNDP Data Management | `placeholder-undp` | UNDP administrator |
| `/admin/undp/site-content` | UNDP Site Content | `placeholder-undp` | UNDP administrator |
| `/admin/undp/ai` | UNDP AI Management | `placeholder-undp` | UNDP administrator |
| `/admin/undp/integrations` | UNDP API Access and Integrations | `placeholder-undp` | UNDP administrator |
| `/admin/undp/users` | UNDP User Management | `placeholder-undp` | UNDP administrator |

### 4.4 Cross-agency platform administration

| Route | Page | Evidence state | Audience |
| --- | --- | --- | --- |
| `/platform-admin` | Platform Admin Overview | `prototype` | Platform administrator |
| `/platform-admin/agencies` | Agency Oversight | `prototype` | Platform administrator |
| `/platform-admin/portfolio` | Programme and Portfolio | `prototype` | Platform administrator |
| `/platform-admin/knowledge` | Knowledge and Content | `prototype` | Platform administrator |
| `/platform-admin/ai` | AI Oversight | `prototype` | Platform administrator |
| `/platform-admin/integrations` | API and Integrations | `prototype` | Platform administrator |
| `/platform-admin/users` | Users and Access | `prototype` | Platform administrator |
| `/platform-admin/governance` | Governance and Audit | `prototype` | Platform administrator |
| `/platform-admin/reports` | Performance and Reports | `prototype` | Platform administrator |

### 4.5 Technical operations

| Route | Page | Evidence state | Audience |
| --- | --- | --- | --- |
| `/it-admin/frontend` | IT Frontend Overview | `prototype` | IT frontend operator |
| `/it-admin/frontend/health` | Service Health | `prototype` | IT frontend operator |
| `/it-admin/frontend/environments` | Environments and Releases | `prototype` | IT frontend operator |
| `/it-admin/frontend/incidents` | Incidents | `prototype` | IT frontend operator |
| `/it-admin/frontend/jobs` | Jobs and Pipelines | `prototype` | IT frontend operator |
| `/it-admin/frontend/integrations` | Integrations and APIs | `prototype` | IT frontend operator |
| `/it-admin/frontend/logs` | Logs and Diagnostics | `prototype` | IT frontend operator |
| `/it-admin/frontend/security` | Security and Resilience | `prototype` | IT frontend operator |
| `/it-admin/backend` | IT Backend Overview | `prototype` | IT backend operator |
| `/it-admin/backend/health` | Service and Data Health | `prototype` | IT backend operator |
| `/it-admin/backend/documents` | Data Stores and Documents | `prototype` | IT backend operator |
| `/it-admin/backend/users` | Identity and User Data | `prototype` | IT backend operator |
| `/it-admin/backend/ai-audit` | AI Queries and Audit | `prototype` | IT backend operator |
| `/it-admin/backend/pipelines` | Pipelines and Integrations | `prototype` | IT backend operator |
| `/it-admin/backend/security` | Security and Secrets | `prototype` | IT backend operator |
| `/it-admin/backend/access` | Access Review and Diagnostics | `prototype` | IT backend operator |

### 4.6 Super administration and utilities

| Route | Page | Evidence state | Audience |
| --- | --- | --- | --- |
| `/super-admin` | Super Admin Overview | `prototype` | Super administrator |
| `/super-admin/identity` | Identity and Roles | `prototype` | Super administrator |
| `/super-admin/policies` | Access Policies | `prototype` | Super administrator |
| `/super-admin/configuration` | Global Configuration | `prototype` | Super administrator |
| `/super-admin/features` | Environments and Features | `prototype` | Super administrator |
| `/super-admin/audit` | Audit and Emergency Access | `prototype` | Super administrator |
| `/search` | Search | `prototype` | Public and signed-in |
| `/prototype-notice` | About this Prototype | `prototype` | Public and signed-in |
| `/privacy` | Privacy | `prototype` | Public and signed-in |
| `/accessibility` | Accessibility | `prototype` | Public and signed-in |
| `*` | Page not found | `prototype` | Public and signed-in |

The future information architecture should preserve stable canonical resource
routes and may add explicit country programme, project, organization, dataset,
publication, policy, and API routes. New routes should be introduced only with
an owner, audience, access class, lifecycle, canonical identifier, metadata
contract, and redirect strategy.

## 5. Feature set

### 5.1 Shared platform shell

**Implemented demonstrator**

- persistent global navigation for funding, portfolio, knowledge, stories,
  community events, help, search, account, language, and role preview;
- responsive desktop and mobile layouts with stable scrollbar allocation;
- base-path-safe navigation and assets for GitHub Pages;
- seven localized URL schemes and translated interface catalogues;
- Arabic text direction where appropriate while preserving the established
  dashboard and grants-page geometry;
- shared docked AI assistant with streaming state, citations, and history;
- public-safe role preview, saved items, notifications, and browser preferences;
- local optimized imagery with responsive WebP variants and intrinsic sizing;
- not-found handling and deep-link SPA recovery.

**Target platform**

- authenticated, policy-scoped navigation generated from server-authorized
  capabilities;
- organization and assignment switching without cross-scope data leakage;
- consistent service status, privacy, accessibility, consent, and support
  affordances;
- design-system tokens and components governed across public, workspace, and
  administration channels; and
- analytics that measure outcomes without collecting unnecessary personal or
  sensitive content.

### 5.2 Home and orientation

**Implemented demonstrator**

- programme value proposition and four primary journeys: access funding, view
  stories and voices, learn from evidence, and see community events;
- portfolio KPIs and a live portfolio-atlas preview;
- knowledge and AI entry points;
- responsive visual storytelling, local imagery, and role-aware calls to action.

**Target platform**

- configurable, versioned editorial modules by audience, language, campaign,
  region, and programme priority;
- current opportunity, evidence, event, and service-health signals from
  governed sources; and
- measurable handoff from public discovery into authenticated or external
  agency workflows.

### 5.3 Funding and open opportunities

**Implemented demonstrator**

- ten curated demonstration opportunities across UNDP, FAO, and CI;
- canonical opportunity pages at `/funding/grants/:grantId`;
- visual opportunity cards and a detail panel using the same detail component;
- search by country, theme, applicant, or opportunity text;
- one selected-filter card per filter type;
- agency selectors with approved visual marks;
- a full-width region selector with counts and programme-region colors;
- an eight-theme multi-select icon wheel;
- a historical-project choropleth shaded by project count, light-grey
  no-data countries, open-opportunity markers, Pacific wrapping, data-fit
  bounds, pan, zoom, reset, responsive recovery, and coordinated hover;
- region, agency, theme, country, and search filtering that updates map bounds,
  KPIs, and results;
- closing-date and alphabetical sorting;
- application guidance and agency-specific next steps;
- UNDP application links into the demonstrated workspace and explicit FAO/CI
  external handoffs.

**Target platform**

- an authoritative opportunity feed or approved agency integrations with
  freshness, version, closure, correction, and withdrawal behavior;
- configurable eligibility, geography, funding, modality, deadline, language,
  contact, guidance, template, and application-channel metadata;
- saved searches, alerts, watchlists, and consented communications;
- accessible non-map alternatives and low-bandwidth views;
- eligibility guidance that explains requirements without making decisions;
- end-to-end attribution from discovery to agency handoff or KLP application;
  and
- no duplication of an agency-owned case-management record unless governance
  explicitly assigns it to the KLP.

### 5.4 Portfolio evidence and analytics

**Implemented demonstrator**

- 30,753 normalized project rows and 56,808 detailed cofinancing rows;
- global and filtered KPIs for projects, countries, grants, cofinancing, total
  investment, leverage, active/completed status, and related measures;
- country, region, focal area, phase, status, year, grantee, and text filtering;
- interactive map, trend, composition, indicator, comparison, and table views;
- project and country drill-down over prepared records;
- country aliases, ISO matching, historical coverage, and provenance;
- local query planning for structured portfolio questions; and
- prepared exports or views that remain independent of the live AI service.

**Target platform**

- a canonical, reconciled portfolio model across operational phases and
  participating agencies;
- explicit coverage, freshness, source hierarchy, missingness, duplicate,
  currency, phase, and confidence indicators;
- governed indicator definitions, disaggregation, methodology, and revision;
- traceability from aggregate values to contributing records and evidence;
- approved public datasets and restricted analytical workspaces;
- versioned snapshots for official reporting; and
- APIs and bulk exports with scope, pagination, provenance, and revocation.

### 5.5 Knowledge, library, and AI

**Implemented demonstrator**

- a Knowledge and AI landing page with an “Ask the SGP Innovation Library”
  prompt, prompt ideas, direct library search, and collection KPIs;
- an Innovation Library over a prepared 29,384-record archive index plus a
  3,316-record editorial index;
- scope, record-type, and text filtering; resource detail pages; saved items;
  canonical-source links; source labels; and rights cautions;
- a connected AI Knowledge Studio with selectable library, project, or combined
  corpora;
- streamed answers, citations, source cards, follow-up ideas, status, and
  relevance-map squares colored by relevance score;
- organization-scoped browser conversation history in the community preview;
- a current service request limited to the question and locale—the connected
  assistant does not read or modify workspace records; and
- an indicative API contract for sessions, assistant queries, resource search,
  document search, and datasets.

**Target platform**

- one governed retrieval and generation service used by all channels;
- separate public and protected indexes with authorization enforced before
  retrieval, not only before presentation;
- short-lived signed context carrying identity, organization, agency, country,
  role, assignment, permitted corpora, purpose, and expiry;
- source snapshots, chunk lineage, citation locations, index version, model and
  prompt version, language, policy result, and audit identifier;
- multilingual and cross-lingual retrieval with glossary-controlled terminology;
- visible abstention when evidence is insufficient or authorization excludes
  sources;
- prompt-injection, sensitive-data, unsafe-output, and exfiltration controls;
- evaluation for retrieval quality, groundedness, citation validity, refusal
  correctness, safety, latency, cost, coverage, and multilingual quality;
- human review before AI-assisted text becomes an official record or public
  product; and
- explicit, authorized actions for any write-back. Reading an application or
  modifying a record must never be inferred from the chat interface.

AI must not automatically determine eligibility, rank or score applications,
make safeguards or fiduciary judgments, approve grants, release funds, close
awards, make evaluation findings, or clear publication.

### 5.6 Global search

**Implemented demonstrator**

- unified discovery across nine result families: grant, project, story, video,
  publication, resource, event, photo, and page;
- visual thumbnails where available, type-specific color and icon treatment,
  relevance scoring, type facets, deduplication, and canonical links; and
- a results layout that separates the total and filters from result cards.

**Target platform**

- hybrid lexical, structured, semantic, multilingual, and geospatial search;
- access-filtered results and counts;
- spelling, aliases, controlled vocabulary, acronym expansion, and entity
  resolution;
- explainable ranking signals and source freshness;
- governed synonyms for country, agency, GEF phase, focal area, programme,
  lifecycle, and document families; and
- search analytics feeding taxonomy and content-quality improvement without
  exposing protected query content.

### 5.7 Stories and voices

**Implemented demonstrator**

- locally cached and optimized story imagery rather than runtime hotlinks;
- featured content plus stories, SGP voices, photography, and publications;
- archive search, category treatment, progressive loading, canonical links,
  detailed story routes, image attribution, and responsive card geometry.

**Target platform**

- an editorial workflow for submission, consent, rights, sensitive-location
  review, translation, fact checking, publication, correction, expiry, and
  withdrawal;
- structured links from narratives to projects, organizations, countries,
  themes, outcomes, media, and underlying public evidence;
- accessible transcripts, captions, alt text, and rights metadata; and
- reusable country, theme, campaign, event, and partner collections.

### 5.8 Community events

**Implemented demonstrator**

- the Community Events listing and canonical event pages;
- event search plus region, theme, format, and event-type filters;
- distinct webinar, workshop, exchange, dialogue, training, and related
  category treatment;
- placeholder or source visuals for every event;
- a changeable monthly calendar with day coloring from filtered events;
- selecting a date as a filter and clearing the text search to avoid conflicting
  intent; and
- event-detail metadata and a consistently positioned return action.

**Target platform**

- governed event ownership, registration destination, capacity, time zone,
  language, accessibility, recurrence, recording, related materials, and status;
- agency and external calendar integrations;
- permissioned attendance or participation data kept outside public event
  records; and
- conversion of approved event outputs into durable knowledge records.

### 5.9 Help and support

**Implemented demonstrator**

- general help, applicant guidance, FAQ search, templates, and contact;
- stepwise opportunity and application guidance;
- signed-in support requests with category, messages, attachments metadata,
  status, owner, related record, and durable browser-local threads.

**Target platform**

- versioned guidance tied to country, call, agency, language, and lifecycle;
- an accessible service catalogue with case ownership, service levels,
  escalation, consent, retention, and reporting;
- case links to operational records without copying their protected content;
  and
- offline and assisted channels for users unable to complete digital flows.

### 5.10 Applicant-to-grantee workspace

**Implemented demonstrator**

- organization-centred overview, priorities, members, and organization switch;
- application lists, filters, creation from a canonical opportunity, persistent
  draft narratives, structured OP8 result rows, budget and cofinancing rows,
  section owners, comments, and attachments metadata;
- autosave, browser reload recovery, validation, submission confirmation,
  immutable submission snapshots, locked submitted records, requested changes,
  response and resubmission versions, and demonstration audit events;
- application history and award transition;
- grant overview, requirements, milestones, documents affordance, and next
  actions;
- field-visit preparation, observations, and follow-up;
- progress/final reporting, section progress, requested changes, and knowledge
  candidate status;
- support requests and replies, notifications, saved resources, AI history, and
  profile preferences;
- organization-scoped selectors and unavailable states for missing or
  cross-organization identifiers; and
- labelled external-agency handoffs instead of simulated ownership.

Selected file bytes are not stored. Only safe metadata is retained for the
demonstrator.

**Target platform**

- authoritative organization and membership records;
- server-side workflow, authorization, optimistic versioning, audit, document
  storage, malware scanning, e-signature or agreement integration, and
  notification delivery;
- reusable structured application data that flows into grant, monitoring,
  reporting, and knowledge records;
- explicit reviewer and decision separation, conflict-of-interest handling,
  quorum, delegation, and time-limited assignments;
- secure grant agreement, disbursement, safeguards, reporting, monitoring,
  correction, and closure interfaces where assigned to the KLP; and
- synchronization or deep handoff for agency-owned workflows.

### 5.11 Programme, agency, platform, and technical administration

The demonstrator includes coherent administration concepts rather than
production consoles:

- **National programme:** applications, grants, reviews, visits, reports,
  portfolio evidence, support, and country priorities.
- **Agency administration:** documents, data, site content, AI, integrations,
  and users within an agency scope.
- **UNDP administration:** the same administrative families as explicit
  placeholders for the proposed UNDP operational migration.
- **Platform administration:** agencies, global portfolio, knowledge, AI,
  integrations, users, governance/audit, and performance/reporting.
- **IT frontend:** service health, environments/releases, incidents, jobs,
  dependency contracts, sanitized logs, browser security, and resilience.
- **IT backend:** service/data health, data stores/documents, identity/user
  operations, AI query audit, pipelines/integrations, secrets, and
  purpose-bound diagnostic access.
- **Super administration:** identity and roles, access policies, global
  configuration, environments/features, audit, and emergency access.

Target administrative actions require separation of duties, approval,
environment and scope controls, immutable audit, expiry, rollback, and
break-glass governance. Frontend operators should receive data-minimized
telemetry; protected content access must require a separately approved,
purpose-bound backend role.

## 6. Users, stakeholders, and access

### 6.1 Demonstrated access levels

The levels orient the interface; they are not a simple inheritance hierarchy.

| Level | Role | Primary demonstrated scope |
| ---: | --- | --- |
| L0 | Public visitor | Cleared public discovery and evidence |
| L1 | Grant applicant | Organization, applications, support, saved knowledge |
| L2 | Reviewer | Assigned reviews, visits, evidence, support |
| L3 | Grantee partner | Application history, grants, reports, visits, support |
| L4 | National programme user | Country programme operations and oversight |
| L5 | Agency administrator | Agency-scoped content, data, AI, integrations, users |
| L6 | UNDP administrator | UNDP-scoped programme administration |
| L7 | Platform administrator | Cross-agency programme oversight and governance |
| L8 | IT frontend operator | Frontend delivery and sanitized diagnostics |
| L9 | IT backend operator | Purpose-bound data, identity, AI, and backend operations |
| L10 | Super administrator | Global access policy and controlled configuration |

### 6.2 Target stakeholder register

The broader future platform must account for actors who are not represented by
a permanent navigation role.

| Code | Stakeholder or actor | Expected relationship to the KLP |
| --- | --- | --- |
| ST01 | Project proponent / grantee partner | Apply, implement, report, contribute approved knowledge |
| ST02 | Community members / beneficiaries | Provide consented priorities, feedback, evidence, and learning |
| ST03 | National Coordinator / national project management | Configure country programme, calls, reviews, grants, monitoring |
| ST04 | Programme Assistant / country data support | Data entry, document, workflow, QA, and reporting support |
| ST05 | NSC / country-level governance structure | Portfolio governance and approval decisions |
| ST06 | Technical reviewers / TAG | Time-bound technical appraisal and evidence review |
| ST07 | Implementing agency country team / UNDP Country Office | Compliance, safeguards, agreement, disbursement, assurance |
| ST08 | National Host Institution / Responsible Party | Assigned implementation and monitoring support |
| ST09 | National Host Institution Director | Constrained institutional oversight and conflict management |
| ST10 | CPMT regional focal point | Regional strategy review, QA, and country support |
| ST11 | CPMT global M&E / KM team | Methodology, global QA, reporting, knowledge, publication |
| ST12 | Implementing agency global / HQ team | Agency oversight, reporting, implementation, exchange |
| ST13 | SGP Global Steering Committee | Cross-agency strategic governance |
| ST14 | GEF Secretariat | Programme direction, oversight, and reporting recipient |
| ST15 | GEF Council | High-level aggregate evidence and programme reporting |
| ST16 | Government / GEF OFP / MEA focal points | National priorities, policy linkages, uptake, endorsement inputs |
| ST17 | Evaluators / auditors | Time-limited, controlled evidence and audit access |
| ST18 | Grantmaker+ / strategic grantee partner | Differentiated grant, partner, or sub-grant implementation |
| ST19 | Partners / cofinanciers / CSO networks | Cofinancing, technical cooperation, learning, scale-up evidence |
| ST20 | Public / external users | Cleared maps, records, datasets, knowledge, and public AI |
| ST21 | Platform administrators / KLP system owner | Configuration, permissions, taxonomy, publication, AI governance |

### 6.3 Target authorization decision

Every protected read or action should evaluate:

```text
identity
  × platform role
  × organization membership
  × agency and programme scope
  × country or regional scope
  × record ownership or assignment
  × lifecycle state
  × information classification
  × requested action
  × approval, purpose, and expiry
```

The default is deny. Navigation visibility is not authorization. Search, AI,
exports, notifications, caches, logs, and analytics must apply the same policy.

## 7. Programme lifecycle and record architecture

### 7.1 Target lifecycle

| Code | Phase | Principal record outcome |
| --- | --- | --- |
| P00 | Country Programme Strategy and Portfolio Setup | Approved programme frame, priorities, governance, taxonomy |
| P01 | Call for Proposals Design and Launch | Versioned call, rules, guidance, templates, launch record |
| P02 | Project Proponent Profile and Eligibility | Organization profile and eligibility evidence |
| P03 | Concept Paper, Community Problem, and Planning Support | Concept, community evidence, baseline, planning support |
| P04 | NC Screening and Full Proposal Development | Screening decision and full proposal package |
| P05 | Technical Review, Country Governance Decision, and Revision | Review, governance decision, conditions, revisions |
| P06 | Safeguards Review, Verification, and Agreement | Clearance, verification, and agreement package |
| P07 | Agreement Signing and First Disbursement | Signed record, readiness, first tranche evidence |
| P08 | Implementation, Progress Reporting, and Field Monitoring | Reports, visits, actuals, corrective actions, tranche evidence |
| P09 | Final Results, Financial Closure, and Acquittal | Verified results, financial closure, assets, sustainability |
| P10 | Knowledge Capture, Products, and Replication | Cleared knowledge products, cases, replication evidence |
| P11 | Global Reporting, PIR / AMR, and RMF QA | Validated snapshots, aggregates, evaluation and audit evidence |

The phases are a controlled taxonomy, not a requirement that every agency use
the same application screens. A record must identify its authoritative system,
phase, status, transition, decision owner, applicable rules, and linked
evidence.

### 7.2 Target document and record register

| Code | Record family |
| --- | --- |
| D01 | Country Programme Strategy / country programme record |
| D02 | Call for Proposals design package |
| D03 | Applicant guidance and template pack |
| D04 | Project proponent / grantee partner profile |
| D05 | Concept Paper package |
| D06 | Community consultation and consent record — design |
| D07 | Community feedback and beneficiary evidence — implementation |
| D08 | Site and baseline assessment |
| D09 | NC Concept Paper screening record |
| D10 | Planning Grant application and support record |
| D11 | Full Project Proposal package |
| D12 | Workplan, Results Framework, and M&E Plan — living record |
| D13 | Safeguards review / SES screening record |
| D14 | Gender, inclusion, and stakeholder analysis record |
| D15 | Technical review / TAG appraisal record |
| D16 | NSC / country governance decision record |
| D17 | MOA / Grant Agreement package |
| D18 | First disbursement and tranche release record |
| D19 | Progress report package |
| D20 | Field monitoring and corrective action record |
| D21 | Cofinancing evidence and actuals record |
| D22 | Final technical and financial report package |
| D23 | Final results / indicator verification table |
| D24 | Closure, sustainability, and asset record |
| D25 | Knowledge product / KM product package |
| D26 | Policy uptake and replication evidence |
| D27 | Country Programme Results Report |
| D28 | AMR / PIR country reporting submission |
| D29 | Evaluation and audit evidence package |
| D30 | Grant modality / SGP 2.0 special initiative record |
| D31 | Responsible person / role assignment record |

Each family requires a separately approved owner, authoritative source,
classification default, retention rule, version rule, minimum metadata,
workflow, publication rule, AI rule, API rule, and correction or withdrawal
process. A document file and its programme record are not interchangeable:
structured facts, workflow state, original evidence, extracted text, rendered
derivatives, translations, and published representations need distinct
identities and provenance.

### 7.3 Canonical entity relationships

```text
Agency ─┬─ Country programme ─ Call / Opportunity
        │                         └─ Guidance and templates
        └─ Integration contract

Organization ─ Membership / role assignment
      └─ Application ─ Submission version ─ Review ─ Decision
                                          └─ Safeguards / verification
Decision ─ Grant / agreement ─ Disbursement
                            ├─ Workplan / results / indicators
                            ├─ Progress report ─ Evidence
                            ├─ Field visit ─ Corrective action
                            ├─ Cofinancing commitment / actual
                            └─ Final report ─ Closure
                                             └─ Knowledge candidate

Project / programme evidence ─ Knowledge resource ─ Publication / story / media
                            └─ Dataset release

Every entity ─ Provenance ─ Classification ─ Rights / consent
             ├─ Version / correction / withdrawal
             ├─ Access and audit events
             └─ AI index and citation eligibility
```

## 8. Data scope and evidence baseline

### 8.1 Packaged demonstrator data

The current static runtime package is validated by
`public/generated/provenance.json`.

| Artifact | Records | Demonstrator use |
| --- | ---: | --- |
| Normalized projects | 30,753 | Portfolio, maps, KPIs, project search |
| Detailed cofinancing rows | 56,808 | Finance, leverage, partner analysis |
| World-country features | 249 | Maps and geographic joins |
| Country content profiles | 139 | Country context and content links |
| Editorial index | 3,316 | Stories, voices, publications, photos |
| Archive knowledge index | 29,384 | Innovation Library discovery |
| Country alias package | 2 top-level collections | Name normalization and ISO matching |
| Data dictionary | 3 top-level collections | Source-field profiling and validation |
| Geographic provenance | 1 record | Boundary-source traceability |

The manifest schema is `sgp-klp-mvp-provenance-v1`, generated 22 July 2026.
Each artifact includes a source label, byte count, record count, SHA-256 hash,
and passed validation state. “Passed” means the packaged technical contract
passed; it does not mean every record is complete, current, reconciled, or
approved for official reporting.

The prepared project data includes project identifiers, duplicate signals,
operational phase, grant type and category, title, region, normalized country
and ISO match state, institutional type, grantee, focal area, source status and
normalized status group, dates, duration, funding source, grant amount,
cash/in-kind cofinancing, total investment, leverage, partner counts, and
cofinancing linkage signals.

The cofinancing data includes row and project identifiers, linkage candidates,
phase, title, region, country, focal area, dates, partner name and normalized
name, partner type and country, and cash, in-kind, and total values.

Source profiling identifies material missingness that future migration must
preserve and address rather than silently impute. Examples include 12,894
project rows without an NSC approval date, 1,980 without project-level cash
cofinancing, 1,683 without project-level in-kind cofinancing, 654 without an
MOA signed date, 84 without an institutional type or grantee name, and
cofinancing partner-country fields absent in approximately 14.3K detail rows.

### 8.2 Other demonstrator records

- **Open grants:** ten curated examples with title, summary, country and ISO,
  location, region, themes, managing agency, funding range and currency, open
  and close dates, duration, applicant types, eligibility, priorities,
  expected outputs, visual, reference project, and prototype status. They are
  not approved live calls.
- **Community workspace:** two public-safe example organizations and linked
  applications, grants, visits, reports, support, messages, comments,
  assignments, attachments metadata, structured results and budgets,
  requested changes, submission snapshots, and audit events. They are not
  programme records.
- **Archive resources:** identifier, title, kind, record kind, route type,
  status, path, source URL, summary, context, section, and source.
- **Editorial content:** story, voice/video, publication, and photo identifiers;
  titles; summaries or bodies; canonical and download URLs; dates; authors;
  imagery and alt text; countries; focal areas; types; and source counts.
- **Media:** 124 local media files and eight brand files at the evidence date,
  including responsive variants where prepared.

### 8.3 Data limitations to carry into planning

- The repository does not contain an authoritative live opportunity database.
- The static package reflects source snapshots and cannot establish current
  programme status without source-system refresh and reconciliation.
- Archive presence does not establish rights, consent, publication clearance,
  accuracy, or AI eligibility.
- Historical projects require cross-phase terminology, identifier, country,
  currency, status, grantee, and agency reconciliation.
- Source completeness varies substantially by field and period.
- Browser-local workspace data cannot be migrated as if it were a programme
  record.
- Public static hosting permits only information safe for anonymous delivery.

## 9. Metadata strategy

### 9.1 Design rules

1. Assign a stable global identifier while retaining every source identifier.
2. Keep original evidence immutable; corrections create governed versions.
3. Separate raw source values from normalized and controlled values.
4. Preserve the source hierarchy and reconciliation decision.
5. Treat access, publication, AI retrieval, and API exposure as four separate
   policy decisions.
6. Record agency, country programme, GEF phase, operational phase, grant
   modality, lifecycle phase, document family, and language explicitly.
7. Attach rights, consent, sensitivity, and sensitive-location controls to
   content and evidence, not only to enclosing folders.
8. Make quality and coverage visible rather than filling gaps invisibly.
9. Propagate correction, reclassification, expiry, withdrawal, and revocation
   to search, AI, analytics, translations, caches, APIs, and feeds.
10. Version controlled vocabularies and keep aliases for historic terminology.

### 9.2 Minimum metadata envelope

Every canonical record should carry the relevant fields from this envelope.

| Layer | Minimum concerns |
| --- | --- |
| Identity | Global ID, record type, canonical URI, source system, source ID, parent or relationship IDs |
| Version and time | Version, status, created/updated/effective dates, reporting period, supersedes/superseded-by, content hash |
| Institutional | Implementing agency, programme, country programme, owning organization, steward, responsible role |
| Geography | ISO country, SGP region, administrative areas, landscape/seascape, coordinates, geometry, precision class, sensitive-location flag |
| Programme taxonomy | GEF phase, operational phase, lifecycle phase P00–P11, record family D01–D31, grant modality, initiative |
| Theme | Focal area, theme, cross-cutting theme, SDG or other mappings, controlled term IDs and vocabulary version |
| Workflow | State, transition, decision, decision owner, assignment, due date, conditions, exception, lock or snapshot |
| Finance | Currency, exchange-rate basis, grant, requested amount, approved amount, disbursement, cash and in-kind cofinancing, actuals, period |
| Results | Result, output, outcome, indicator, unit, baseline, target, actual, disaggregation, method, verification, confidence |
| Provenance | Source artifact, extraction or ingestion run, lineage, reconciliation rule, original value, normalized value, validator |
| Quality | Requiredness, completeness, validation status, duplicate status, mapping status, confidence, freshness, last reconciliation |
| Rights and protection | Information class, personal-data flag, consent/FPIC, rights/license, embargo, sensitive groups or locations, redaction |
| Distribution policy | Access rule, publication status, AI eligibility, API exposure, export rule, correction and withdrawal state |
| Retention | Retention class, disposition date, legal hold, deletion or preservation event |
| Language | Source language, content language, translation relationship, glossary version, translator, review status |
| Accessibility and media | Media type, dimensions/duration, alt text, caption, transcript, derivative, attribution, rights |
| Search and AI | Index eligibility, approved corpus, chunk lineage, embedding/index version, citation locator, safety exclusions |

### 9.3 Entity-specific extensions

- **Country programme and call:** priorities, selection rationale, target
  geographies, governing CPS and version, rules and criteria version, opening
  and closing dates, language versions, review configuration, outreach, and
  launch clearance.
- **Organization and person:** legal identity, constituency, contacts,
  verification, membership, role, delegation, conflict of interest, consent,
  support need, and active dates. Personal data belongs in a protected domain.
- **Application and proposal:** opportunity and call version, applicant,
  narrative, structured results, workplan, budget, cofinancing, safeguards,
  inclusion, attachments, validations, submission snapshots, and change
  history.
- **Review and decision:** assignment, rubric and version, declarations,
  comments, evidence, score where policy permits, deliberation, conditions,
  decision, rationale, notification, and appeal or revision path.
- **Grant and finance:** agreement, approved value, currency, dates, tranche
  schedule, disbursement, financial evidence, commitments, actuals, assets, and
  closure.
- **Monitoring and reporting:** reporting period, progress, expenditure,
  indicator observations, evidence, field visit, feedback, risk, grievance,
  corrective action, review, acceptance, and revision.
- **Knowledge and media:** source records, editorial state, abstract, audience,
  format, contributors, location, theme, language, rights, consent, review,
  publication, correction, withdrawal, and reuse relationship.
- **Event:** organizer, date/time/time zone, recurrence, format, venue or
  connection, language, accessibility, registration destination, status,
  capacity, materials, and recording.
- **AI evidence:** session, purpose, corpus, query, retrieved source/version and
  span, score, policy decision, model and prompt version, answer, citations,
  refusal, user feedback, review, retention, and cost.

### 9.4 Controlled vocabularies

At minimum, governance is required for countries and aliases, programme
regions, agencies, GEF and operational phases, focal areas, the eight current
grant themes, grant modalities, lifecycle phases, document families, statuses,
organization and partner types, event types, languages, access classes,
publication states, AI eligibility, rights, consent, indicator definitions,
currencies, and quality states.

The current eight opportunity themes are Biodiversity, Climate Change, Land
Degradation, Multifocal Area, Capacity Development, International Waters,
Chemicals and Waste, and Climate Change Adaptation. They should map to, rather
than replace, approved programme taxonomies.

## 10. Technical architecture

### 10.1 Implemented demonstrator

```text
GitHub Pages
  └─ immutable Vite build
      └─ browser
          ├─ React 18 + TypeScript UI and client router
          ├─ committed generated JSON and GeoJSON
          ├─ committed optimized media and brand assets
          ├─ browser-local preview state
          └─ HTTPS NDJSON stream to external SGP AI service
```

There is no application server or protected database in this repository. The
AI service is the only live external application service. Failure of that
service should not prevent access to the static portfolio, grants, stories, or
library. Production source maps are disabled unless explicitly enabled.

The build uses `BASE_PATH=/sgp-platform/`; `404.html` mirrors `index.html` for
SPA deep links. Runtime data is packaged into the repository and never fetched
from a sibling developer checkout. Role, saved, locale, assistant, and
community preview state use browser storage and have no security authority.

### 10.2 Target logical architecture

```text
Public web ─┐
Workspace ──┼─ Edge / CDN / WAF ─ API gateway ─ Identity and policy
Admin web ──┘                              │
                                          ├─ Public content and publication
                                          ├─ Opportunity and handoff
                                          ├─ Portfolio and results
                                          ├─ Knowledge, search, and taxonomy
                                          ├─ Organization and membership
                                          ├─ Application and workflow
                                          ├─ Grant, monitoring, and reporting
                                          ├─ Document and media
                                          ├─ Notification and support
                                          ├─ Administration and audit
                                          ├─ AI orchestration and evaluation
                                          └─ Integration and export
                                                  │
                    ┌─────────────────────────────┼─────────────────────────┐
                    │                             │                         │
             Transactional data          Object/evidence store      Search/vector indexes
                    │                             │                         │
                    └──── events, workers, pipelines, quality, lineage ────┘
                                                  │
                                   UNDP and participating-agency systems
```

Services may begin as a well-structured modular application and be separated
only where security, independent scaling, ownership, availability, or
integration needs justify it. The architecture should avoid both a browser-only
production design and premature service fragmentation.

### 10.3 Trust zones

1. **Public publication zone:** anonymous, cleared content and data derivatives;
   no confidential records or secrets.
2. **Protected programme zone:** authenticated organization, application,
   review, grant, monitoring, reporting, and support records.
3. **Privileged administration zone:** configuration, publication, access,
   taxonomy, integrations, and programme oversight.
4. **Technical operations zone:** separated frontend and backend duties,
   purpose-bound diagnostic access, and minimized telemetry.
5. **Integration zone:** managed adapters, queues, schemas, reconciliation, and
   source-specific credentials.
6. **AI processing zone:** policy-aware retrieval and generation isolated by
   corpus and access class.
7. **Analytics and release zone:** de-identified or approved data products,
   versioned reporting snapshots, and controlled exports.

No protected object should become public merely because a derivative is
searchable or indexed. Public and protected search/AI indexes should be
separate where practical and always policy-filtered.

### 10.4 Ingestion and information zones

```text
Source snapshot
  → immutable raw landing
  → malware / format / schema quarantine
  → parsed and normalized derivative
  → entity resolution and reconciliation
  → canonical governed record
  → access-specific index or analytical product
  → publication candidate
  → approved public release
```

Every transition needs run ID, timestamp, source, schema version, validation,
lineage, exception, reviewer where applicable, and rollback or replay
capability. Corrections must preserve prior evidence and propagate to every
downstream product.

### 10.5 Identity and security

The target should support OIDC/OAuth-based identity, MFA, invited external
users, federation where feasible, lifecycle automation, session revocation,
least privilege, and time-limited reviewer or evaluator access. An Entra-based
identity model is a plausible reference for UNDP alignment, but the procurement
specification should describe protocols and controls before products.

Required controls include:

- authorization at every protected service and object boundary;
- tenant, agency, organization, country, assignment, and record scope;
- encryption in transit and at rest, managed keys and secrets, credential
  rotation, and non-production isolation;
- secure uploads, malware scanning, content-type verification, and controlled
  rendering;
- audit for authentication, access, export, workflow, decision, publication,
  configuration, AI, and privileged operations;
- data minimization in logs, analytics, errors, and frontend telemetry;
- retention, legal hold, deletion, correction, export, and incident workflows;
- dependency, build, artifact, and software-supply-chain controls;
- denial by default when identity, policy, or classification services fail; and
- tested backup, restore, continuity, rollback, and incident response.

### 10.6 Illustrative Azure mapping

The future concept may retain a solution-neutral target architecture with an
illustrative Azure deployment:

| Architecture concern | Illustrative Azure option |
| --- | --- |
| Edge, CDN, WAF | Azure Front Door or equivalent |
| Public static web | Static Web Apps or Storage static site behind the edge |
| API gateway | API Management |
| Workforce and external identity | Microsoft Entra ID and an approved external-identity pattern |
| Application and worker runtime | App Service, Container Apps, Functions, or approved managed runtime |
| Transactional data | Managed relational database; other stores only for justified access patterns |
| Documents and media | Blob Storage with private containers, scanning, lifecycle, and immutable options |
| Search and retrieval | Azure AI Search or equivalent managed search/vector service |
| Events and queues | Service Bus and Event Grid or equivalents |
| Secrets and keys | Key Vault |
| Monitoring and security evidence | Azure Monitor, Application Insights, and approved security services |
| AI model access | Approved model gateway/service with policy, evaluation, logging, and regional controls |

Product selection remains subject to enterprise architecture, data residency,
security, procurement, cost, portability, and operating-capability review.

## 11. Agency and system-of-record strategy

- The KLP is the shared discovery, portfolio, knowledge, publication, search,
  and governed AI layer.
- In-scope UNDP operational processes may migrate to KLP-managed services after
  workflow, data, security, legal, and operating validation.
- FAO, CI, and any other agency retain authoritative operational systems unless
  an explicit governance decision changes ownership.
- The KLP should publish approved opportunity metadata and a canonical KLP
  opportunity page, then continue through a native UNDP workflow or labelled
  agency handoff.
- Integration should exchange the minimum approved identifiers, statuses,
  public metadata, reporting facts, and links. It should not create an
  ungoverned shadow application or grant record.
- Every exchanged record needs agency, source system, source ID, KLP global ID,
  schema and contract version, synchronization state, source timestamp,
  reconciliation status, canonical URL, and correction or withdrawal behavior.
- Cross-agency analytics require agreed definitions, controlled vocabularies,
  coverage statements, and a named steward; visual consistency alone does not
  establish comparability.
- Where no API is available, a governed batch process should still follow the
  same schema, provenance, security, quality, and replay requirements.

## 12. Interfaces and interoperability

The repository contains an indicative, non-authoritative OpenAPI description
covering session context, assistant query, resource search, planned document
search, dataset catalogue, and dataset records.

The target contract should standardize:

- stable, opaque identifiers and canonical URIs;
- OAuth scopes and signed user or service context;
- agency, organization, country, purpose, role, and assignment claims;
- consistent pagination, sorting, filtering, field selection, and language;
- schema and vocabulary versions;
- record version, ETag or optimistic concurrency;
- provenance, coverage, freshness, and quality;
- access and publication classification;
- idempotency for writes and replay-safe integration;
- correction, tombstone, withdrawal, and revocation events;
- rate limit, error, retry, and correlation semantics;
- webhooks or events for approved state changes; and
- audit evidence without response-body leakage.

Bulk analytical exports should be asynchronous, policy checked, versioned, and
time limited. Public APIs should expose only approved publication derivatives.

## 13. Localization, accessibility, and performance

### 13.1 Localization

- Maintain English, Portuguese, French, Spanish, Russian, Chinese, and Arabic
  interface coverage as the initial product baseline.
- Keep language in the URL and preserve route, query, and hash during switching.
- Govern official names and acronyms through the approved SGP glossary.
- Store source language, translation relationship, translation method,
  translator or model, reviewer, glossary version, and approval status.
- Do not assume a translated interface means a translated record corpus.
- Test long labels, CJK line breaking, Arabic text direction, mixed-script
  identifiers, numerals, dates, currencies, maps, charts, and generated files.

### 13.2 Accessibility

WCAG 2.2 AA should be the procurement baseline. Include keyboard access, visible
focus, semantic regions and headings, input names and errors, screen-reader
status, reduced motion, contrast, text resizing, reflow, map and chart
alternatives, data tables, captions, transcripts, alt text, accessible
authentication, and accessible documents. Test with automated tools and
representative assistive technology and users.

### 13.3 Performance and resilience

The demonstrator already uses local optimized images, responsive image
variants, intrinsic sizing, lazy loading, static data, error boundaries,
coordinated map animation, and stable scrollbar allocation. The target should
add:

- performance budgets by channel, device, region, and connection class;
- Core Web Vitals and task-success monitoring using privacy-safe telemetry;
- pagination, virtualization, caching, compressed transfer, and incremental
  loading for large result sets;
- generalized map and chart performance that does not depend on a desktop GPU;
- graceful degradation when AI, maps, an agency service, or a data refresh is
  unavailable;
- draft durability and safe retry for interrupted protected workflows;
- service-level indicators for availability, latency, error, queue age, data
  freshness, search freshness, AI time-to-first-token, and integration lag; and
- explicitly agreed availability, RTO, RPO, retention, and support targets
  before procurement.

Candidate public acceptance thresholds should align with current Core Web
Vitals guidance, including p75 LCP at or below 2.5 seconds, INP at or below 200
milliseconds, and CLS at or below 0.1 on supported devices. Final targets must
be tested from representative SGP countries and low-bandwidth conditions.

## 14. Quality, testing, and acceptance

### 14.1 Demonstrator verification

The maintained repository verifies source linting, translation coverage,
documentation, TypeScript, unit and contract tests, generated data, production
build output, deep-link fallback, base-path safety, and selected Playwright
journeys. Current test evidence includes contracts, grant-map behavior,
story-image caching, responsive/accessibility journeys, and principal role
flows.

### 14.2 Target acceptance areas

| Area | Minimum acceptance evidence |
| --- | --- |
| Product | Traceable requirements, role journeys, usability testing, content approval |
| Accessibility | WCAG 2.2 AA audit, assistive-technology tests, accessible document checks |
| Localization | Seven-locale interface audit, glossary checks, layout and routing tests |
| Data | Reconciliation, lineage, missingness, duplicates, freshness, coverage, rollback |
| Metadata | Core envelope coverage, vocabulary governance, entity relationship integrity |
| Security | Threat model, code and dependency review, penetration test, access tests, secrets audit |
| Privacy and rights | Classification, consent, retention, deletion, export, publication and withdrawal tests |
| Workflow | State, authorization, versioning, assignment, decision, audit, recovery, concurrency tests |
| Integration | Contract, schema, identity, retry, idempotency, lag, correction and failure-mode tests |
| Search | Relevance set, filters, multilingual and access-trimming tests |
| AI | Groundedness, citation, authorization, refusal, injection, privacy, multilingual and cost evaluation |
| Performance | Representative country/device/network tests and agreed budget |
| Resilience | Backup/restore, service degradation, queue replay, rollback, RTO/RPO exercises |
| Operations | Dashboards, alerts, runbooks, ownership, support, incident and change procedures |
| Handover | Source, infrastructure, schemas, data dictionary, training, licenses, decisions, backlog |

## 15. Delivery and procurement strategy

The future platform should be procured and delivered in governed increments:

1. **Discovery and decisions:** validate user research, source systems, agency
   ownership, workflows, policy, terminology, non-functional requirements, and
   target operating model.
2. **Platform foundation:** identity, policy, public/protected zones, delivery
   pipeline, observability, document foundation, metadata registry, and
   integration standards.
3. **Public knowledge and portfolio:** governed ingestion, canonical portfolio,
   publication, search, library, stories, events, opportunities, datasets, and
   public AI.
4. **UNDP operational migration:** organization, applications, review,
   safeguards, decisions, agreements, grants, monitoring, reports, support, and
   controlled AI assistance.
5. **Cross-agency interoperability:** approved opportunity, portfolio,
   reporting, knowledge, and identity handoffs with FAO, CI, and future partners.
6. **Optimization and scale:** multilingual quality, low-bandwidth and assisted
   channels, analytics, evaluation, performance, automation, and continuous
   improvement.

Each increment should deliver working software, migrated or integrated data,
security and privacy evidence, tests, documentation, training, operational
ownership, and a reversible release. A single late “data migration” or
“security review” phase is not sufficient.

The concept's broad implementation envelope should remain explicitly
indicative until requirements, source-system assessments, licensing, data
quality, migration volume, integrations, security tier, service levels,
support model, and cloud costs are validated. Procurement should compare total
cost of ownership, not only build cost.

## 16. Documentation governance and evidence sources

This reference should be updated when the sitemap, material feature behavior,
role model, data contracts, authoritative-source boundary, target architecture,
or operating assumptions change. Changes should cite approved decisions or
executable repository evidence and retain the distinction between demonstrator
and target platform.

Primary repository evidence:

- `src/sitemap.json`
- `src/auth/roles.ts`
- `src/routing/access.ts`
- `src/workspace/workspaceConfig.ts`
- `src/admin/adminConfig.ts`
- `src/lib/data/schema.ts`
- `src/data/open-grants.ts`
- `src/services/content.ts`
- `src/services/ai.ts`
- `src/workspace/communityWorkspaceData.ts`
- `src/workspace/CommunityWorkspaceStore.tsx`
- `public/generated/provenance.json`
- `public/generated/portfolio/data/data-dictionary.json`
- `public/api/openapi-indicative.yaml`

Focused operational references:

- [Architecture](ARCHITECTURE.md)
- [Deployment](DEPLOYMENT.md)
- [Configuration](CONFIGURATION.md)
- [Routing and localization](ROUTING_AND_LOCALIZATION.md)
- [Data and content](DATA_AND_CONTENT.md)
- [Access and roles](ACCESS_AND_ROLES.md)
- [Operations](OPERATIONS.md)
