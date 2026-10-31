#!/usr/bin/env bun
/**
 * Ensures Tailwind radius classes stick to the 4-level scale (+ pill / none).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(scriptDir, "..");
const srcRoot = join(frontendRoot, "src");

const ALLOWED_SIZE = new Set(["sm", "md", "lg", "xl", "full", "none"]);
const CORNERS = ["t", "b", "l", "r", "s", "e", "tl", "tr", "bl", "br"];

const ROUNDED_RE =
  /(?:^|[\s"'`])((?:[a-z0-9_-]+:)*rounded(?:-[a-z0-9\[\]-]+)?)/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "api" && dir === srcRoot) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, out);
    } else if (/\.(tsx|ts|css)$/.test(name)) {
      if (path.includes(`${join("src", "api", "generated")}`)) continue;
      out.push(path);
    }
  }
  return out;
}

function validateToken(token: string): string | null {
  const bare = token.replace(/^[a-z0-9_-]+:/, "");
  if (bare === "rounded") {
    return "use rounded-sm|md|lg|xl|full|none instead of bare rounded";
  }
  if (bare.includes("[")) {
    return "arbitrary radius is not allowed (rounded-[…])";
  }
  const rest = bare.slice("rounded-".length);
  if (!rest) return null;
  if (ALLOWED_SIZE.has(rest)) return null;
  if (["2xl", "3xl", "4xl"].includes(rest)) {
    return `rounded-${rest} is not in the shape scale`;
  }
  for (const corner of CORNERS) {
    if (rest.startsWith(`${corner}-`)) {
      const size = rest.slice(corner.length + 1);
      if (ALLOWED_SIZE.has(size)) return null;
      if (["2xl", "3xl", "4xl"].includes(size)) {
        return `rounded-${rest} is not in the shape scale`;
      }
      return `rounded-${rest} uses disallowed size "${size}"`;
    }
  }
  return `unrecognized radius class "${bare}"`;
}

function checkFile(path: string): { line: number; token: string; reason: string }[] {
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n");
  const issues: { line: number; token: string; reason: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const match of line.matchAll(ROUNDED_RE)) {
      const token = match[1];
      const reason = validateToken(token);
      if (reason) {
        issues.push({ line: i + 1, token, reason });
      }
    }
  }
  return issues;
}

function main() {
  const files = walk(srcRoot);
  const all: { file: string; line: number; token: string; reason: string }[] =
    [];
  for (const file of files) {
    for (const issue of checkFile(file)) {
      all.push({ file: relative(frontendRoot, file), ...issue });
    }
  }
  if (all.length > 0) {
    console.error("Disallowed border-radius classes found:\n");
    for (const { file, line, token, reason } of all) {
      console.error(`  ${file}:${line}  ${token}  — ${reason}`);
    }
    console.error(
      `\nAllowed: rounded-sm|md|lg|xl|full|none and directional variants (e.g. rounded-t-lg).`,
    );
    process.exit(1);
  }
  console.log("Radius classes conform to the shape scale.");
}

if (import.meta.main) {
  main();
}
