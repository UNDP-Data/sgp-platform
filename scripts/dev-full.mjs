import { spawn } from "node:child_process";
import process from "node:process";

const children = [];
const start = (command, args, label) => {
  const child = spawn(command, args, { stdio: "inherit", env: process.env });
  child.on("exit", (code, signal) => {
    if (signal || code === 0) return;
    console.error(`${label} exited with code ${code}`);
    stop(code || 1);
  });
  children.push(child);
};

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 250).unref();
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
start(process.execPath, ["--import", "tsx", "server/index.ts"], "backend");
const frontend = spawn(process.execPath, ["./node_modules/vite/bin/vite.js", "--host", "127.0.0.1"], {
  stdio: "inherit",
  env: { ...process.env, VITE_SGP_BACKEND_ENABLED: "true", VITE_SGP_AI_API_BASE: "/api/sgp-ai", VITE_SGP_PARTNER_API_BASE: "/api/v1" }
});
frontend.on("exit", (code, signal) => {
  if (signal || code === 0) return;
  console.error(`frontend exited with code ${code}`);
  stop(code || 1);
});
children.push(frontend);
