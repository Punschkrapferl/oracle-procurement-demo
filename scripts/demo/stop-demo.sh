#!/usr/bin/env bash
set -euo pipefail

# This script lives under scripts/demo/, so ../.. resolves to the project root.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "${PROJECT_ROOT}"

if [[ ! -f ".env.demo" ]]; then
  echo "Error: .env.demo file not found in project root."
  exit 1
fi

# This stops the demo Compose services but keeps the demo Oracle volume.
echo "Stopping local demo Oracle database ..."
docker compose -f docker-compose.yml --env-file .env.demo down