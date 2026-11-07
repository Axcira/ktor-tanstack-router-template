import { writeFileSync } from "node:fs";
import { join } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";
import { resolveBuildVersion } from "./scripts/build-version";

const appVersion = resolveBuildVersion();

function versionJsonPlugin(): Plugin {
  return {
    name: "version-json",
    apply: "build",
    closeBundle() {
      const outDir = join(process.cwd(), "dist");
      writeFileSync(
        join(outDir, "version.json"),
        `${JSON.stringify(appVersion, null, 2)}\n`,
      );
    },
  };
}

const config = defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "jotai"],
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
    versionJsonPlugin(),
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
