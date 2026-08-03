import { rmSync } from "node:fs";
import path from "node:path";
import { createBackendApp } from "./app";
import { backendConfig } from "./config";

const dataDir = path.join(process.cwd(), ".local", "backend-e2e");
rmSync(dataDir, { recursive: true, force: true });
const config = backendConfig({ host: "127.0.0.1", port: 8790, dataDir, databasePath: path.join(dataDir, "test.sqlite3"), filesDir: path.join(dataDir, "evidence") });
const app = createBackendApp(config);

app.server.listen(config.port, config.host, () => {
  console.log(`SGP temporary backend E2E fixture listening on http://${config.host}:${config.port}`);
});

const close = () => app.server.close(() => {
  app.database.close();
  rmSync(dataDir, { recursive: true, force: true });
  process.exit(0);
});
process.on("SIGINT", close);
process.on("SIGTERM", close);
