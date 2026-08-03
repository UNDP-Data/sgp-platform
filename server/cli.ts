import { existsSync, statSync } from "node:fs";
import { backendConfig } from "./config";
import { ContentRepository } from "./content";
import { BackendDatabase } from "./database";

const command = process.argv[2] || "doctor";
const config = backendConfig();
const database = new BackendDatabase(config);

try {
  if (command === "reset") {
    database.reset();
    console.log(`Temporary backend reset: ${config.databasePath}`);
  } else if (command === "seed") {
    database.seed();
    console.log(`Temporary backend seeded: ${config.databasePath}`);
  } else if (command === "doctor") {
    const content = new ContentRepository(config);
    const state = database.state();
    const required = [
      "public/generated/knowledge/archive-index.json",
      "public/generated/knowledge/editorial-index.json",
      "public/generated/portfolio/data/projects.runtime.json",
      "public/generated/provenance.json"
    ];
    const missing = required.filter((relative) => !existsSync(`${config.rootDir}/${relative}`));
    if (missing.length) throw new Error(`Missing generated backend sources: ${missing.join(", ")}`);
    if (state.records.length !== 16) throw new Error(`Expected 16 seeded workflows, found ${state.records.length}.`);
    console.log(JSON.stringify({
      status: "ready", database: config.databasePath, databaseBytes: statSync(config.databasePath).size,
      journalMode: "wal", workflows: state.records.length, files: database.fileStats(), content: content.stats(), revision: database.revision()
    }, null, 2));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} finally {
  database.close();
}
