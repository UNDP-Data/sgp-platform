import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pipelineRoot = process.env.SGP_DATA_PIPELINE_DIR
  ? path.resolve(process.env.SGP_DATA_PIPELINE_DIR)
  : path.resolve(root, "../SGP-Data-Pipeline");
const pipelineApi = path.resolve(process.env.SGP_PIPELINE_API || path.join(pipelineRoot, "00_API"));
const output = path.join(root, "public/generated");
const portfolioSource = path.join(pipelineApi, "dashboard-runtime");
const archiveSource = path.join(pipelineApi, "archive-browser/static");
const editorialSource = path.join(pipelineRoot, "03_Outputs/site_archive/output/sgp_full_site/content");
const portfolioOutput = path.join(output, "portfolio");
const knowledgeOutput = path.join(output, "knowledge");
const manifest = { schemaVersion: "sgp-klp-mvp-provenance-v1", generatedAt: new Date().toISOString(), sources: [] };

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

async function readJson(file) {
  const buffer = await readFile(file);
  return { value: JSON.parse(buffer.toString("utf8")), buffer };
}

async function copyValidated(relative, validate, count) {
  const source = path.join(portfolioSource, relative);
  const destination = path.join(portfolioOutput, relative);
  const { value, buffer } = await readJson(source);
  validate(value, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
  manifest.sources.push({
    artifact: `portfolio/${relative}`,
    source: path.relative(root, source),
    sha256: sha256(buffer),
    bytes: buffer.length,
    records: count(value),
    validation: "passed"
  });
}

const compactTable = (value, label) => {
  if (!Array.isArray(value?.fields) || !Array.isArray(value?.rows)) throw new Error(`${label} is not a compact runtime table`);
  if (value.rows.some((row) => !Array.isArray(row) || row.length !== value.fields.length)) throw new Error(`${label} contains malformed rows`);
};
const objectValue = (value, label) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
};
const geoValue = (value, label) => {
  if (value?.type !== "FeatureCollection" || !Array.isArray(value.features)) throw new Error(`${label} must be GeoJSON FeatureCollection`);
};

function parseShard(source) {
  const match = source.match(/\["[^"]+"\]=(\{[\s\S]*\});?\s*$/);
  if (!match) throw new Error("Unrecognized archive shard wrapper");
  return JSON.parse(match[1]);
}

function publicUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
}

function archiveKind(node, value) {
  const text = `${node.element_type || ""} ${node.path || ""} ${node.title || ""} ${node.record_kind || ""}`.toLowerCase();
  if (/video|youtube/.test(text)) return "video";
  if (/image|photo|thumbnail/.test(text)) return "image";
  if (/document|publication|download|pdf|file/.test(text)) return "document";
  if (/story|article/.test(text)) return "story";
  if (/contact/.test(text)) return "contact";
  if (/link|url/.test(text) || publicUrl(value)) return "link";
  return "content";
}

