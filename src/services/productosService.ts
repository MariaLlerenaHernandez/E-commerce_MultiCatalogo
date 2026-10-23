// src/services/productosService.ts
// Capa de servicios del catálogo que consume la API REST de Go (GET /api/productos)
// con fallback automático a productosMock para soporte PWA Offline.

import { API_URL } from "../config";
import { productosMock, type Producto } from "../data/productos";

// GET /api/productos (lista de productos desde la API con fallback offline)
export const getProductos = async (): Promise<Producto[]> => {
  try {
    const res = await fetch(`${API_URL}/api/productos`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Fallo al conectar con la API de productos, usando catálogo local offline:", err);
  }
  return productosMock;
};

// GET /api/productos/:id (detalle de un producto desde la API con fallback offline)
export const getProductoById = async (id: number): Promise<Producto | undefined> => {
  try {
    const res = await fetch(`${API_URL}/api/productos/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`Fallo al conectar con la API para producto ${id}, usando fallback local:`, err);
  }
  return productosMock.find((p) => p.id === id);
};