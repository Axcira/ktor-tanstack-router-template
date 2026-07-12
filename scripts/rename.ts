#!/usr/bin/env -S bun run
/**
 * rename.ts — rename project identity (package, slug, display name).
 *
 * Usage:
 *   bun scripts/rename.ts --help
 *   bun scripts/rename.ts --package com.example.myapp [--write]
 *   bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App" [--write]
 *
 * Default: dry-run (--write required to mutate).
 *
 * SAFEGUARDS:
 *   - All validation runs before any file is written.
 *   - All replacement content is prepared in memory, then written once
 *     before directory moves (clean Git remains the recovery boundary).
 *   - Unknown/duplicate flags, missing values, control characters, and
 *     positional arguments are rejected early.
 *   - Every expected source literal is verified before write; partial
 *     drift (missing old slug/artifact/display value) is a hard error.
 *   - A clean Git worktree is required for --write (unless --allow-dirty).
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, readdirSync } from "fs";
import { join, dirname, relative } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// ── Resolve root ─────────────────────────────────────────────────────────────

const ROOT_DIR = dirname(fileURLToPath(import.meta.url)); // scripts/
const rootDir = join(ROOT_DIR, "..");

function resolve(...parts: string[]) {
  return join(rootDir, ...parts);
}

// ── CLI parsing ──────────────────────────────────────────────────────────────

const KNOWN_FLAGS = new Set([
  "--package", "--slug", "--name", "--api-title",
  "--write", "--allow-dirty", "--help", "-h",
]);

const args = process.argv.slice(2);

// --help / -h: succeed before any validation
if (args.includes("--help") || args.includes("-h")) {
  showHelp();
}

function showHelp(exitCode = 0) {
  const help = `
bun scripts/rename.ts — rename project identity

USAGE:
  bun scripts/rename.ts [OPTIONS] [--write]

OPTIONS:
  --package <reverse.dns.package>  (Required) New Kotlin package, e.g. com.example.myapp.
                                     Replaces "net.axcira" everywhere in source, config,
                                     and docs.  Directories are moved accordingly.

  --slug <lowercase-hyphen-slug>   (Optional) New project slug, e.g. "my-app".
                                     Replaces "ktor-tanstack-router-template" in Worker
                                     name, docs, welcome message, Gradle project name,
                                     artifact paths, and related metadata.
                                     Must match: ^[a-z][a-z0-9-]*$

  --name <human display name>      (Optional) New display name, e.g. "My App".
                                     Updates index.html <title>, .idea/.name,
                                     manifest.json, README H1, OpenAPI title,
                                     and other user-facing labels.

  --api-title <string>             (Optional) OpenAPI title.  Defaults to --name
                                     when --name is given, otherwise "My API".

  --write                           Perform changes.  Without this flag the script
                                     runs in dry-run mode and prints planned operations.

  --allow-dirty                     Allow mutation when the Git worktree is dirty
                                     (only relevant with --write).

  --help, -h                        Show this message.

EXAMPLES:
  # Dry-run (safe — previews all changes)
  bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App"

  # Full rename with write (requires clean Git worktree)
  bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App" --write

  # Package + slug without display name
  bun scripts/rename.ts --package com.example.myapp --slug my-app --write

RENAME ORDER:
  1. Validate all inputs and source roots before touching anything.
  2. Package identity (net.axcira → new package):
     - Rewrite imports / FQNs in Kotlin sources, YAML configs, docs
     - Rewrite build.gradle.kts (group, mainClass, tablesPackage)
     - Move package directories
  3. Slug identity (ktor-tanstack-router-template → new slug):
     - Worker name, welcome message, docs, Gradle project name
     - Artifact paths (Dockerfile, README, AGENTS)
     - frontend/package.json, .cta.json
  4. Display name:
     - .idea/.name, index.html title, manifest.json
     - README H1, OpenAPI title
  5. Print post-rename instructions.
`;
  console.log(help);
  process.exit(exitCode);
}

// ── Validate CLI structure ───────────────────────────────────────────────────

// Reject positional arguments (no stray non-flag values)
const FLAG_NAMES = [...KNOWN_FLAGS];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  // Flags that accept a following value
  const takesValue = ["--package", "--slug", "--name", "--api-title"].includes(a);
  // Flag with = already consumed; the value after the = is not a flag
  // Skip the value after a takes-value flag
  if (takesValue && i + 1 < args.length) {
    i++; // skip value in next iteration
    continue;
  }
  // At this point we should only see flags, not bare words
  if (!a.startsWith("--") && a !== "") {
    console.error(`Error: unexpected positional argument "${a}".`);
    process.exit(1);
  }
}

// Reject unknown flags and detect duplicates
const seenFlags = new Set<string>();
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith("--") && a !== "" && !KNOWN_FLAGS.has(a)) continue;
  // Split --x=value into flag name
  const flagName = a.includes("=") ? a.split("=")[0] : a;
  if (flagName === "-h") continue; // -h can't be duplicated meaningfully
  if (flagName.startsWith("--") && !KNOWN_FLAGS.has(flagName)) {
    console.error(`Error: unknown flag "${flagName}". Use --help to see valid options.`);
    process.exit(1);
  }
  if (seenFlags.has(flagName)) {
    console.error(`Error: duplicate flag "${flagName}".`);
    process.exit(1);
  }
  seenFlags.add(flagName);
  // Skip value for flags that take an argument
  if (["--package", "--slug", "--name", "--api-title"].includes(flagName)) {
    if (a.includes("=")) continue; // value is part of this arg
    i++; // skip next arg (the value)
  }
}

// ── Extract values ───────────────────────────────────────────────────────────

function getFlag(name: string): string | undefined {
  // prefer --x=value form
  for (const a of args) {
    if (a.startsWith(`${name}=`)) return a.slice(name.length + 1);
  }
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) {
    const val = args[idx + 1];
    if (val.startsWith("--")) {
      console.error(`Error: --flag "${name}" appears to be missing its value (next token "${val}" starts with --). Use --x=value form if the value itself begins with --.`);
      process.exit(1);
    }
    return val;
  }
  return undefined;
}

const optPackage = getFlag("--package");
const optSlug = getFlag("--slug");
const optName = getFlag("--name");
const optApiTitle = getFlag("--api-title");
const optWrite = args.includes("--write");
const optAllowDirty = args.includes("--allow-dirty");

if (optAllowDirty && !optWrite) {
  console.error("Error: --allow-dirty is only meaningful with --write.");
  process.exit(1);
}

if (!optPackage) {
  console.error("Error: --package is required.");
  showHelp(1);
}

// ── Validate format ──────────────────────────────────────────────────────────

const pkgPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/;
if (!pkgPattern.test(optPackage)) {
  console.error(
    `Error: --package "${optPackage}" is not a valid reverse-DNS package name.`,
    `Expected format: "com.example.myapp"`,
  );
  process.exit(1);
}

const slugPattern = /^[a-z][a-z0-9-]*$/;
if (optSlug && !slugPattern.test(optSlug)) {
  console.error(
    `Error: --slug "${optSlug}" is not valid.`,
    `Must match ^[a-z][a-z0-9-]*$ (lowercase, hyphens and digits allowed, cannot start with digit/hyphen).`,
  );
  process.exit(1);
}

// Validate nonempty names, single-line, no control characters (include tab/LF/CR)
function validateSafeString(label: string, value: string | undefined, allowEmpty = false) {
  if (value === undefined || value === "") {
    if (!allowEmpty) {
      console.error(`Error: --${label} value must not be empty.`);
      process.exit(1);
    }
    return;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(value)) {
    console.error(`Error: --${label} value contains control or non-printable characters (tab, newline, etc.). Single-line text only.`);
    process.exit(1);
  }
  if (value.includes("\n") || value.includes("\r")) {
    console.error(`Error: --${label} value must be a single line.`);
    process.exit(1);
  }
}
validateSafeString("package", optPackage);
validateSafeString("slug", optSlug, true);
validateSafeString("name", optName, true);
validateSafeString("api-title", optApiTitle, true);

// ── Constants ────────────────────────────────────────────────────────────────

const OLD_PKG = "net.axcira";
const OLD_SLUG = "ktor-tanstack-router-template";
const OLD_API_TITLE = "My API";
const OLD_PROJECT_NAME = "backend";
const OLD_ARTIFACT = "backend-all.jar";
const OLD_FRONTEND_PKG_NAME = "frontend";
const OLD_IDEA_NAME = "Ktor TanStack Router Template";
const OLD_README_H1 = "Axcira Development Template";

const newPkg = optPackage;
const newSlug = optSlug ?? OLD_SLUG;
const newName = optName;
const newApiTitle = optApiTitle ?? (newName ? newName : OLD_API_TITLE);
const newProjectName = optSlug ? `${newSlug}-backend` : OLD_PROJECT_NAME;
const newArtifact = optSlug ? `${newSlug}-backend-all.jar` : OLD_ARTIFACT;
const newFrontendPkgName = optSlug ? `${newSlug}-frontend` : OLD_FRONTEND_PKG_NAME;

const oldPkgPath = OLD_PKG.replaceAll(".", "/");
const newPkgPath = newPkg.replaceAll(".", "/");

// ── Helper functions ─────────────────────────────────────────────────────────

function fileContains(filePath: string, search: string): boolean {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) return false;
  return readFileSync(resolved, "utf-8").includes(search);
}

/** Escape a Kotlin string literal — backslash, quote, dollar, and control chars */
function escapeKotlinString(s: string): string {
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x20 || cp === 0x7F) {
      out += `\\u${cp.toString(16).padStart(4, "0")}`;
    } else if (ch === "\\") out += "\\\\";
    else if (ch === '"') out += '\\"';
    else if (ch === "$") out += "\\$";
    else out += ch;
  }
  return out;
}

