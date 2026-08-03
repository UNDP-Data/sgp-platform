import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const translationFiles = [
  "src/i18n.tsx",
  "src/i18n-glossary.ts",
  "src/i18n-interface-completion.ts",
  "src/i18n-functional-workflows.ts",
  "src/i18n-grant-workbench.ts",
  "src/i18n-learning.ts",
  "src/i18n-operational-workspaces.ts",
  "src/i18n-ui-completion.ts"
];
async function filesWithExtension(directory, extension) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relative = path.posix.join(directory, entry.name);
    return entry.isDirectory() ? filesWithExtension(relative, extension) : relative.endsWith(extension) ? [relative] : [];
  }));
  return files.flat();
}
const componentFiles = (await filesWithExtension("src", ".tsx")).filter((file) => file !== "src/ApiDocumentationPage.tsx");
const configFiles = [
  {
    file: "src/workspace/workspaceConfig.ts",
    properties: new Set(["label", "title", "action", "description", "body", "intro", "meta", "status"])
  },
  {
    file: "src/admin/adminConfig.ts",
    properties: new Set(["label", "title", "action"])
  },
  {
    file: "src/auth/roles.ts",
    properties: new Set(["label", "title"])
  },
  {
    file: "src/workspace/roleAreaPresentation.ts",
    properties: new Set(["label", "title"])
  },
  {
    file: "src/lib/dashboard/config.ts",
    properties: new Set(["label", "group"])
  },
  {
    file: "src/lib/data/countryGroups.ts",
    properties: new Set(["label", "group"])
  },
  {
    file: "src/lib/grants/historicalMap.ts",
    properties: new Set(["label"])
  }
];
const intentionalSourceLanguage = new Set([
  "English",
  "Español",
  "Français",
  "Türkiye",
  "n/a",
  "currentColor",
  "grantAmount",
  "projectRecords"
]);
const technicalPattern = /^(?:https?:|\/|#|--|rgba\(|translate(?:Y)?(?:\(|$)|px(?:\b|,)|#[0-9a-f]{3,8}$|[\w-]+\.(?:json|csv|png|jpg|jpeg|svg|webp|pdf|yaml))|^(?:_blank|true|false)$/i;
const cssClassPattern = /(?:^|\s)[a-z][\w-]*--[\w-]*(?:\s|$)|^(?:[a-z]+-){1,}[a-z]+(?:\s+(?:[a-z]+-){1,}[a-z]+)+$/;
const lowerTokenPattern = /^[a-z0-9_-]+$/;
const technicalSelectorPattern = /\[data-[\w-]+=?|^["']?\]\s*(?:input|textarea)|^[a-z]+(?:[A-Z][A-Za-z0-9]*)+$/;
const translatedJsxAttributes = new Set([
  "aria-label",
  "placeholder",
  "title",
  "alt",
  "data-tooltip",
  "eyebrow",
  "intro",
  "label",
  "body",
  "description",
  "emptyLabel"
]);
const translatedJsxAttributePattern = /(?:label|title|description|caption|message|eyebrow|intro|body|meta|status|action|helper|tooltip|placeholder|alt)$/i;
const uiVariablePattern = /(?:title|label|heading|caption|message|description|eyebrow|intro)$/i;
const translationKeys = new Set();
const missing = new Map();

function sourceFile(file, text, kind = ts.ScriptKind.TSX) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
}

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
}

function normalize(value) {
  return value.replaceAll("&amp;", "&").replace(/\s+/g, " ").trim();
}

function record(value, file, node) {
  const clean = normalize(value);
  if (
    clean.length < 2 ||
    !/[A-Za-z]/.test(clean) ||
    translationKeys.has(clean) ||
    intentionalSourceLanguage.has(clean) ||
    technicalPattern.test(clean) ||
    cssClassPattern.test(clean) ||
    lowerTokenPattern.test(clean) ||
    technicalSelectorPattern.test(clean)
  ) return;
  const line = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart()).line + 1;
  const locations = missing.get(clean) ?? [];
  locations.push(`${file}:${line}`);
  missing.set(clean, locations);
}

function collectStrings(node, file) {
  visit(node, (candidate) => {
    if (ts.isStringLiteralLike(candidate)) record(candidate.text, file, candidate);
  });
}

