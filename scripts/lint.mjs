import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const forbidden = [
  /\.\.\/SGP-KLP-Frontend/,
  /\.\.\/SGP-Data-Pipeline/,
  /undp-data\.github\.io\/dsc-sgp-ai/i,
  /<iframe[^>]+(?:SGP-KLP-Frontend|dsc-sgp-ai)/i
];
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".html", ".json"]);
const failures = [];

function auditMarkup(file, text) {
  if (!file.endsWith(".tsx")) return;

  for (const match of text.matchAll(/<button\b((?:(?!>).)*)>/gs)) {
    if (!/\btype\s*=/.test(match[1])) failures.push(`${file} contains a <button> without an explicit type`);
  }
  for (const match of text.matchAll(/<img\b((?:(?!>).)*)>/gs)) {
    if (!/\balt\s*=/.test(match[1])) failures.push(`${file} contains an <img> without alt text`);
    if (/\bsrc\s*=\s*["']\/(?:brand|media|api)\//.test(match[1])) {
      failures.push(`${file} contains a domain-root public image; use publicAssetUrl`);
    }
  }
  for (const match of text.matchAll(/<source\b((?:(?!>).)*)>/gs)) {
    if (/\bsrcSet\s*=\s*["']\/(?:brand|media|api)\//.test(match[1])) {
      failures.push(`${file} contains a domain-root public source; use publicAssetUrl`);
    }
  }
  for (const match of text.matchAll(/<a\b((?:(?!>).)*)>/gs)) {
    const attributes = match[1];
    if (/\btarget\s*=\s*["']_blank["']/.test(attributes) && !/\brel\s*=\s*["'][^"']*(?:noreferrer|noopener)/.test(attributes)) {
      failures.push(`${file} opens a new tab without noreferrer or noopener`);
    }
    if (/\bhref\s*=\s*["']\/(?:brand|media|api)\//.test(attributes)) {
      failures.push(`${file} contains a domain-root public download; use publicAssetUrl`);
    }
  }
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", "public"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (extensions.has(path.extname(entry.name))) {
      const text = await readFile(target, "utf8");
      const relative = path.relative(root, target);
      for (const rule of forbidden) if (rule.test(text)) failures.push(`${relative} matches ${rule}`);
      auditMarkup(relative, text);
    }
  }
}
await walk(path.join(root, "src"));
if (failures.length) throw new Error(failures.join("\n"));
console.log("Source, markup and forbidden-reference audit passed");