/** Escape text for HTML body content: &, <, > */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Recursive collect .kt files ─────────────────────────────────────────────

function collectKtFiles(dir: string): string[] {
  const result: string[] = [];
  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".kt")) {
        result.push(relative(rootDir, full));
      }
    }
  }
  if (existsSync(dir)) walk(dir);
  return result;
}

const kotlinFiles: string[] = [];
for (const base of ["backend/src/main/kotlin", "backend/src/test/kotlin"]) {
  kotlinFiles.push(...collectKtFiles(resolve(base, oldPkgPath)));
}

// ── Manifests ────────────────────────────────────────────────────────────────

const PACKAGE_MANIFEST: [string, string][] = [
  ["backend/src/main/resources/application.yaml", OLD_PKG],
  ["backend/src/test/resources/test.application.yaml", OLD_PKG],
  ["backend/build.gradle.kts", OLD_PKG],
  ["README.md", OLD_PKG],
  ["AGENTS.md", OLD_PKG],
];

const SLUG_MANIFEST: [string, string][] = [
  ["frontend/wrangler.jsonc", OLD_SLUG],
  ["frontend/src/features/dashboard/components/WelcomeMessage.tsx", OLD_SLUG],
  ["README.md", OLD_SLUG],
];

const ARTIFACT_MANIFEST: [string, string][] = [
  ["backend/Dockerfile", OLD_ARTIFACT],
  ["README.md", OLD_ARTIFACT],
  ["AGENTS.md", OLD_ARTIFACT],
];

