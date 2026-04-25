DIRECTUS_URL   ?= http://localhost:8055
DIRECTUS_TOKEN ?= super-token-dev
COUNT          ?= 10
CONFLICTS      ?= 0

.PHONY: seed run down directus dev dev-frontend dev-backend

# Populate Directus with production orders.
#
#   make seed                        → 10 regular orders
#   make seed COUNT=30               → 30 regular orders
#   make seed COUNT=30 CONFLICTS=8   → 30 orders, 8 with schedule conflicts
#
# Conflicting orders share the same product and have a 1-day overlapping window
# with an existing order, triggering the reschedule detection logic.
run:
	docker compose up --build

down:
	docker compose down

directus:
	docker compose up directus

dev:
	docker compose up directus -d
	yarn dev:backend & yarn dev:frontend

dev-frontend:
	docker compose up directus -d
	yarn dev:frontend

dev-backend:
	docker compose up directus -d
	yarn dev:backend

seed:
	@node directus/scripts/seed-orders.mjs \
		--url=$(DIRECTUS_URL) \
		--token=$(DIRECTUS_TOKEN) \
		--count=$(COUNT) \
		--conflicts=$(CONFLICTS)
