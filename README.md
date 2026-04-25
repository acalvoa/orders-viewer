# Production Orders — Monorepo

Sistema de gestión de órdenes de producción con detección y resolución automática de conflictos de scheduling.

## Stack

| Capa | Tecnología |
|---|---|
| Monorepo | Yarn 4 Workspaces (`node-modules` linker) |
| Backend | NestJS 11 · CQRS · TypeScript |
| Frontend | Next.js 16 · React Query 5 · Ant Design 6 |
| CMS / Persistencia | Directus 11 · SQLite |
| Tipos compartidos | `@repo/shared` (TypeScript source directo) |

## Estructura

```
.
├── apps/
│   ├── backend/          # NestJS API (puerto 3001)
│   └── frontend/         # Next.js (puerto 3000 dev / 3002 si hay conflicto)
├── packages/
│   └── shared/           # Interfaces y enums compartidos
├── directus/
│   ├── scripts/          # bootstrap.sh · permissions.sh · token.sh · seed-orders.mjs
│   ├── snapshots/        # snapshot.yaml — schema de Directus versionado
│   └── permissions/      # permissions.json — permisos declarativos
├── docker-compose.yml
└── Makefile
```

## Requisitos

- Node.js ≥ 22
- Yarn 4 (`corepack enable && corepack prepare yarn@4 --activate`)
- Docker + Docker Compose

## Primeros pasos

```bash
# 1. Instalar dependencias (desde la raíz)
yarn install

# 2. Ejeucta la app usando Docker compose
make run

# o: docker compose up

## Desarrollo

# 1. Entorno integrado
make dev

# o Hacerlo manual

# 1. Variables de entorno
make directus

# 2. Variables de entorno
cp apps/backend/.env.example apps/backend/.env
# apps/frontend/.env.local ya está incluido en el repositorio para dev

# 3. Backend (en otra terminal)
yarn dev:backend

# 4. Frontend (en otra terminal)
yarn dev:frontend

# Para finalizar

# Agrega ordenes mock para ver la app funcionando
make seed COUNT=30 CONFLICTS=8  
```

> El primer `docker compose up` tarda ~30 s mientras Directus inicializa la base de datos y aplica el schema.

## Variables de entorno

### `apps/backend/.env`

| Variable | Descripción | Default dev |
|---|---|---|
| `PORT` | Puerto del servidor NestJS | `3000` |
| `DIRECTUS_URL` | URL de Directus | `http://localhost:8055` |
| `DIRECTUS_STATIC_TOKEN` | Token de acceso a Directus | `super-token-dev` |

### `apps/frontend/.env.local`

| Variable | Descripción | Default dev |
|---|---|---|
| `NEXT_PUBLIC_NESTJS_URL` | URL del backend NestJS | `http://localhost:3001` |

## Comandos raíz

```bash
yarn dev:backend          # NestJS en modo watch
yarn dev:frontend         # Next.js en modo dev
yarn build                # Build topológico de todos los workspaces
```

## Makefile

```bash
make run                              # docker compose up --build
make down                             # docker compose down
make seed                             # 10 órdenes sin conflictos
make seed COUNT=30                    # 30 órdenes
make seed COUNT=30 CONFLICTS=8        # 30 órdenes, 8 con conflicto de scheduling
```

`DIRECTUS_URL` y `DIRECTUS_TOKEN` se pueden sobreescribir:
```bash
make seed COUNT=50 CONFLICTS=10 DIRECTUS_URL=http://staging:8055
```

---

## Arquitectura

### Directus como capa de persistencia

El backend **no tiene ORM ni base de datos propia**. Directus actúa como headless CMS y base de datos. El backend se comunica con él via HTTP usando un static token (`DIRECTUS_STATIC_TOKEN`).

El schema de Directus está versionado en `directus/snapshots/snapshot.yaml`. Al hacer `docker compose up`, el script `bootstrap.sh` lo aplica automáticamente mediante `directus schema apply`.

```
Frontend → NestJS API → Directus HTTP API → SQLite
```

### Backend: CQRS

El backend usa el patrón CQRS con `@nestjs/cqrs`. Cada operación es un `Command` (mutación) o `Query` (lectura):

```
Controller
  └─ Service
       ├─ QueryBus   → QueryHandler   → DirectusListItemsHandler / DirectusGetItemHandler
       └─ CommandBus → CommandHandler → DirectusCreateItemHandler / DirectusUpdateItemHandler / …
```