// ── Build ops & validate preconditions ───────────────────────────────────────

interface FileOp {
  path: string;
  type: "text" | "move";
  description: string;
}

const ops: FileOp[] = [];
const validationErrors: string[] = [];

// --- Package ops ---

if (newPkg !== OLD_PKG) {
  for (const f of kotlinFiles) {
    if (fileContains(f, OLD_PKG)) {
      ops.push({ path: f, type: "text", description: `Replace package references in ${f}` });
    }
  }

  for (const [f] of PACKAGE_MANIFEST) {
    if (fileContains(f, OLD_PKG)) {
      ops.push({ path: f, type: "text", description: `Replace ${OLD_PKG} references in ${f}` });
    }
  }

  for (const base of ["backend/src/main/kotlin", "backend/src/test/kotlin"]) {
    const src = resolve(base, oldPkgPath);
    if (existsSync(src)) {
      ops.push({
        path: `${base}/${oldPkgPath} → ${base}/${newPkgPath}`,
        type: "move",
        description: `Move ${base}/${oldPkgPath} → ${base}/${newPkgPath}`,
      });
    }
  }
}

// OpenAPI title
const openApiRel = `backend/src/main/kotlin/${oldPkgPath}/plugins/OpenApi.kt`;
if (existsSync(resolve(openApiRel)) && (newName !== undefined || newApiTitle !== OLD_API_TITLE)) {
  ops.push({ path: openApiRel, type: "text", description: `Update OpenAPI title to "${newApiTitle}"` });
}

