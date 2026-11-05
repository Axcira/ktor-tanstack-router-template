#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
out="$root/backend/build/generated/build-info/build-info.properties"
mkdir -p "$(dirname "$out")"

if [[ -n "${GIT_COMMIT:-}" ]]; then
  commit="$GIT_COMMIT"
else
  commit="$(git -C "$root" rev-parse HEAD 2>/dev/null || echo unknown)"
fi

if [[ "$commit" == "unknown" ]]; then
  commit_short="unknown"
elif ((${#commit} >= 7)); then
  commit_short="${commit:0:7}"
else
  commit_short="$commit"
fi

if porcelain="$(git -C "$root" status --porcelain 2>/dev/null)"; then
  if [[ -n "$porcelain" ]]; then
    dirty=true
  else
    dirty=false
  fi
else
  dirty=false
fi

built_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

cat >"$out" <<EOF
commit=$commit
commitShort=$commit_short
builtAt=$built_at
dirty=$dirty
EOF
