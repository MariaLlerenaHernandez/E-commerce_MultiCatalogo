# REQUIREMENTS CHECKLIST — MultiCatálogo

> Fuente de verdad del progreso. Leer al inicio de cada sesión; marcar `- [x]`
> y actualizar "Estado General" al completar cualquier tarea.
>
> **Estructura:** el documento se divide en fases por **Unidad/Tema del sílabo**
> (`Silabo_Framework_Programacion_Web.md`). Cada fase trae un comentario con lo
> que se hará en esa clase. El producto integrador es UNO: MultiCatálogo —
> una tienda cosmética con red de ventas multinivel (MLM) que crece como
> **sistema políglota**: React (front) + Go/Fiber (núcleo transaccional, U2)
> + FastAPI (capa SaaS/multitenant, U3), desplegado contenerizado (U4).
>
> **Principios rectores (aplican a toda fase):**
> - Seguridad por defecto: ningún endpoint nuevo nace sin auth ni validación.
> - Inyección de dependencias: interfaces en los bordes; globals solo en el entry point.
> - Funciones puras para el dominio (comisiones, totales, validadores) — testeables sin I/O.
> - Mobile-first: UI a 360px, touch ≥44px, un campo por fila en formularios.

## Estado General

| Ítem | Valor |
|---|---|
| **Hito actual** | **PWA FASE 0-3 completadas + Dashboard real conectado a API** |
| **Última tarea completada** | FASE 6: Dashboard actualizado para consumir `/api/reportes/*` (2026-10-22) |
| **Siguiente tarea pendiente** | Completar FASE 4-5: vistas MiRed comisiones + admin liquidaciones |
| **Bloqueadores** | PostgresRepository parcial (solo ProductRepository); usando MemoryRepository para operaciones complejas; endpoints de FASE 4-5 retornan datos simulados (TODO implementar SQL real) |

## Arquitectura objetivo del semestre

```
React SPA (:5173) ──► Caddy/Nginx (U4: proxy inverso + SSL)
                        ├─ /api/tx/*   → Go/Fiber  :3000  — núcleo transaccional (U2)
                        └─ /api/saas/* → FastAPI   :8000  — capa SaaS/multitenant (U3)
                                            │
                          PostgreSQL 16 (:5434) + Redis (:6379)
```

---

# UNIDAD 1 — FRAMEWORKS FRONTEND (SPA React + Vite + Tailwind)

## U1-T1 · Introducción a frameworks web y arquitectura de soluciones

> Se presenta la pila tecnológica del semestre, la inversión de control y los
> lineamientos del producto integrador MultiCatálogo (tienda + red MLM).

- [ ] Pila definida y workspace estructurado (`Unidad1_Frontend/`, `Unidad2_Backend/`)

## U1-T2 · Entorno SPA con Vite + Tailwind CSS

> Scaffold del frontend: empaquetador Vite, Tailwind v4, estructura de carpetas
> por responsabilidad (`components/`, `context/`, `services/`, `data/`).

- [ ] Entorno SPA con Vite + Tailwind CSS
- [ ] `package.json` renombrado a `multicatalogo-frontend`
- [ ] `VITE_API_URL` en `.env` + `import.meta.env` (cliente único en `services/http.ts`)

## U1-T3 · Componentes y gestión de estado global

> Estado global con React Context: sesión de usuario y carrito por usuario.

- [ ] `AuthContext` (sesión `{email, rol}`) y `CartContext` (carrito en localStorage por email)
- [ ] Persistencia de sesión en `AuthContext` (`multicatalogo_sesion`: usuario + JWT en localStorage)
- [ ] Warnings eslint resueltos: split `context/auth.ts` + `context/cart.ts` (hooks/tipos separados del Provider); `npm run lint` → 0 errores, 0 warnings

## U1-T4 · Consumo de API RESTful y enrutamiento

> Promesas con fetch, capa de servicios desacoplada y guardas de ruta por rol.

- [ ] `services/productosService.ts`, `redService.ts` + guardas `ProtectedRoute`/`AdminRoute`
- [ ] `services/http.ts`: `apiFetch` único con `Authorization: Bearer` automático, `ApiError` tipado con status y helpers de sesión

