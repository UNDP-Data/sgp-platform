import path from "node:path";

export type BackendConfig = {
  host: string;
  port: number;
  rootDir: string;
  dataDir: string;
  databasePath: string;
  filesDir: string;
  maxFileBytes: number;
  sessionHours: number;
};

export function backendConfig(overrides: Partial<BackendConfig> = {}): BackendConfig {
  const rootDir = overrides.rootDir || process.cwd();
  const dataDir = overrides.dataDir || process.env.SGP_BACKEND_DATA_DIR || path.join(rootDir, ".local", "backend");
  return {
    host: overrides.host || process.env.SGP_BACKEND_HOST || "127.0.0.1",
    port: overrides.port || Number(process.env.SGP_BACKEND_PORT || 8787),
    rootDir,
    dataDir,
    databasePath: overrides.databasePath || process.env.SGP_BACKEND_DB || path.join(dataDir, "sgp-platform.sqlite3"),
    filesDir: overrides.filesDir || process.env.SGP_BACKEND_FILES || path.join(dataDir, "evidence"),
    maxFileBytes: overrides.maxFileBytes || Number(process.env.SGP_BACKEND_MAX_FILE_BYTES || 8 * 1024 * 1024),
    sessionHours: overrides.sessionHours || Number(process.env.SGP_BACKEND_SESSION_HOURS || 12)
  };
}