// --- Slug ops ---
const slugActive = optSlug && newSlug !== OLD_SLUG;
if (slugActive) {
  for (const [f] of SLUG_MANIFEST) {
    if (fileContains(f, OLD_SLUG)) {
      ops.push({ path: f, type: "text", description: `Replace slug "${OLD_SLUG}" → "${newSlug}" in ${f}` });
    }
  }
  for (const [f] of ARTIFACT_MANIFEST) {
    if (fileContains(f, OLD_ARTIFACT)) {
      ops.push({ path: f, type: "text", description: `Replace artifact "${OLD_ARTIFACT}" → "${newArtifact}" in ${f}` });
    }
  }
  ops.push({ path: "backend/settings.gradle.kts", type: "text", description: `Update rootProject.name to "${newProjectName}"` });
  ops.push({ path: "frontend/package.json", type: "text", description: `Update frontend/package.json name to "${newFrontendPkgName}"` });
  ops.push({ path: "frontend/.cta.json", type: "text", description: `Update .cta.json projectName to "${newFrontendPkgName}"` });
}

// --- Display-name ops ---
if (newName) {
  if (fileContains(".idea/.name", OLD_IDEA_NAME)) {
    ops.push({ path: ".idea/.name", type: "text", description: `Update IntelliJ project name to "${newName}"` });
  }
  if (fileContains("frontend/index.html", "<title>")) {
    ops.push({ path: "frontend/index.html", type: "text", description: `Update <title> to "${newName}"` });
  }
  const manifestPath = "frontend/public/manifest.json";
  if (existsSync(resolve(manifestPath))) {
    ops.push({ path: manifestPath, type: "text", description: `Update manifest.json name to "${newName}"` });
  }
  ops.push({ path: "README.md", type: "text", description: `Update README H1 to "${newName}"` });
}

// ── Validate source file existence & expected literals ───────────────────────

// Package: every file must exist and contain OLD_PKG
for (const f of kotlinFiles) {
  if (!existsSync(resolve(f))) {
    validationErrors.push(`Expected Kotlin file not found: ${f}.`);
    continue;
  }
  if (!fileContains(f, OLD_PKG)) {
    validationErrors.push(`Expected "${OLD_PKG}" not found in ${f}.`);
  }
}
for (const [f, lit] of PACKAGE_MANIFEST) {
  if (!existsSync(resolve(f))) {
    validationErrors.push(`Expected file not found: ${f}.`);
    continue;
  }
  if (!fileContains(f, lit)) {
    validationErrors.push(`Expected "${lit}" not found in ${f}.`);
  }
}

// Slug/artifact: ALL files must exist and contain expected literal
if (slugActive) {
  for (const [f, lit] of SLUG_MANIFEST) {
    if (!existsSync(resolve(f))) {
      validationErrors.push(`Expected file not found: ${f}.`);
      continue;
    }
    if (!fileContains(f, lit)) {
      validationErrors.push(`Expected slug "${lit}" not found in ${f}. File may have already been renamed.`);
    }
  }
  for (const [f, lit] of ARTIFACT_MANIFEST) {
    if (!existsSync(resolve(f))) {
      validationErrors.push(`Expected file not found: ${f}.`);
      continue;
    }
    if (!fileContains(f, lit)) {
      validationErrors.push(`Expected artifact "${lit}" not found in ${f}. File may have already been renamed.`);
    }
  }
}

