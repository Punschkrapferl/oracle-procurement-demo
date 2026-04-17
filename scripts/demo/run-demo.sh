#!/usr/bin/env bash
set -euo pipefail

# This script lives under scripts/demo/, so ../.. resolves to the project root.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "${PROJECT_ROOT}"

if [[ ! -f ".env.demo" ]]; then
  echo "Error: .env.demo file not found in project root."
  exit 1
fi

# The local Spring Boot app binds to 8080, so fail early if another process is already using it.
if lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Error: port 8080 is already in use."
  echo "Run: lsof -nP -iTCP:8080 -sTCP:LISTEN"
  echo "Then stop the existing process and try again."
  exit 1
fi

echo "Loading local demo environment from .env.demo ..."
set -a
source .env.demo
set +a

# In the demo script, Oracle is started through Docker Compose first.
# The application itself is then started locally with Spring Boot.
echo "Starting local demo Oracle database ..."
docker compose -f docker-compose.yml --env-file .env.demo up -d oracle --wait --wait-timeout 600

# Unset SPRING_PROFILES_ACTIVE so the default configuration path is used.
echo "Starting Spring Boot with demo/default profile ..."
exec env -u SPRING_PROFILES_ACTIVE ./mvnw spring-boot:run