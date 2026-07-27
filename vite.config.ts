import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || "/",
  server: {
    proxy: {
      "/api/sgp-ai": {
        target: "https://sea-ai-api.azurewebsites.net",
        changeOrigin: true,
        headers: { Origin: "https://undp-data.github.io" },
        rewrite: (requestPath) => requestPath.replace(/^\/api\/sgp-ai/, "/pages/sgp-ai")
      }
    }
  },
  build: { sourcemap: process.env.SOURCE_MAPS === "true" }
});
