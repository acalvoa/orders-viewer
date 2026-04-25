# CLAUDE.md — Production Orders Monorepo

Guía de referencia para asistentes de código. Lee esto antes de tocar cualquier archivo.

---

## Qué hace esta app

Sistema de gestión de **órdenes de producción** con detección y resolución automática de conflictos de scheduling. Una orden conflicta con otra cuando ambas están en estado `planned` y sus ventanas `startDate`/`endDate` se solapan.

---

## Estructura del monorepo

```
.
├── apps/
│   ├── backend/          # NestJS 11 — API REST (puerto 3001)
│   └── frontend/         # Next.js 16 — UI (puerto 3000)
├── packages/
│   └── shared/           # Interfaces y enums TypeScript compartidos
├── directus/
│   ├── scripts/          # bootstrap.sh, permissions.sh, token.sh, seed-orders.mjs
│   ├── snapshots/        # snapshot.yaml — schema versionado de Directus
│   └── permissions/      # permissions.json — permisos declarativos
├── docker-compose.yml    # Levanta directus + backend + frontend
└── Makefile              # make run | make down | make seed
```

**Workspaces Yarn 4:** `apps/*` y `packages/*`. Siempre instala desde la raíz con `yarn install`.

---

## Cómo correr la app

```bash
# Todo en Docker (recomendado)
make run          # docker compose up --build
make down         # docker compose down

# Solo Directus en Docker + apps en local
docker compose up directus
cp apps/backend/.env.example apps/backend/.env
yarn dev:backend   # NestJS en modo watch — puerto 3001
yarn dev:frontend  # Next.js dev — puerto 3000
```

> Directus tarda ~30s la primera vez. Aplica el schema automáticamente via `directus schema apply`.

### Poblar datos de prueba

```bash
make seed                        # 10 órdenes aleatorias
make seed COUNT=30               # 30 órdenes
make seed COUNT=30 CONFLICTS=8   # 30 órdenes, 8 con solapamiento intencional
```

---

## Variables de entorno

### `apps/backend/.env`
| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto NestJS (docker-compose lo sobreescribe a `3001`) |
| `DIRECTUS_URL` | `http://localhost:8055` | URL de Directus |
| `DIRECTUS_STATIC_TOKEN` | `super-token-dev` | Token de acceso |

### `apps/frontend/.env.local`
| Variable | Default | Descripción |
|---|---|---|
| `NEXT_PUBLIC_NESTJS_URL` | `http://localhost:3001` | URL del backend (embebida en el bundle en build time) |

---

## Arquitectura — decisiones clave

### 1. El backend no tiene base de datos propia

**Directus actúa como la capa de datos.** El backend se comunica con él via HTTP usando un static token. No hay ORM, no hay migrations propias.

```
Browser → Next.js → NestJS API → Directus HTTP API → SQLite
```

El schema de Directus está versionado en `directus/snapshots/snapshot.yaml` y se aplica automáticamente al iniciar. Si modificas la colección en el panel de Directus, exporta el snapshot:

```bash
docker exec -it <container_id> node /directus/cli.js schema snapshot /directus/snapshots/snapshot.yaml
```

### 2. CQRS estricto en el backend

Toda operación pasa por `CommandBus` o `QueryBus`. El controller no tiene lógica.

```
Controller → Service → { QueryBus | CommandBus } → Handler → DirectusHandler
```

**Regla:** lecturas = `Query`, mutaciones = `Command`. Nunca mezclar.

### 3. Capa Directus genérica compartida

Los handlers de `production-order` no conocen HTTP. Despachan comandos/queries genéricos a `src/shared/directus/`, que es la única capa con `HttpService` y credenciales:

| Handler genérico | HTTP |
|---|---|
| `DirectusListItemsQuery` | `GET /items/:col` |
| `DirectusGetItemQuery` | `GET /items/:col/:id` |
| `DirectusCreateItemCommand` | `POST /items/:col` |
| `DirectusUpdateItemCommand` | `PATCH /items/:col/:id` |
| `DirectusDeleteItemCommand` | `DELETE /items/:col/:id` |
| `DirectusBulkUpdateCommand` | `PATCH /items/:col` (array) |

### 4. `@repo/shared` se resuelve desde fuente en dev

No hay que compilar el paquete shared para desarrollar. TypeScript lo resuelve directamente desde `packages/shared/src/` via path alias en ambos workspaces. Para builds de producción, `yarn build` ya lo compila en orden topológico.

---

## Backend — patrones a seguir

### Agregar un nuevo campo a `production_orders`

1. Añadir el campo en el panel de Directus, luego exportar el snapshot.
2. Actualizar `packages/shared/src/interfaces/production-order.ts`.
3. Actualizar los DTOs en `apps/backend/src/modules/production-order/dtos/` si aplica.
4. La interfaz `DirectusProductionOrder` en `apps/backend/src/modules/production-order/interfaces/directus-production-order.interface.ts` mapea la respuesta de Directus al DTO del dominio.

### Agregar un nuevo endpoint

