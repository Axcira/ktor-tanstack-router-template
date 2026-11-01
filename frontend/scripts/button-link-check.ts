#!/usr/bin/env bun
/**
 * Navigation must stay a link. Base UI Button sets role="button" when it
 * renders a non-button, so <Button render={<Link>}> / <a> is rejected.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(scriptDir, "..");
const srcRoot = join(frontendRoot, "src");

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

export type ButtonLinkIssue = { line: number; message: string };

/** Opening `<Button>` tags whose render prop is a `<Link>` or `<a>`. */
export function buttonLinkIssuesInSource(text: string): ButtonLinkIssue[] {
  const issues: ButtonLinkIssue[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = text.indexOf("<Button", i);
    if (idx === -1) break;
    const next = text[idx + "<Button".length];
    if (next && /[A-Za-z0-9_$]/.test(next)) {
      i = idx + "<Button".length;
      continue;
    }
    const end = endOfOpeningTag(text, idx);
    const tag = text.slice(idx, end);
    if (renderPointsAtAnchor(tag)) {
      issues.push({
        line: text.slice(0, idx).split("\n").length,
        message:
          "<Button render={<Link>}> or <a> is announced as a button. Use ButtonLink.",
      });
    }
    i = Math.max(end, idx + "<Button".length);
  }
  return issues;
}

function renderPointsAtAnchor(openingTag: string): boolean {
  const renderAt = openingTag.search(/\brender\s*=/);
  if (renderAt === -1) return false;
  const expr = openingTag.slice(renderAt);
  return /<Link(?:[\s>/]|$)/.test(expr) || /<a(?:[\s>/]|$)/.test(expr);
}

function endOfOpeningTag(source: string, start: number): number {
  let brace = 0;
  let paren = 0;
  let bracket = 0;
  let quote: string | null = null;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "{") brace++;
    else if (ch === "}" && brace > 0) brace--;
    else if (ch === "(") paren++;
    else if (ch === ")" && paren > 0) paren--;
    else if (ch === "[") bracket++;
    else if (ch === "]" && bracket > 0) bracket--;
    else if (ch === ">" && brace === 0 && paren === 0 && bracket === 0) {
      return i + 1;
    }
  }
  return source.length;
}

function main() {
  const issues: string[] = [];
  for (const file of walk(srcRoot)) {
    const rel = relative(frontendRoot, file);
    const text = readFileSync(file, "utf8");
    for (const issue of buttonLinkIssuesInSource(text)) {
      issues.push(`${rel}:${issue.line}  ${issue.message}`);
    }
  }

  if (issues.length > 0) {
    console.error("Disallowed button-as-link usage:\n");
    for (const line of issues) {
      console.error(`  ${line}`);
    }
    console.error(
      "\nStyle the router Link with ButtonLink (buttonVariants) so it stays an anchor.",
    );
    process.exit(1);
  }
  console.log("Button links use ButtonLink.");
}

if (import.meta.main) {
  main();
}
