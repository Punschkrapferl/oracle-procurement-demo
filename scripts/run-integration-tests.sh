#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
ENV_EXAMPLE_FILE="${PROJECT_ROOT}/.env.example"

cd "${PROJECT_ROOT}"

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ -f "${ENV_EXAMPLE_FILE}" ]]; then
    echo "No .env found. Creating one from .env.example..."
    cp "${ENV_EXAMPLE_FILE}" "${ENV_FILE}"
  else
    echo "Missing both .env and .env.example."
    exit 1
  fi
fi

set -a
source "${ENV_FILE}"
set +a

echo "Starting Oracle container..."
docker compose up -d oracle --wait --wait-timeout 600

echo "Running Maven tests..."
./mvnw clean test