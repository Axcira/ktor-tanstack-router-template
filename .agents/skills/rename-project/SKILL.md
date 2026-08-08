---
name: rename-project
description: Use when renaming the project identity — Kotlin package, slug, or display name
---

# rename-project

Rename the project identity — package (`net.axcira`), slug
(`ktor-tanstack-router-template`), and/or display name — using the automated
`scripts/rename.ts` script.  All validation runs before any file is written,
and a dry-run is **always** required before applying changes.

## Scope

- **Package**: Replace `net.axcira` with a new reverse-DNS package name in
  all Kotlin sources under `main` / `test` / `codegen`, YAML configs, build
  configs, and docs.  Package directories are moved accordingly.
- **Slug**: Replace `ktor-tanstack-router-template` in Worker name, docs,
  project name, artifact paths, and metadata.
- **Display name**: Update `index.html <title>`, `manifest.json`, IntelliJ
  project name, README H1, and OpenAPI title.
- Does **not** automatically edit `workspace.xml`, `.iml` files, Git
  history, or rename the parent directory.
- Does **not** generate or regenerate the API client or route tree — those
  are post-rename steps printed by the script.

## Prerequisites

- **Bun** — verify with `bun --version`.
- **Clean Git worktree** (unless `--allow-dirty` is explicitly chosen).
  Check with `git status --porcelain`.
- **Existing old identity** present in the source tree — the script
  validates that the expected old values still exist before making changes.
- The script is run from the **repository root**, not from a subdirectory.

## Steps

1. **Dry-run (required first)**

   ```bash
   bun scripts/rename.ts --package <new.package> [--slug <new-slug>] [--name "New Name"] [--api-title "New API Title"]
   ```

   Example:

   ```bash
   bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App"
   ```

   The script prints all planned changes without touching any files:

   - Old and new package / slug / name
   - Each file that will be rewritten
   - Directory moves that will be performed
   - Whether the Git worktree is dirty

2. **Inspect the dry-run output**

   Verify:

   - The package format is correct (`com.example.myapp` — lowercase, dots)
   - The slug is valid (`my-app` — lowercase, hyphens/digits allowed)
   - The display name is correct
   - No unexpected files appear in the plan

3. **Confirm with the user**

   ```
   ?  Apply the rename plan above?  (y/N)
   ```

   The skill **must** pause and require explicit keyboard confirmation.
   Default is No.  Abort if the response is anything other than `y`/`yes`.

4. **Apply the rename**

   ```bash
   bun scripts/rename.ts --package <new.package> [--slug <new-slug>] [--name "New Name"] [--api-title "New API Title"] [--write]
   ```

   Add `--write` to the same flags used in the dry-run.  If the worktree is
   dirty and this was explicitly accepted, also add `--allow-dirty`.

   The script:

   1. Re-validates all inputs and source roots
   2. Prepares all replacements in memory (validation pass)
   3. Performs sequential file writes
   4. Moves package directories
   5. Clean Git remains the recovery boundary — inspect `git diff` after
      completion

5. **Post-rename actions (manual)**

   After the script completes, advise the user to:

   1. Reload the IntelliJ project (File → Reload All From Disk, refresh
      Gradle).
   2. Rename the parent directory if desired (`mv old-slug new-slug`).
   3. Regenerate the API client and run verification:

      ```bash
      (cd backend  && ./gradlew generateOpenApiJson)
      (cd frontend && bun run orval:gen)
      (cd frontend && bun run check && bun run build)
      ```

## Confirmation / destructive boundaries

- **Dry-run is mandatory** before any `--write` invocation.
- The skill does **not** edit `workspace.xml`, `.iml` files, Git history,
  or rename the parent directory automatically.
- A **clean Git worktree is required** by default.  `--allow-dirty` is only
  acceptable when the user explicitly chooses it after being informed of the
  risk.
- The script cannot be undone by the tool — advise the user to inspect
  `git diff` and commit if satisfied.
- Generated files (`src/routeTree.gen.ts`, `src/api/generated/`) are
  excluded from the rename scope and must be regenerated after renaming.

## Verification

- Run `git diff --stat` to review all changed files.
- Verify the old package string no longer appears in source:

  ```bash
  grep -r "net\.axcira" backend/src frontend/ --include="*.kt" --include="*.yaml" --include="*.kts" --include="*.md" --include="*.jsonc" || echo "No old package references found"
  ```

- Verify the new package directories exist:

  ```bash
  ls backend/src/main/kotlin/com/example/myapp/
  ```

- Run `bun run check && bun run build` in `frontend/` and
  `./gradlew test` in `backend/` after regenerating the API client. Backend
  tests require Docker for Testcontainers.

## Safe failure

| Failure | Behaviour |
|---------|-----------|
| Missing `--package` flag | Script exits with error and prints help — required argument |
| Invalid package format | Script exits with format validation error |
| Dirty worktree without `--allow-dirty` | Script exits with clear message; clean or re-run with `--allow-dirty` |
| Old identity not found (already renamed) | Script detects this and aborts with diagnostic message |
| Destination package already exists | Script refuses to overwrite |
| Dry-run output looks wrong | Do **not** pass `--write` — investigate and adjust flags |
| User declines confirmation | Clean exit, no changes made |

## See also

- [`scripts/rename.ts`](../../../scripts/rename.ts) — The rename implementation
- [`AGENTS.md`](../../../AGENTS.md#rename-project) — Rename section with usage examples
