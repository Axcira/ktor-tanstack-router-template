#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

# shellcheck source=scripts/lib/compose.sh
source "$script_dir/lib/compose.sh"

if [ ! -d node_modules ]; then
  echo "Installing dependencies (root workspace)…"
  bun install
  echo ""
fi

compose_cmd="$(resolve_compose_cmd)"

stop_postgres() {
  # shellcheck disable=SC2086
  $compose_cmd stop postgres >/dev/null 2>&1 || true
}

trap stop_postgres EXIT INT TERM

echo "Starting PostgreSQL ($compose_cmd)…"
# shellcheck disable=SC2086
$compose_cmd up -d --wait

echo "PostgreSQL is ready. Starting db logs, backend, and frontend (Ctrl-C stops everything, including PostgreSQL)."
echo ""

"$repo_root/node_modules/.bin/concurrently" \
  --kill-others-on-fail \
  --names db,backend,frontend \
  --prefix-colors blue.bold,green.bold,magenta.bold \
  "bash scripts/dev-db-logs.sh" \
  "bun run backend:dev" \
  "bun run frontend:dev"