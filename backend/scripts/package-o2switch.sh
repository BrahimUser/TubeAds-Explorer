#!/usr/bin/env bash
# Build a deployment archive for O2switch (sources only — run npm install on the server).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/deploy-o2switch.zip"

cd "$ROOT"

rm -f "$OUT"

zip -r "$OUT" . \
  -x "node_modules/*" \
  -x "node_modules/**" \
  -x ".env" \
  -x "uploads/*" \
  -x "!uploads/.gitkeep" \
  -x "deploy*.zip" \
  -x "node_modules.zip" \
  -x ".git/*" \
  -x ".git/**"

echo "Created $OUT"
echo "Upload and extract on O2switch, then run npm install in the Node.js virtualenv."
