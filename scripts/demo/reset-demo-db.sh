#!/usr/bin/env bash
set -euo pipefail

# This script lives under scripts/demo/, so ../.. resolves to the project root.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "${PROJECT_ROOT}"

if [[ ! -f ".env.demo" ]]; then
  echo "Error: .env.demo file not found in project root."
  exit 1
fi

# down -v removes the demo Oracle volume as well, which forces a fresh database
# initialization on the next startup.
echo "Stopping local demo Oracle database and removing demo volume ..."
docker compose -f docker-compose.yml --env-file .env.demo down -v