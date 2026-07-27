import {
  ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, ChevronDown, Database, Download, ExternalLink, FileText,
  Handshake, Images, LayoutDashboard, Library, Map as MapIcon, Newspaper, Play, Quote, Search, ShieldCheck, Sparkles, Users, Video
} from "lucide-react";
import { lazy, Suspense, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { isPrivilegedRole, ROLE_LABELS, type Role } from "./auth/roles";
import { adminConfigForRole, adminSectionHref, resolveAdminRoute } from "./admin/adminConfig";
import seedJson from "./seed-content.json";
import sitemap from "./runtime-sitemap.json";
import { AppLink } from "./components/AppLink";
import { AssistantConversation } from "./components/Assistant";
import { OptimizedImage } from "./components/OptimizedImage";
import { DemoBadge, Empty, Loading, PageHero } from "./components/PagePrimitives";
import { useAssistant } from "./contexts/AssistantContext";
import { useArchive, useEditorial, useProjects } from "./hooks/useContent";
import { useI18n } from "./i18n";
import { normalizedSearch, type ArchiveItem, type EditorialPhoto, type EditorialStory } from "./services/content";
import { readSessionJson, writeSessionJson } from "./lib/browser/storage";
import { replaceUrlSilently } from "./lib/browser/navigation";
import { roleAreaPresentation } from "./workspace/roleAreaPresentation";
import { workspaceConfigForRole, type WorkspaceConfig } from "./workspace/workspaceConfig";

const PortfolioDashboard = lazy(() => import("./PortfolioDashboard").then((module) => ({ default: module.App })));
const OpenGrantsExplorer = lazy(() => import("./components/OpenGrantsExplorer").then((module) => ({ default: module.OpenGrantsExplorer })));

type Opportunity = { id: string; slug: string; title: string; summary: string; managingAgency: string; agencyLabel: string; countries: string[]; regions: string[]; themes: string[]; eligibilitySummary: string; resourceIds: string[]; operationalDestination: string; externalUrl?: string; prototype: boolean };
type Resource = { id: string; title: string; summary: string; resourceType: string; sourceLabel: string; language: string; year: number; themes: string[]; lifecycleStages: string[]; rightsLabel: string; prototype: boolean };
type Story = { id: string; kind: string; title: string; excerpt: string; countryCode: string; themes: string[]; canonicalUrl: string; sourceLabel: string; prototype: boolean };
type EventRecord = { id: string; title: string; summary: string; startsAt: string; endsAt: string; format: string; language: string; regions: string[]; themes: string[]; prototype: boolean };
type SeedProject = { id: string; title: string; managingAgency: string; countryCode: string; countryName: string; themes: string[]; summary: string; qualitativeResults: string[]; coverageLabel: string; relatedResourceIds: string[]; relatedStoryIds: string[]; prototype: boolean };
type Seed = { prototypeNotice: string; opportunities: Opportunity[]; resources: Resource[]; stories: Story[]; events: EventRecord[]; projects: SeedProject[]; workspace: { priorityItems: Array<{ id: string; label: string; type: string; path: string; status: string }>; notifications: Array<{ id: string; title: string; body: string; read: boolean }> } };
const seed = seedJson as Seed;

function navigationHrefIsActive(href: string, path: string) {
  if (href === path) return true;
  return href.startsWith("/workspace/") && path.startsWith(`${href}/`);
}

function WorkspaceDirectory({ workspace }: { workspace: WorkspaceConfig }) {
  const groupLabels = { work: "Work", access: "Administration", account: "Account" };
  const destinations = workspace.nav.filter((item) => item.href !== workspace.homeHref);
  return <div className="workspace-directory-grid">
    {destinations.map((item) => <AppLink href={item.href} key={item.id}>
      <span className="badge">{groupLabels[item.group]}</span>
      <h3>{item.label}</h3>
      <p>{item.description}</p>
      <strong>Open page <ArrowRight /></strong>
    </AppLink>)}
  </div>;
}

export function HomePage({ role, savedCount }: { role: Role; savedCount: number }) {
  const signedIn = role !== "public";
  const workspace = signedIn ? workspaceConfigForRole(role) : null;
  const roleArea = signedIn ? roleAreaPresentation(role) : null;
  const roleAreaStyle = roleArea ? { "--role-accent": roleArea.accent } as CSSProperties : undefined;
  return <>
    <section className="home-hero">
      <div className="home-hero-media" aria-hidden="true" />
      <div className="home-hero-content">
        <h1>Knowledge and Learning Platform</h1>
        <p>Find funding, explore community-led impact, learn from programme evidence and reach the right agency context.</p>
        <div className="hero-actions"><AppLink href="/funding" className="button button--primary">Find opportunities <ArrowRight size={17} /></AppLink><AppLink href="/portfolio" className="button button--light">Explore the portfolio</AppLink></div>
        <div className="home-hero-signals" aria-label="Platform coverage">
          <span><strong>30,753</strong><small>Project records</small></span>
          <span><strong>136</strong><small>Programme countries</small></span>
          <span><strong>30+</strong><small>Years of impact</small></span>
        </div>
      </div>
      <a className="hero-next" href="#journeys">
        <span className="hero-next-copy"><small>Explore the platform</small></span>
        <span className="hero-next-icon" aria-hidden="true"><ChevronDown size={18} /></span>
      </a>
    </section>
    {workspace && roleArea && <section className={`user-dashboard-band role-area role-area--l${roleArea.level}`} style={roleAreaStyle} data-access-level={`L${roleArea.level}`} data-role={role}><div className="content-width"><header className="user-dashboard-head"><div><p className="eyebrow">{workspace.label}</p><h2>Welcome back</h2><p>{workspace.intro}</p></div><AppLink href={workspace.homeHref} className="button button--secondary">Open workspace <ArrowRight size={16} /></AppLink></header><div className="user-dashboard-grid"><section className="active-work"><div className="section-heading"><div><span>Current access</span><h3>{workspace.accessCards[0].title}</h3></div><strong>{workspace.accessCards[0].meta}</strong></div><AppLink className="active-work-row" href={workspace.priorities[0].href}><FileText /><span><strong>{workspace.priorities[0].title}</strong><small>{workspace.priorities[0].meta}</small></span><span className="badge badge--status">{workspace.priorities[0].status}</span><ArrowRight /></AppLink><div className="active-work-empty"><CheckCircle2 /><span><strong>{workspace.accessCards[1].title}</strong><small>{workspace.accessCards[1].body}</small></span></div></section><section className="priority-queue"><div className="section-heading"><div><span>Priority queue</span><h3>{workspace.priorities.length} items to review</h3></div></div>{workspace.priorities.map((item) => <AppLink href={item.href} key={`${role}-${item.title}`}><span><strong>{item.title}</strong><small>{item.meta} · {item.status}</small></span><ArrowRight /></AppLink>)}</section><aside className="workspace-glance"><h3>At a glance</h3><AppLink href={workspace.homeHref}><LayoutDashboard /><span><strong>{workspace.summary[0].value}</strong><small>{workspace.summary[0].label}</small></span></AppLink><AppLink href="/knowledge/saved"><BookOpen /><span><strong>{savedCount}</strong><small>Saved knowledge items</small></span></AppLink></aside></div></div></section>}
    <section id="journeys" className="journey-grid content-width" aria-label="Platform journeys">
      {[
        ["Access funding", "Find calls, understand requirements and continue with the managing agency.", "/funding", <Handshake />],
        ["Explore impact", "Investigate grants through the live map, filters and project records.", "/portfolio", <MapIcon />],
        ["Learn from evidence", "Search resources and project knowledge or ask a cited question.", "/knowledge", <BookOpen />],
        ["Deliver and improve", "Reach saved work, support and future agency-authorized workflows.", workspace?.homeHref || "/help", <Users />]
      ].map(([title, body, href, icon]) => <AppLink href={String(href)} className="journey-link" key={String(title)}><span className="journey-icon">{icon}</span><h2>{title}</h2><p>{body}</p><ArrowRight /></AppLink>)}
    </section>
    <section className="evidence-band"><div className="content-width evidence-layout"><div><p className="eyebrow">Live portfolio atlas</p><h2>A global view of locally led impact</h2><p>The integrated dashboard uses 30,753 prepared project records and 56,808 cofinancing records from the SGP data pipeline. Source, transformation and geographic provenance remain inspectable.</p><AppLink href="/portfolio" className="text-link">Open the live atlas <ArrowRight size={16} /></AppLink></div><OptimizedImage src="/media/dashboard/preview.png" alt="Preview of the SGP portfolio atlas" sizes="(max-width: 800px) 100vw, 58vw" /></div></section>
    <section className="knowledge-band"><div className="content-width"><div><p className="eyebrow">Knowledge &amp; AI</p><h2>Leverage 30 years of knowledge from on the ground</h2></div><div className="knowledge-actions"><AppLink href="/knowledge/library"><Library /><strong>Browse the Innovation Library</strong><span>Resources, publications and practical evidence</span></AppLink><AppLink href="/knowledge/library?scope=projects"><Database /><strong>Search project knowledge</strong><span>Prepared records and extracted project documents</span></AppLink><AppLink href="/knowledge/studio"><Sparkles /><strong>Open Knowledge Studio</strong><span>Live cited retrieval across approved corpora</span></AppLink></div></div></section>
  </>;
}

export function FundingPage({ path }: { path: string }) {
  if (path !== "/funding") return <NotFoundPage />;
  return <div className="funding-route layout-direction-ltr" dir="ltr"><PageHero eyebrow="Access funding" title="Open grants" intro="Explore indicative opportunities by place and environmental theme, then inspect funding, eligibility and delivery details." actions={<AppLink href="/help/applicants" className="button button--light">Application guidance</AppLink>} compact className="funding-page-hero" /><Suspense fallback={<Loading label="Loading grant map" />}><OpenGrantsExplorer /></Suspense></div>;
}

export function PortfolioPage({ path }: { path: string }) {
  if (path !== "/portfolio") return <NotFoundPage />;
  return <div className="dashboard-route layout-direction-ltr" dir="ltr"><Suspense fallback={<Loading label="Loading the portfolio atlas" />}><PortfolioDashboard /></Suspense></div>;
}

export function KnowledgePage({ path, saved, toggleSaved }: { path: string; saved: string[]; toggleSaved: (id: string) => void }) {
  if (path === "/knowledge/studio") return <><PageHero eyebrow="Knowledge & AI" title="AI Knowledge Studio" intro="Ask cited questions across approved SGP knowledge and inspect the evidence returned by the live service." compact /><div className="studio-shell content-width"><AssistantConversation studio /></div></>;
  if (path.startsWith("/knowledge/resources/")) return <ResourceDetail id={decodeURIComponent(path.split("/knowledge/resources/")[1])} saved={saved} toggleSaved={toggleSaved} />;
  if (path === "/knowledge/saved") return <SavedKnowledge saved={saved} toggleSaved={toggleSaved} />;
  if (path === "/knowledge/library") return <KnowledgeLibrary saved={saved} toggleSaved={toggleSaved} />;
  return <><PageHero eyebrow="Learn from evidence" title="Knowledge & AI" intro="Browse programme knowledge, connect evidence to projects and ask questions with inspectable sources." /><div className="content-width knowledge-hub knowledge-hub--focused">
    <AppLink href="/knowledge/studio" className="knowledge-hub-primary"><div className="knowledge-hub-media"><OptimizedImage src="/media/grants/fiji.jpg" alt="Community learning in Fiji" sizes="(max-width: 800px) 100vw, 62vw" /><span><Sparkles aria-hidden="true" /></span></div><div className="knowledge-hub-copy"><p className="eyebrow">Start here</p><h2>AI Knowledge Studio</h2><p>Ask cited questions across approved Innovation Library and project evidence sources.</p><ArrowRight aria-hidden="true" /></div></AppLink>
    <AppLink href="/knowledge/library"><div className="knowledge-hub-media"><OptimizedImage src="/media/grants/kenya.jpg" alt="Community knowledge exchange in Kenya" sizes="(max-width: 800px) 100vw, 34vw" /><span><Library aria-hidden="true" /></span></div><div className="knowledge-hub-copy"><h2>Innovation Library</h2><p>Search publications, reports, stories, practical knowledge and project-oriented evidence.</p><ArrowRight aria-hidden="true" /></div></AppLink>
  </div></>;
}

function KnowledgeLibrary({ saved, toggleSaved }: { saved: string[]; toggleSaved: (id: string) => void }) {
  const { items, loading, error } = useArchive();
  const savedState = useMemo(() => readSessionJson("sgp-library-state", {}, (value) => (
    value && typeof value === "object" && !Array.isArray(value)
      ? value as { query?: string; kind?: string; scope?: string }
      : {}
  )), []);
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get("q") || savedState.query || "");
  const [kind, setKind] = useState(params.get("kind") || savedState.kind || "all");
  const [scope, setScope] = useState(params.get("scope") || savedState.scope || "all");
  const kinds = ["all", "document", "story", "video", "image", "link", "content"];
  useEffect(() => {
    writeSessionJson("sgp-library-state", { query, kind, scope });
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (kind !== "all") next.set("kind", kind);
    if (scope !== "all") next.set("scope", scope);
    replaceUrlSilently(`/knowledge/library${next.size ? `?${next}` : ""}`);
  }, [kind, query, scope]);
  const matches = useMemo(() => {
    const terms = normalizedSearch(query);
    return items.filter((item) => (kind === "all" || item.kind === kind) && (!terms || normalizedSearch(`${item.title} ${item.summary} ${item.contextTitle} ${item.section}`).includes(terms)) && (scope === "all" || /project|grant|proposal|report|monitor/i.test(`${item.title} ${item.contextTitle} ${item.path}`))).slice(0, 120);
  }, [items, kind, query, scope]);
  return <><PageHero eyebrow="Knowledge & AI" title="Innovation Library" intro="Search programme resources and project-oriented evidence while preserving source, rights and content distinctions." compact /><div className="content-width library-layout"><aside className="filter-panel"><h2>Refine</h2><label>Knowledge scope<select value={scope} onChange={(event) => setScope(event.target.value)}><option value="all">All programme knowledge</option><option value="projects">Project-oriented evidence</option></select></label><label>Record type<select value={kind} onChange={(event) => setKind(event.target.value)}>{kinds.map((value) => <option value={value} key={value}>{value}</option>)}</select></label><AppLink href="/knowledge/saved" className="library-saved-link">Saved knowledge <span>{saved.length}</span></AppLink><div className="source-note"><ShieldCheck /><p>Archive records retain their canonical SGP source. Presence here does not create publication clearance for operational documents.</p></div></aside><section className="library-results"><label className="search-field"><Search /><span className="sr-only">Search knowledge</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, text, place or theme" /></label>{loading ? <Loading label="Loading migrated knowledge index" /> : error ? <Empty title="Knowledge index unavailable" body={error} /> : <><p className="result-summary">{matches.length.toLocaleString()} shown from {items.length.toLocaleString()} migrated records</p><div className="resource-list">{matches.map((item) => <article key={item.id}><div><span className="badge">{item.kind}</span>{saved.includes(item.id) && <span className="badge badge--saved">Saved</span>}</div><h2><AppLink href={`/knowledge/resources/${encodeURIComponent(item.id)}`}>{item.title}</AppLink></h2><p>{item.summary || item.contextTitle || "Metadata record from the SGP website archive."}</p><footer><span>{item.source}</span><button type="button" onClick={() => toggleSaved(item.id)}>{saved.includes(item.id) ? "Remove saved item" : "Save item"}</button></footer></article>)}</div></>}</section></div></>;
}

