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

if [ "${AUTO_SEED}" = "true" ]; then
  echo "Checking if seed is needed..."
  ORDER_COUNT=$(wget -q -O- \
    "http://127.0.0.1:8055/items/production_orders?aggregate[count]=*&access_token=${ADMIN_STATIC_TOKEN}" \
    2>/dev/null \
    | node -e "
        const chunks = [];
        process.stdin.on('data', c => chunks.push(c));
        process.stdin.on('end', () => {
          try { console.log(JSON.parse(chunks.join('')).data?.[0]?.count ?? '0'); }
          catch { console.log('0'); }
        });
    " || echo "0")

  if [ "${ORDER_COUNT}" = "0" ]; then
    echo "No orders found — seeding initial data..."
    node /directus/scripts/seed-orders.mjs \
      --url "http://127.0.0.1:8055" \
      --token "${ADMIN_STATIC_TOKEN}" \
      --count 90 \
      --conflicts 20 \
      && echo "Seed done." || echo "Seed failed (non-fatal)."
  else
    echo "Orders already exist (${ORDER_COUNT}) — skipping seed."
  fi
fi

wait $DIRECTUS_PID
