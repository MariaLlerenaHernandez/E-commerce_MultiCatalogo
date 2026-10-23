// src/components/MisPedidos.tsx
import { useState, useEffect, useMemo } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

interface PedidoItem {
  id?: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal?: number;
}

interface PedidoCliente {
  id: number;
  numero: string;
  fecha: string;
  total: number;
  estado: "pendiente" | "preparando" | "enviado" | "entregado" | "cancelado" | string;
  nombre?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  metodo_pago?: string;
  items?: PedidoItem[];
}

const MisPedidos = () => {
  const { token, isAuthenticated, user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoCliente | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPedidos();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/api/pedidos/mios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Error al cargar tus pedidos");
      }

      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión con el servidor";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verRecibo = async (p: PedidoCliente) => {
    try {
      setCargandoDetalle(true);
      setPedidoDetalle(p);
      const res = await fetch(`${API_URL}/api/pedidos/${p.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPedidoDetalle(data);
      }
    } catch (err) {
      console.error("Error obteniendo detalle de pedido:", err);
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Métricas de compras del usuario
  const metricas = useMemo(() => {
    const totalCompras = pedidos.length;
    const gastoTotal = pedidos
      .filter((p) => p.estado !== "cancelado")
      .reduce((acc, p) => acc + Number(p.total || 0), 0);
    const activos = pedidos.filter(
      (p) => p.estado === "pendiente" || p.estado === "preparando" || p.estado === "enviado"
    ).length;
    const entregados = pedidos.filter((p) => p.estado === "entregado").length;

    return { totalCompras, gastoTotal, activos, entregados };
  }, [pedidos]);

  // Filtrado reactivo de pedidos
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const matchSearch =
        p.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.ciudad && p.ciudad.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.metodo_pago && p.metodo_pago.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;

      return matchSearch && matchEstado;
    });
  }, [pedidos, searchTerm, filtroEstado]);

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case "entregado":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
          dot: "bg-emerald-500",
          label: "Entregado",
        };
      case "enviado":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200/80",
          dot: "bg-blue-500",
          label: "Enviado",
        };
      case "preparando":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200/80",
          dot: "bg-purple-500",
          label: "Preparando",
        };
      case "cancelado":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200/80",
          dot: "bg-rose-500",
          label: "Cancelado",
        };
      case "pendiente":
      default:
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200/80",
          dot: "bg-amber-500",
          label: "Pendiente",
        };
    }
  };

  if (!isAuthenticated || !token) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white rounded-2xl shadow-xs border border-slate-200 my-12">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          🔒
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Inicia Sesión</h2>
        <p className="text-slate-500 text-sm mb-6">
          Debes identificarte con tu cuenta para consultar el historial y recibos de tus pedidos.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-100 transition"
        >
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  if (loading && pedidos.length === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-sm font-medium">Consultando tus pedidos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Mis Pedidos
            </h1>
            <span className="bg-purple-100 text-purple-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Revisa el estado de entrega y los recibos de compra de tu cuenta ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <span>🛍️</span> Seguir Comprando
          </Link>
          <button
            onClick={fetchPedidos}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition cursor-pointer"
            title="Refrescar pedidos"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Alerta de Error si ocurre */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="font-bold opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Tarjetas Resumen */}
      {pedidos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Total Compras
            </span>
            <span className="text-2xl font-black text-slate-800">{metricas.totalCompras}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Órdenes registradas</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs uppercase font-bold text-amber-600 tracking-wider block mb-1">
              En Camino / Proceso
            </span>
            <span className="text-2xl font-black text-amber-600">{metricas.activos}</span>
            <span className="text-xs text-amber-700/70 block mt-0.5">Pendiente o enviado</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs uppercase font-bold text-emerald-600 tracking-wider block mb-1">
              Entregados
            </span>
            <span className="text-2xl font-black text-emerald-600">{metricas.entregados}</span>
            <span className="text-xs text-emerald-700/70 block mt-0.5">Completados</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider block mb-1">
              Total Invertido
            </span>
            <span className="text-2xl font-black text-slate-900">${metricas.gastoTotal.toFixed(2)}</span>
            <span className="text-xs text-indigo-600/70 block mt-0.5">En productos MultiCatálogo</span>
          </div>
        </div>
      )}

      {/* Filtros y Buscador */}
      {pedidos.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
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
              placeholder="Buscar por Nº de pedido (MC-...), método de pago o ciudad..."
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

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "todos", label: "Todos" },
              { id: "pendiente", label: "Pendientes" },
              { id: "enviado", label: "Enviados" },
              { id: "entregado", label: "Entregados" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroEstado(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  filtroEstado === f.id
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de Pedidos */}
      {pedidos.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-xs border border-slate-200 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            📦
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Aún no tienes pedidos</h3>
          <p className="text-slate-500 text-xs mb-6">
            Explora nuestro catálogo con productos de belleza y cuidado diario y realiza tu primera compra.
          </p>
          <Link
            to="/catalogo"
            className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-purple-100 transition text-sm"
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4">Nº Pedido</th>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Pago / Entrega</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                      <p className="font-semibold text-slate-700 text-sm">No se encontraron pedidos</p>
                      <p className="text-xs text-slate-400 mt-1">Prueba cambiando el filtro o término de búsqueda.</p>
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((p) => {
                    const badge = getBadgeEstado(p.estado);

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-purple-50/20 transition-colors duration-150 group"
                      >
                        {/* Nº Pedido */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600 text-xs">
                              🧾
                            </span>
                            <div>
                              <span className="font-mono font-bold text-slate-800 text-sm group-hover:text-purple-700 transition block">
                                {p.numero}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                Orden #{p.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="px-6 py-4 text-slate-600 text-xs">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{p.fecha}</span>
                          </div>
                        </td>

                        {/* Pago / Entrega */}
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <span className="font-semibold text-slate-700 capitalize block">
                              💳 {p.metodo_pago || "Tarjeta / Efectivo"}
                            </span>
                            {p.ciudad && (
                              <span className="text-slate-400 text-[11px] block mt-0.5">
                                📍 {p.ciudad}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4">
                          <span className="text-base font-extrabold text-slate-900 block">
                            ${Number(p.total).toFixed(2)}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                            {badge.label}
                          </span>
                        </td>

                        {/* Botón Ver Recibo */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => verRecibo(p)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 transition cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Ver Recibo
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Mostrando <strong>{pedidosFiltrados.length}</strong> de <strong>{pedidos.length}</strong> compras
            </span>
            <span className="text-slate-400">MultiCatálogo &bull; Maria Llerena Hernandez</span>
          </div>
        </div>
      )}

      {/* Modal Ticket de Recibo para el Cliente */}
      {pedidoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Ticket */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  🧾
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Recibo de Compra: {pedidoDetalle.numero}
                  </h3>
                  <p className="text-xs text-slate-500">Fecha: {pedidoDetalle.fecha}</p>
                </div>
              </div>
              <button
                onClick={() => setPedidoDetalle(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/80 transition"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Recibo */}
            <div className="p-6 space-y-5 text-xs">
              {/* Info de Envío */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Información de Entrega
                </span>
                <p className="font-semibold text-slate-800 text-sm">
                  {pedidoDetalle.nombre || user?.nombre || "Cliente"}
                </p>
                <p className="text-slate-600">{pedidoDetalle.email || user?.email}</p>
                {pedidoDetalle.direccion && (
                  <p className="text-slate-600 mt-1">📍 {pedidoDetalle.direccion}, {pedidoDetalle.ciudad}</p>
                )}
                {pedidoDetalle.telefono && (
                  <p className="text-slate-600">📞 {pedidoDetalle.telefono}</p>
                )}
              </div>

              {/* Items Desglosados */}
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Artículos
                </span>
                {cargandoDetalle ? (
                  <div className="p-4 text-center text-slate-400">Cargando desglose...</div>
                ) : pedidoDetalle.items && pedidoDetalle.items.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {pedidoDetalle.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{item.nombre}</p>
                          <span className="text-slate-400 text-[11px]">
                            {item.cantidad} x ${Number(item.precio).toFixed(2)}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">
                          ${Number(item.subtotal || item.precio * item.cantidad).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-center">
                    Compra por un total de ${Number(pedidoDetalle.total).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <div>
                  <span className="font-bold text-purple-900 text-sm block">Total Pagado</span>
                  <span className="text-[11px] text-purple-700/70">
                    Método: {pedidoDetalle.metodo_pago || "Tarjeta"}
                  </span>
                </div>
                <span className="text-2xl font-black text-purple-950">
                  ${Number(pedidoDetalle.total).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setPedidoDetalle(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisPedidos;