Los handlers de dominio de `production-order` no conocen HTTP ni credenciales. Despachan comandos/queries Directus genéricos hacia la capa compartida `src/shared/directus/`, que es la única que tiene `HttpService` y el token.

**Queries disponibles:**
- `GetProductionOrdersQuery` — lista paginada con filtros
- `GetProductionOrderQuery` — orden por ID
- `SimulateRescheduleQuery` — propuestas de re-scheduling sin aplicar

**Commands disponibles:**
- `CreateProductionOrderCommand`
- `UpdateProductionOrderCommand`
- `DeleteProductionOrderCommand`
- `RescheduleConflictsCommand` — aplica propuestas de re-scheduling en bulk

**Capa Directus compartida (`src/shared/directus/`):**

| Handler | Verbo HTTP |
|---|---|
| `DirectusListItemsHandler` | `GET /items/:col` |
| `DirectusGetItemHandler` | `GET /items/:col/:id` |
| `DirectusCreateItemHandler` | `POST /items/:col` |
| `DirectusUpdateItemHandler` | `PATCH /items/:col/:id` |
| `DirectusDeleteItemHandler` | `DELETE /items/:col/:id` |
| `DirectusBulkUpdateHandler` | `PATCH /items/:col` (array) |

### Algoritmo de resolución de conflictos

**Archivos:**
- `apps/backend/src/modules/production-order/utils/conflict-resolver.util.ts` — lógica pura
- `apps/backend/src/modules/production-order/utils/date.util.ts` — utilidades de fecha

Dos órdenes **conflictan** cuando sus ventanas de tiempo se solapan y estan en estado planned:

```
startA < endB  &&  endA > startB
```

La resolución solo opera sobre órdenes con `status: 'planned'`.

#### Fase 1 — Pre-cómputo de timestamps

Todas las fechas (`startDate`, `endDate`, `createdAt`) se convierten a milisegundos una sola vez antes del loop de detección, evitando `new Date()` repetidos en el O(n²) interno.

#### Fase 2 — Union-Find con path compression

Se construye un Union-Find sobre los índices del array de órdenes. Para cada par `(i, j)` con el mismo producto y fechas solapadas, se unen sus raíces:

```
parent[find(i)] = find(j)
```

El path compression (halving) mantiene el árbol casi plano. Al final, todos los índices con la misma raíz forman un **cluster de conflicto**. Esta estructura captura conflictos transitivos: si A solapa con B y B solapa con C, los tres quedan en el mismo cluster aunque A y C no se solapen directamente.

```
A ──solapa── B ──solapa── C      →   cluster { A, B, C }
```

#### Fase 3 — Scheduling secuencial por cluster

Dentro de cada cluster (grupos con ≥ 2 órdenes):

1. **Anchor:** se toma el `startDate` más temprano del grupo como punto de inicio del timeline resuelto.
2. **Prioridad:** las órdenes se ordenan por `createdAt` ascendente — la orden más antigua tiene prioridad y mantiene su slot.
3. **Cursor:** se avanza `cursor = proposedEnd` tras asignar cada orden, encadenando los slots sin hueco.
4. **Duración mínima:** si una orden tiene `startDate == endDate` (duración cero), se le asigna 1 día como fallback.
5. **Filtro de cambios:** solo se emite `RescheduleProposal` para órdenes cuyas fechas propuestas difieren de las actuales. La primera orden del cluster con el slot más temprano típicamente no cambia.

```
Ejemplo: cluster { A(5 días), B(3 días), C(4 días) } ordenado por createdAt

  anchor = min(startDate del grupo)

  A: [anchor ────── anchor+5d)           → sin cambio si ya estaba ahí
  B: [anchor+5d ── anchor+8d)            → RescheduleProposal
  C: [anchor+8d ────── anchor+12d)       → RescheduleProposal
```

La resolución usa un único **bulk PATCH** a Directus (`PATCH /items/production_orders` con array), no requests secuenciales.

**Complejidad:** O(n²) detección · O(n log n) por group sort · O(1) HTTP round-trips para aplicar.

#### Casos excepcionales

