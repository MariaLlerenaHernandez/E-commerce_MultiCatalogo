// src/components/AdminUsuarios.tsx
import { useState, useEffect, useMemo } from "react";
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
  const [notificacion, setNotificacion] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

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

  const mostrarToast = (tipo: "exito" | "error", texto: string) => {
    setNotificacion({ tipo, texto });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const toggleEstadoUsuario = async (u: Usuario) => {
    const nuevoEstado = !u.activo;
    const confirmacion = window.confirm(
      `¿Confirmas ${nuevoEstado ? "activar" : "desactivar"} la cuenta de ${u.nombre || u.email}?`
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
      mostrarToast(
        "exito",
        `Cuenta de ${u.nombre || u.email} ${nuevoEstado ? "activada" : "desactivada"} exitosamente.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el estado";
      mostrarToast("error", msg);
    } finally {
      setProcesandoId(null);
    }
  };

  // Métricas
  const metricas = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter((u) => u.rol?.toLowerCase() === "admin").length;
    const clientes = usuarios.filter((u) => u.rol?.toLowerCase() === "cliente").length;
    const activos = usuarios.filter((u) => u.activo).length;

    return { total, admins, clientes, activos };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchBusqueda =
        u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email?.toLowerCase().includes(busqueda.toLowerCase());

      const matchRol =
        filtroRol === "todos" ? true : u.rol?.toLowerCase() === filtroRol.toLowerCase();

      return matchBusqueda && matchRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  const getIniciales = (nombre: string, email: string) => {
    if (nombre && nombre.trim().length > 0) {
      const partes = nombre.trim().split(" ");
      return partes.length >= 2 ? `${partes[0][0]}${partes[1][0]}`.toUpperCase() : partes[0].slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : "US";
  };

  if (loading && usuarios.length === 0) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium text-sm">Cargando directorio de usuarios...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
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
          <button onClick={() => setNotificacion(null)} className="font-bold opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Usuarios y Cuentas
            </h1>
            <span className="bg-purple-100 text-purple-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              Directorio
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Administración centralizada de cuentas, roles y control de accesos al sistema MultiCatálogo.
          </p>
        </div>

        <button
          onClick={fetchUsuarios}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar Cuentas
        </button>
      </div>

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

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Usuarios</span>
            <span className="text-lg">👥</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{metricas.total}</p>
          <span className="text-xs text-slate-400">Cuentas registradas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Clientes / Red</span>
            <span className="text-lg">🛍️</span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600">{metricas.clientes}</p>
          <span className="text-xs text-indigo-600/70">Compradores y distribuidores</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Administradores</span>
            <span className="text-lg">🛡️</span>
          </div>
          <p className="text-2xl font-extrabold text-purple-700">{metricas.admins}</p>
          <span className="text-xs text-purple-700/70">Gestores con acceso total</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Cuentas Activas</span>
            <span className="text-lg">✅</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{metricas.activos}</p>
          <span className="text-xs text-emerald-600/70">Con acceso habilitado</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
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
            placeholder="Buscar usuario por nombre o correo electrónico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "todos", label: "Todos", count: metricas.total },
            { id: "cliente", label: "Clientes", count: metricas.clientes },
            { id: "admin", label: "Admins", count: metricas.admins },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFiltroRol(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                filtroRol === item.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {usuariosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="font-semibold text-slate-700 text-sm">No se encontraron usuarios</p>
            <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando el rol o término de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4 text-center w-16">ID</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Patrocinador</th>
                  <th className="px-6 py-4">Fecha Registro</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {usuariosFiltrados.map((u) => {
                  const iniciales = getIniciales(u.nombre, u.email);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-purple-50/20 transition-colors duration-150 group"
                    >
                      {/* ID */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
                          #{u.id}
                        </span>
                      </td>

                      {/* Usuario */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                            {iniciales}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block text-sm group-hover:text-purple-700 transition">
                              {u.nombre || "Usuario"}
                            </span>
                            <span className="text-xs text-slate-400 block">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            u.rol === "admin"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          }`}
                        >
                          {u.rol}
                        </span>
                      </td>

                      {/* Patrocinador */}
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {u.referido_id ? (
                          <span className="font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                            ID #{u.referido_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Directo / Raíz</span>
                        )}
                      </td>

                      {/* Fecha de Registro */}
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {u.creado_en || "Reciente"}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            u.activo
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.activo ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                            }`}
                          ></span>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleEstadoUsuario(u)}
                          disabled={procesandoId === u.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer disabled:opacity-50 ${
                            u.activo
                              ? "border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                              : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                        >
                          {procesandoId === u.id ? (
                            "..."
                          ) : u.activo ? (
                            "Desactivar"
                          ) : (
                            "Activar"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400">
          <span>Mostrando <strong>{usuariosFiltrados.length}</strong> de <strong>{usuarios.length}</strong> cuentas</span>
          <span>MultiCatálogo &bull; Maria Llerena Hernandez</span>
        </div>
      </div>
    </div>
  );
};

export default AdminUsuarios;
