import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredDocs = [
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "docs/README.md",
  "docs/PLATFORM_REFERENCE.md",
  "docs/ARCHITECTURE.md",
  "docs/TEMPORARY_BACKEND.md",
  "docs/DEPLOYMENT.md",
  "docs/CONFIGURATION.md",
  "docs/ROUTING_AND_LOCALIZATION.md",
  "docs/DATA_AND_CONTENT.md",
  "docs/ACCESS_AND_ROLES.md",
  "docs/OPERATIONS.md"
];
const requiredRepositoryFiles = [
  ".github/workflows/deploy-pages.yml",
  ".github/workflows/quality.yml",
  ".nvmrc",
  "package-lock.json",
  "public/generated/provenance.json"
];
const staleClaims = [
  /SGP-KLP-MVP/,
  /SGP-KLP-Frontend/,
  /\.\.\/SGP-Documents/,
  /dsc-sgp-ai/,
  /aligned 73-screen/,
  /74-pattern runtime/
];

async function collectMarkdownFiles(directory, prefix = "") {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await collectMarkdownFiles(absolute, relative));
    else if (entry.isFile() && entry.name.endsWith(".md")) output.push(relative);
  }
  return output.sort();
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

const errors = [];
const markdownFiles = [
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  ...await collectMarkdownFiles(path.join(appRoot, "docs"), "docs")
];
const contents = new Map();

for (const relative of markdownFiles) {
  contents.set(relative, await readFile(path.join(appRoot, relative), "utf8"));
}

for (const relative of requiredDocs) {
  if (!contents.has(relative)) errors.push(`Missing maintained document: ${relative}`);
}
for (const relative of requiredRepositoryFiles) {
  if (!await exists(path.join(appRoot, relative))) errors.push(`Missing repository handoff file: ${relative}`);
}

for (const [relative, content] of contents) {
  for (const stale of staleClaims) {
    if (stale.test(content)) errors.push(`${relative} contains stale repository claim: ${stale}`);
  }

  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    const rawTarget = match[1].replace(/^<|>$/g, "").split(/\s+["']/)[0];
    if (
      !rawTarget
      || rawTarget.startsWith("#")
      || rawTarget.startsWith("/")
      || /^[a-z][a-z\d+.-]*:/i.test(rawTarget)
    ) continue;
    const fileTarget = rawTarget.split("#")[0].split("?")[0];
    const target = path.resolve(path.dirname(path.join(appRoot, relative)), decodeURIComponent(fileTarget));
    if (!await exists(target)) errors.push(`${relative} links to missing file: ${rawTarget}`);
  }
}

const sitemap = JSON.parse(await readFile(path.join(appRoot, "src/sitemap.json"), "utf8"));
const routeCount = sitemap.routes.length;
for (const relative of ["README.md", "docs/README.md", "docs/ROUTING_AND_LOCALIZATION.md"]) {
  if (!contents.get(relative)?.includes(`${routeCount}`)) {
    errors.push(`${relative} does not include the current ${routeCount}-route count`);
  }
}
const platformReference = contents.get("docs/PLATFORM_REFERENCE.md") || "";
for (const route of sitemap.routes) {
  if (!platformReference.includes(`\`${route.path}\``)) {
    errors.push(`docs/PLATFORM_REFERENCE.md is missing sitemap route: ${route.path}`);
  }
}

const deployment = await readFile(path.join(appRoot, ".github/workflows/deploy-pages.yml"), "utf8");
for (const expected of [
  "actions/checkout@v6",
  "actions/setup-node@v6",
  "actions/configure-pages@v5",
  "actions/upload-pages-artifact@v4",
  "actions/deploy-pages@v4",
  "BASE_PATH: /sgp-platform/",
  "pages: write",
  "id-token: write"
]) {
  if (!deployment.includes(expected)) errors.push(`Pages workflow is missing: ${expected}`);
}

const packageJson = JSON.parse(await readFile(path.join(appRoot, "package.json"), "utf8"));
if (packageJson.name !== "sgp-platform") errors.push("package.json name must be sgp-platform");
if (!packageJson.scripts?.verify || !packageJson.scripts?.check) errors.push("package.json must expose verify and check scripts");

if (errors.length) {
  console.error(`Documentation audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Documentation audit passed for ${markdownFiles.length} maintained Markdown files and ${routeCount} routes`);