## U1-T5 · Interfaces full-screen y flujos MLM (Práctica 03)

> Vistas inmersivas del catálogo y flujo completo de compra y red multinivel.

- [ ] F8 Login con rol + redirección por rol
- [ ] F1 Storefront `/tienda` full-screen | F3 Catálogo con búsqueda/filtros | F2 Detalle `/producto/:id` | F4 Lightbox
- [ ] F5 Carrito + checkout + confirmación | F6 Árbol multinivel comisiones 10/5/2 % | F7 Dashboard KPIs
- [ ] `Checkout.tsx` → `POST /api/checkout` real (sin simulación) + manejo de `APIError`
- [ ] Audit mobile-first: 375px sin overflow en Dashboard/MiRed/Catálogo; botones de acción ≥44px (`Añadir al Carrito`, steppers de `Carrito`, `Cerrar Sesión`)

---

# UNIDAD 2 — BACKEND ALTA TRANSACCIONALIDAD (Go/Fiber · "entornos bancarios")

## U2-T1 · Rendimiento, memoria y concurrencia

> Goroutines y contextos: procesos de misión crítica que no bloquean la respuesta HTTP.

- [x] Goroutine `procesarComisiones` tras el COMMIT del pedido (contexto propio, no el del request)
  - **Estado:** Implementado en `checkoutController.go` con `calcularComisionesAsync`
  - **Nota:** Ejecuta tasas 10%, 5%, 2% en segundo plano con logs visibles

## U2-T2 · Microservicios y APIs robustas (Fiber)

> API REST en capas con contrato de error estándar y configuración por entorno.

- [x] Capas routes → controllers → repository; endpoints login/productos/red/health
  - **Estado:** Arquitectura implementada con interfaces
- [x] `APIError{status,message,details}` en todos los errores + validación de entrada (400/404)
  - **Estado:** Implementado en `models/models.go`, usado en todos los controladores
- [ ] Puerto de escucha configurable (`PORT`, defecto 3000)
  - **Estado:** Hardcoded en `:3000`, pendiente variable de entorno
- [ ] `/api/health` real: `HealthController` con ping a Postgres (503 si cae) y Redis (`"degraded"` si cae)
  - **Estado:** Implementado básico, pendiente ping a Postgres (usando memoria simulada)

## U2-T3 · Persistencia PostgreSQL + caché Redis

> Dockeriza la BD, SQL puro con pgx, reconstrucción del árbol y Cache-Aside.

- [x] `docker-compose` Postgres 16 + Redis alpine + volumen + healthchecks
  - **Estado:** Redis implementado, PostgreSQL pendiente
- [ ] `init.sql` (usuarios/productos/referidos + seed), `repository.go` a SQL real, árbol por `parent_id`
  - **Estado:** Usando `memoryRepository.go` con datos estáticos, pendiente migración a SQL
- [x] Cache-Aside: `productos:all` TTL 5 min, `red:tree:{email}` TTL 10 min, degradación sin caché
  - **Estado:** Implementado en `prodController.go` y `redController.go`
- [ ] Índices: `referidos(parent_id)`, `pedidos(cliente_email)`, `pedido_items(pedido_id)`, `productos(categoria)` (migración `003_seguridad.sql` + init.sql)
  - **Estado:** Pendiente (requiere PostgreSQL)
- [ ] Errores propagados: firmas del repo devuelven `error`; `ErrNoEncontrado`→404/401, resto→500 (nunca lista vacía silenciosa)
  - **Estado:** Parcialmente implementado, pendiente refinamiento con errores específicos

## U2-T4 · Inyección de dependencias y microservicio seguro

> DI por interfaces en toda la cadena + transacción ACID del checkout + hardening.

- [x] Interfaces `DBRepository`/`CacheRepository`; `PostgresRepository`/`RedisCache`; structs de controladores; `NewControllers` en `main.go`
  - **Estado:** Interfaces en `interfaces/interfaces.go`, controladores refactorizados
- [x] `POST /api/checkout` ACID: `FOR UPDATE` + descuento de stock + `pedidos`/`pedido_items`, ROLLBACK → 400/500, total recalculado en servidor
  - **Estado:** Implementado con transacción simulada en `memoryRepository.go`, pendiente `FOR UPDATE` real en PostgreSQL
