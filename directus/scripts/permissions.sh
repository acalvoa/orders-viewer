#!/bin/sh
set -e

DIRECTUS_URL="${DIRECTUS_URL:-http://127.0.0.1:8055}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"

TOKEN=$(wget -qO- \
  --header="Content-Type: application/json" \
  --post-data="{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  "$DIRECTUS_URL/auth/login" | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

POLICY_ID=$(wget -qO- \
  --header="Authorization: Bearer $TOKEN" \
  "$DIRECTUS_URL/policies?filter[admin_access][_eq]=true&fields[]=id&limit=1" | \
  grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

COLLECTIONS=$(grep -o '"collection": *"[^"]*"' /directus/permissions/permissions.json | \
  grep -o '"[^"]*"$' | tr -d '"' | sort -u)

for COLLECTION in $COLLECTIONS; do
  CHECK=$(wget -qO- \
    --header="Authorization: Bearer $TOKEN" \
    "$DIRECTUS_URL/permissions?filter[policy][_eq]=$POLICY_ID&filter[collection][_eq]=$COLLECTION&filter[action][_eq]=read")

  if ! echo "$CHECK" | grep -q '"data":\[\]'; then
    echo "  $COLLECTION: already configured, skipping."
    continue
  fi

  grep "\"collection\": *\"$COLLECTION\"" /directus/permissions/permissions.json | while IFS= read -r line; do
    ACTION=$(echo "$line" | grep -o '"action": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
    [ -z "$ACTION" ] && continue

    wget -qO- \
      --header="Authorization: Bearer $TOKEN" \
      --header="Content-Type: application/json" \
      --post-data="{\"policy\":\"$POLICY_ID\",\"collection\":\"$COLLECTION\",\"action\":\"$ACTION\",\"fields\":[\"*\"],\"permissions\":{},\"validation\":{}}" \
      "$DIRECTUS_URL/permissions" > /dev/null

    echo "  $COLLECTION ($ACTION): created."
  done
done