// Display-name preconditions
if (newName) {
  if (existsSync(resolve(".idea/.name"))) {
    const ideaName = readFileSync(resolve(".idea/.name"), "utf-8").trim();
    if (ideaName !== OLD_IDEA_NAME) {
      validationErrors.push(
        `Expected .idea/.name to be "${OLD_IDEA_NAME}" but found "${ideaName}".`,
      );
    }
  }
  const htmlPath = resolve("frontend/index.html");
  if (existsSync(htmlPath)) {
    const html = readFileSync(htmlPath, "utf-8");
    if (!/<title>.*?<\/title>/.test(html)) {
      validationErrors.push("frontend/index.html does not contain a <title> tag.");
    }
  }
  if (!existsSync(resolve("README.md"))) {
    validationErrors.push("Expected file not found: README.md.");
  } else if (fileContains("README.md", OLD_README_H1)) {
    // OK
  } else {
    // Check if already renamed
    const readme = readFileSync(resolve("README.md"), "utf-8");
    const h1Match = readme.match(/^#\s+(.+)$/m);
    if (h1Match && h1Match[1] !== OLD_README_H1) {
      validationErrors.push(
        `README.md H1 is "${h1Match[1]}", expected "${OLD_README_H1}". File may have already been renamed.`,
      );
    }
  }
}

// OpenAPI-title precondition (also applies to --api-title without --name)
if (newApiTitle !== OLD_API_TITLE) {
  if (existsSync(resolve(openApiRel))) {
    const content = readFileSync(resolve(openApiRel), "utf-8");
    if (!content.includes(`OpenApiInfo("${OLD_API_TITLE}", "1.0")`)) {
      // It may have already been renamed or use a different title
      const match = content.match(/OpenApiInfo\("([^"]*)",\s*"1\.0"\)/);
      if (match && match[1] !== OLD_API_TITLE) {
        validationErrors.push(
          `OpenAPI info title is "${match[1]}", expected "${OLD_API_TITLE}".`,
        );
      }
    }
  }
}

// Destination collisions & already-renamed detection
for (const base of ["backend/src/main/kotlin", "backend/src/test/kotlin"]) {
  const dst = resolve(base, newPkgPath);
  if (newPkg !== OLD_PKG && existsSync(dst)) {
    validationErrors.push(`Destination already exists: ${base}/${newPkgPath}. Refusing to overwrite.`);
  }
}

for (const base of ["backend/src/main/kotlin", "backend/src/test/kotlin"]) {
  const src = resolve(base, oldPkgPath);
  if (newPkg !== OLD_PKG && !existsSync(src)) {
    validationErrors.push(`Source not found: ${base}/${oldPkgPath}. Has the project already been renamed?`);
  }
}

if (newPkg !== OLD_PKG && !existsSync(resolve("backend/src/main/kotlin", oldPkgPath))) {
  if (existsSync(resolve("backend/src/main/kotlin", newPkgPath))) {
    validationErrors.push(
      `Old package root "net/axcira" not found but new path "${newPkgPath}" exists. ` +
      "The project appears to have already been renamed. Aborting.",
    );
  }
}

// Slug sub-validation
if (slugActive) {
  const settingsPath = resolve("backend/settings.gradle.kts");
  if (existsSync(settingsPath)) {
    const content = readFileSync(settingsPath, "utf-8");
    if (!content.includes(`rootProject.name = "${OLD_PROJECT_NAME}"`)) {
      validationErrors.push(
        `Expected rootProject.name = "${OLD_PROJECT_NAME}" not found in backend/settings.gradle.kts.`,
      );
    }
  }
  const pkgJsonPath = resolve("frontend/package.json");
  if (existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    if (pkg.name !== OLD_FRONTEND_PKG_NAME) {
      validationErrors.push(
        `frontend/package.json name is "${pkg.name}", expected "${OLD_FRONTEND_PKG_NAME}".`,
      );
    }
  }
  const ctaPath = resolve("frontend/.cta.json");
  if (existsSync(ctaPath)) {
    const cta = JSON.parse(readFileSync(ctaPath, "utf-8"));
    if (cta.projectName !== OLD_FRONTEND_PKG_NAME) {
      validationErrors.push(
        `frontend/.cta.json projectName is "${cta.projectName}", expected "${OLD_FRONTEND_PKG_NAME}".`,
      );
    }
  }
}

// ── Emit errors or continue ──────────────────────────────────────────────────

if (validationErrors.length > 0) {
  console.error("\n─── Validation errors ───────────────────────────────\n");
  for (const err of validationErrors) console.error(`  ✖ ${err}`);
  console.error("");
  process.exit(1);
}

// ── Print plan ───────────────────────────────────────────────────────────────

const isDirty = () => {
  try {
    const st = execSync("git status --porcelain", { cwd: rootDir, encoding: "utf-8" }).trim();
    return st.length > 0;
  } catch { return false; }
};

console.log(`\n─── Rename plan ──────────────────────────────────────\n`);
console.log(`  Old package:       ${OLD_PKG}`);
console.log(`  New package:       ${newPkg}`);
if (slugActive) {
  console.log(`  Old slug:          ${OLD_SLUG}`);
  console.log(`  New slug:          ${newSlug}`);
  console.log(`  Gradle project:    ${newProjectName}`);
  console.log(`  Artifact:          ${newArtifact}`);
  console.log(`  Frontend name:     ${newFrontendPkgName}`);
}
if (newName) console.log(`  New display name:  ${newName}`);
if (newApiTitle !== OLD_API_TITLE) console.log(`  New API title:     ${newApiTitle}`);
console.log("");

if (ops.length === 0) {
  console.log("  No changes needed — everything is up to date.\n");
  if (!optWrite) console.log("  (Pass --write to apply.)");
  process.exit(0);
}

for (const op of ops) {
  const icon = op.type === "move" ? "📦" : "✏️ ";
  console.log(`  ${icon} ${op.description}`);
}

const dirty = isDirty();
if (dirty) console.log(`\n  ⚠  Git worktree is dirty. Use --allow-dirty with --write to proceed.`);

console.log(`\n  Total: ${ops.length} operation(s)`);
console.log(`  Mode:  ${optWrite ? "WRITE" : "DRY-RUN (pass --write to apply)"}`);
console.log("");

if (!optWrite) { console.log(`  Pass --write to apply these changes.`); process.exit(0); }

// ── Dirty check ──────────────────────────────────────────────────────────────

if (dirty && !optAllowDirty) {
  console.error("Error: Git worktree is dirty. Commit/stash changes first, or use --allow-dirty.");
  process.exit(1);
}

// ── Build in-memory content map (all changes before any flush) ───────────────

const writeMap = new Map<string, string>();

function planReplace(filePath: string, search: string, replace: string): boolean {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) return false;
  const prev = writeMap.get(resolved) ?? readFileSync(resolved, "utf-8");
  if (!prev.includes(search)) return false;
  writeMap.set(resolved, prev.replaceAll(search, replace));
  return true;
}

