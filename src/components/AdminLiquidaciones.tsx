// src/components/AdminLiquidaciones.tsx
import { useState, useEffect, useMemo } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

interface Liquidacion {
  id: number;
  referido_id: number;
  referido_nombre?: string;
  referido_email?: string;
  total: number;
  estado: string;
  creado_en: string;
  pagada_en?: string;
}

interface PendienteLiquidar {
  referido_id: number;
  nombre: string;
  email: string;
  total: number;
}

const AdminLiquidaciones = () => {
  const { token } = useAuth();
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [pendientes, setPendientes] = useState<PendienteLiquidar[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (token) {
      cargarDatos();
    }
  }, [token]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setMensaje(null);
      const headers = { Authorization: `Bearer ${token}` };

      const [liqRes, pendRes] = await Promise.all([
        fetch(`${API_URL}/api/liquidaciones`, { headers }),
        fetch(`${API_URL}/api/reportes/comisiones-pendientes`, { headers }),
      ]);

      if (liqRes.ok) {
        const liqData = await liqRes.json();
        setLiquidaciones(Array.isArray(liqData) ? liqData : []);
      }

      if (pendRes.ok) {
        const pendData = await pendRes.json();
        setPendientes(Array.isArray(pendData) ? pendData : []);
      }
    } catch (err: unknown) {
      console.error("Error al cargar liquidaciones:", err);
      mostrarToast("error", "Error de red al consultar el sistema de comisiones");
    } finally {
      setLoading(false);
    }
  };

  const mostrarToast = (tipo: "exito" | "error", texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4500);
  };

  const handleLiquidar = async (referidoId: number, nombre: string, total: number) => {
    if (!confirm(`¿Confirmar liquidación y pago de $${total.toFixed(2)} a ${nombre}?`)) return;

    try {
      setProcesandoId(referidoId);
      setMensaje(null);

      const res = await fetch(`${API_URL}/api/liquidaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ referido_id: referidoId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Error al procesar la liquidación");
      }

      mostrarToast(
        "exito",
        `Liquidación #LIQ-${data.id} generada con éxito por un monto de $${Number(data.total).toFixed(2)} para ${nombre}.`
      );

      await cargarDatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al liquidar";
      mostrarToast("error", msg);
    } finally {
      setProcesandoId(null);
    }
  };

  // Métricas financieras
  const metricas = useMemo(() => {
    const totalPendiente = pendientes.reduce((acc, p) => acc + Number(p.total || 0), 0);
    const totalLiquidado = liquidaciones.reduce((acc, l) => acc + Number(l.total || 0), 0);
    const distribuidoresPendientes = pendientes.length;
    const totalLiquidaciones = liquidaciones.length;

    return { totalPendiente, totalLiquidado, distribuidoresPendientes, totalLiquidaciones };
  }, [pendientes, liquidaciones]);

  // Filtrado de pendientes
  const pendientesFiltrados = useMemo(() => {
    return pendientes.filter((p) => {
      return (
        p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.email?.toLowerCase().includes(busqueda.toLowerCase())
      );
    });
  }, [pendientes, busqueda]);

  const getIniciales = (nombre: string, email: string) => {
    if (nombre && nombre.trim().length > 0) {
      const p = nombre.trim().split(" ");
      return p.length >= 2 ? `${p[0][0]}${p[1][0]}`.toUpperCase() : p[0].slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : "DS";
  };

  if (loading && pendientes.length === 0 && liquidaciones.length === 0) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium text-sm">Cargando sistema de comisiones y liquidaciones...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast Notificación */}
      {mensaje && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-md transition-all duration-300 ${
            mensaje.tipo === "exito"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{mensaje.tipo === "exito" ? "✅" : "⚠️"}</span>
            <span>{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="font-bold opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Liquidaciones y Pagos
            </h1>
            <span className="bg-emerald-100 text-emerald-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              Multinivel
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Corte financiero y liquidación de comisiones acumuladas por la red de distribuidores.
          </p>
        </div>

        <button
          onClick={cargarDatos}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar Comisiones
        </button>
      </div>

      {/* Tarjetas KPIs Financieras */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Por Liquidar</span>
            <span className="text-lg">⏳</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600">
            ${metricas.totalPendiente.toFixed(2)}
          </p>
          <span className="text-xs text-slate-500">
            {metricas.distribuidoresPendientes} distribuidores con saldo
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Pagado</span>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">
            ${metricas.totalLiquidado.toFixed(2)}
          </p>
          <span className="text-xs text-slate-500">
            {metricas.totalLiquidaciones} liquidaciones emitidas
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Comisiones Red</span>
            <span className="text-lg">📈</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">
            ${(metricas.totalPendiente + metricas.totalLiquidado).toFixed(2)}
          </p>
          <span className="text-xs text-slate-400">Generadas por ventas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Esquema Comisiones</span>
            <span className="text-lg">⚡</span>
          </div>
          <p className="text-sm font-extrabold text-purple-700">10% / 5% / 2%</p>
          <span className="text-xs text-slate-400">Niveles 1, 2 y 3</span>
        </div>
      </div>

      {/* SECCIÓN 1: DISTRIBUIDORES PENDIENTES DE LIQUIDACIÓN */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>💳</span> Comisiones Pendientes de Pago
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribuidores que han acumulado comisiones y están listos para liquidación
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Filtrar por nombre o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {pendientes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-3xl block mb-2">🎉</span>
            <p className="font-semibold text-slate-700 text-sm">Al día: No hay comisiones pendientes</p>
            <p className="text-xs text-slate-400 mt-0.5">Todas las comisiones devengadas han sido liquidadas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4">ID Nodo</th>
                  <th className="px-6 py-4">Distribuidor</th>
                  <th className="px-6 py-4 text-right">Comisión Acumulada</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pendientesFiltrados.map((p) => (
                  <tr key={p.referido_id} className="hover:bg-emerald-50/20 transition-colors">
                    {/* ID */}
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
                        #{p.referido_id}
                      </span>
                    </td>

                    {/* Distribuidor */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                          {getIniciales(p.nombre, p.email)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 block text-sm">
                            {p.nombre}
                          </span>
                          <span className="text-xs text-slate-500 block">
                            {p.email || "Sin email registrado"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Saldo Pendiente */}
                    <td className="px-6 py-4 text-right">
                      <span className="text-base font-extrabold text-amber-600">
                        ${Number(p.total).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Listo para pago</span>
                    </td>

                    {/* Botón Liquidar */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleLiquidar(p.referido_id, p.nombre, p.total)}
                        disabled={procesandoId === p.referido_id}
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                      >
                        {procesandoId === p.referido_id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <span>💰</span>
                            <span>Liquidar Pago</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: HISTORIAL DE LIQUIDACIONES CONFIRMADAS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>📜</span> Historial de Liquidaciones Emitidas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro contable de pagos liquidados y comprobantes emitidos
          </p>
        </div>

        {liquidaciones.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="font-semibold text-slate-700 text-sm">Sin historial de liquidaciones aún</p>
            <p className="text-xs text-slate-400 mt-0.5">Los pagos liquidados aparecerán registrados aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4">Nº Liquidación</th>
                  <th className="px-6 py-4">Distribuidor</th>
                  <th className="px-6 py-4">Total Pagado</th>
                  <th className="px-6 py-4">Fecha de Liquidación</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {liquidaciones.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    {/* Código Liquidación */}
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        LIQ-#{l.id}
                      </span>
                    </td>

                    {/* Distribuidor */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-slate-800 block text-sm">
                          {l.referido_nombre || `Distribuidor #${l.referido_id}`}
                        </span>
                        {l.referido_email && (
                          <span className="text-xs text-slate-400">{l.referido_email}</span>
                        )}
                      </div>
                    </td>

                    {/* Monto */}
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-emerald-600 text-base">
                        ${Number(l.total).toFixed(2)}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <span>{l.creado_en}</span>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {l.estado || "Pagado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400">
          <span>Total liquidaciones registradas: <strong>{liquidaciones.length}</strong></span>
          <span>MultiCatálogo &bull; Maria Llerena Hernandez</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLiquidaciones;
