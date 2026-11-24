#!/usr/bin/env bash
# Resolves the container compose CLI (docker compose vs podman compose).
# Override: COMPOSE_CMD="podman compose" or COMPOSE_CMD="docker compose"

resolve_compose_cmd() {
  if [ -n "${COMPOSE_CMD:-}" ]; then
    printf '%s' "$COMPOSE_CMD"
    return 0
  fi

  if command -v podman &>/dev/null && podman compose version &>/dev/null && podman info &>/dev/null; then
    printf '%s' "podman compose"
    return 0
  fi

  if command -v docker &>/dev/null && docker compose version &>/dev/null && docker info &>/dev/null; then
    printf '%s' "docker compose"
    return 0
  fi

  # CLI present but daemon not reachable — still report the likely command for clearer errors.
  if command -v podman &>/dev/null && podman compose version &>/dev/null; then
    printf '%s' "podman compose"
    return 0
  fi

  if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    printf '%s' "docker compose"
    return 0
  fi

  echo "Error: no compose CLI found. Install Docker Compose v2 or Podman with compose, or set COMPOSE_CMD (e.g. COMPOSE_CMD='podman compose')." >&2
  return 1
}

run_compose() {
  local cmd
  cmd="$(resolve_compose_cmd)" || return 1
  # shellcheck disable=SC2086
  $cmd "$@"
}