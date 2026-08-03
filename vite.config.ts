import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || "/",
  server: {
    proxy: {
      "/api/sgp-ai": {
        target: process.env.SGP_BACKEND_URL || "http://127.0.0.1:8787",
        changeOrigin: true
      },
      "/api": {
        target: process.env.SGP_BACKEND_URL || "http://127.0.0.1:8787",
        changeOrigin: true
      }
    }
  },
  build: { sourcemap: process.env.SOURCE_MAPS === "true" }
});
