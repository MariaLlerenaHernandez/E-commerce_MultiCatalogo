// En desarrollo local apunta a :3000; en producción (Render) utiliza VITE_API_URL asegurando protocolo https
const rawApiUrl = import.meta.env.VITE_API_URL;
export const API_URL = rawApiUrl
  ? (rawApiUrl.startsWith("http") ? rawApiUrl : `https://${rawApiUrl}`)
  : (import.meta.env.DEV
      ? `http://${window.location.hostname}:3000`
      : "");