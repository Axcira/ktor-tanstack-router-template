import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "jotai"],
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    server: {
      deps: {
        // The package's ESM imports omit file extensions. Node cannot load
        // that, so Vitest must bundle it instead of externalizing it.
        inline: ["@material/material-color-utilities"],
      },
    },
  },
});

export default config;
