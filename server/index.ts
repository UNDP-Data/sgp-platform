import { backendConfig } from "./config";
import { createBackendApp } from "./app";

const config = backendConfig();
const { server, database } = createBackendApp(config);

server.listen(config.port, config.host, () => {
  console.log(`SGP temporary backend: http://${config.host}:${config.port}`);
  console.log(`Data: ${config.dataDir}`);
  console.log("Development-only authentication is enabled. Do not expose this service publicly.");
});

const stop = () => server.close(() => {
  database.close();
  process.exit(0);
});
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
