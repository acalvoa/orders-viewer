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
│   ├── backend/          # NestJS 11 — API REST (puerto 3001)
│   └── frontend/         # Next.js 16 — UI (puerto 3000)
├── packages/
│   ├── shared/           # Interfaces y enums TypeScript compartidos
│   └── logics/           # Algoritmos de resolución de conflictos (@repo/logics)
├── directus/
│   ├── scripts/          # bootstrap.sh, permissions.sh, token.sh, seed-orders.mjs
│   ├── snapshots/        # snapshot.yaml — schema versionado de Directus
│   └── permissions/      # permissions.json — permisos declarativos
├── terraform/            # Infraestructura Cloud Run (Google Cloud)
├── docker-compose.yml    # Levanta directus + backend + frontend
└── Makefile              # make run | make down | make seed
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

Los handlers de dominio no conocen HTTP ni credenciales. Despachan comandos/queries genéricos a `src/shared/directus/`, única capa con `HttpService`. El `HttpService` está configurado con `baseURL` y `Authorization` via `DirectusHttpModule` (`HttpModule.registerAsync()`).

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

El algoritmo vive en el paquete independiente **`@repo/logics`** (`packages/logics/`), separado del backend. Expone cuatro funciones puras —`resolveConflicts`, `findSlot`, `firstEndingAfter` e `insertInterval`— cada una en su propia carpeta con su test unitario. El backend lo importa via path alias `@repo/logics`; cualquier otro consumidor del monorepo puede hacer lo mismo sin depender de NestJS.

**Archivo:** `apps/backend/src/modules/production-order/utils/conflict-resolver.util.ts`

Dos órdenes **conflictan** cuando sus ventanas de tiempo se solapan y ambas tienen `status: 'planned'`:

```
startA < endB  &&  endA > startB
```

#### Greedy interval scheduling con búsqueda binaria

El algoritmo ordena todas las órdenes por `createdAt` ascendente (la más antigua = mayor prioridad) y las coloca una a una en un array `placed` de intervalos no solapados mantenido siempre ordenado por `startMs`.

Para cada orden:

1. Intenta colocarla en su `startDate` original.
2. Usa **búsqueda binaria** (`firstEndingAfter`) para encontrar el primer intervalo ya colocado cuyo `endMs > startDate`. Como `placed` es no solapado y ordenado por `startMs`, los `endMs` también son estrictamente crecientes, lo que hace válida la búsqueda binaria sobre `endMs`.
3. Si ese intervalo bloquea el slot, empuja el inicio al `endMs` del bloqueador y avanza al siguiente índice (scan lineal). No se necesita segunda búsqueda binaria porque los intervalos ya colocados son no solapados.
4. Repite hasta encontrar un hueco suficientemente ancho o llegar al final del array.
5. Inserta el intervalo colocado en `placed` manteniendo el orden (búsqueda binaria + `splice`).
6. Si las fechas propuestas difieren de las originales, emite un `RescheduleProposal`.

```
Ejemplo: A (4d, oldest) · B (5d) · C (4d) todos solapados

  placed tras A:        [──A──]
  B intenta Jan3 → bloqueado por A → slot: Jan5
  placed tras B:        [──A──][───B───]
  C intenta Jan7 → bloqueado por B → slot: Jan10
  placed tras C:        [──A──][───B───][──C──]

  Proposals: B y C  (A sin cambio, es la más antigua)
```

Las órdenes originalmente sin conflicto también pueden desplazarse en cascada si una orden empujada aterriza sobre ellas. Todos los desplazamientos —incluyendo los en cascada— aparecen en las proposals. Una sola ejecución siempre produce un schedule completamente libre de conflictos.

La resolución aplica los cambios con un único **bulk PATCH** a Directus (`PATCH /items/production_orders` con array).

**Complejidad:** O(n log n) ordenación · O(n log n) colocación (búsqueda binaria por orden) · O(1) round-trips HTTP.

#### Casos excepcionales

| Caso | Comportamiento |
|---|---|
| `startDate === endDate` (duración cero) | Se asigna 1 día como duración mínima |
| `createdAt` idéntico en varias órdenes | El sort es estable: se respeta el orden del array de entrada |
| Orden que cabe en un hueco intermedio | Se coloca en ese hueco sin desplazarse más |
| Hueco intermedio demasiado estrecho | Se salta al siguiente hueco automáticamente |

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
