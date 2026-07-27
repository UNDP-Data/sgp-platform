import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generated = path.join(root, "public/generated");
const required = [
  "provenance.json",
  "portfolio/data/projects.runtime.json",
  "portfolio/data/cofinancing.runtime.json",
  "portfolio/data/content-profiles.json",
  "portfolio/geo/world-countries.geojson",
  "knowledge/archive-index.json"
];
for (const relative of required) JSON.parse(await readFile(path.join(generated, relative), "utf8"));
const provenance = JSON.parse(await readFile(path.join(generated, "provenance.json"), "utf8"));
if (provenance.sources?.some((source) => source.validation !== "passed")) throw new Error("Generated data contains a failed validation");
console.log(`Validated ${required.length} generated MVP artifacts`);
