#!/usr/bin/env sh
set -euo pipefail

echo "=================================================="
echo " Running tests in Docker (api, client)"
echo "=================================================="

echo "[1/2] API tests -> docker compose -f compose.test.yml up --build api-tests"
docker compose -f compose.test.yml up --build --abort-on-container-exit --exit-code-from api-tests api-tests

echo "\nAPI tests completed successfully."

echo "[2/2] Client tests -> docker compose -f compose.test.yml up --build client-tests"
docker compose -f compose.test.yml up --build --abort-on-container-exit --exit-code-from client-tests client-tests

echo "\nAll tests passed. Cleaning up containers..."
docker compose -f compose.test.yml down -v || true

echo "✅ Done."


