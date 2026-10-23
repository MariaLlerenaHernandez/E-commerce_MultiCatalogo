// src/components/Dashboard.tsx
import { useState, useEffect } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<any>(null);
  const [topProductos, setTopProductos] = useState<any[]>([]);
  const [topReferidos, setTopReferidos] = useState<any[]>([]);
  const [comisionesPendientes, setComisionesPendientes] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      fetchReportes();
    }
  }, [token]);

  const fetchReportes = async () => {
    try {
      setLoading(true);
      setError("");
      const headers = { Authorization: `Bearer ${token}` };

      const [resumenRes, productosRes, referidosRes, pendientesRes] = await Promise.all([
        fetch(`${API_URL}/api/reportes/resumen`, { headers }),
        fetch(`${API_URL}/api/reportes/top-productos`, { headers }),
        fetch(`${API_URL}/api/reportes/top-referidos`, { headers }),
        fetch(`${API_URL}/api/reportes/comisiones-pendientes`, { headers }),
      ]);

      if (!resumenRes.ok) {
        throw new Error("No se pudo cargar el resumen de reportes");
      }

      const resumenData = await resumenRes.json();
      const productosData = await productosRes.json();
      const referidosData = await referidosRes.json();
      const pendientesData = await pendientesRes.json();

      setResumen(resumenData);
      setTopProductos(Array.isArray(productosData) ? productosData : []);
      setTopReferidos(Array.isArray(referidosData) ? referidosData : []);
      setComisionesPendientes(Array.isArray(pendientesData) ? pendientesData : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando dashboard";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Cargando analítica y métricas...</span>
      </div>
    );
  }

  const kpis = [
    { etiqueta: "VENTAS", valor: `$${resumen?.ventas_total?.toFixed(2) || "0.00"}`, color: "text-indigo-600" },
    { etiqueta: "PEDIDOS", valor: resumen?.num_pedidos?.toString() || "0", color: "text-indigo-600" },
    { etiqueta: "TICKET PROMEDIO", valor: `$${resumen?.ticket_promedio?.toFixed(2) || "0.00"}`, color: "text-indigo-600" },
    { etiqueta: "COMISIONES DEVENGADAS", valor: `$${resumen?.comisiones_devengadas?.toFixed(2) || "0.00"}`, color: "text-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resumen del negocio</h1>
          <p className="text-sm text-slate-500 mt-1">Indicadores calculados desde los pedidos y comisiones registrados.</p>
        </div>
        <button
          onClick={fetchReportes}
          className="px-3.5 py-1.5 text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition"
        >
          🔄 Refrescar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {/* KPIs desde API */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <div key={kpi.etiqueta} className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{kpi.etiqueta}</p>
            <p className={`text-3xl font-extrabold mt-3 ${kpi.color}`}>{kpi.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Productos más vendidos
          </h2>
          <div className="space-y-3">
            {topProductos.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Sin datos de productos vendidos</p>
            ) : (
              topProductos.map((prod, idx) => (
                <div
                  key={prod.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition shadow-2xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{prod.nombre}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {prod.categoria || "Catálogo"} {prod.unidades ? `· ${prod.unidades} unidades` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-slate-900">${Number(prod.ventas || 0).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Referidos */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Referidos destacados
          </h2>
          <div className="space-y-3">
            {topReferidos.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Sin datos de referidos</p>
            ) : (
              topReferidos.map((ref, idx) => (
                <div
                  key={ref.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition shadow-2xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{ref.nombre}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Nivel {ref.nivel || 1}</p>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-slate-900">${Number(ref.ventas || 0).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comisiones pendientes por liquidar */}
      {comisionesPendientes.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Comisiones por liquidar</span>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
              Pendientes de pago
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Monto Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comisionesPendientes.map((cp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{cp.nombre || `Usuario #${cp.usuario_id}`}</td>
                    <td className="px-4 py-3 text-slate-500">{cp.email || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">${Number(cp.total || cp.monto || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;