Sigue el patrón existente en `src/modules/production-order/`:

```
1. Declarar el Query o Command en commands/declarations/ o queries/declarations/
2. Crear el Handler en el subdirectorio correspondiente (handler + module)
3. Registrar el Handler en production-order.module.ts
4. Exponer desde el Service (production-order.service.ts)
5. Agregar el método al Controller
```

### DTOs y validación

- Los DTOs del backend implementan las interfaces de `@repo/shared`
- Usar `class-validator` + `class-transformer` (ya configurado globalmente con `transform: true, whitelist: true`)
- Nunca usar `any`. Los tipos viven en `@repo/shared`

### Path aliases en el backend

```typescript
import { Foo } from '@repo/shared';              // paquete compartido
import { Bar } from '@modules/production-order/...'; // alias local
```

El alias `@modules` está configurado en `tsconfig.json`.

---

## Frontend — patrones a seguir

### Estado

- **Server state** (datos de API): React Query 5 — hooks en `hooks/`
- **UI state** (modal abierto, orden editando): Zustand — store en `stores/orders.store.ts`

### Hacer una llamada a la API

Usa la función `request<T>()` de `lib/axios.ts`:

```typescript
import { request } from '@/lib/axios';
import type { ProductionOrder } from '@repo/shared';

const order = await request<ProductionOrder>(`/production-orders/${id}`);
const created = await request<ProductionOrder>('/production-orders', {
  method: 'POST',
  data: dto,
});
```

### Agregar un nuevo hook de datos

Sigue el patrón de `hooks/useOrders.ts`. Toda mutación debe invalidar las query keys afectadas:

```typescript
// Query keys usadas en el proyecto
['orders']           // lista de órdenes
['conflicts-count']  // conteo de conflictos
```

### Componentes

Todos los componentes de órdenes viven en `components/orders/`. Cada componente es un directorio con `index.tsx`. Usa **Ant Design 6** para UI y **Tailwind 4** para utilidades de layout.

### `NEXT_PUBLIC_NESTJS_URL` es build-time

Esta variable se embebe en el bundle al compilar. Si cambias su valor, necesitas rebuild. Es accedida solo desde el cliente (browser). Si algún día necesitas llamar al backend desde el servidor (SSR/RSC), usa una variable sin el prefijo `NEXT_PUBLIC_`.

---

## `@repo/shared` — qué hay dentro

```
packages/shared/src/
├── enums/
│   ├── production-order-status.ts   # planned | scheduled | in_progress | completed
│   ├── directus-operator.ts         # _eq, _lt, _contains, etc.
│   └── directus-meta.ts             # total_count, filter_count
└── interfaces/
    ├── production-order.ts          # Tipo principal ProductionOrder
    ├── create-production-order-dto.ts
    ├── update-production-order-dto.ts
    ├── production-order-filter.ts
    ├── reschedule-proposal.ts
    ├── paginated.ts                 # Paginated<T>
    ├── page-options.ts
    └── directus-*.ts                # Tipos para queries a Directus
```

**Regla:** cualquier tipo que usen tanto backend como frontend va aquí. Nunca duplicar tipos entre workspaces.

---

## Modelo de datos

### `ProductionOrder`

```typescript
interface ProductionOrder {
  id: string;                          // UUID auto-generado por Directus
  reference: string;                   // Ej: "ORD-AB12CD" — requerido
  product: string;                     // Nombre del producto — requerido
  quantity: number;                    // Unidades ≥ 1
  startDate: string;                   // ISO datetime "YYYY-MM-DDTHH:mm:ss"
  endDate: string;                     // ISO datetime "YYYY-MM-DDTHH:mm:ss"
  status: ProductionOrderStatus;       // default: 'planned'
  createdAt: string;                   // timestamp auto-generado
}
```

> `startDate` y `endDate` son tipo `dateTime` en Directus (no `date`). Siempre enviar con hora.

### Colisión de conflictos

Dos órdenes **conflictan** si:
- `startA < endB && endA > startB`
- Ambas tienen `status: 'planned'`

---

## Directus

- Panel admin: [http://localhost:8055](http://localhost:8055)
- Credenciales dev: `admin@example.com` / `admin`
- Token dev: `super-token-dev`
- API base: `http://localhost:8055/items/production_orders`

El bootstrap (`directus/scripts/bootstrap.sh`) ejecuta en orden: `bootstrap` → `start` → espera health → aplica schema → aplica permisos → configura token.

---

## Convenciones obligatorias

- **Sin `any`** — TypeScript estricto. Todos los tipos en `@repo/shared` o en el módulo correspondiente.
- **CQRS estricto** — el controller no tiene lógica. El service solo orquesta bus dispatches.
- **Invalidación completa** — cualquier mutación que cambie órdenes invalida `['orders']` y `['conflicts-count']`.
- **Skeletons** — toda sección que cargue datos asincrónicamente necesita skeleton que replique la estructura visual.
- **Build topológico** — `yarn build` en la raíz respeta el orden: `shared` → `backend` y `frontend` en paralelo.