function planReplaceRegex(filePath: string, pattern: RegExp, replacement: string): boolean {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) return false;
  const prev = writeMap.get(resolved) ?? readFileSync(resolved, "utf-8");
  const next = prev.replace(pattern, replacement);
  if (next === prev) return false;
  writeMap.set(resolved, next);
  return true;
}

console.log(`─── Applying changes ───────────────────────────────────\n`);

// 1. Package text replacements
if (newPkg !== OLD_PKG) {
  for (const f of kotlinFiles) {
    if (planReplace(f, OLD_PKG, newPkg)) console.log(`  ✓ Replaced package references in ${f}`);
  }
  for (const [f] of PACKAGE_MANIFEST) {
    if (planReplace(f, OLD_PKG, newPkg)) console.log(`  ✓ Replaced ${OLD_PKG} references in ${f}`);
  }
}

// 2. OpenAPI title (write to old path; will be moved below)
if (existsSync(resolve(openApiRel)) && (newName !== undefined || newApiTitle !== OLD_API_TITLE)) {
  const escaped = escapeKotlinString(newApiTitle);
  if (planReplaceRegex(
    openApiRel,
    /OpenApiInfo\("[^"]*",\s*"1\.0"\)/,
    `OpenApiInfo("${escaped}", "1.0")`,
  )) console.log(`  ✓ Updated OpenAPI title to "${newApiTitle}"`);
}