async function compileArchive() {
  const recordFiles = (await readdir(path.join(archiveSource, "shards"))).filter((name) => name.endsWith(".js")).sort();
  const treeFiles = (await readdir(path.join(archiveSource, "tree_shards"))).filter((name) => name.endsWith(".js")).sort();
  const records = new Map();
  const sourceBuffers = [];
  for (const name of recordFiles) {
    const buffer = await readFile(path.join(archiveSource, "shards", name));
    sourceBuffers.push(buffer);
    for (const [id, value] of Object.entries(parseShard(buffer.toString("utf8")))) records.set(id, value);
  }
  const items = new Map();
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.record_ref?.id) {
      const value = records.get(node.record_ref.id);
      const context = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const sourceUrl = publicUrl(node.url) || publicUrl(value) || publicUrl(context.source_url) || publicUrl(context.referrer_url);
      const rawText = typeof value === "string" && !publicUrl(value) ? value : (context.summary || context.body || context.text || "");
      const title = String(node.title || context.label || context.context_title || "Untitled archive record").trim();
      const id = String(node.id || node.record_ref.id);
      if (!items.has(id)) items.set(id, {
        id,
        title,
        kind: archiveKind(node, value),
        recordKind: node.record_kind || null,
        routeType: node.route_type || null,
        status: node.status || null,
        path: node.path || null,
        sourceUrl,
        summary: String(rawText || "").replace(/\s+/g, " ").trim().slice(0, 900),
        contextTitle: context.context_title || null,
        section: context.section_heading || null,
        source: "SGP website archive"
      });
    }
    if (node.children) visit(node.children);
  };
  for (const name of treeFiles) {
    const buffer = await readFile(path.join(archiveSource, "tree_shards", name));
    sourceBuffers.push(buffer);
    Object.values(parseShard(buffer.toString("utf8"))).forEach(visit);
  }
  const payload = { schemaVersion: "sgp-klp-archive-index-v1", generatedAt: new Date().toISOString(), items: [...items.values()] };
  const encoded = Buffer.from(JSON.stringify(payload));
  await mkdir(knowledgeOutput, { recursive: true });
  await writeFile(path.join(knowledgeOutput, "archive-index.json"), encoded);
  manifest.sources.push({
    artifact: "knowledge/archive-index.json",
    source: path.relative(root, archiveSource),
    sha256: sha256(Buffer.concat(sourceBuffers)),
    bytes: encoded.length,
    records: payload.items.length,
    validation: "passed"
  });
}

