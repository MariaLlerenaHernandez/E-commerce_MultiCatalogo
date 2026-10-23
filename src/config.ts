// En desarrollo local apunta a :3000; en producción (Render) utiliza VITE_API_URL o la raíz relativa del dominio
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? `http://${window.location.hostname}:3000`
    : "");