// 3. Slug replacements
if (slugActive) {
  for (const [f] of SLUG_MANIFEST) {
    if (planReplace(f, OLD_SLUG, newSlug)) console.log(`  ✓ Replaced slug in ${f}`);
  }
  for (const [f] of ARTIFACT_MANIFEST) {
    if (planReplace(f, OLD_ARTIFACT, newArtifact)) console.log(`  ✓ Replaced artifact in ${f}`);
  }
  planReplace("backend/settings.gradle.kts", `rootProject.name = "${OLD_PROJECT_NAME}"`, `rootProject.name = "${newProjectName}"`);
  console.log(`  ✓ Updated rootProject.name to "${newProjectName}"`);

  // frontend/package.json
  const pkgJsonPath = resolve("frontend/package.json");
  if (existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    pkg.name = newFrontendPkgName;
    writeMap.set(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`  ✓ Updated frontend/package.json name to "${newFrontendPkgName}"`);
  }

  // .cta.json
  const ctaPath = resolve("frontend/.cta.json");
  if (existsSync(ctaPath)) {
    const cta = JSON.parse(readFileSync(ctaPath, "utf-8"));
    cta.projectName = newFrontendPkgName;
    writeMap.set(ctaPath, JSON.stringify(cta, null, 2) + "\n");
    console.log(`  ✓ Updated .cta.json projectName to "${newFrontendPkgName}"`);
  }
}

// 4. Display name
if (newName) {
  const escapedHtml = escapeHtml(newName);

  // .idea/.name
  const dotIdea = resolve(".idea/.name");
  if (existsSync(dotIdea)) {
    writeMap.set(dotIdea, `${newName}\n`);
    console.log(`  ✓ Updated .idea/.name to "${newName}"`);
  }

  // index.html title
  const idxHtml = resolve("frontend/index.html");
  if (existsSync(idxHtml)) {
    const prev = writeMap.get(idxHtml) ?? readFileSync(idxHtml, "utf-8");
    writeMap.set(idxHtml, prev.replace(/<title>.*?<\/title>/, `<title>${escapedHtml}</title>`));
    console.log(`  ✓ Updated index.html <title> to "${newName}"`);
  }

  // manifest.json
  const manifestPath = resolve("frontend/public/manifest.json");
  if (existsSync(manifestPath)) {
    const prev = JSON.parse(writeMap.get(manifestPath) ?? readFileSync(manifestPath, "utf-8"));
    prev.name = newName;
    prev.short_name = newName;
    writeMap.set(manifestPath, JSON.stringify(prev, null, 2) + "\n");
    console.log(`  ✓ Updated manifest.json to "${newName}"`);
  }

  // README H1
  const readmePath = resolve("README.md");
  if (existsSync(readmePath)) {
    const prev = writeMap.get(readmePath) ?? readFileSync(readmePath, "utf-8");
    writeMap.set(readmePath, prev.replace(/^#\s+.*$/m, `# ${newName}`));
    console.log(`  ✓ Updated README H1 to "${newName}"`);
  }
}

// ── Single flush before directory moves ──────────────────────────────────────

for (const [filePath, content] of writeMap) {
  writeFileSync(filePath, content, "utf-8");
}
writeMap.clear();

// ── Move package directories ─────────────────────────────────────────────────

if (newPkg !== OLD_PKG) {
  for (const base of ["backend/src/main/kotlin", "backend/src/test/kotlin"]) {
    const src = resolve(base, oldPkgPath);
    const dst = resolve(base, newPkgPath);
    if (existsSync(src)) {
      mkdirSync(dirname(dst), { recursive: true });
      renameSync(src, dst);
      console.log(`  📦 Moved ${base}/${oldPkgPath} → ${base}/${newPkgPath}`);
    }
  }
}

// ── Post-rename instructions ─────────────────────────────────────────────────

console.log(`\n─── Post-rename steps ─────────────────────────────────\n`);
console.log(`  1. Update IDE configuration:`);
console.log(`     IntelliJ: File → Reload All From Disk, then refresh Gradle`);
if (slugActive) {
  console.log(`     Also rename the parent directory if desired:`);
  console.log(`       mv "${OLD_SLUG}" "${newSlug}"`);
}
console.log("");
console.log(`  2. Regenerate generated files:`);
console.log(`     cd backend  && ./gradlew generateOpenApiJson`);
console.log(`     cd frontend && bun run orval:gen`);
console.log("");
console.log(`  3. Run verification:`);
console.log(`     cd backend  && ./gradlew test`);
console.log(`     cd frontend && bun run check && bun run build`);
console.log(`     cd frontend && bunx wrangler deploy --dry-run`);
console.log("");
console.log(`  Done!`);