function cleanEditorialText(value, limit = 420) {
  return String(value || "")
    .replace(/^Print\s+Details\s+Created:\s*[^A-Z]+/i, "")
    .replace(/This email address is being protected[^.]*\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function meaningfulTitle(value) {
  const title = cleanEditorialText(value, 240);
  return title.length > 8 && !/^(title|url|caption|image url|entity type|read (the )?(full|original) story)/i.test(title) ? title : null;
}

async function compileEditorial() {
  const sourceFiles = ["stories.json", "videos.json", "publication_links.json"];
  const sourcePayloads = await Promise.all(sourceFiles.map((name) => readJson(path.join(editorialSource, name))));
  const [storyRecords, videoRecords, publicationRecords] = sourcePayloads.map((item) => item.value);

  const stories = storyRecords
    .filter((item) => item?.identity?.source_system === "sgp_story" && meaningfulTitle(item.identity.title) && cleanEditorialText(item?.content?.body_text, 600).length > 160)
    .map((item) => {
      const image = (item.images || []).find((candidate) => publicUrl(candidate.url));
      const author = cleanEditorialText(item?.metadata?.author, 100);
      const blocks = (item?.content?.blocks || [])
        .filter((block) => block && typeof block === "object" && ["paragraph", "heading", "quote", "list_item"].includes(block.type))
        .map((block) => ({
          type: block.type,
          text: cleanEditorialText(block.text, 4000),
          ...(block.type === "heading" ? { level: Math.min(6, Math.max(2, Number(block.level) || 2)) } : {})
        }))
        .filter((block) => block.text);
      const body = blocks.length
        ? blocks.map((block) => block.text).join("\n\n")
        : String(item?.content?.body_text || "").split(/\n\s*\n/).map((part) => cleanEditorialText(part, 4000)).filter(Boolean).join("\n\n").slice(0, 12000);
      return {
        id: `story-${item.identity.source_key}`,
        sourceKey: String(item.identity.source_key),
        title: meaningfulTitle(item.identity.title),
        summary: cleanEditorialText(item.content.body_text, 420),
        body,
        blocks,
        canonicalUrl: item.identity.canonical_url,
        publishedAt: item?.metadata?.published_at || null,
        author: author && author.length < 80 ? author : null,
        imageUrl: image?.url || null,
        imageAlt: cleanEditorialText(image?.alt_text || image?.label || item.identity.title, 180),
        imageCount: (item.images || []).length
      };
    })
    .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));

  const videos = videoRecords
    .filter((item) => item?.video_id && meaningfulTitle(item.title))
    .map((item) => ({
      id: `video-${item.video_id}`,
      videoId: item.video_id,
      title: meaningfulTitle(item.title),
      canonicalUrl: `https://www.youtube.com/watch?v=${item.video_id}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`,
      isVoice: item?.metadata?.is_sgp_voice === true,
      category: item?.metadata?.video_category || item.category || "video",
      context: cleanEditorialText(item?.appearances?.[0]?.section_heading || item?.appearances?.[0]?.label, 180)
    }));

  const publications = publicationRecords
    .filter((item) => item?.identity?.entity_type === "publication_reference" && meaningfulTitle(item.identity.title) && publicUrl(item.identity.canonical_url))
    .map((item) => ({
      id: `publication-${item.identity.source_key}`,
      title: meaningfulTitle(item.identity.title),
      canonicalUrl: item.identity.external_detail_url || item.identity.canonical_url,
      downloadUrl: item.identity.canonical_url,
      countries: item?.metadata?.catalog_tags?.Countries || [],
      focalAreas: item?.metadata?.catalog_tags?.["Focal Areas"] || [],
      types: item?.metadata?.catalog_tags?.Type || [],
      appearances: Number(item?.metadata?.appearance_count || item?.mention_count || 0)
    }))
    .sort((a, b) => b.appearances - a.appearances || a.title.localeCompare(b.title));

  const photoUrls = new Set();
  const photos = [];
  for (const item of storyRecords) {
    const storyTitle = meaningfulTitle(item?.identity?.title);
    if (!storyTitle) continue;
    for (const image of item.images || []) {
      if (!publicUrl(image.url) || photoUrls.has(image.url)) continue;
      photoUrls.add(image.url);
      photos.push({
        id: `photo-${image.sha256 || image.id}`,
        title: storyTitle,
        imageUrl: image.url,
        alt: cleanEditorialText(image.alt_text || image.label || storyTitle, 180),
        canonicalUrl: item.identity.canonical_url,
        publishedAt: item?.metadata?.published_at || null
      });
    }
  }

  const payload = {
    schemaVersion: "sgp-klp-editorial-index-v1",
    generatedAt: new Date().toISOString(),
    counts: { stories: stories.length, videos: videos.length, voices: videos.filter((item) => item.isVoice).length, publications: publications.length, photos: photos.length },
    stories, videos, publications, photos
  };
  const encoded = Buffer.from(JSON.stringify(payload));
  await mkdir(knowledgeOutput, { recursive: true });
  await writeFile(path.join(knowledgeOutput, "editorial-index.json"), encoded);
  manifest.sources.push({
    artifact: "knowledge/editorial-index.json",
    source: path.relative(root, editorialSource),
    sha256: sha256(Buffer.concat(sourcePayloads.map((item) => item.buffer))),
    bytes: encoded.length,
    records: stories.length + videos.length + publications.length + photos.length,
    validation: "passed"
  });
}

await rm(output, { recursive: true, force: true });
await Promise.all([
  copyValidated("data/projects.runtime.json", compactTable, (value) => value.rows.length),
  copyValidated("data/cofinancing.runtime.json", compactTable, (value) => value.rows.length),
  copyValidated("data/content-profiles.json", objectValue, (value) => Object.keys(value.countries || {}).length + Object.keys(value.areas || {}).length),
  copyValidated("data/country-aliases.json", objectValue, (value) => Object.keys(value).length),
  copyValidated("data/data-dictionary.json", objectValue, (value) => Object.keys(value).length),
  copyValidated("geo/world-countries.geojson", geoValue, (value) => value.features.length),
  copyValidated("geo/authoritative-provenance.json", objectValue, () => 1),
  compileArchive(),
  compileEditorial()
]);
await writeFile(path.join(output, "provenance.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synced ${manifest.sources.length} validated artifacts to ${path.relative(process.cwd(), output)}`);
