#!/usr/bin/env bun
/**
 * App pages must use ResponsiveSelect — not raw <select> or shadcn Select imports.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(scriptDir, "..");
const srcRoot = join(frontendRoot, "src");

const ALLOWED_SELECT_TAG = join("src", "components", "ResponsiveSelect.tsx");
const ALLOWED_UI_SELECT = join("src", "components", "ui", "select.tsx");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "api" && dir === srcRoot) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, out);
    } else if (/\.(tsx|ts)$/.test(name)) {
      if (path.includes(`${join("src", "api", "generated")}`)) continue;
      out.push(path);
    }
  }
  return out;
}

function main() {
  const files = walk(srcRoot);
  const issues: string[] = [];

  for (const file of files) {
    const rel = relative(frontendRoot, file);
    const text = readFileSync(file, "utf8");
    const lines = text.split("\n");

    if (rel !== ALLOWED_SELECT_TAG && /<select[\s>]/.test(text)) {
      for (let i = 0; i < lines.length; i++) {
        if (/<select[\s>]/.test(lines[i])) {
          issues.push(`${rel}:${i + 1}  raw <select> — use ResponsiveSelect`);
        }
      }
    }

    if (
      rel !== ALLOWED_UI_SELECT &&
      rel !== ALLOWED_SELECT_TAG &&
      text.includes('@/components/ui/select')
    ) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("@/components/ui/select")) {
          issues.push(
            `${rel}:${i + 1}  import from @/components/ui/select — use ResponsiveSelect`,
          );
        }
      }
    }
  }

  if (issues.length > 0) {
    console.error("Disallowed select usage:\n");
    for (const line of issues) {
      console.error(`  ${line}`);
    }
    console.error(
      "\nUse ResponsiveSelect in app code (native on coarse pointer, shadcn on desktop).",
    );
    process.exit(1);
  }
  console.log("Select usage conforms to ResponsiveSelect.");
}

if (import.meta.main) {
  main();
}
