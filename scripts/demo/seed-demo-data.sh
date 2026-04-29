#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="oracle-procurement-oracle-demo"
SEED_FILE="src/main/resources/db/demo/V100__seed_demo_data.sql"
CONTAINER_SEED_FILE="/tmp/V100__seed_demo_data.sql"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Demo Oracle container is not running: $CONTAINER_NAME"
  echo "Start the demo first with:"
  echo "./scripts/demo/run-demo.sh"
  exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
  echo "Seed file not found:"
  echo "$SEED_FILE"
  exit 1
fi

echo "Copying demo seed SQL into Oracle container..."
docker cp "$SEED_FILE" "$CONTAINER_NAME:$CONTAINER_SEED_FILE"

echo "Running demo seed SQL..."
docker exec -i "$CONTAINER_NAME" bash -lc "sqlplus -L \"\$APP_USER/\$APP_USER_PASSWORD@localhost:1521/FREEPDB1\" @$CONTAINER_SEED_FILE"

echo "Demo seed data loaded successfully."