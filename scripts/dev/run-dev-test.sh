#!/usr/bin/env bash
set -euo pipefail

# This script lives under scripts/dev/, so ../.. resolves to the project root.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "${PROJECT_ROOT}"

if [[ ! -f ".env" ]]; then
  echo "Error: .env file not found in project root."
  exit 1
fi

echo "Loading local environment from .env ..."
set -a
source .env
set +a

# Start the development Oracle database before running the dev-oriented test profile.
echo "Starting local dev Oracle database ..."
docker compose -f docker-compose-dev.yml --env-file .env up -d --wait --wait-timeout 600

echo "Running tests with test-dev profile ..."
exec ./mvnw clean test -Dspring.profiles.active=test-dev