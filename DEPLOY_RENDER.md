# 🚀 Guía de Despliegue en Render (MultiCatálogo - Maria Llerena Hernandez)

Esta guía te explica paso a paso cómo subir tu proyecto a **Render** para que tu profesor pueda ingresar al link público, probar todas las vistas y descargar la aplicación como **PWA**.

---

## 📋 Estructura de Servicios en Render

Para desplegar en Render necesitas:
1. **PostgreSQL Database** (Base de datos gratuita en Render).
2. **Web Service (Backend Go Fiber)**: Provee la API REST, autenticación JWT y transacciones.
3. **Static Site (Frontend Vite React PWA)**: Aloja la aplicación web progresiva con soporte de descarga offline.

---

## 🛠️ Paso 1: Subir tus cambios a tu repositorio de GitHub

En tu terminal o en VSCode:
```bash
git add .
git commit -m "feat: interfaz completada, sidebar verde, usuarios y soporte render pwa"
git push origin main
```

---

## 🗄️ Paso 2: Crear la Base de Datos PostgreSQL en Render

1. Entra a [dashboard.render.com](https://dashboard.render.com) e inicia sesión con tu cuenta de GitHub.
2. Clic en **New +** -> **PostgreSQL**.
3. Configuración:
   - **Name:** `multicatalogo-db`
   - **Database:** `multicatalogo`
   - **User:** `multicatalogo`
   - **Region:** `Oregon (US West)` (o la más cercana)
   - **Plan:** `Free`
4. Clic en **Create Database**.
5. Una vez creada, copia el **Internal Database URL** (o los campos Host, Port, User, Password).
6. Ve a la pestaña **Connect** o usa la terminal de Render/DBeaver para ejecutar los scripts SQL de inicialización:
   - Ejecuta el contenido de `database/init.sql`
   - Ejecuta el contenido de `database/004_backoffice.sql`
   - Ejecuta el contenido de `database/seed.sql`

---

## ⚙️ Paso 3: Crear el Servicio Web del Backend (Go)

1. En Render, clic en **New +** -> **Web Service**.
2. Conecta tu repositorio de GitHub `Sistemas_Incidencias` (o el nombre de tu repo).
3. Configuración del servicio:
   - **Name:** `multicatalogo-backend`
   - **Region:** Misma región que la base de datos (ej. `Oregon`)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Go`
   - **Build Command:** `go build -o app .`
   - **Start Command:** `./app`
   - **Plan:** `Free`
4. En **Environment Variables** (Variables de Entorno), añade:
   - `PORT`: `10000`
   - `DB_HOST`: El host de tu Postgres en Render (ej. `dpg-xxxx-a.oregon-postgres.render.com`)
   - `DB_PORT`: `5432`
   - `DB_NAME`: `multicatalogo`
   - `DB_USER`: `multicatalogo`
   - `DB_PASSWORD`: La contraseña generada por Render
   - `JWT_SECRET`: `ClaveSuperSecretaMaria2026`
   - `CORS_ORIGIN`: `*`
5. Clic en **Create Web Service**.
6. Copia la URL que Render le asigne a tu backend (ejemplo: `https://multicatalogo-backend-xxxx.onrender.com`).

---

## 💻 Paso 4: Crear el Sitio Estático del Frontend (Vite PWA)

1. En Render, clic en **New +** -> **Static Site**.
2. Conecta el mismo repositorio de GitHub.
3. Configuración:
   - **Name:** `multicatalogo`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. En **Environment Variables**:
   - `VITE_API_URL`: La URL de tu backend en Render del paso anterior (ej. `https://multicatalogo-backend-xxxx.onrender.com`).
5. En la sección **Redirects/Rewrites**:
   - Clic en **Add Rule**:
     - **Source:** `/*`
     - **Destination:** `/index.html`
     - **Action:** `Rewrite`
   *(Esto es indispensable para que React Router funcione al recargar cualquier página como `/mi-red` o `/admin/usuarios` sin error 404)*.
6. Clic en **Create Static Site**.

---

## 📱 ¿Cómo probar y descargar la PWA?

1. Abre el enlace público que Render te da para el frontend (ej. `https://multicatalogo.onrender.com`).
2. En tu computadora (Chrome/Edge):
   - Verás el botón flotante en la esquina inferior derecha: **`⬇ Instalar app`**.
   - Al darle clic, o en el ícono de instalación en la barra de direcciones del navegador, se descargará e instalará como aplicación de escritorio nativa.
3. En el celular (Android / iOS):
   - Al abrir el enlace, el botón flotante **`⬇ Instalar app`** te permitirá instalarla directamente en la pantalla de inicio del teléfono con su ícono y pantalla de bienvenida.
