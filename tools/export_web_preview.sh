#!/usr/bin/env bash
set -euo pipefail

GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${PROJECT_ROOT}/build/web"

mkdir -p "${OUTPUT_DIR}"
"${GODOT_BIN}" --headless --path "${PROJECT_ROOT}" --export-release "Web" "${OUTPUT_DIR}/index.html"

cd "${OUTPUT_DIR}"
python3 -m http.server "${PORT:-8080}"
