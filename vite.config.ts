import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    target: ["chrome107", "safari16"],
    outDir: "build/client",
    emptyOutDir: true,
    chunkSizeWarningLimit: 500,
  },
  publicDir: "public",
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:4173",
      "/auth": "http://127.0.0.1:4173",
      "/library": "http://127.0.0.1:4173",
    },
  },
});
