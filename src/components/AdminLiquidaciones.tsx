// src/components/AdminLiquidaciones.tsx
import { useState, useEffect } from "react";
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
    } finally {
      setLoading(false);
    }
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
        throw new Error(data.message || data.error || "Error al procesar liquidación");
      }

      setMensaje({
        tipo: "exito",
        texto: `Liquidación #${data.id} generada exitosamente por un total de $${Number(data.total).toFixed(2)}.`,
      });

      await cargarDatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setMensaje({ tipo: "error", texto: msg });
    } finally {
      setProcesandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Cargando sistema de liquidaciones...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Liquidaciones y Pagos</h1>
          <p className="text-sm text-slate-500">Gestión de comisiones devengadas y pagos consolidados a distribuidores</p>
        </div>
        <button
          onClick={cargarDatos}
          className="px-3.5 py-1.5 text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition"
        >
          🔄 Actualizar
        </button>
      </div>

      {mensaje && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
            mensaje.tipo === "exito"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{mensaje.tipo === "exito" ? "✅" : "❌"} {mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* SECCIÓN 1: PENDIENTES POR LIQUIDAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Comisiones Pendientes de Pago</h2>
            <p className="text-xs text-slate-500">Distribuidores con saldo acumulado listo para corte y liquidación</p>
          </div>
          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full">
            {pendientes.length} distribuidores pendientes
          </span>
        </div>

        {pendientes.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            🎉 No hay comisiones pendientes por liquidar actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">ID Distribuidor</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 text-right">Saldo Pendiente</th>
                  <th className="px-5 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendientes.map((p) => (
                  <tr key={p.referido_id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 font-mono text-slate-500">#{p.referido_id}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{p.nombre}</td>
                    <td className="px-5 py-3 text-slate-500">{p.email || "—"}</td>
                    <td className="px-5 py-3 text-right font-bold text-amber-600">
                      ${Number(p.total).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleLiquidar(p.referido_id, p.nombre, p.total)}
                        disabled={procesandoId === p.referido_id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                      >
                        {procesandoId === p.referido_id ? "Liquidando..." : "💰 Liquidar Pago"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: HISTORIAL DE LIQUIDACIONES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Historial de Liquidaciones Confirmadas</h2>

        {liquidaciones.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Sin liquidaciones registradas aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Nº Liquidación</th>
                  <th className="px-5 py-3">Distribuidor</th>
                  <th className="px-5 py-3">Total Liquidado</th>
                  <th className="px-5 py-3">Fecha de Creación</th>
                  <th className="px-5 py-3">Fecha de Pago</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liquidaciones.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-800">LIQ-#{l.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {l.referido_nombre || `Distribuidor #${l.referido_id}`}
                      {l.referido_email && <span className="block text-xs text-slate-400">{l.referido_email}</span>}
                    </td>
                    <td className="px-5 py-3 font-bold text-emerald-600">${Number(l.total).toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-500">{l.creado_en}</td>
                    <td className="px-5 py-3 text-slate-500">{l.pagada_en || "Inmediata"}</td>
                    <td className="px-5 py-3">
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        {l.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLiquidaciones;
