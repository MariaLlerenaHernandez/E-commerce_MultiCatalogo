// En desarrollo local apunta a :3000; en producción (Render) resuelve dinámicamente el dominio .onrender.com
const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL;
  if (raw && typeof raw === "string" && raw.trim() !== "") {
    let url = raw.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (!url.includes(".")) {
        url = `${url}.onrender.com`;
      }
      url = `https://${url}`;
    }
    return url;
  }
  return import.meta.env.DEV
    ? `http://${window.location.hostname}:3000`
    : "https://multicatalogo-backend.onrender.com";
};

export const API_URL = getApiUrl();