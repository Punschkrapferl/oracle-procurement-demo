#!/usr/bin/env bash
set -euo pipefail

# This script lives under scripts/dev/, so ../.. resolves to the project root.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "${PROJECT_ROOT}"

if [[ ! -f ".env" ]]; then
  echo "Error: .env file not found in project root."
  exit 1
fi

# down -v removes the development Oracle volume as well, which forces a fresh
# database initialization on the next startup.
echo "Stopping local dev Oracle database and removing dev volume ..."
docker compose -f docker-compose-dev.yml --env-file .env down -v