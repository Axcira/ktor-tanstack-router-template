#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/compose.sh
source "$script_dir/lib/compose.sh"

compose_cmd="$(resolve_compose_cmd)"
# shellcheck disable=SC2086
exec $compose_cmd logs -f postgres