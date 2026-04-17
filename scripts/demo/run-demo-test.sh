#!/usr/bin/env bash
set -euo pipefail

# This script lives under scripts/demo/, so ../.. resolves to the project root.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "${PROJECT_ROOT}"

if [[ ! -f ".env.demo" ]]; then
  echo "Error: .env.demo file not found in project root."
  exit 1
fi

echo "Loading local demo environment from .env.demo ..."
set -a
source .env.demo
set +a

# Start the demo Oracle database before running the test profile.
echo "Starting local demo Oracle database ..."
docker compose -f docker-compose.yml --env-file .env.demo up -d oracle --wait --wait-timeout 600

echo "Running tests with test profile ..."
exec ./mvnw clean test -Dspring.profiles.active=test