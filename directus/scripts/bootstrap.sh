#!/bin/sh
set -e

node /directus/cli.js bootstrap

node /directus/cli.js start &
DIRECTUS_PID=$!

echo "Waiting for Directus to be ready..."
until wget -q --spider "http://127.0.0.1:8055/server/health" 2>/dev/null; do
  sleep 3
done
echo "Directus ready."

if [ -f "/directus/snapshots/snapshot.yaml" ]; then
  echo "Applying schema snapshot..."
  node /directus/cli.js schema apply --yes /directus/snapshots/snapshot.yaml && \
    echo "Schema applied." || \
    echo "Schema already up to date."
fi

if [ -f "/directus/permissions/permissions.json" ]; then
  echo "Setting up permissions..."
  sh /directus/scripts/permissions.sh && \
    echo "Permissions done." || \
    echo "Permissions setup failed (non-fatal)."
fi

echo "Configuring static token..."
sh /directus/scripts/token.sh && \
  echo "Token done." || \
  echo "Token setup failed (non-fatal)."

wait $DIRECTUS_PID
