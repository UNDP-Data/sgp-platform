import { copyFile, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
await copyFile(path.join(dist, "index.html"), path.join(dist, "404.html"));
const forbidden = [/SGP-KLP-Frontend/, /SGP-Data-Pipeline/, /undp-data\.github\.io\/dsc-sgp-ai/i];
const configuredBase = process.env.BASE_PATH || "/";
const projectSiteBuild = configuredBase !== "/";
const rootAssetPatterns = {
  ".html": [/\b(?:src|srcset|href|poster)=["']\/(?:assets|brand|media|api)\//],
  ".css": [/url\(["']?\/(?:assets|brand|media|api)\//]
};
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (/\.(?:html|js|css)$/.test(entry.name)) {
      const text = await readFile(target, "utf8");
      for (const rule of forbidden) if (rule.test(text)) throw new Error(`Forbidden runtime reference in ${path.relative(root, target)}`);
      if (projectSiteBuild) {
        for (const rule of rootAssetPatterns[path.extname(entry.name)] || []) {
          if (rule.test(text)) {
            throw new Error(`Domain-root asset reference in project-site build: ${path.relative(root, target)}`);
          }
        }
      }
    }
  }
}
await walk(dist);
console.log(`Created SPA fallback and audited production runtime references for ${configuredBase}`);
