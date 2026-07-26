#!/usr/bin/env bash
set -euo pipefail

# ---- resolve repository root ----
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

# ---- dependency install (if not yet run) ----
if [ ! -d node_modules ]; then
  echo "Installing dependencies (root workspace)…"
  bun install
  echo ""
fi

# ---- dependency checks ----
if ! command -v docker &>/dev/null; then
  echo "Error: docker is not installed or not in PATH." >&2
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo "Error: docker compose (v2 plugin) is not available." >&2
  exit 1
fi

# ---- start PostgreSQL ----
echo "Starting PostgreSQL via Docker Compose..."
docker compose up -d --wait

echo ""
echo "PostgreSQL is ready on port 5432."

# ---- next steps ----
echo ""
echo "─── Next steps ──────────────────────────────────────"
echo ""
echo "  Backend  (Ktor, port 8080):"
echo "    bun run backend:dev"
echo "    # or: cd backend && ./gradlew run"
echo ""
echo "  Frontend (Vite, port 3000):"
echo "    bun run frontend:dev"
echo "    # or: cd frontend && bun run dev"
echo ""
echo "  Optional – watch-mode codegen:"
echo "    bun run generate:openapi -t -i"
echo "    # or: cd backend && ./gradlew generateOpenApiJson -t -i"
echo "    bun run orval:watch"
echo "    # or: cd frontend && bun run orval:watch"
echo ""
echo "─────────────────────────────────────────────────────"
echo ""
