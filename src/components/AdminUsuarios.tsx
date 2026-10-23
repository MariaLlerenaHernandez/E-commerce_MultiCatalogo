// src/components/AdminUsuarios.tsx
import { useState, useEffect } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  referido_id?: number | null;
  creado_en?: string;
}

const AdminUsuarios = () => {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, [token]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/api/usuarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudieron cargar los usuarios del sistema");
      }

      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al consultar usuarios";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstadoUsuario = async (u: Usuario) => {
    const nuevoEstado = !u.activo;
    const confirmacion = window.confirm(
      `¿Estás seguro de ${nuevoEstado ? "activar" : "desactivar"} la cuenta de ${u.nombre || u.email}?`
    );
    if (!confirmacion) return;

    try {
      setProcesandoId(u.id);
      const res = await fetch(`${API_URL}/api/usuarios/${u.id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activo: nuevoEstado }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Error al actualizar el estado del usuario");
      }

      // Actualizar estado local
      setUsuarios((prev) =>
        prev.map((usr) => (usr.id === u.id ? { ...usr, activo: nuevoEstado } : usr))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el estado";
      alert(`❌ ${msg}`);
    } finally {
      setProcesandoId(null);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusqueda =
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase());

    const matchRol =
      filtroRol === "todos" ? true : u.rol?.toLowerCase() === filtroRol.toLowerCase();

    return matchBusqueda && matchRol;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Usuarios y Cuentas</h1>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {usuarios.length} registrados
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Administración centralizada de cuentas, roles y accesos al sistema
          </p>
        </div>
        <button
          onClick={fetchUsuarios}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition self-start sm:self-auto"
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-500 uppercase">Filtrar Rol:</label>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Cargando cuentas de usuarios...</span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-4xl mb-2">👥</p>
            <p className="font-medium">No se encontraron usuarios con los criterios indicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Patrocinador</th>
                  <th className="px-5 py-3">Registro</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => {
                  const iniciales = (u.nombre || u.email)
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">#{u.id}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                            {iniciales}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{u.nombre || "Sin nombre"}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${
                            u.rol === "admin"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {u.referido_id ? (
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            ID #{u.referido_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Directo / Raíz</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {u.creado_en || "Reciente"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            u.activo
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.activo ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          ></span>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => toggleEstadoUsuario(u)}
                          disabled={procesandoId === u.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                            u.activo
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={u.activo ? "Desactivar acceso" : "Reactivar acceso"}
                        >
                          {procesandoId === u.id
                            ? "..."
                            : u.activo
                            ? "Desactivar"
                            : "Activar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsuarios;
