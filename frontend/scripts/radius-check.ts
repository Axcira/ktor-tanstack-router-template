#!/usr/bin/env bun
/**
 * Ensures Tailwind radius classes stick to the 4-level scale (+ pill / none).
 *
 * Variant prefixes are stripped at the last top-level `:`, so colons inside
 * `[]` (arbitrary variants, data attributes) stay with the prefix. Leading and
 * trailing `!` on the utility are ignored.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(scriptDir, "..");
const srcRoot = join(frontendRoot, "src");

const ALLOWED_SIZE = new Set(["sm", "md", "lg", "xl", "full", "none"]);
const CORNERS = ["t", "b", "l", "r", "s", "e", "tl", "tr", "bl", "br"];

export type RadiusIssue = {
  line: number;
  token: string;
  reason: string;
};

/** Split source into class-like tokens, keeping `[...]` groups intact. */
export function classTokens(source: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let current = "";
  const flush = () => {
    if (current) tokens.push(current);
    current = "";
  };
  for (const ch of source) {
    if (ch === "[") {
      depth++;
      current += ch;
      continue;
    }
    if (ch === "]" && depth > 0) {
      depth--;
      current += ch;
      continue;
    }
    if (depth === 0 && /[\s"'`{}(),;=]/.test(ch)) {
      flush();
      continue;
    }
    current += ch;
  }
  flush();
  return tokens;
}

/** Utility name after the last top-level variant `:`, without `!`, or null if it does not start with `rounded`. */
export function radiusUtility(classToken: string): string | null {
  let depth = 0;
  let lastColon = -1;
  for (let i = 0; i < classToken.length; i++) {
    const ch = classToken[i];
    if (ch === "[") depth++;
    else if (ch === "]" && depth > 0) depth--;
    else if (ch === ":" && depth === 0) lastColon = i;
  }
  let segment =
    lastColon === -1 ? classToken : classToken.slice(lastColon + 1);
  segment = segment.replace(/^!+/, "").replace(/!+$/, "");
  if (!segment.startsWith("rounded")) return null;
  return segment;
}

/**
 * Check an extracted `rounded` utility against the shape scale.
 * Returns a reason for a disallowed utility, or null when no issue is found.
 */
export function validateRadiusUtility(utility: string): string | null {
  if (utility === "rounded") {
    return "use rounded-sm|md|lg|xl|full|none instead of bare rounded";
  }
  if (utility.includes("[")) {
    return "arbitrary radius is not allowed (rounded-[…])";
  }
  const rest = utility.slice("rounded-".length);
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
  return `unrecognized radius class "${utility}"`;
}

/**
 * Scan source text for disallowed radius tokens, including tokens in comments.
 * Each issue includes its original token and 1-based line number.
 */
export function radiusIssuesInSource(text: string): RadiusIssue[] {
  const issues: RadiusIssue[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const token of classTokens(lines[i])) {
      const utility = radiusUtility(token);
      if (!utility) continue;
      const reason = validateRadiusUtility(utility);
      if (reason) issues.push({ line: i + 1, token, reason });
    }
  }
  return issues;
}

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

function main() {
  const files = walk(srcRoot);
  const all: (RadiusIssue & { file: string })[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const issue of radiusIssuesInSource(text)) {
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
