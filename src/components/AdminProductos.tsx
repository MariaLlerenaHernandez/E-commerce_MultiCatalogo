// src/components/AdminProductos.tsx
import { useState, useEffect, useMemo } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock?: number;
  categoria?: string;
  img?: string;
  activo?: boolean;
}

const AdminProductos = () => {
  const { token } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("todas");
  const [notificacion, setNotificacion] = useState<{ tipo: "exito" | "error"; mensaje: string } | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    categoria: "",
    img: "",
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/productos`);
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching productos:", error);
      mostrarNotificacion("error", "Error al conectar con el servidor de productos");
    } finally {
      setLoading(false);
    }
  };

  const mostrarNotificacion = (tipo: "exito" | "error", mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `${API_URL}/api/productos/${editing.id}`
      : `${API_URL}/api/productos`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio),
          stock: parseInt(formData.stock) || 0,
          activo: true,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        setFormData({
          nombre: "",
          descripcion: "",
          precio: "",
          stock: "",
          categoria: "",
          img: "",
        });
        mostrarNotificacion("exito", editing ? "Producto actualizado correctamente" : "Producto creado con éxito");
        fetchProductos();
      } else {
        const err = await res.json().catch(() => ({}));
        mostrarNotificacion("error", err.message || "Error al procesar el producto");
      }
    } catch (error) {
      console.error("Error saving producto:", error);
      mostrarNotificacion("error", "Error inesperado al guardar el producto");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas desactivar este producto del catálogo?")) return;

    try {
      const res = await fetch(`${API_URL}/api/productos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        mostrarNotificacion("exito", "Producto desactivado");
        fetchProductos();
      } else {
        mostrarNotificacion("error", "No se pudo desactivar el producto");
      }
    } catch (error) {
      console.error("Error deleting producto:", error);
      mostrarNotificacion("error", "Error de comunicación con el servidor");
    }
  };

  const handleEdit = (producto: Producto) => {
    setEditing(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precio: producto.precio.toString(),
      stock: producto.stock?.toString() || "0",
      categoria: producto.categoria || "",
      img: producto.img || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const abrirNuevoFormulario = () => {
    setEditing(null);
    setFormData({
      nombre: "",
      descripcion: "",
      precio: "",
      stock: "",
      categoria: "Facial",
      img: "https://picsum.photos/seed/nuevo/300",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Obtener lista de categorías únicas para los filtros
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    productos.forEach((p) => {
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats);
  }, [productos]);

  // Filtrado reactivo en memoria
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat =
        selectedCategoria === "todas" ||
        p.categoria?.toLowerCase() === selectedCategoria.toLowerCase();

      return matchSearch && matchCat;
    });
  }, [productos, searchTerm, selectedCategoria]);

  const stockTotal = useMemo(() => {
    return productos.reduce((acc, p) => acc + (p.stock || 0), 0);
  }, [productos]);

  if (loading && productos.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">Cargando inventario de productos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Alerta de notificación flotante */}
      {notificacion && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-md transition-all duration-300 ${
            notificacion.tipo === "exito"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notificacion.tipo === "exito" ? "✅" : "⚠️"}</span>
            <span>{notificacion.mensaje}</span>
          </div>
          <button
            onClick={() => setNotificacion(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Encabezado y Métricas Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Gestión de Productos
            </h1>
            <span className="bg-purple-100 text-purple-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              Inventario
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Administra los artículos de tu catálogo, imágenes, precios y disponibilidad en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Total Productos</span>
              <span className="text-slate-800 font-bold text-base">{productos.length}</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-400 block font-medium">Unidades en Stock</span>
              <span className="text-indigo-600 font-bold text-base">{stockTotal}</span>
            </div>
          </div>

          <button
            onClick={abrirNuevoFormulario}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-purple-200 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer text-sm whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Formulario Modal / Expandible */}
      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-purple-200 shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                {editing ? "✏️" : "✨"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editing ? `Editar: ${editing.nombre}` : "Agregar Nuevo Producto al Catálogo"}
                </h2>
                <p className="text-xs text-slate-500">
                  Completa los datos y visualiza cómo lucirá la imagen en la tienda
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Cerrar formulario"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Vista previa en vivo de la imagen */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Vista Previa de Imagen
                </span>
                <div className="relative w-40 h-40 rounded-xl overflow-hidden shadow-sm bg-white border border-slate-200 flex items-center justify-center group">
                  {formData.img ? (
                    <img
                      src={formData.img}
                      alt="Vista previa"
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&auto=format&fit=crop&q=60";
                      }}
                    />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs mt-1">Sin imagen</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2 px-2">
                  Pega un enlace directo (URL https) para actualizar la portada
                </p>
              </div>

              {/* Campos del Formulario */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Serum Revitalizante Facial"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Categoría *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Facial, Limpieza, Cuidado Diario..."
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Precio (USD $) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Stock Disponible *
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    URL de la Imagen
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formData.img}
                    onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Descripción del Producto
                  </label>
                  <textarea
                    placeholder="Describe los beneficios, ingredientes o características del producto..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition"
              >
                {editing ? "Guardar Cambios" : "Publicar Producto"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro por Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategoria("todas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              selectedCategoria === "todas"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todas ({productos.length})
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoria(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                selectedCategoria === cat
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Intuitiva y Moderna con Tailwind */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Disponibilidad</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🔍</span>
                      <p className="font-semibold text-slate-700">No se encontraron productos</p>
                      <p className="text-xs text-slate-500">Prueba ajustando el término de búsqueda o categoría.</p>
                      {searchTerm && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedCategoria("todas");
                          }}
                          className="mt-2 text-xs font-semibold text-purple-600 hover:underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((p) => {
                  const stockNum = p.stock ?? 0;
                  const isLowStock = stockNum > 0 && stockNum <= 15;
                  const isOutOfStock = stockNum === 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-purple-50/30 transition-colors duration-150 group"
                    >
                      {/* Columna Producto: Imagen + Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs flex-shrink-0 group-hover:shadow-sm transition">
                            <img
                              src={p.img || "https://picsum.photos/seed/product/150"}
                              alt={p.nombre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=60";
                              }}
                            />
                            <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/60 text-white px-1 rounded-sm">
                              #{p.id}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-base group-hover:text-purple-700 transition">
                              {p.nombre}
                            </span>
                            {p.descripcion && (
                              <p className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                                {p.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {p.categoria || "General"}
                        </span>
                      </td>

                      {/* Precio */}
                      <td className="px-6 py-4">
                        <span className="text-base font-extrabold text-slate-900">
                          ${Number(p.precio).toFixed(2)}
                        </span>
                      </td>

                      {/* Stock / Disponibilidad */}
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Agotado (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Bajo stock ({stockNum})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {stockNum} unidades
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Activo
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition cursor-pointer"
                            title="Editar datos del producto"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </button>

                          <button
                            onClick={() => handleDelete(p.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition cursor-pointer"
                            title="Desactivar producto"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de tabla con resumen */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Mostrando <strong>{productosFiltrados.length}</strong> de <strong>{productos.length}</strong> productos
          </span>
          <span className="text-slate-400">
            MultiCatálogo &bull; Maria Llerena Hernandez
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminProductos;
