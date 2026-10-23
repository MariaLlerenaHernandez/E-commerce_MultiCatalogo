# PROJECT_MAP — Practica03_MultiCatalogo

Sistema SaaS multinivel (catálogo + red de referidos). Frontend React ya hecho; la Unidad 2 trabaja el backend Go con PostgreSQL real.

## Estructura (raíz)
- `src/`            Frontend React 19 + TypeScript + Vite 8 + Tailwind 4 + react-router-dom 7 (puerto dev Vite).
- `backend/`        API Go + Fiber v2 (módulo `multicatalogo-backend`, puerto **3000**).
- `database/`       Scripts SQL: init.sql, 004_backoffice.sql, seed.sql (migraciones y datos iniciales).
- `public/`, `dist/`, `index.html`  Estáticos y build del frontend (no tocar `dist/`).
- `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`  Config del frontend.
- `docker-compose.yml`  Orquestación de PostgreSQL (puerto 5434) + Redis (puerto 6379).
- `REQUIREMENTS_CHECKLIST.md`  Estado de requerimientos por Unidad/Tema del sílabo.
- `PLAN_IMPLEMENTACION_U2.md`  Plan de implementación del back-office (FASE 0-7).
- `ANALISIS_FUNCIONAL_U2.md`  Análisis de brechas funcionales y justificación de diseño.
- `.windsurfrules`  Reglas del agente.

## Backend (`backend/`)
- `main.go`                       Crea app Fiber, CORS, inicializa Redis + PostgreSQL, inyecta dependencias, puerto configurable (ENV `PORT`).
- `routes/routes.go`              Registro de endpoints con controladores instanciados (inyección de dependencias).
- `interfaces/interfaces.go`      Interfaces: ProductRepository, RedRepository, OrderRepository, CacheRepository, Transaction.
- `controllers/authController.go` `AuthController` con método `Login` (POST /api/login).
- `controllers/prodController.go` `ProductController` con `GetProductos` (caché Redis), `GetProductoPorID`.
- `controllers/redController.go`   `RedController` con `GetRed` (caché Redis, estructura jerárquica).
- `controllers/checkoutController.go` `CheckoutController` con `ProcesarCheckout` (transacción ACID, Goroutines para comisiones).
- `controllers/healthController.go` `HealthController` con verificación de Redis y PostgreSQL.
- `models/models.go`              `LoginRequest`, `Producto`, `Referido`, `Pedido`, `PedidoItem`, `CheckoutRequest`, `CheckoutResponse`, `APIError`. Errores: `ErrNoEncontrado`, `ErrCantidadInvalida`, `ErrStockInsuficiente`.
- `config/redis.go`               Cliente Redis con manejo de errores (continúa sin caché si no disponible).
- `config/postgres.go`            Cliente PostgreSQL con pgxpool, manejo de errores (continúa sin persistencia si no disponible).
- `repository/memoryRepository.go` Implementación en memoria con transacciones ACID simuladas (Commit/Rollback).
- `repository/postgresRepository.go` Implementación parcial de ProductRepository con PostgreSQL real (GetAll, GetByID).
- `repository/cacheRepository.go` Implementación de CacheRepository usando Redis.

### Endpoints actuales
- `POST /api/login`          Credenciales hardcodeadas (admin@upse.edu.ec / cliente@upse.edu.ec).
- `GET  /api/productos`      Lista del catálogo (con caché Redis, TTL 5min).
- `GET  /api/productos/:id`  Detalle; 400 si ID no numérico, 404 si no existe.
- `GET  /api/health`         Estado del servidor + dependencias (Redis, PostgreSQL).
- `GET  /api/red`            Jerarquía de referidos (con caché Redis, TTL 10min).
- `POST /api/checkout`       Procesa pedido con transacción ACID, control de stock, Goroutines para comisiones (10%, 5%, 2%), invalidación de caché.

### Endpoints pendientes (por fase)
**FASE 1 - Registro + Referido Real:**
- `POST /api/register`         Registro de usuarios con bcrypt y código de referido
- `GET  /api/red/mia`         Red del usuario autenticado (subárbol desde su nodo)

**FASE 2 - CRUD Productos (Admin):**
- `POST   /api/productos`      Crear producto (RequireAdmin)
- `PUT    /api/productos/:id`  Editar producto (RequireAdmin)
- `DELETE /api/productos/:id`  Desactivar producto lógico (RequireAdmin)
- `GET    /api/admin/productos` Lista completa (incluye inactivos) + búsqueda ?q= (RequireAdmin)

