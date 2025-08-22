#!/usr/bin/env sh
set -euo pipefail

echo "=================================================="
echo " Running tests (api, client)"
echo "=================================================="

# If Docker is available and running, use compose-based tests
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "[Docker] Detected Docker engine. Running tests in containers."
  echo "[1/2] API tests -> docker compose -f compose.test.yml up --build api-tests"
  docker compose -f compose.test.yml up --build --abort-on-container-exit --exit-code-from api-tests api-tests
  echo "\nAPI tests completed successfully."

  echo "[2/2] Client tests -> docker compose -f compose.test.yml up --build client-tests"
  docker compose -f compose.test.yml up --build --abort-on-container-exit --exit-code-from client-tests client-tests
  echo "\nAll tests passed. Cleaning up containers..."
  docker compose -f compose.test.yml down -v || true
  echo "✅ Done."
  exit 0
fi

# Fallback: run tests locally without Docker
echo "[Local] Docker not detected or not running. Falling back to local test run."
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

# Run API tests
echo "[1/2] API tests (local)"
cd "$REPO_ROOT/api"
if [ ! -d node_modules ]; then
  npm ci || npm install
fi
npm test

# Run Client tests
echo "[2/2] Client tests (local)"
cd "$REPO_ROOT/client"
if [ ! -d node_modules ]; then
  npm ci || npm install
fi
npm test

echo "✅ All tests passed locally."


