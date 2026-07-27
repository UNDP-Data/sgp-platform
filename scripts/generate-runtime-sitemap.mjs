import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(await readFile(path.join(root, "src/sitemap.json"), "utf8"));
const runtime = {
  primaryNavigation: source.primaryNavigation.map(({ label, path }) => ({ label, path })),
  routes: source.routes.map(({ id, path, title, section, state, audiences }) => ({
    id, path, title, section, state, audiences
  }))
};
await writeFile(path.join(root, "src/runtime-sitemap.json"), `${JSON.stringify(runtime, null, 2)}\n`);
console.log(`Generated runtime sitemap with ${runtime.routes.length} routes`);
