// src/components/MisPedidos.tsx
import { useState, useEffect } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

interface PedidoCliente {
  id: number;
  numero: string;
  fecha: string;
  total: number;
  estado: string;
  items?: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
}

const MisPedidos = () => {
  const { token, isAuthenticated } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        throw new Error(errData.message || "Error al cargar pedidos");
      }

      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !token) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Inicia sesión</h2>
        <p className="text-slate-600 text-sm mb-4">Debes identificarte para consultar tu historial de pedidos.</p>
        <Link to="/login" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Cargando tus pedidos...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Pedidos</h1>
          <p className="text-sm text-slate-500">Historial y estado de tus compras en MultiCatálogo</p>
        </div>
        <button
          onClick={fetchPedidos}
          className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition"
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <p className="text-slate-500 mb-4">Aún no has realizado ninguna compra.</p>
          <Link
            to="/catalogo"
            className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nº Pedido</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800">{p.numero}</td>
                    <td className="px-6 py-4 text-slate-500">{p.fecha}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">${Number(p.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          p.estado === "entregado"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.estado === "cancelado"
                            ? "bg-rose-100 text-rose-800"
                            : p.estado === "enviado"
                            ? "bg-blue-100 text-blue-800"
                            : p.estado === "preparando"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
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

export default MisPedidos;
