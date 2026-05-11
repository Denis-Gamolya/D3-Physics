#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

: "${ITCH_USER:?Set ITCH_USER to your itch.io username.}"
: "${ITCH_GAME:?Set ITCH_GAME to your itch.io project slug.}"

ITCH_CHANNEL="${ITCH_CHANNEL:-html5}"
USER_VERSION="${USER_VERSION:-local}"

bash "${ROOT_DIR}/scripts/build-web.sh"

butler push "${ROOT_DIR}/dist" "${ITCH_USER}/${ITCH_GAME}:${ITCH_CHANNEL}" --userversion "${USER_VERSION}" --if-changed
