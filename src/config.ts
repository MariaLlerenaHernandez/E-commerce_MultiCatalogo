// Usa el mismo host desde el que se abrió el frontend, así funciona en la PC (localhost) y en el celular (192.168.1.102)
export const API_URL = `http://${window.location.hostname}:3000`;