function collectTemplateText(node, file) {
  visit(node, (candidate) => {
    if (!ts.isTemplateHead(candidate) && !ts.isTemplateMiddle(candidate) && !ts.isTemplateTail(candidate)) return;
    const phrase = candidate.text.replace(/^[\s.!?:,|()]+/, "").replace(/[\s.!?:,|()]+$/, "");
    record(phrase, file, candidate);
  });
}

for (const file of translationFiles) {
  const text = await readFile(path.join(root, file), "utf8");
  const parsed = sourceFile(file, text);
  visit(parsed, (node) => {
    if (
      ts.isArrayLiteralExpression(node) &&
      node.elements.length === 7 &&
      node.elements.every((element) => ts.isStringLiteralLike(element))
    ) {
      translationKeys.add(normalize(node.elements[0].text));
    }
  });
}

for (const file of componentFiles) {
  const text = await readFile(path.join(root, file), "utf8");
  const parsed = sourceFile(file, text);
  visit(parsed, (node) => {
    if (ts.isJsxText(node)) record(node.text, file, node);
    if (
      ts.isJsxAttribute(node) &&
      (translatedJsxAttributes.has(node.name.text) || translatedJsxAttributePattern.test(node.name.text))
    ) {
      const initializer = node.initializer;
      if (initializer && ts.isStringLiteral(initializer)) record(initializer.text, file, initializer);
      if (initializer && ts.isJsxExpression(initializer) && initializer.expression) {
        collectStrings(initializer.expression, file);
        collectTemplateText(initializer.expression, file);
      }
    }
    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
    ) {
      collectStrings(node.expression, file);
      collectTemplateText(node.expression, file);
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      uiVariablePattern.test(node.name.text) &&
      node.initializer
    ) {
      collectStrings(node.initializer, file);
      collectTemplateText(node.initializer, file);
    }
  });
}

for (const { file, properties } of configFiles) {
  const text = await readFile(path.join(root, file), "utf8");
  const parsed = sourceFile(file, text, ts.ScriptKind.TS);
  visit(parsed, (node) => {
    if (
      file === "src/auth/roles.ts" &&
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      (node.name.text === "ROLE_ACCESS_SUMMARIES" || node.name.text === "ROLE_LABELS") &&
      node.initializer
    ) {
      collectStrings(node.initializer, file);
    }
    if (!ts.isPropertyAssignment(node)) return;
    const property = node.name.getText(parsed).replaceAll("\"", "").replaceAll("'", "");
    if (!properties.has(property)) return;
    if (ts.isStringLiteralLike(node.initializer)) record(node.initializer.text, file, node.initializer);
    if (ts.isTemplateExpression(node.initializer)) collectTemplateText(node.initializer, file);
  });
}

for (const { file, variable } of [
  { file: "src/data/open-grants.ts", variable: "OPEN_GRANT_THEMES" }
]) {
  const text = await readFile(path.join(root, file), "utf8");
  const parsed = sourceFile(file, text, ts.ScriptKind.TS);
  visit(parsed, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variable &&
      node.initializer
    ) {
      collectStrings(node.initializer, file);
    }
  });
}

const seed = JSON.parse(await readFile(path.join(root, "src/seed-content.json"), "utf8"));
const dataDrivenLabels = new Set(["Tag", "Tags", "Date", "Dates"]);
for (const event of seed.events ?? []) {
  for (const value of [...(event.regions ?? []), ...(event.themes ?? []), event.format]) {
    if (typeof value === "string" && value.trim()) dataDrivenLabels.add(value.trim());
  }
}
const editorial = JSON.parse(await readFile(path.join(root, "public/generated/knowledge/editorial-index.json"), "utf8"));
for (const publication of editorial.publications ?? []) {
  for (const value of [...(publication.types ?? []), ...(publication.focalAreas ?? [])]) {
    if (typeof value === "string" && value.trim()) dataDrivenLabels.add(value.trim());
  }
}
for (const value of dataDrivenLabels) {
  if (!translationKeys.has(value)) missing.set(value, ["data-driven interface metadata"]);
}

if (missing.size) {
  const details = [...missing]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, locations]) => `${value}\n  ${locations.join(", ")}`)
    .join("\n");
  throw new Error(`Missing interface translations:\n${details}`);
}

console.log(`Interface translation audit passed (${translationKeys.size} catalogued phrases)`);
