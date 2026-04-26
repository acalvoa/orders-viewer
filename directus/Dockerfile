FROM directus/directus:11

COPY --chmod=755 scripts/bootstrap.sh /directus/scripts/bootstrap.sh
COPY scripts/permissions.mjs /directus/scripts/permissions.mjs
COPY --chmod=755 scripts/token.sh /directus/scripts/token.sh
COPY scripts/seed-orders.mjs /directus/scripts/seed-orders.mjs
COPY snapshots/ /directus/snapshots/
COPY permissions/ /directus/permissions/

ENTRYPOINT ["/bin/sh", "/directus/scripts/bootstrap.sh"]