**FASE 3 - Gestión de Pedidos:**
- `GET  /api/pedidos/mios`     Pedidos del usuario autenticado
- `GET  /api/pedidos`          Todos los pedidos (admin, paginado)
- `GET  /api/pedidos/:id`      Detalle de pedido con items
- `PATCH /api/pedidos/:id/estado` Cambiar estado (admin): pendiente→preparando→enviado→entregado, cancelado

**FASE 4 - Ledger de Comisiones:**
- `GET  /api/comisiones/mias`  Ledger de comisiones del usuario
- La transacción de checkout inserta en tabla `comisiones` (auditable)

**FASE 5 - Liquidaciones:**
- `POST /api/liquidaciones`    Crear liquidación (admin)
- `GET  /api/liquidaciones`    Historial de liquidaciones (admin)
- `GET  /api/liquidaciones/mias` Liquidaciones del usuario

**FASE 6 - Reportes:**
- `GET /api/reportes/resumen?desde&hasta` KPIs de ventas
- `GET /api/reportes/top-productos` Productos más vendidos
- `GET /api/reportes/top-referidos` Referidos con más ventas
- `GET /api/reportes/comisiones-pendientes` Deuda por distribuidor

**FASE 7 - Operaciones de API:**
- Paginación estándar en todos los listados `{data, page, limit, total}`
- Búsqueda server-side `?q=` (ILIKE)

## Frontend (`src/`)
- `main.tsx`, `App.tsx`        Arranque y rutas: /login, /, /mi-red, /tienda, /catalogo, /producto/:id, /carrito, /checkout, /confirmacion.
- `config.ts`                  `API_URL` = `http://<host>:3000`.
- `services/productosService.ts` Capa de servicio del catálogo (hoy MOCK; pasar a fetch).
- `data/productos.ts`, `data/red.ts` Datos mock.
- `context/AuthContext.tsx`    Sesión/rol. `CartContext.tsx` carrito. `LayoutContext.tsx` layout.
- `components/Login.tsx`       Login; lee `data.error` de la API.
- `components/Dashboard.tsx`, `MiRed.tsx`  Vista admin, KPIs y red.
- `components/Storefront.tsx`, `Catalogo.tsx`, `DetalleProducto.tsx`  Tienda.
- `components/Carrito.tsx`, `Checkout.tsx`, `Confirmacion.tsx`  Flujo de compra.
- `components/Layout.tsx`, `Navbar.tsx`, `Sidebar.tsx`  Estructura visual.

### Vistas pendientes (por fase)
**FASE 1:**
- `/registro` - Formulario de registro con código de referido
- Actualizar MiRed para mostrar link de referido propio

**FASE 2:**
- `/admin/productos` - CRUD de productos (tabla + formulario)

**FASE 3:**
- `/mis-pedidos` - Historial de pedidos del cliente
- `/admin/pedidos` - Gestión de pedidos del admin

**FASE 4:**
- Panel "Mis comisiones" en MiRed

**FASE 5:**
- `/admin/liquidaciones` - Gestión de liquidaciones

**FASE 6:**
- Dashboard admin real con KPIs de reportes

## Database (`database/`)
- `init.sql`        Estructura base: usuarios, referidos, productos, pedidos, pedido_items + índices + pgcrypto
- `004_backoffice.sql` Migraciones FASE 0: columnas nuevas, tablas comisiones y liquidaciones
- `seed.sql`        Datos iniciales: usuarios (passwords bcrypt), referidos (códigos), productos

## Reglas del proyecto
- No cambiar firmas de endpoints existentes ni la forma de los JSON que consume el frontend.
- Arquitectura: routes → controllers → (repository) → models.
- Inyección de dependencias: controladores reciben repositorios vía constructor.
- Seguridad por defecto: toda ruta de escritura requiere `RequireAuth`; rutas admin requieren `RequireAdmin`.
- Mobile-first: UI a 360px mínimo, touch ≥44px, un campo por fila en formularios.

## Estado de Fases (PLAN_IMPLEMENTACION_U2)

