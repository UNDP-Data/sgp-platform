import {
  ArrowRight, Bot, Check, Clipboard, Code2, Database, Download, ExternalLink,
  FileJson, KeyRound, LockKeyhole, Radio, Search, ShieldCheck, Webhook
} from "lucide-react";
import { useState } from "react";
import { AppLink } from "./components/AppLink";
import { apiMessage, type ApiMessageId } from "./api-i18n";
import { useI18n } from "./i18n";
import { publicAssetUrl } from "./lib/browser/assets";

const API_BASE = "https://api.sgp-klp.example/v1";

const assistantCurl = `curl -X POST "${API_BASE}/assistant/query" \\
  -H "Authorization: Bearer $SGP_KLP_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "X-SGP-Agency: your-agency" \\
  -d '{
    "question": "What approaches have supported community-led reef restoration?",
    "corpus": "all",
    "filters": { "countries": ["FJI", "IDN"] },
    "language": "en"
  }'`;

const embedServer = `const response = await fetch("${API_BASE}/embed/sessions", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.SGP_KLP_API_KEY}\`,
    "Content-Type": "application/json",
    "X-SGP-Agency": "your-agency"
  },
  body: JSON.stringify({
    origin: "https://portal.agency.example",
    corpus: "all",
    locale: "en",
    context: { country: "FJI", lifecycle_stage: "delivery" }
  })
});
const { token, embed_url, expires_at } = await response.json();`;

const embedClient = `<script type="module" src="https://klp.sgp.example/embed/v1.js"></script>
<sgp-knowledge-assistant
  session-token="SHORT_LIVED_TOKEN"
  theme="light"
  mode="compact"
></sgp-knowledge-assistant>`;

const documentSearch = `curl -X POST "${API_BASE}/documents/search" \\
  -H "Authorization: Bearer $SGP_KLP_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "participatory monitoring lessons",
    "filters": {
      "countries": ["TUR"],
      "document_codes": ["D21", "D25"],
      "lifecycle_phases": ["monitoring", "closure"],
      "languages": ["en", "tr"]
    },
    "page": { "size": 20 }
  }'`;

const resourceSearch = `GET ${API_BASE}/resources/search
  ?q=community%20forestry
  &types=publication,story,voice
  &countries=NPL
  &languages=en
  &limit=20`;

function CopyButton({ value, copyLabel, copiedLabel }: { value: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="api-copy" type="button" onClick={async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }}>{copied ? <Check size={15} /> : <Clipboard size={15} />}<span>{copied ? copiedLabel : copyLabel}</span></button>;
}

function CodeBlock({ title, code, copyLabel, copiedLabel }: { title: string; code: string; copyLabel: string; copiedLabel: string }) {
  return <div className="api-code"><header><span>{title}</span><CopyButton value={code} copyLabel={copyLabel} copiedLabel={copiedLabel} /></header><pre><code>{code}</code></pre></div>;
}

function Status({ kind, children }: { kind: "live" | "design" | "planned"; children: string }) {
  return <span className={`api-status api-status--${kind}`}>{children}</span>;
}

