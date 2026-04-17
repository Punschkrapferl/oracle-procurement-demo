#!/usr/bin/env bash
set -euo pipefail

# This script lives under scripts/dev/, so ../.. resolves to the project root.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "${PROJECT_ROOT}"

if [[ ! -f ".env" ]]; then
  echo "Error: .env file not found in project root."
  exit 1
fi

# The local Spring Boot app binds to 8080, so fail early if another process is already using it.
if lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Error: port 8080 is already in use."
  echo "Run: lsof -nP -iTCP:8080 -sTCP:LISTEN"
  echo "Then stop the existing process and try again."
  exit 1
fi

echo "Loading local environment from .env ..."
set -a
source .env
set +a

# In the development flow, Oracle runs in Docker while the application runs locally
# with the explicit dev Spring profile.
echo "Starting local dev Oracle database ..."
docker compose -f docker-compose-dev.yml --env-file .env up -d --wait --wait-timeout 600

echo "Starting Spring Boot with dev profile ..."
exec env SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run