function ResourceDetail({ id, saved, toggleSaved }: { id: string; saved: string[]; toggleSaved: (id: string) => void }) {
  const assistant = useAssistant();
  const seedResource = seed.resources.find((item) => item.id === id);
  const { items, loading } = useArchive();
  const archive = items.find((item) => item.id === id);
  if (!seedResource && loading) return <Loading label="Loading resource" />;
  if (!seedResource && !archive) return <NotFoundPage />;
  const title = seedResource?.title || archive!.title;
  const summary = seedResource?.summary || archive!.summary || archive!.contextTitle || "Migrated archive record.";
  const sourceUrl = archive?.sourceUrl;
  return <><div className="content-width detail-return"><AppLink href="/knowledge/library">← Return to Innovation Library</AppLink></div><PageHero eyebrow="Knowledge resource" title={title} intro={summary} compact /><div className="content-width detail-layout"><article className="record-detail"><div className="badge-row">{seedResource ? <DemoBadge /> : <span className="badge">Migrated archive</span>}<span className="badge">{seedResource?.resourceType || archive?.kind}</span></div><div className="resource-preview"><FileText /><div><span>Resource preview</span><strong>{title}</strong><p>{summary}</p></div></div><h2>About this resource</h2><p>{summary}</p><dl className="definition-grid">{seedResource && <><div><dt>Source</dt><dd>{seedResource.sourceLabel}</dd></div><div><dt>Language</dt><dd>{seedResource.language}</dd></div><div><dt>Year</dt><dd>{seedResource.year}</dd></div><div><dt>Rights</dt><dd>{seedResource.rightsLabel}</dd></div></>}{archive && <><div><dt>Source</dt><dd>{archive.source}</dd></div><div><dt>Record type</dt><dd>{archive.kind}</dd></div><div><dt>Section</dt><dd>{archive.section || "Not specified"}</dd></div><div><dt>Status</dt><dd>{archive.status || "Not specified"}</dd></div></>}</dl>{sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer" className="button button--primary">Open canonical source <ExternalLink size={16} /></a>}</article><aside className="detail-aside"><button className="button button--secondary" type="button" onClick={() => toggleSaved(id)}>{saved.includes(id) ? "Remove from saved" : "Save resource"}</button><AppLink href="/knowledge/studio" className="button button--ghost" onClick={() => assistant.setDraft(`What are the main lessons and evidence in \"${title}\"?`)}>Ask about this source</AppLink><div className="related-material"><strong>Continue exploring</strong><AppLink href="/knowledge/library">Related resources</AppLink><AppLink href="/stories">Stories and voices</AppLink></div></aside></div></>;
}

function SavedKnowledge({ saved, toggleSaved }: { saved: string[]; toggleSaved: (id: string) => void }) { const { items, loading } = useArchive(); const resources = [...seed.resources, ...items].filter((item) => saved.includes(item.id)); return <><PageHero eyebrow="Personal tools" title="Saved knowledge" intro="Resources saved from the library remain available in this browser." compact /><div className="content-width">{loading ? <Loading /> : !resources.length ? <Empty title="No saved knowledge yet" body="Save resources from the Innovation Library to build a working set." /> : resources.map((item) => <div className="list-row" key={item.id}><BookOpen /><span><strong>{item.title}</strong><small>{"summary" in item ? item.summary : "Saved knowledge record"}</small></span><button type="button" onClick={() => toggleSaved(item.id)}>Remove</button></div>)}</div></>; }

function TemplateList() {
  return <><PageHero eyebrow="Practical knowledge" title="Templates" intro="Reusable programme resources organized around application, delivery, reporting and learning workflows." compact /><div className="content-width record-list">{seed.resources.map((item) => <AppLink href={`/knowledge/resources/${item.id}`} className="resource-row" key={item.id}><FileText /><div><div className="badge-row"><DemoBadge /><span className="badge">{item.resourceType}</span></div><h2>{item.title}</h2><p>{item.summary}</p><span className="meta-line">{item.lifecycleStages.join(" · ")}</span></div><ArrowRight /></AppLink>)}</div></>;
}

function ArchiveImage({ src, alt, className, priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <OptimizedImage className={className} src={src} alt={alt} sizes="(max-width: 800px) 100vw, 50vw" intrinsicSize={false} priority={priority} onError={() => setFailed(true)} />;
}

function ArchivePhoto({ photo }: { photo: EditorialPhoto }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <a className="archive-photo" href={photo.canonicalUrl} target="_blank" rel="noreferrer">
    <OptimizedImage src={photo.imageUrl} alt={photo.alt || photo.title} sizes="(max-width: 640px) 50vw, 25vw" intrinsicSize={false} onError={() => setFailed(true)} />
    <span>{photo.title}</span>
  </a>;
}

function storyDate(value: string | null | undefined, locale: string) {
  if (!value) return "Archive story";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Archive story" : date.toLocaleDateString(locale, { month: "short", year: "numeric" });
}

function ArchiveStoryDetail({ story }: { story: EditorialStory }) {
  const { locale } = useI18n();
  return <>
    <div className="content-width detail-return detail-return--story"><AppLink href="/stories">← Return to Stories &amp; Voices</AppLink></div>
    <header className="archive-story-hero">
      {story.imageUrl && <ArchiveImage src={story.imageUrl} alt={story.imageAlt || story.title} priority />}
      <div className="content-width"><p className="eyebrow">From the SGP archive</p><h1>{story.title}</h1><p key={locale}>{storyDate(story.publishedAt, locale)}{story.author ? ` · ${story.author}` : ""}</p></div>
    </header>
    <article className="content-width archive-story-body">
      <p className="archive-story-deck">{story.summary}</p>
      {story.blocks?.length ? <div className="archive-story-prose">{story.blocks.map((block, index) => block.type === "heading"
        ? <h2 key={`${block.type}-${index}`}>{block.text}</h2>
        : block.type === "quote"
          ? <blockquote key={`${block.type}-${index}`}>{block.text}</blockquote>
          : block.type === "list_item"
            ? <p className="archive-story-list-item" key={`${block.type}-${index}`}>{block.text}</p>
            : <p key={`${block.type}-${index}`}>{block.text}</p>)}</div> : <p>{story.body}</p>}
      <a className="button button--primary" href={story.canonicalUrl} target="_blank" rel="noreferrer">Read the full story <ExternalLink size={16} /></a>
    </article>
  </>;
}

export function StoriesPage({ path }: { path: string }) {
  const { locale, t } = useI18n();
  const { editorial, loading, error } = useEditorial();
  const initial = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(initial.get("q") || "");
  const [themeFilter, setThemeFilter] = useState(initial.get("theme") || "all");
  const [placeFilter, setPlaceFilter] = useState(initial.get("place") || "all");
  const [formatFilter, setFormatFilter] = useState(initial.get("format") || "all");
  const [limits, setLimits] = useState({ stories: 8, voices: 8, photos: 10, publications: 8 });
  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (themeFilter !== "all") next.set("theme", themeFilter);
    if (placeFilter !== "all") next.set("place", placeFilter);
    if (formatFilter !== "all") next.set("format", formatFilter);
    replaceUrlSilently(`/stories${next.size ? `?${next}` : ""}${window.location.hash}`);
  }, [formatFilter, placeFilter, query, themeFilter]);
  const storyId = path.startsWith("/stories/") ? path.split("/").at(-1) : null;
  const archiveStory = storyId ? editorial?.stories.find((item) => item.id === storyId) : null;
  const archiveVoice = storyId ? editorial?.videos.find((item) => item.id === storyId || item.videoId === storyId) : null;
  const demoStory = storyId ? seed.stories.find((item) => item.id === storyId) : null;
  if (archiveStory) return <ArchiveStoryDetail story={archiveStory} />;
  if (storyId && loading) return <Loading label="Loading archive story" />;
  if (archiveVoice) return <><div className="content-width detail-return"><AppLink href="/stories#sgp-voices">← Return to Stories &amp; Voices</AppLink></div><PageHero eyebrow={archiveVoice.isVoice ? "SGP Voice" : "Programme film"} title={archiveVoice.title} intro={archiveVoice.context || "Watch this perspective from the SGP archive."} compact /><div className="content-width voice-detail"><OptimizedImage src={archiveVoice.thumbnailUrl} alt="" sizes="(max-width: 800px) 100vw, 55vw" priority /><div><span className="badge">Video</span><h2>Watch and listen</h2><p>{archiveVoice.context || "This archive record links to the canonical SGP video source."}</p><a className="button button--primary" href={archiveVoice.canonicalUrl} target="_blank" rel="noreferrer">Watch the full video <ExternalLink size={16} /></a></div></div></>;
  if (demoStory) return <><div className="content-width detail-return"><AppLink href="/stories">← Return to Stories &amp; Voices</AppLink></div><PageHero eyebrow="Stories & voices" title={demoStory.title} intro={demoStory.excerpt} compact /><div className="content-width reading-layout"><DemoBadge /><dl className="definition-grid"><div><dt>Place</dt><dd>{demoStory.countryCode}</dd></div><div><dt>Themes</dt><dd>{demoStory.themes.map(t).join(", ")}</dd></div></dl><a className="button button--primary" href={demoStory.canonicalUrl} target="_blank" rel="noreferrer">Open canonical story <ExternalLink size={16} /></a></div></>;
  if (storyId && editorial) return <NotFoundPage />;

  const title = "Stories & Voices";
  if (loading) return <><PageHero eyebrow="Programme narratives" title={title} intro="Community perspectives, films, photography and publications from the SGP archive." compact /><Loading label="Loading the editorial archive" /></>;
  if (error || !editorial) return <><PageHero eyebrow="Programme narratives" title={title} intro="Community perspectives, films, photography and publications from the SGP archive." compact /><Empty title="Editorial archive unavailable" body={error || "The archive index could not be loaded."} /></>;

  const term = normalizedSearch(query);
  const thematicTerm = themeFilter === "all" ? "" : normalizedSearch(themeFilter);
  const placeTerm = placeFilter === "all" ? "" : normalizedSearch(placeFilter);
  const matches = (value: unknown) => { const normalized = normalizedSearch(value); return (!term || normalized.includes(term)) && (!thematicTerm || normalized.includes(thematicTerm)) && (!placeTerm || normalized.includes(placeTerm)); };
  const stories = editorial.stories.filter((item) => matches(`${item.title} ${item.summary} ${item.author || ""}`));
  const featured = stories.find((item) => item.imageUrl) || stories[0];
  const storyGrid = stories.filter((item) => item !== featured);
  const voices = editorial.videos.filter((item) => item.isVoice && matches(`${item.title} ${item.context || ""}`));
  const films = editorial.videos.filter((item) => !item.isVoice && matches(`${item.title} ${item.context || ""}`)).slice(0, 4);
  const photos = editorial.photos.filter((item) => matches(item.title));
  const publications = editorial.publications.filter((item) => matches(`${item.title} ${item.countries.join(" ")} ${item.focalAreas.join(" ")} ${item.types.join(" ")}`));
  const themeOptions = [...new Set([...editorial.publications.flatMap((item) => item.focalAreas), ...seed.stories.flatMap((item) => item.themes)])].filter(Boolean).sort();
  const placeOptions = [...new Set([...editorial.publications.flatMap((item) => item.countries), ...seed.stories.map((item) => item.countryCode)])].filter(Boolean).sort();
  const more = (key: keyof typeof limits) => setLimits((current) => ({ ...current, [key]: current[key] + (key === "photos" ? 10 : 8) }));
  const scrollToSection = (event: ReactMouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    const target = document.getElementById(sectionId);
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    replaceUrlSilently(`/stories${window.location.search}#${sectionId}`);
  };

  return <>
    <PageHero eyebrow="Programme narratives" title={title} intro="Explore community stories, first-person video, field photography and publications preserved from the SGP archive." compact />
    <div className="story-explorer-bar"><div className="content-width">
      <nav aria-label="Stories and voices formats"><a href="#community-stories" onClick={(event) => scrollToSection(event, "community-stories")}><Newspaper />Stories <span>{editorial.counts.stories}</span></a><a href="#sgp-voices" onClick={(event) => scrollToSection(event, "sgp-voices")}><Video />Voices <span>{editorial.counts.voices}</span></a><a href="#photo-stories" onClick={(event) => scrollToSection(event, "photo-stories")}><Images />Photos <span>{editorial.counts.photos}</span></a><a href="#field-publications" onClick={(event) => scrollToSection(event, "field-publications")}><BookOpen />Publications <span>{editorial.counts.publications}</span></a></nav>
      <label className="story-search"><Search /><span className="sr-only">Search stories, voices and publications</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the editorial archive" /></label>
      <div className="story-filter-row"><label><span>Format</span><select value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)}><option value="all">All formats</option><option value="stories">Stories</option><option value="voices">Voices and films</option><option value="photos">Photos</option><option value="publications">Publications</option></select></label><label><span>Theme</span><select value={themeFilter} onChange={(event) => setThemeFilter(event.target.value)}><option value="all">All themes</option>{themeOptions.map((item) => <option value={item} key={item}>{t(item)}</option>)}</select></label><label><span>Place</span><select value={placeFilter} onChange={(event) => setPlaceFilter(event.target.value)}><option value="all">All places</option>{placeOptions.map((item) => <option value={item} key={item}>{item}</option>)}</select></label></div>
    </div></div>

    {(formatFilter === "all" || formatFilter === "stories") && featured && <section className="story-feature-band" id="community-stories"><div className="content-width">
      <div className="story-feature-media">{featured.imageUrl && <ArchiveImage src={featured.imageUrl} alt={featured.imageAlt || featured.title} priority />}</div>
      <article><p className="eyebrow">Featured community story</p><h2>{featured.title}</h2><p>{featured.summary}</p><div className="story-meta"><span key={locale}>{storyDate(featured.publishedAt, locale)}</span>{featured.author && <span>{featured.author}</span>}</div><AppLink className="button button--primary" href={`/stories/${featured.id}`}>Read the story <ArrowRight size={16} /></AppLink></article>
    </div></section>}

    {(formatFilter === "all" || formatFilter === "stories") && <section className="story-grid-section"><div className="content-width"><header className="editorial-section-head"><div><p className="eyebrow">Local action, told in context</p><h2>Community stories</h2></div><span>{stories.length.toLocaleString()} matching stories</span></header>
      <div className="archive-story-grid">{storyGrid.slice(0, limits.stories).map((item, index) => <AppLink href={`/stories/${item.id}`} className={`archive-story-card archive-story-card--${index % 3}`} key={item.id}>{item.imageUrl && <ArchiveImage src={item.imageUrl} alt={item.imageAlt || item.title} />}<div><span key={locale}>{storyDate(item.publishedAt, locale)}</span><h3>{item.title}</h3><p>{item.summary}</p><strong>Read story <ArrowRight size={14} /></strong></div></AppLink>)}</div>
      {storyGrid.length > limits.stories && <button className="archive-more" type="button" onClick={() => more("stories")}>Show more stories <span>{Math.min(storyGrid.length - limits.stories, 8)}</span></button>}
    </div></section>}

    {(formatFilter === "all" || formatFilter === "voices") && <section className="voices-band" id="sgp-voices"><div className="content-width"><header className="editorial-section-head editorial-section-head--light"><div><p className="eyebrow">Watch and listen</p><h2>SGP Voices</h2><p>First-person perspectives and films from communities across the programme.</p></div><Quote /></header>
      <div className="voice-grid">{voices.slice(0, limits.voices).map((item) => <AppLink href={`/stories/${item.id}`} key={item.id}><div className="voice-thumbnail"><ArchiveImage src={item.thumbnailUrl} alt="" /><span><Play fill="currentColor" /></span></div><div><small>SGP Voice</small><h3>{item.title}</h3>{item.context && <p>{item.context}</p>}</div></AppLink>)}</div>
      {voices.length > limits.voices && <button className="archive-more archive-more--light" type="button" onClick={() => more("voices")}>Show more voices <span>{Math.min(voices.length - limits.voices, 8)}</span></button>}
      {!!films.length && <div className="archive-film-strip"><strong>More films</strong>{films.map((item) => <a href={item.canonicalUrl} target="_blank" rel="noreferrer" key={item.id}><Play size={14} />{item.title}</a>)}</div>}
    </div></section>}

    {(formatFilter === "all" || formatFilter === "photos") && <section className="photo-stories-section" id="photo-stories"><div className="content-width"><header className="editorial-section-head"><div><p className="eyebrow">Field photography</p><h2>Photo stories</h2></div><span>{photos.length.toLocaleString()} archive images</span></header>
      <div className="archive-photo-grid">{photos.slice(0, limits.photos).map((photo, index) => <ArchivePhoto photo={photo} key={`${photo.id || photo.imageUrl || "archive-photo"}-${index}`} />)}</div>
      {photos.length > limits.photos && <button className="archive-more" type="button" onClick={() => more("photos")}>Show more photography <span>{Math.min(photos.length - limits.photos, 10)}</span></button>}
    </div></section>}

    {(formatFilter === "all" || formatFilter === "publications") && <section className="publication-section" id="field-publications"><div className="content-width"><header className="editorial-section-head"><div><p className="eyebrow">Evidence to use</p><h2>Publications and field resources</h2></div><span>{publications.length.toLocaleString()} references</span></header>
      <div className="publication-shelf">{publications.slice(0, limits.publications).map((item, index) => <a href={item.canonicalUrl} target="_blank" rel="noreferrer" className={`publication-card publication-card--${index % 4}`} key={item.id}><div className="publication-cover"><BookOpen /><span>{t(item.types[0] || "SGP publication")}</span></div><div><small>{item.countries.slice(0, 2).join(" · ") || t(item.focalAreas[0] || "Global")}</small><h3>{item.title}</h3><p>{item.focalAreas.slice(0, 3).map(t).join(" · ")}</p><strong>Open resource <ExternalLink size={13} /></strong></div></a>)}</div>
      {publications.length > limits.publications && <button className="archive-more" type="button" onClick={() => more("publications")}>Show more publications <span>{Math.min(publications.length - limits.publications, 8)}</span></button>}
      <a className="publication-download-link" href="/knowledge/library"><Download size={17} />Search the complete Innovation Library</a>
    </div></section>}
  </>;
}