export function ApiDocumentationPage() {
  const { locale } = useI18n();
  const tx = (id: ApiMessageId, variables?: Record<string, string>) => apiMessage(locale, id, variables);
  const codeLabels = { copyLabel: tx("copy"), copiedLabel: tx("copied") };
  return <div className="api-docs" data-no-translate>
    <header className="api-docs-hero">
      <div className="content-width">
        <div className="api-docs-kicker"><Code2 size={18} /><span>{tx("kicker")}</span></div>
        <h1>{tx("title")}</h1>
        <p>{tx("hero")}</p>
        <div className="api-docs-actions">
          <a className="button button--primary" href={publicAssetUrl("/api/openapi-indicative.yaml")} download><Download size={17} /> {tx("download")}</a>
          <a className="button button--light" href="#quickstart">{tx("start")} <ArrowRight size={17} /></a>
        </div>
        <div className="api-release-strip" aria-label={tx("interfaceStatus")}>
          <div><Status kind="live">{tx("current")}</Status><span>{tx("currentBody")}</span></div>
          <div><Status kind="design">{tx("design")}</Status><span>{tx("designBody")}</span></div>
          <div><Status kind="planned">{tx("planned")}</Status><span>{tx("plannedBody")}</span></div>
        </div>
      </div>
    </header>

    <div className="content-width api-docs-layout">
      <aside className="api-docs-nav">
        <strong>{tx("onPage")}</strong>
        <a href="#overview">{tx("navOverview")}</a><a href="#quickstart">{tx("navQuickstart")}</a><a href="#authentication">{tx("navAuthentication")}</a>
        <a href="#embed">{tx("navEmbed")}</a><a href="#assistant">{tx("navAssistant")}</a><a href="#search">{tx("navSearch")}</a>
        <a href="#datasets">{tx("navDatasets")}</a><a href="#exchange">{tx("navExchange")}</a><a href="#governance">{tx("navGovernance")}</a>
        <a href="#operations">{tx("navOperations")}</a>
      </aside>

      <article className="api-docs-content">
        <section id="overview" className="api-section">
          <p className="eyebrow">{tx("integrationModel")}</p><h2>{tx("overviewTitle")}</h2>
          <p>{tx("overviewBody")}</p>
          <div className="api-capability-grid">
            <div><Bot /><h3>{tx("assistant")}</h3><p>{tx("assistantCapability")}</p><Status kind="design">{tx("externalContract")}</Status></div>
            <div><Search /><h3>{tx("search")}</h3><p>{tx("searchCapability")}</p><Status kind="planned">{tx("documentIndexPlanned")}</Status></div>
            <div><Database /><h3>{tx("data")}</h3><p>{tx("dataCapability")}</p><Status kind="design">{tx("design")}</Status></div>
            <div><Radio /><h3>{tx("exchange")}</h3><p>{tx("exchangeCapability")}</p><Status kind="design">{tx("design")}</Status></div>
          </div>
          <div className="api-principle"><ShieldCheck /><div><strong>{tx("accessNotClearance")}</strong><p>{tx("accessNotClearanceBody")}</p></div></div>
        </section>

        <section id="quickstart" className="api-section">
          <p className="eyebrow">{tx("navQuickstart")}</p><h2>{tx("quickTitle")}</h2>
          <ol className="api-steps"><li><span>1</span><div><strong>{tx("requestClient")}</strong><p>{tx("requestClientBody")}</p></div></li><li><span>2</span><div><strong>{tx("storeKey")}</strong><p>{tx("storeKeyBody")}</p></div></li><li><span>3</span><div><strong>{tx("scopedRequest")}</strong><p>{tx("scopedRequestBody")}</p></div></li></ol>
          <CodeBlock title="cURL" code={assistantCurl} {...codeLabels} />
          <div className="api-note"><strong>{tx("basePlaceholder")}</strong><p>{tx("basePlaceholderBody", { base: API_BASE })}</p></div>
        </section>

        <section id="authentication" className="api-section">
          <p className="eyebrow">{tx("navAuthentication")}</p><h2>{tx("authTitle")}</h2>
          <p>{tx("authBody")}</p>
          <div className="api-table-wrap"><table className="api-table"><thead><tr><th>{tx("scope")}</th><th>{tx("permits")}</th><th>{tx("typicalTier")}</th></tr></thead><tbody>
            <tr><td><code>assistant.query</code></td><td>{tx("permitAssistant")}</td><td>{tx("partnerTier")}</td></tr>
            <tr><td><code>resources.read</code></td><td>{tx("permitResources")}</td><td>{tx("publicTier")} / {tx("partnerTier")}</td></tr>
            <tr><td><code>documents.search</code></td><td>{tx("permitDocuments")}</td><td>{tx("partnerTier")} / {tx("controlledTier")}</td></tr>
            <tr><td><code>datasets.read</code></td><td>{tx("permitDatasets")}</td><td>{tx("publicTier")} / {tx("partnerTier")}</td></tr>
            <tr><td><code>events.subscribe</code></td><td>{tx("permitEvents")}</td><td>{tx("partnerTier")}</td></tr>
            <tr><td><code>audit.read</code></td><td>{tx("permitAudit")}</td><td>{tx("agencyAdmin")}</td></tr>
          </tbody></table></div>
          <div className="api-tier-list"><div><LockKeyhole /><span><strong>{tx("publicTier")}</strong><small>{tx("publicTierBody")}</small></span></div><div><KeyRound /><span><strong>{tx("partnerTier")}</strong><small>{tx("partnerTierBody")}</small></span></div><div><ShieldCheck /><span><strong>{tx("controlledTier")}</strong><small>{tx("controlledTierBody")}</small></span></div><div><LockKeyhole /><span><strong>{tx("confidentialTier")}</strong><small>{tx("confidentialTierBody")}</small></span></div></div>
        </section>

        <section id="embed" className="api-section">
          <p className="eyebrow">{tx("widgetSdk")}</p><h2>{tx("embedTitle")}</h2>
          <p>{tx("embedBody")}</p>
          <div className="api-endpoint"><span>POST</span><code>/embed/sessions</code><Status kind="design">{tx("indicativeExternal")}</Status></div>
          <CodeBlock title={tx("agencyServer")} code={embedServer} {...codeLabels} />
          <CodeBlock title={tx("agencyPage")} code={embedClient} {...codeLabels} />
          <div className="api-field-grid"><div><strong>{tx("embedModes")}</strong><p>{tx("embedModesBody")}</p></div><div><strong>{tx("requiredControls")}</strong><p>{tx("requiredControlsBody")}</p></div><div><strong>{tx("contextExpiry")}</strong><p>{tx("contextExpiryBody")}</p></div><div><strong>{tx("writeBack")}</strong><p>{tx("writeBackBody")}</p></div></div>
        </section>

        <section id="assistant" className="api-section">
          <p className="eyebrow">{tx("navAssistant")}</p><h2>{tx("assistantApiTitle")}</h2>
          <div className="api-endpoint"><span>POST</span><code>/assistant/query</code><Status kind="design">{tx("indicativeExternal")}</Status></div>
          <p>{tx("assistantApiBody")}</p>
          <CodeBlock title={tx("responseJson")} code={`{
  "request_id": "req_01J...",
  "answer": "Community-led reef restoration examples...",
  "citations": [{
    "resource_id": "res_8f2a",
    "title": "Locally managed marine areas",
    "url": "https://sgp.undp.org/...",
    "excerpt": "...",
    "access_tier": "public"
  }],
  "limitations": ["Coverage is limited to approved indexed resources."],
  "policy": { "version": "2026-07", "corpus": "all" }
}`} {...codeLabels} />
          <div className="api-principle"><Bot /><div><strong>{tx("assistantBoundaries")}</strong><p>{tx("assistantBoundariesBody")}</p></div></div>
        </section>

        <section id="search" className="api-section">
          <p className="eyebrow">{tx("discovery")}</p><h2>{tx("searchTitle")}</h2>
          <div className="api-endpoint"><span>GET</span><code>/resources/search</code><Status kind="design">{tx("design")}</Status></div>
          <p>{tx("resourceSearchBody")}</p>
          <CodeBlock title={tx("resourceSearch")} code={resourceSearch} {...codeLabels} />
          <div className="api-endpoint"><span>POST</span><code>/documents/search</code><Status kind="planned">{tx("databaseNotDeployed")}</Status></div>
          <p>{tx("documentSearchBody")}</p>
          <CodeBlock title={tx("permissionedSearch")} code={documentSearch} {...codeLabels} />
          <div className="api-note api-note--warning"><strong>{tx("indicativeDocumentApi")}</strong><p>{tx("indicativeDocumentBody")}</p></div>
        </section>

        <section id="datasets" className="api-section">
          <p className="eyebrow">{tx("dataAccess")}</p><h2>{tx("datasetsTitle")}</h2>
          <div className="api-endpoint"><span>GET</span><code>/datasets</code><Status kind="design">{tx("design")}</Status></div>
          <div className="api-datasets">
            <div><FileJson /><span><strong>{tx("portfolioProjects")}</strong><small>{tx("portfolioProjectsBody")}</small></span></div>
            <div><FileJson /><span><strong>{tx("cofinancing")}</strong><small>{tx("cofinancingBody")}</small></span></div>
            <div><FileJson /><span><strong>{tx("knowledgeResources")}</strong><small>{tx("knowledgeResourcesBody")}</small></span></div>
            <div><FileJson /><span><strong>{tx("editorialDatasets")}</strong><small>{tx("editorialDatasetsBody")}</small></span></div>
            <div><FileJson /><span><strong>{tx("taxonomy")}</strong><small>{tx("taxonomyBody")}</small></span></div>
          </div>
          <p>{tx("datasetsBody")}</p>
        </section>

        <section id="exchange" className="api-section">
          <p className="eyebrow">{tx("interoperability")}</p><h2>{tx("exchangeTitle")}</h2>
          <div className="api-exchange-list"><div><Webhook /><span><strong>{tx("eventsWebhooks")}</strong><p>{tx("eventsWebhooksBody")}</p></span></div><div><Download /><span><strong>{tx("scheduledExchange")}</strong><p>{tx("scheduledExchangeBody")}</p></span></div><div><ExternalLink /><span><strong>{tx("deepLink")}</strong><p>{tx("deepLinkBody")}</p></span></div><div><Radio /><span><strong>{tx("contentFeeds")}</strong><p>{tx("contentFeedsBody")}</p></span></div></div>
          <CodeBlock title={tx("webhookEvent")} code={`{
  "id": "evt_01J...",
  "type": "resource.corrected",
  "occurred_at": "2026-07-22T10:30:00Z",
  "agency": "sgp-shared",
  "data": { "resource_id": "res_8f2a", "version": 4 },
  "delivery_attempt": 1
}`} {...codeLabels} />
        </section>

        <section id="governance" className="api-section">
          <p className="eyebrow">{tx("navGovernance")}</p><h2>{tx("governanceTitle")}</h2>
          <ul className="api-checklist"><li><Check />{tx("governance1")}</li><li><Check />{tx("governance2")}</li><li><Check />{tx("governance3")}</li><li><Check />{tx("governance4")}</li><li><Check />{tx("governance5")}</li><li><Check />{tx("governance6")}</li></ul>
        </section>

        <section id="operations" className="api-section">
          <p className="eyebrow">{tx("navOperations")}</p><h2>{tx("operationsTitle")}</h2>
          <div className="api-field-grid"><div><strong>{tx("versioning")}</strong><p>{tx("versioningBody")}</p></div><div><strong>{tx("pagination")}</strong><p>{tx("paginationBody")}</p></div><div><strong>{tx("rateLimits")}</strong><p>{tx("rateLimitsBody")}</p></div><div><strong>{tx("traceability")}</strong><p>{tx("traceabilityBody")}</p></div></div>
          <CodeBlock title={tx("errorEnvelope")} code={`{
  "error": {
    "code": "insufficient_scope",
    "message": "This credential cannot search controlled documents.",
    "request_id": "req_01J...",
    "details": { "required_scope": "documents.search" }
  }
}`} {...codeLabels} />
          <div className="api-final-cta"><div><h2>{tx("planIntegration")}</h2><p>{tx("planIntegrationBody")}</p></div><AppLink href="/help/contact" className="button button--primary">{tx("contactSupport")} <ArrowRight size={16} /></AppLink></div>
        </section>
      </article>
    </div>
  </div>;
}