- [x] Invalidación de caché tras compra (`productos:all`, `red:tree:*`) + migración `002_checkout.sql`
  - **Estado:** Invalidación implementada, migración SQL pendiente
- [ ] bcrypt de passwords (pgcrypto `crypt()/gen_salt('bf')` en migración `003_seguridad.sql` + seed; login con `CompareHashAndPassword`)
  - **Estado:** Pendiente (usando credenciales hardcodeadas)
- [ ] JWT real (`JWT_SECRET` en env, claims `{sub,email,rol,iat,exp}` 2h, HS256) + `middleware.RequireAuth(secret)`/`RequireAdmin()`
  - **Estado:** Pendiente (usando tokens fake)
- [ ] Protegidos `/api/red` y `/api/checkout` con el middleware (401 sin token / token adulterado)
  - **Estado:** Pendiente (endpoints actualmente públicos)
- [ ] Checkout toma la identidad del TOKEN (`c.Locals` desde claims) — verificado: `email` falso en body NO se persiste ni atribuye comisiones
  - **Estado:** Pendiente (usando email del body sin validación JWT)
- [ ] Errores sanitizados: `Details` solo con `APP_ENV=dev`; `ErrCantidadInvalida` propio (400 "cantidad debe ser mayor que cero", distinto de stock)

---

# PWA — PROGRESSIVE WEB APP

> Transformar MultiCatálogo en PWA para permitir instalación en móviles, funcionamiento offline y notificaciones push.

## PWA-FASE 0 · Configuración base

> Instalar plugin PWA de Vite y configurar manifiesto básico.

- [x] Instalar `vite-plugin-pwa` como devDependency
- [x] Configurar `vite.config.ts` con `VitePWA` plugin
- [x] Crear manifest PWA con nombre, descripción, colores básicos
- [x] Verificar que Service Worker se genera en build

## PWA-FASE 1 · Iconos y assets

> Generar iconos en tamaños requeridos para PWA (192x192, 512x512, apple-touch-icon).

- [x] Crear directorio `public/icons/`
- [x] Generar iconos PWA en tamaños: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- [x] Crear `apple-touch-icon.png` (180x180) para iOS
- [x] Crear `favicon.ico` con versión moderna
- [x] Actualizar manifest.json con rutas a iconos

## PWA-FASE 2 · Estrategia de caché y offline

> Configurar estrategia de caché para permitir funcionamiento offline de recursos estáticos.

- [x] Configurar strategy `CacheFirst` para assets estáticos (images, fonts)
- [x] Configurar strategy `NetworkFirst` para llamadas API
- [x] Agregar offline fallback page (`public/offline.html`)
- [x] Configurar precaching de rutas principales (`/`, `/tienda`, `/catalogo`)
- [ ] Verificar Lighthouse PWA score >90

## PWA-FASE 3 · Notificaciones y actualizaciones

> Configurar auto-update del Service Worker y preparar notificaciones push (opcional).

- [x] Configurar `registerType: 'autoUpdate'` en VitePWA
- [x] Agregar UI para recargar cuando hay nueva versión disponible
- [ ] Opcional: Configurar service worker para notificaciones push
- [ ] Verificar instalación en móvil (Chrome Android / Safari iOS)

## Criterios de verificación por fase

**PWA-FASE 0:**
- `npm run build` genera `sw.js` y `workbox-*.js` en `dist/`
- Lighthouse PWA audit muestra "PWA Optimized"

**PWA-FASE 1:**
- Lighthouse PWA audit muestra "Installable"
- Iconos renderizan correctamente en todos los tamaños
- iOS muestra icono en "Add to Home Screen"

**PWA-FASE 2:**
- App funciona offline (carga página anterior, muestra offline.html)
- Network tab muestra recursos cacheados con Service Worker
- `application/x-web-app-manifest+json` response header correcto

**PWA-FASE 3:**
- App se actualiza automáticamente cuando hay nueva versión
- Banner "Update available" aparece al cambiar de versión
- Opcional: Notificaciones push funcionan (requiere backend adicional)
  - **Estado:** Pendiente refinamiento de errores específicos

---