- **Duración cero** — si una orden tiene `startDate === endDate`, se le asigna 1 día mínimo para que el cursor no se quede trabado y las órdenes siguientes del cluster no queden apiladas en el mismo instante.
- **Cruce de medianoche** — el algoritmo opera en milisegundos sin restricción de horario laboral. Si el cursor llega a las 23:00 y la siguiente orden dura 2 horas, la propuesta quedará a las 01:00 del día siguiente. Las fechas resultantes son correctas, pero pueden caer fuera del turno productivo.
- **Conflictos en cadena** — si A solapa con B y B solapa con C, las tres se reprograman juntas aunque A y C no se solapen directamente. Sin Union-Find, mover solo a A dejaría un conflicto residual entre B y C.

### Frontend: React Query

El frontend usa **React Query 5** para server state (fetching, caching, invalidación).

Cada mutación invalida tanto `['orders']` como `['conflicts-count']` para mantener los stats sincronizados sin polling.

**Hooks de datos:**

| Hook | Descripción |
|---|---|
| `useOrders` | Lista paginada de órdenes |
| `useConflictsCount` | Conteo de conflictos (server-side, `staleTime: 30s`) |
| `useSimulateReschedule` | Propuestas de re-scheduling (activación manual) |
| `useCreateOrder` | POST + invalidación |
| `useUpdateOrder` | PATCH + invalidación |
| `useDeleteOrder` | DELETE + invalidación |
| `useRescheduleConflicts` | POST bulk reschedule + invalidación |

> `useConflictsCount` es un query separado de `useSimulateReschedule`: el primero se auto-fetcha en background para los stats, el segundo se activa manualmente al pulsar "Reschedule Conflicts".

### Tipos compartidos (`@repo/shared`)

El paquete `packages/shared` compila a `dist/` con `tsc`. Backend y frontend lo importan via path alias `@repo/shared`.

- **Backend:** tsconfig paths apunta a `packages/shared/src/index.ts` en desarrollo (TypeScript resuelve tipos directamente desde fuente, sin rebuild previo).
- **Frontend:** tsconfig paths + `transpilePackages: ['@repo/shared']` en `next.config.ts`.

Si añades tipos nuevos, edita `packages/shared/src/`. Para producción ejecuta `yarn workspace @repo/shared build` antes de compilar los consumidores.

---

## API Reference

Base URL: `http://localhost:3001`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/production-orders` | Lista paginada. Query: `page`, `size`, `status`, `product`, `reference`, `startDateFrom`, `startDateTo` |
| `POST` | `/production-orders` | Crear orden |
| `GET` | `/production-orders/stats` | Totales por estado → `{ total, planned, inProgress }` |
| `GET` | `/production-orders/conflicts/reschedules` | Simular re-scheduling (sin persistir) |
| `POST` | `/production-orders/conflicts/reschedules` | Aplicar re-scheduling → `{ rescheduled: number }` |
| `GET` | `/production-orders/:id` | Obtener orden por ID |
| `PATCH` | `/production-orders/:id` | Actualizar orden (campos opcionales) |
| `DELETE` | `/production-orders/:id` | Eliminar orden (204) |

### Modelo `ProductionOrder`

```typescript
interface ProductionOrder {
  id: string;
  reference: string;       // Ej: "PO-0042"
  product: string;         // Nombre del producto
  quantity: number;        // Unidades (≥ 1)
  startDate: string;       // ISO datetime "YYYY-MM-DDTHH:mm:ss"
  endDate: string;         // ISO datetime "YYYY-MM-DDTHH:mm:ss"
  status: 'planned' | 'scheduled' | 'in_progress' | 'completed';
  createdAt: string;
}
```

> La detección de conflictos solo opera sobre órdenes con `status: 'planned'`.

---

## Directus

Panel de administración: [http://localhost:8055](http://localhost:8055)  
Credenciales de desarrollo: `admin@example.com` / `admin`

### Actualizar el schema

Si modificas colecciones en el panel de Directus y quieres versionar el cambio:

```bash
docker exec -it <container> node /directus/cli.js schema snapshot /directus/snapshots/snapshot.yaml
```

El archivo `directus/snapshots/snapshot.yaml` se aplica automáticamente en cada `docker compose up`.

### Permisos

Los permisos de la política admin están declarados en `directus/permissions/permissions.json` y se aplican via `directus/scripts/permissions.sh` durante el bootstrap. Para añadir permisos a nuevas colecciones, edita ese archivo.