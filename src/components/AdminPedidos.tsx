// src/components/AdminPedidos.tsx
import { useState, useEffect, useMemo } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

interface PedidoItem {
  id: number;
  pedido_id: number;
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

interface Pedido {
  id: number;
  numero: string;
  usuario_id?: number;
  email: string;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  metodo_pago?: string;
  total: number;
  items?: PedidoItem[];
  fecha: string;
  estado: "pendiente" | "preparando" | "enviado" | "entregado" | "cancelado";
}

const AdminPedidos = () => {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [notificacion, setNotificacion] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  useEffect(() => {
    if (token) {
      fetchPedidos();
    }
  }, [token]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/pedidos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
      mostrarNotificacion("error", "Error al conectar con el servidor de pedidos");
    } finally {
      setLoading(false);
    }
  };

  const mostrarNotificacion = (tipo: "exito" | "error", texto: string) => {
    setNotificacion({ tipo, texto });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const cambiarEstado = async (id: number, nuevoEstado: string, numero?: string) => {
    try {
      setActualizandoId(id);
      const res = await fetch(`${API_URL}/api/pedidos/${id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        mostrarNotificacion(
          "exito",
          `Pedido ${numero ? numero : `#${id}`} actualizado a "${nuevoEstado}"`
        );
        // Actualizar en el estado local inmediatamente
        setPedidos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado as any } : p))
        );
        if (pedidoSeleccionado && pedidoSeleccionado.id === id) {
          setPedidoSeleccionado((prev) => (prev ? { ...prev, estado: nuevoEstado as any } : null));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        mostrarNotificacion("error", errData.message || "No se pudo cambiar el estado del pedido");
      }
    } catch (error) {
      console.error("Error updating estado:", error);
      mostrarNotificacion("error", "Error de red al actualizar el estado");
    } finally {
      setActualizandoId(null);
    }
  };

  const verDetallePedido = async (p: Pedido) => {
    try {
      setCargandoDetalle(true);
      setPedidoSeleccionado(p);
      const res = await fetch(`${API_URL}/api/pedidos/${p.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPedidoSeleccionado(data);
      }
    } catch (err) {
      console.error("Error cargando detalle:", err);
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Filtrado reactivo de pedidos
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const matchSearch =
        p.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.nombre && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.ciudad && p.ciudad.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;

      return matchSearch && matchEstado;
    });
  }, [pedidos, searchTerm, filtroEstado]);

  // Cálculos métricos para el dashboard de pedidos
  const metricas = useMemo(() => {
    const total = pedidos.length;
    const pendientes = pedidos.filter((p) => p.estado === "pendiente").length;
    const enProceso = pedidos.filter((p) => p.estado === "preparando" || p.estado === "enviado").length;
    const entregados = pedidos.filter((p) => p.estado === "entregado").length;
    const facturado = pedidos
      .filter((p) => p.estado !== "cancelado")
      .reduce((acc, p) => acc + Number(p.total || 0), 0);

    return { total, pendientes, enProceso, entregados, facturado };
  }, [pedidos]);

