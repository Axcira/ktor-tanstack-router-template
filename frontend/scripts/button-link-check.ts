#!/usr/bin/env bun
/**
 * Navigation must stay a link. Base UI Button sets role="button" when it
 * renders a non-button, so a Button whose render prop or children are a
 * <Link> or <a> is rejected.
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

const ANCHOR_ELEMENT = /<Link(?:[\s>/]|$)|<a(?:[\s>/]|$)/;

/** `<Button>` whose render prop or element body contains a `<Link>` or `<a>`. */
export function buttonLinkIssuesInSource(text: string): ButtonLinkIssue[] {
  const issues: ButtonLinkIssue[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = indexOfButtonTag(text, i);
    if (idx === -1) break;
    const openEnd = endOfOpeningTag(text, idx);
    const opening = text.slice(idx, openEnd);
    const selfClosing = opening.trimEnd().endsWith("/>");
    let bodyHasAnchor = false;
    let nextIndex = openEnd;
    if (!selfClosing) {
      const close = findMatchingClose(text, openEnd);
      bodyHasAnchor = ANCHOR_ELEMENT.test(text.slice(openEnd, close.start));
      nextIndex = close.end;
    }
    if (renderPointsAtAnchor(opening) || bodyHasAnchor) {
      issues.push({
        line: text.slice(0, idx).split("\n").length,
        message:
          "<Button> must not render a <Link> or <a>, including as a child. Use ButtonLink.",
      });
    }
    i = Math.max(nextIndex, idx + "<Button".length);
  }
  return issues;
}

function indexOfButtonTag(text: string, from: number): number {
  let i = from;
  while (i < text.length) {
    const idx = text.indexOf("<Button", i);
    if (idx === -1) return -1;
    const next = text[idx + "<Button".length];
    if (!next || !/[A-Za-z0-9_$]/.test(next)) return idx;
    i = idx + "<Button".length;
  }
  return -1;
}

function renderPointsAtAnchor(openingTag: string): boolean {
  const renderAt = openingTag.search(/\brender\s*=/);
  if (renderAt === -1) return false;
  return ANCHOR_ELEMENT.test(openingTag.slice(renderAt));
}

function findMatchingClose(
  source: string,
  from: number,
): { start: number; end: number } {
  let depth = 1;
  let i = from;
  let quote: string | null = null;
  while (i < source.length) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      i++;
      continue;
    }
    if (source.startsWith("</Button", i) && isTagBoundary(source, i + "</Button".length)) {
      depth--;
      const gt = source.indexOf(">", i);
      const end = gt === -1 ? source.length : gt + 1;
      if (depth === 0) return { start: i, end };
      i = end;
      continue;
    }
    if (source.startsWith("<Button", i) && isTagBoundary(source, i + "<Button".length)) {
      const openEnd = endOfOpeningTag(source, i);
      if (!source.slice(i, openEnd).trimEnd().endsWith("/>")) depth++;
      i = openEnd;
      continue;
    }
    i++;
  }
  return { start: source.length, end: source.length };
}

function isTagBoundary(source: string, index: number): boolean {
  const next = source[index];
  return !next || !/[A-Za-z0-9_$]/.test(next);
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