| Fase | Entregable | Estado |
|---|---|---|
| 0 | Migración `004_backoffice.sql` + PostgreSQL + config/postgres.go | ✅ Completada |
| 1 | Registro + referido real (`POST /api/register`, `GET /api/red/mia`) | ⏳ Pendiente |
| 2 | CRUD productos admin (POST/PUT/DELETE-lógico, `?q=` ILIKE) | ⏳ Pendiente |
| 3 | Pedidos: `/mios`, admin, detalle, estados, cancelar→stock+clawback | ⏳ Pendiente |
| 4 | Ledger `comisiones` en la tx + `/red/mia` + `domain.RepartirComisiones` pura | ⏳ Pendiente |
| 5 | Liquidaciones `pendiente→pagada` (idempotente, bloqueo FOR UPDATE) | ⏳ Pendiente |
| 6 | Reportes SQL reales + Dashboard consumiendo `/api/reportes/*` | ⏳ Pendiente |
| 7 | `Pagina{data,page,limit,total}` + `?q=` admin + auditoría de rutas | ⏳ Pendiente |

## Demostración educativa
### Simular ROLLBACK en clase
En `checkoutController.go`, línea 57-58, descomentar:
```go
// return errors.New("FALLA SIMULADA: Caída del sistema antes de procesar items")
```
Esto forzará un ROLLBACK antes de insertar items, demostrando que el pedido no se crea en la base de datos.

### Verificar Goroutines
Al hacer checkout, revisar los logs del servidor. Verás:
```
[Goroutine] Iniciando cálculo de comisiones para ...
[Goroutine] Comisión nivel 1: $XX.XX (10%)
[Goroutine] Comisión nivel 2: $XX.XX (5%)
[Goroutine] Comisión nivel 3: $XX.XX (2%)
[Goroutine] Cálculo de comisiones completado
```
Esto ocurre en segundo plano mientras el cliente ya ve la confirmación.

## Comandos
- **Iniciar servicios:** `docker compose up -d` (PostgreSQL en 5434, Redis en 6379)
- **Backend:** `cd backend && go run .` | Build: `go build ./...`
- **Frontend:** `npm run dev` | `npm run build` | `npm run lint`
- **Health check:** `curl http://localhost:3000/api/health`

## Documentación
- `REQUIREMENTS_CHECKLIST.md` - Estado por Unidad/Tema del sílabo + plan PWA
- `PLAN_IMPLEMENTACION_U2.md` - Plan checkeable por fases 0-7
- `ANALISIS_FUNCIONAL_U2.md` - Análisis de brechas y justificación de diseño

## Plan PWA (Progressive Web App)

Transformar MultiCatálogo en PWA para permitir instalación en móviles y funcionamiento offline.

### Fases PWA

**PWA-FASE 0 - Configuración base:**
- Instalar `vite-plugin-pwa` como devDependency
- Configurar `vite.config.ts` con `VitePWA` plugin
- Crear manifest PWA con nombre, descripción, colores básicos
- Verificar que Service Worker se genera en build

**PWA-FASE 1 - Iconos y assets:**
- Crear directorio `public/icons/`
- Generar iconos PWA en tamaños: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Crear `apple-touch-icon.png` (180x180) para iOS
- Crear `favicon.ico` con versión moderna
- Actualizar manifest.json con rutas a iconos

**PWA-FASE 2 - Estrategia de caché y offline:**
- Configurar strategy `CacheFirst` para assets estáticos (images, fonts)
- Configurar strategy `NetworkFirst` para llamadas API
- Agregar offline fallback page (`public/offline.html`)
- Configurar precaching de rutas principales (`/`, `/tienda`, `/catalogo`)
- Verificar Lighthouse PWA score >90

**PWA-FASE 3 - Notificaciones y actualizaciones:**
- Configurar `registerType: 'autoUpdate'` en VitePWA
- Agregar UI para recargar cuando hay nueva versión disponible
- Opcional: Configurar service worker para notificaciones push
- Verificar instalación en móvil (Chrome Android / Safari iOS)

## Estado de Fases (PWA)

|| Fase | Entregable | Estado |
|---|---|---|
| 0 | Configuración base (vite-plugin-pwa, manifest) | ✅ Completada |
| 1 | Iconos y assets (múltiples tamaños, apple-touch-icon) | ✅ Completada |
| 2 | Estrategia de caché y offline (CacheFirst, NetworkFirst) | ✅ Completada |
| 3 | Notificaciones y actualizaciones (auto-update, UI recarga) | ✅ Completada (UI básica simplificada) |