export function CommunityPage({ path }: { path: string }) {
  const { locale, t } = useI18n();
  const eventId = path.split("/community/events/")[1];
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [theme, setTheme] = useState("all");
  const [format, setFormat] = useState("all");
  if (eventId) { const event = seed.events.find((item) => item.id === eventId); if (!event) return <NotFoundPage />; return <><div className="content-width detail-return"><AppLink href="/community">← Return to events</AppLink></div><PageHero eyebrow="Community event" title={event.title} intro={event.summary} compact /><div className="content-width detail-layout"><article className="record-detail"><DemoBadge /><h2>Event purpose</h2><p>{event.summary}</p><dl className="definition-grid"><div><dt>Starts</dt><dd key={`starts-${locale}`}>{new Date(event.startsAt).toLocaleString(locale)}</dd></div><div><dt>Ends</dt><dd key={`ends-${locale}`}>{new Date(event.endsAt).toLocaleString(locale)}</dd></div><div><dt>Location</dt><dd>{event.regions.map(t).join(", ")}</dd></div><div><dt>Format</dt><dd>{t(event.format)}</dd></div><div><dt>Language</dt><dd>{event.language}</dd></div><div><dt>Themes</dt><dd>{event.themes.map(t).join(", ")}</dd></div></dl><div className="boundary-callout"><CalendarDays /><div><strong>Participation details</strong><p>Registration and attendance instructions will be supplied by the organizing programme. Confirm the official event notice before making arrangements.</p></div></div></article><aside className="detail-aside"><h2>Next action</h2><p>Review the programme context or ask SGP for related evidence before the session.</p><AppLink href="/knowledge/studio" className="button button--primary">Ask about this topic</AppLink><AppLink href="/stories" className="button button--ghost">Explore related impact</AppLink></aside></div></>; }
  const term = normalizedSearch(query);
  const matches = seed.events.filter((event) => (!term || normalizedSearch(`${event.title} ${event.summary} ${event.regions.join(" ")} ${event.themes.join(" ")}`).includes(term)) && (region === "all" || event.regions.includes(region)) && (theme === "all" || event.themes.includes(theme)) && (format === "all" || event.format === format));
  const regions = [...new Set(seed.events.flatMap((event) => event.regions))].sort();
  const themes = [...new Set(seed.events.flatMap((event) => event.themes))].sort();
  const formats = [...new Set(seed.events.map((event) => event.format))].sort();
  return <><PageHero eyebrow="Connect and learn" title="Events" intro="Find programme events and learning sessions by topic, place, format, or keyword." compact /><div className="content-width event-explorer"><section className="event-controls" aria-label="Event filters"><label className="search-field"><Search /><span className="sr-only">Search events</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events" /></label><label>Region<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="all">All regions</option>{regions.map((item) => <option value={item} key={item}>{t(item)}</option>)}</select></label><label>Theme<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="all">All themes</option>{themes.map((item) => <option value={item} key={item}>{t(item)}</option>)}</select></label><label>Format<select value={format} onChange={(event) => setFormat(event.target.value)}><option value="all">All formats</option>{formats.map((item) => <option value={item} key={item}>{t(item)}</option>)}</select></label></section><p className="result-summary">{matches.length} matching events</p><div className="event-list">{matches.map((event) => <AppLink href={`/community/events/${event.id}`} key={event.id}><time dateTime={event.startsAt} key={`${event.id}-${locale}`}><strong>{new Date(event.startsAt).toLocaleDateString(locale, { day: "2-digit" })}</strong><span>{new Date(event.startsAt).toLocaleDateString(locale, { month: "short" })}</span></time><div><div className="badge-row"><DemoBadge /><span className="badge">{t(event.format)}</span></div><h2>{event.title}</h2><p>{event.summary}</p><small>{event.regions.map(t).join(" · ")} · {event.themes.map(t).join(" · ")}</small></div><ArrowRight /></AppLink>)}</div></div></>;
}