  // Configuración de estilos visuales por cada estado
  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200/80",
          dot: "bg-amber-500",
          label: "Pendiente",
        };
      case "preparando":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200/80",
          dot: "bg-purple-500",
          label: "Preparando",
        };
      case "enviado":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200/80",
          dot: "bg-blue-500",
          label: "Enviado",
        };
      case "entregado":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
          dot: "bg-emerald-500",
          label: "Entregado",
        };
      case "cancelado":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200/80",
          dot: "bg-rose-500",
          label: "Cancelado",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
          label: estado,
        };
    }
  };

  // Helper para iniciales de avatar
  const getIniciales = (nombre: string, email: string) => {
    if (nombre && nombre.trim().length > 0) {
      const partes = nombre.trim().split(" ");
      if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
      return partes[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading && pedidos.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">Cargando pedidos de la plataforma...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notificación */}
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
            <span>{notificacion.texto}</span>
          </div>
          <button
            onClick={() => setNotificacion(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Encabezado y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Gestión de Pedidos
            </h1>
            <span className="bg-indigo-100 text-indigo-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              Backoffice
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Supervisa compras, actualiza estados de despacho y gestiona el flujo de entrega a clientes.
          </p>
        </div>

        <button
          onClick={fetchPedidos}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar Lista
        </button>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pedidos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pedidos</span>
            <span className="text-lg">📦</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{metricas.total}</p>
          <span className="text-xs text-slate-500">Registrados en la plataforma</span>
        </div>

        {/* Pendientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Por Preparar</span>
            <span className="text-lg">⏳</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{metricas.pendientes}</p>
          <span className="text-xs text-amber-700/80 font-medium">Requieren confirmación</span>
        </div>

        {/* En Tránsito / Proceso */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">En Ruta / Despacho</span>
            <span className="text-lg">🚚</span>
          </div>
          <p className="text-2xl font-extrabold text-blue-600">{metricas.enProceso}</p>
          <span className="text-xs text-blue-700/80 font-medium">Preparando o enviados</span>
        </div>

        {/* Total Facturado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Volumen Ventas</span>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">${metricas.facturado.toFixed(2)}</p>
          <span className="text-xs text-emerald-600 font-semibold">{metricas.entregados} pedidos completados</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Buscador */}
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
            placeholder="Buscar por Nº de pedido (MC-...), cliente, correo o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
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

        {/* Filtros por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "todos", label: "Todos", count: pedidos.length },
            { id: "pendiente", label: "Pendiente", count: metricas.pendientes },
            { id: "preparando", label: "Preparando", count: pedidos.filter((p) => p.estado === "preparando").length },
            { id: "enviado", label: "Enviado", count: pedidos.filter((p) => p.estado === "enviado").length },
            { id: "entregado", label: "Entregado", count: metricas.entregados },
            { id: "cancelado", label: "Cancelado", count: pedidos.filter((p) => p.estado === "cancelado").length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFiltroEstado(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                filtroEstado === item.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Pedidos Profesional */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="px-6 py-4">Nº Pedido</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Estado Actual</th>
                <th className="px-6 py-4 text-center">Gestionar Estado</th>
                <th className="px-6 py-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📭</span>
                      <p className="font-semibold text-slate-700">No hay pedidos que coincidan</p>
                      <p className="text-xs text-slate-500">Prueba cambiando el filtro de estado o la búsqueda.</p>
                      {searchTerm && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFiltroEstado("todos");
                          }}
                          className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Restablecer filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p) => {
                  const badge = getBadgeEstado(p.estado);
                  const isTerminal = p.estado === "entregado" || p.estado === "cancelado";

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-indigo-50/20 transition-colors duration-150 group"
                    >
                      {/* Nº Pedido */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600 text-xs">
                            🧾
                          </span>
                          <div>
                            <span className="font-mono font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition block">
                              {p.numero}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID #{p.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                            {getIniciales(p.nombre, p.email)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block text-sm">
                              {p.nombre || "Cliente"}
                            </span>
                            <span className="text-xs text-slate-500 block">
                              {p.email}
                            </span>
                            {p.ciudad && (
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                📍 {p.ciudad}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{p.fecha}</span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-base font-extrabold text-slate-900 block">
                            ${Number(p.total).toFixed(2)}
                          </span>
                          {p.metodo_pago && (
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                              {p.metodo_pago}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado Actual */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {badge.label}
                        </span>
                      </td>

                      {/* Gestionar Estado */}
                      <td className="px-6 py-4 text-center">
                        {isTerminal ? (
                          <span className="text-xs text-slate-400 font-medium italic">
                            Estado final
                          </span>
                        ) : (
                          <div className="inline-flex items-center">
                            <select
                              value={p.estado}
                              disabled={actualizandoId === p.id}
                              onChange={(e) => cambiarEstado(p.id, e.target.value, p.numero)}
                              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 shadow-2xs hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                            >
                              <option value="pendiente" disabled={p.estado !== "pendiente"}>
                                Pendiente
                              </option>
                              <option value="preparando" disabled={p.estado !== "pendiente" && p.estado !== "preparando"}>
                                📦 Preparando
                              </option>
                              <option value="enviado" disabled={p.estado !== "preparando" && p.estado !== "enviado"}>
                                🚚 Enviado
                              </option>
                              <option value="entregado" disabled={p.estado !== "enviado"}>
                                ✅ Entregado
                              </option>
                              <option value="cancelado">
                                ❌ Cancelar
                              </option>
                            </select>
                          </div>
                        )}
                      </td>

                      {/* Detalle */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => verDetallePedido(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition cursor-pointer"
                          title="Ver detalle y productos de este pedido"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de resumen */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Mostrando <strong>{pedidosFiltrados.length}</strong> de <strong>{pedidos.length}</strong> pedidos
          </span>
          <span className="text-slate-400">
            MultiCatálogo &bull; Maria Llerena Hernandez
          </span>
        </div>
      </div>

      {/* Modal Profesional de Detalle de Pedido */}
      {pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera del Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                  🧾
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Pedido {pedidoSeleccionado.numero}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        getBadgeEstado(pedidoSeleccionado.estado).bg
                      }`}
                    >
                      {getBadgeEstado(pedidoSeleccionado.estado).label}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fecha: {pedidoSeleccionado.fecha} &bull; ID #{pedidoSeleccionado.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPedidoSeleccionado(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información del Cliente y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Datos del Comprador
                  </span>
                  <p className="font-semibold text-slate-800 text-sm">
                    {pedidoSeleccionado.nombre || "Cliente"}
                  </p>
                  <p className="text-slate-600">{pedidoSeleccionado.email}</p>
                  {pedidoSeleccionado.telefono && (
                    <p className="text-slate-600">📞 {pedidoSeleccionado.telefono}</p>
                  )}
                </div>

                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dirección de Despacho
                  </span>
                  <p className="text-slate-800 font-medium">
                    {pedidoSeleccionado.direccion || "Dirección no registrada"}
                  </p>
                  {pedidoSeleccionado.ciudad && (
                    <p className="text-slate-600">📍 {pedidoSeleccionado.ciudad}</p>
                  )}
                  <p className="text-slate-600 mt-1">
                    💳 Método de pago:{" "}
                    <span className="font-semibold capitalize text-slate-800">
                      {pedidoSeleccionado.metodo_pago || "No especificado"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Lista de Productos Comprados */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Productos en este pedido
                </h4>

                {cargandoDetalle ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Cargando ítems del pedido...
                  </div>
                ) : pedidoSeleccionado.items && pedidoSeleccionado.items.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-2.5">Producto</th>
                          <th className="px-4 py-2.5 text-center">Cantidad</th>
                          <th className="px-4 py-2.5 text-right">Precio Unit.</th>
                          <th className="px-4 py-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pedidoSeleccionado.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">
                              {item.nombre}
                            </td>
                            <td className="px-4 py-2.5 text-center font-bold text-slate-700">
                              {item.cantidad}
                            </td>
                            <td className="px-4 py-2.5 text-right text-slate-600">
                              ${Number(item.precio).toFixed(2)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                              ${Number(item.subtotal || item.precio * item.cantidad).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200/60">
                    Pedido procesado por monto global de <strong>${Number(pedidoSeleccionado.total).toFixed(2)}</strong>.
                  </div>
                )}
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-center p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <div>
                  <span className="text-xs uppercase font-bold text-indigo-700 block">
                    Importe Total
                  </span>
                  <span className="text-xs text-slate-500">
                    Incluye impuestos y despacho
                  </span>
                </div>
                <span className="text-2xl font-black text-indigo-900">
                  ${Number(pedidoSeleccionado.total).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setPedidoSeleccionado(null)}
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

export default AdminPedidos;