export function HelpPage({ path }: { path: string }) {
  const route = sitemap.routes.find((item) => item.path === path);
  const [faqQuery, setFaqQuery] = useState("");
  const faqs = [
    ["Are the opportunities shown here open calls?", "No. The current catalogue is explicitly labelled demonstration content."],
    ["Does the KLP manage every agency’s grants?", "No. The shared layer supports discovery, portfolio, knowledge and AI; operational records remain with the managing agency unless explicitly agreed."],
    ["Can the assistant determine eligibility?", "No. It retrieves and summarizes approved evidence with citations."],
    ["Where do portfolio figures come from?", "They come from a validated dashboard snapshot produced by the SGP data pipeline, with provenance packaged into the MVP."],
    ["How are privacy and publication rights handled?", "Access, publication clearance and AI eligibility are separate decisions. Sensitive operational records are not exposed through public search."],
    ["Can I change the interface language?", "Yes. Use the language selector in the header to choose English, Portuguese, French, Spanish, Russian, Chinese or Arabic."]
  ];
  if (path === "/help/faq") { const visible = faqs.filter(([q, a]) => normalizedSearch(`${q} ${a}`).includes(normalizedSearch(faqQuery))); return <><PageHero eyebrow="Help" title="Frequently asked questions" intro="Search answers about access, grants, knowledge, AI, data and privacy." compact /><div className="content-width faq-page"><label className="search-field"><Search /><span className="sr-only">Search frequently asked questions</span><input value={faqQuery} onChange={(event) => setFaqQuery(event.target.value)} placeholder="Search questions" /></label><div className="faq-list">{visible.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></>; }
  if (path === "/help/applicants") return <><PageHero eyebrow="Help" title="Applicant Guidance" intro="Understand the shared funding journey, confirm eligibility and prepare the right material before continuing with the managing agency." compact /><div className="content-width process-list">{[["Find an open grant", "Use the grant map, themes and search to identify a relevant call."], ["Confirm eligibility", "Review geography, applicant type, priorities, funding range and the official call."], ["Prepare the application", "Use the required templates and gather governance, budget and safeguard information."], ["Continue with the agency", "Submit only through the system named by UNDP, FAO, CI or another managing agency."]].map(([title, body], index) => <div key={title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{body}</p></div>)}</div><div className="content-width help-actions"><AppLink href="/funding" className="button button--primary">View open grants</AppLink><AppLink href="/help/templates" className="button button--secondary">Open templates</AppLink></div></>;
  if (path === "/help/templates") return <TemplateList />;
  if (path === "/help/contact") return <ContactPage />;
  return <><PageHero eyebrow="Help and guidance" title={route?.title || "Help"} intro="Find concise guidance for common journeys and recover when the next step belongs to another agency or system." compact /><div className="content-width help-grid">{[
    ["Applicant guidance", "Find official opportunity guidance and the managing agency.", "/help/applicants"],
    ["Frequently asked questions", "Platform, data and AI answers.", "/help/faq"],
    ["Templates", "Reusable files for applications, delivery, reporting and learning.", "/help/templates"],
    ["Contact", "File a support, accessibility or language request.", "/help/contact"]
  ].map(([title, body, href]) => <AppLink href={href} key={href}><h2>{title}</h2><p>{body}</p><ArrowRight /></AppLink>)}</div></>;
}

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  return <><PageHero eyebrow="Help" title="Contact" intro="File a support request from any stakeholder group, including accessibility and language needs." compact /><div className="content-width form-layout">{submitted ? <div className="success-state"><CheckCircle2 /><h2>Support request recorded</h2><p>This first-pass interface has saved a demonstration request. Production submission will connect to the governed support service.</p><button type="button" className="button button--secondary" onClick={() => setSubmitted(false)}>Submit another request</button></div> : <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><label>Your name<input required /></label><label>Email address<input type="email" required /></label><label>Request type<select><option>General support</option><option>Grant or application</option><option>Portfolio data correction</option><option>Knowledge or rights</option><option>Accessibility</option><option>Language support</option><option>Technical issue</option></select></label><label>How can we help?<textarea required rows={6} /></label><button className="button button--primary" type="submit">Submit request</button></form>}</div></>;
}

export function WorkspacePage({ path, role, saved }: { path: string; role: Role; saved: string[] }) {
  const section = path.split("/")[2] || "overview";
  const assistant = useAssistant();
  const [profileSaved, setProfileSaved] = useState(false);
  const workspace = workspaceConfigForRole(role);
  const isDetail = path.split("/").length > 3;
  const routeTitle = sitemap.routes.find((item) => isDetail ? item.path.startsWith(`/workspace/${section}/:`) : item.path === path)?.title;
  const title = section === "overview" ? "Overview" : routeTitle || section.replace(/-/g, " ");
  const notifications = seed.workspace.notifications;
  const intro = `${workspace.intro} Operational records remain demonstration content until connected services are approved.`;
  const operational: Record<string, { intro: string; rows: Array<[string, string, string]> }> = {
    applications: { intro: "Track draft, submitted, update-requested and decision-stage applications.", rows: [["Community coastal resilience application", "Draft · Updated today", "Continue"], ["Landscape restoration concept", "Submitted · Under review", "View"]] },
    grants: { intro: "Track active awards, milestones, required documents and delivery status.", rows: [["Community biodiversity corridors", "Active · Next milestone 18 Sep", "Open"], ["Climate-resilient livelihoods", "Reporting due in 24 days", "Review"]] },
    reviews: { intro: "Work through assigned evidence checks, decision drafts and completed reviews.", rows: [["Eligibility and safeguards review", "Assigned · Due Friday", "Start"], ["Technical assessment", "Evidence received", "Continue"]] },
    visits: { intro: "Plan field visits, record observations and track follow-up actions.", rows: [["Coastal livelihoods field visit", "Planned · 12 Oct", "Prepare"], ["Biodiversity corridor follow-up", "3 actions open", "Review"]] },
    reports: { intro: "Prepare, submit and track programme reports and reviewer feedback.", rows: [["Annual progress report", "Draft · 62% complete", "Continue"], ["Financial delivery update", "Returned with comments", "Revise"]] }
  };
  let content: ReactNode;
  if (isDetail) content = <div className="workspace-detail"><span className="badge">Demonstration record</span><h2>{title}</h2><p>This detail state preserves the future workflow structure without creating an operational grant record.</p><div className="workspace-detail-steps"><span className="complete">Record created</span><span className="active">Current review</span><span>Decision or completion</span></div><AppLink href={`/workspace/${section}`} className="button button--secondary">Return to {section}</AppLink></div>;
  else if (operational[section]) content = <WorkspaceQueue section={section} title={title} {...operational[section]} />;
  else if (section === "support") content = <><div className="workspace-section-head"><h2>Guidance and support cases</h2><p>Reviewer guidance and signed-in support are kept together so issues can be followed through resolution.</p></div><div className="workspace-tool-grid"><article><ShieldCheck /><h3>Reviewer guidance</h3><p>Evidence checks, conflicts, decision notes and escalation pathways.</p><details><summary>Open guidance</summary><p>Confirm the evidence source, record conflicts, keep decision notes concise, and escalate rights or access concerns before approval.</p></details></article><article><CheckCircle2 /><h3>Open support case</h3><p>Portfolio correction request · Waiting for data steward</p><span className="badge">In progress</span></article><article><FileText /><h3>New support request</h3><p>Start a permissioned case linked to your account and role.</p><AppLink href="/help/contact">Create request</AppLink></article></div></>;
  else if (section === "notifications") content = <><div className="workspace-section-head"><h2>Notifications</h2><p>Action alerts, decisions, deadlines and platform updates.</p></div>{notifications.map((item) => <article className="notification-row" key={item.id}><Bell /><div><strong>{item.title}</strong><p>{item.body}</p></div></article>)}</>;
  else if (section === "saved") content = <><div className="workspace-section-head"><h2>Saved items</h2><p>Resources, templates, stories, grants and other platform items are collected here.</p></div><div className="workspace-summary"><div><span>Knowledge resources</span><strong>{saved.length}</strong></div><div><span>Open grants</span><strong>1</strong></div><div><span>Stories and templates</span><strong>2</strong></div></div><AppLink href="/knowledge/saved" className="button button--secondary">Open saved knowledge</AppLink></>;
  else if (section === "ai-chat-history") content = <><div className="workspace-section-head"><h2>AI Chat History</h2><p>Reopen previous questions with their citations and follow-up context.</p></div>{assistant.messages.length ? <div className="chat-history-list"><article><Sparkles /><div><strong>Current Ask SGP conversation</strong><p>{assistant.messages.filter((item) => item.role === "user").at(-1)?.content || "Cited SGP knowledge conversation"}</p><small>{assistant.messages.length} messages · saved in this browser</small></div><AppLink href="/knowledge/studio">Reopen</AppLink></article></div> : <Empty title="No saved conversations yet" body="Questions asked in AI Knowledge Studio will appear here." />}</>;
  else if (section === "profile") content = <><div className="workspace-section-head"><h2>Profile and preferences</h2><p>Manage identity, role, language, access and notification preferences.</p></div><div className="profile-settings"><label>Preview role<input value={ROLE_LABELS[role]} readOnly /></label><label>Interface language<select defaultValue="Browser selection"><option>Browser selection</option><option>English</option><option>Français</option><option>Español</option></select></label><label className="check-row"><input type="checkbox" defaultChecked />Email me about deadlines and decisions</label><label className="check-row"><input type="checkbox" defaultChecked />Show platform service updates</label><button className="button button--primary" type="button" onClick={() => setProfileSaved(true)}>Save preferences</button>{profileSaved && <span className="profile-save-status" role="status"><CheckCircle2 /> Preferences saved for this preview</span>}</div></>;
  else content = <><div className="workspace-summary">{workspace.summary.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div><div className="workspace-section-head workspace-section-head--spaced"><h2>All available pages</h2><p>Use this directory to reach every work and account page available to the selected role.</p></div><WorkspaceDirectory workspace={workspace} /><div className="workspace-section-head workspace-section-head--spaced"><h2>Priority queue</h2><p>Role-specific work and decisions requiring your attention.</p></div><div className="workspace-role-priorities">{workspace.priorities.map((item) => <AppLink className="list-row" href={item.href} key={item.title}><CheckCircle2 /><span><strong>{item.title}</strong><small>{item.meta}</small></span><span className="badge">{item.status}</span></AppLink>)}</div></>;

  const privilegedAdmin = isPrivilegedRole(role) ? adminConfigForRole(role) : null;
  const roleArea = roleAreaPresentation(role);
  const roleAreaStyle = { "--role-accent": roleArea.accent } as CSSProperties;
  const areaClassName = `role-area role-area--l${roleArea.level}${privilegedAdmin ? ` admin-workspace admin-workspace--${privilegedAdmin.kind}` : ""}`;
  const heroClassName = privilegedAdmin ? "workspace-page-hero admin-page-hero" : "workspace-page-hero";
  const layoutClassName = privilegedAdmin ? "content-width admin-workspace-layout" : "content-width workspace-layout";
  const navigationClassName = privilegedAdmin ? "admin-nav" : "workspace-nav";
  const contentClassName = privilegedAdmin ? "admin-main" : "workspace-main";

  return <div className={areaClassName} style={roleAreaStyle} data-access-level={`L${roleArea.level}`} data-role={role}>
    <PageHero eyebrow={workspace.label} title={title} intro={intro} compact className={heroClassName} />
    <div className={layoutClassName}>
      <nav className={navigationClassName} aria-label={`${workspace.label} sections`}>
        {workspace.nav.map((item) => <AppLink key={item.id} href={item.href} className={navigationHrefIsActive(item.href, path) ? "active" : ""}>{item.label}</AppLink>)}
      </nav>
      <section className={contentClassName}>{content}</section>
    </div>
  </div>;
}

function WorkspaceQueue({ section, title, intro, rows }: { section: string; title: string; intro: string; rows: Array<[string, string, string]> }) {
  return <><div className="workspace-section-head"><h2>{title}</h2><p>{intro}</p></div><div className="workspace-queue">{rows.map(([name, status, action], index) => <AppLink href={`/workspace/${section}/demo-${index + 1}`} key={name}><span><strong>{name}</strong><small>{status}</small></span><b>{action}</b><ArrowRight /></AppLink>)}</div><div className="boundary-callout"><ShieldCheck /><div><strong>First-pass workflow preview</strong><p>These structured states demonstrate the information architecture. Production actions require identity, permissions and agency workflow services.</p></div></div></>;
}

export function AdminPage({ path, integrationContent }: { path: string; integrationContent?: ReactNode }) {
  const resolved = resolveAdminRoute(path);
  const [activeTab, setActiveTab] = useState<"queue" | "configuration" | "history">("queue");
  const [selectedAdminItem, setSelectedAdminItem] = useState("");
  const sectionId = resolved?.section?.id || "";
  useEffect(() => {
    setActiveTab("queue");
    setSelectedAdminItem("");
  }, [sectionId]);
  if (!resolved?.section) return <NotFoundPage />;

  const { config, section } = resolved;
  const workspace = workspaceConfigForRole(config.role);
  const overview = <><section className="admin-status">{config.metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</section><div className="admin-dashboard-grid">{config.overviewPanels.map((panel) => <article key={panel.title}><h2>{panel.title}</h2><p>{panel.body}</p><AppLink href={adminSectionHref(config, panel.section)}>{panel.action}</AppLink></article>)}</div><div className="workspace-section-head workspace-section-head--spaced"><h2>All available pages</h2><p>Use this directory to reach every administrative and account page available to this role.</p></div><WorkspaceDirectory workspace={workspace} /></>;
  const queue = <div className="admin-table"><div className="admin-table-head"><span>Area</span><span>Status</span><span>Action</span></div>{section.rows.map((row) => <div key={row.name}><strong>{row.name}</strong><span>{row.status}</span><button type="button" onClick={() => setSelectedAdminItem(row.name)}>{row.action}</button></div>)}</div>;
  const configuration = <div className="admin-tab-panel"><ShieldCheck /><div><h3>{section.label} configuration</h3><p>Review scoped defaults, decision rules and ownership before applying a governed production change.</p><button type="button" className="button button--secondary" onClick={() => setSelectedAdminItem(`${section.label} configuration`)}>Preview configuration</button></div></div>;
  const history = <div className="admin-tab-panel"><FileText /><div><h3>Recent administrative history</h3><p>Changes, approvals, imports, diagnostic actions and access decisions appear here with actor, timestamp and affected scope.</p><span className="badge">Audit-ready structure</span></div></div>;
  const management = <><div className="admin-section-head"><div><span className="badge">{config.eyebrow}</span><h2>{section.label}</h2><p>{section.description}</p></div><button className="button button--primary" type="button" onClick={() => setActiveTab("configuration")}>{config.primaryAction}</button></div><div className="admin-tool-tabs" role="tablist" aria-label={`${section.label} views`}><button className={activeTab === "queue" ? "active" : ""} type="button" role="tab" aria-selected={activeTab === "queue"} onClick={() => setActiveTab("queue")}>Queue</button><button className={activeTab === "configuration" ? "active" : ""} type="button" role="tab" aria-selected={activeTab === "configuration"} onClick={() => setActiveTab("configuration")}>Configuration</button><button className={activeTab === "history" ? "active" : ""} type="button" role="tab" aria-selected={activeTab === "history"} onClick={() => setActiveTab("history")}>History</button></div><div role="tabpanel">{activeTab === "queue" ? queue : activeTab === "configuration" ? configuration : history}</div>{selectedAdminItem && <div className="admin-selection-status" role="status"><CheckCircle2 /><span><strong>{selectedAdminItem}</strong><small>Preview selected. No production record has been changed.</small></span><button type="button" onClick={() => setSelectedAdminItem("")}>Dismiss</button></div>}<div className="boundary-callout"><ShieldCheck /><div><strong>{config.boundaryTitle}</strong><p>{config.boundaryBody}</p></div></div></>;
  const showAgencyIntegrationDocs = (config.kind === "agency" || config.kind === "undp") && section.id === "integrations";
  const roleArea = roleAreaPresentation(config.role);
  const roleAreaStyle = { "--role-accent": roleArea.accent } as CSSProperties;
  return <div className={`role-area role-area--l${roleArea.level} admin-workspace admin-workspace--${config.kind}`} style={roleAreaStyle} data-access-level={`L${roleArea.level}`} data-role={config.role}><PageHero eyebrow={workspace.label} title={section.label} intro={section.description || config.description} compact className="workspace-page-hero admin-page-hero" /><div className="content-width admin-workspace-layout"><nav className="admin-nav" aria-label={`${workspace.label} sections`}>{workspace.nav.map((item) => <AppLink href={item.href} className={navigationHrefIsActive(item.href, path) ? "active" : ""} key={item.id}>{item.label}</AppLink>)}</nav><section className="admin-main">{section.id === "overview" ? overview : showAgencyIntegrationDocs ? <div className="admin-integration-content">{integrationContent}</div> : management}</section></div></div>;
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const { items, loading: archiveLoading } = useArchive();
  const { projects, loading: projectLoading } = useProjects();
  const term = normalizedSearch(query);
  const results = useMemo(() => {
    if (term.length < 2) return [];
    const seedItems = [
      ...seed.opportunities.map((item) => ({ id: item.id, title: item.title, summary: item.summary, type: "Opportunity", href: "/funding" })),
      ...seed.resources.map((item) => ({ id: item.id, title: item.title, summary: item.summary, type: "Resource", href: `/knowledge/resources/${item.id}` })),
      ...seed.stories.map((item) => ({ id: item.id, title: item.title, summary: item.excerpt, type: "Story", href: `/stories/${item.id}` })),
      ...seed.events.map((item) => ({ id: item.id, title: item.title, summary: item.summary, type: "Event", href: `/community/events/${item.id}` }))
    ];
    const local = seedItems.filter((item) => normalizedSearch(`${item.title} ${item.summary}`).includes(term));
    const archive = items.filter((item) => normalizedSearch(`${item.title} ${item.summary} ${item.contextTitle}`).includes(term)).slice(0, 35).map((item) => ({ id: item.id, title: item.title, summary: item.summary || item.contextTitle || "Migrated archive record", type: item.kind, href: `/knowledge/resources/${encodeURIComponent(item.id)}` }));
    const projectRows = projects.filter((item) => normalizedSearch(`${item.projectTitle} ${item.countryName} ${item.focalArea}`).includes(term)).slice(0, 20).map((item) => ({ id: item.rowId, title: item.projectTitle, summary: `${item.countryName} · ${item.focalArea || "Theme not recorded"}`, type: "Project", href: `/portfolio?q=${encodeURIComponent(item.projectTitle)}` }));
    return [...local, ...archive, ...projectRows].slice(0, 60);
  }, [items, projects, term]);
  return <><PageHero eyebrow="Global search" title="Search the KLP" intro="Search opportunities, portfolio records, migrated knowledge, stories, events and help from one place." compact /><div className="content-width search-page"><label className="search-field search-field--large"><Search /><span className="sr-only">Search all platform content</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the platform" /></label>{query.length < 2 ? <div className="search-prompts"><p>Try a place, theme, resource or project title.</p>{["coastal resilience", "biodiversity", "Türkiye", "project template"].map((item) => <button type="button" key={item} onClick={() => setQuery(item)}>{item}</button>)}</div> : archiveLoading || projectLoading ? <Loading label="Searching indexes" /> : !results.length ? <Empty title="No matching records" body="Try fewer or broader terms." /> : <div className="search-results"><p className="result-summary">{results.length} results</p>{results.map((item) => <AppLink href={item.href} key={`${item.type}-${item.id}`}><span className="badge">{item.type}</span><h2>{item.title}</h2><p>{item.summary}</p><ArrowRight /></AppLink>)}</div>}</div></>;
}

export function UtilityPage({ path }: { path: string }) {
  const content: Record<string, [string, string]> = {
    "/prototype-notice": ["About this prototype", seed.prototypeNotice],
    "/privacy": ["Privacy", "This local MVP stores role selection, saved items and assistant conversation history in your browser. The live AI service is an external dependency and should receive only appropriate questions."],
    "/accessibility": ["Accessibility", "The MVP is designed for keyboard access, visible focus, semantic structure, reduced motion and responsive layouts. Formal user and assistive-technology testing remains a release gate."]
  };
  const [title, intro] = content[path] || ["Platform information", "Information about this MVP."];
  return <><PageHero eyebrow="Platform information" title={title} intro={intro} compact /><div className="content-width reading-layout"><h2>Current scope</h2><p>The shared public experience, portfolio, knowledge, live assistant and administration concepts are represented. UNDP operational grant workflows remain clearly labelled placeholders, and other agencies retain operational authority.</p><h2>Data and content</h2><p>Portfolio and archive artifacts are synchronized at build time with hashes and record counts. Demonstration records remain visibly labelled.</p></div></>;
}

export function NotFoundPage() { return <><PageHero eyebrow="404" title="Page not found" intro="The requested route is not available in this MVP." compact /><div className="content-width"><AppLink href="/" className="button button--primary">Return home</AppLink></div></>; }
