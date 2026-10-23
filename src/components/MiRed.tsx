// src/components/MiRed.tsx
// Red multinivel visual:
// - Consulta GET /api/red con autenticación JWT Bearer
// - Fallback offline a redInicial para soporte PWA
// - Resumen: referidos activos, ventas de la red, comisiones del mes y nivel alcanzado
// - Árbol jerárquico recursivo de referidos con comisión calculada por nivel
import { useState, useEffect } from "react";
import {
  redInicial,
  contarRed,
  sumarVentasRed,
  sumarComisiones,
  nivelAlcanzado,
  comisionDeReferido,
  TASA_COMISION,
  type Referido,
} from "../data/red";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

// Configuración visual por nivel: estilos, márgenes, anchos decrecientes y tasas
const NIVEL_CONFIG: Record<
  number,
  {
    badge: string;
    cardStyle: string;
    tasa: string;
    iconBg: string;
    iconText: string;
    anchoClase: string;
  }
> = {
  1: {
    badge: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    cardStyle: "bg-white border-slate-200 shadow-2xs hover:border-indigo-300",
    tasa: "10 %",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-700",
    anchoClase: "w-full",
  },
  2: {
    badge: "bg-purple-100 text-purple-700 border border-purple-200",
    cardStyle: "bg-slate-50/80 border-purple-200 shadow-2xs hover:border-purple-300",
    tasa: "5 %",
    iconBg: "bg-purple-100",
    iconText: "text-purple-700",
    anchoClase: "w-[94%] sm:w-[95%]",
  },
  3: {
    badge: "bg-pink-100 text-pink-700 border border-pink-200",
    cardStyle: "bg-pink-50/30 border-pink-200 shadow-2xs hover:border-pink-300",
    tasa: "2 %",
    iconBg: "bg-pink-100",
    iconText: "text-pink-700",
    anchoClase: "w-[88%] sm:w-[90%]",
  },
};

// Componente recursivo: renderiza un referido y, debajo, a sus hijos con sangría y ancho decreciente
const NodoReferido = ({ nodo }: { nodo: Referido }) => {
  const cfg = NIVEL_CONFIG[nodo.nivel] ?? NIVEL_CONFIG[1];
  const comision = comisionDeReferido(nodo);

  return (
    <li className="space-y-3">
      {/* Tarjeta del nodo con ancho decreciente según la profundidad del nivel */}
      <div
        className={`${cfg.anchoClase} ${cfg.cardStyle} rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 transition-all duration-200`}
      >
        <div className="flex items-center gap-3">
          {/* Conector visual para hijos de niveles 2 y 3 */}
          {nodo.nivel > 1 && (
            <span className="text-slate-400 font-mono text-base select-none" title="Subnivel en jerarquía">
              ↳
            </span>
          )}
          <div
            className={`w-10 h-10 rounded-full ${cfg.iconBg} ${cfg.iconText} flex items-center justify-center font-bold text-sm flex-shrink-0 border border-white shadow-2xs`}
          >
            {nodo.nombre ? nodo.nombre.charAt(0).toUpperCase() : "R"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800 text-sm sm:text-base">{nodo.nombre}</p>
            </div>
            <span className={`inline-block mt-0.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
              Nivel {nodo.nivel} · {cfg.tasa} comisión
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase font-semibold">Ventas</p>
          <p className="font-bold text-slate-800 text-base sm:text-lg">${(nodo.ventas || 0).toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">
            +${comision.toFixed(2)} para ti
          </p>
        </div>
      </div>

      {/* Sub-árbol de hijos: sangría progresiva (ml-6 md:ml-10) y línea guía vertical conectora */}
      {nodo.hijos && nodo.hijos.length > 0 && (
        <ul className="ml-5 sm:ml-8 md:ml-12 pl-3 sm:pl-4 border-l-2 border-indigo-200 space-y-3">
          {nodo.hijos.map((hijo) => (
            <NodoReferido key={hijo.id} nodo={hijo} />
          ))}
        </ul>
      )}
    </li>
  );
};

const MiRed = () => {
  const { token, user } = useAuth();
  const [red, setRed] = useState<Referido>(redInicial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchRed();
    }
  }, [token]);

  const fetchRed = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/red`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.nombre) {
          setRed(data);
        }
      }
    } catch (err) {
      console.warn("No se pudo obtener la red desde la API, usando datos locales:", err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs derivados de los datos de la red
  const referidosActivos = contarRed(red);
  const ventasRed = sumarVentasRed(red);
  const comisionesMes = sumarComisiones(red);
  const nivel = nivelAlcanzado(red.hijos?.length ?? 0);

  const resumen = [
    { etiqueta: "Referidos Activos", valor: referidosActivos.toString(), color: "text-indigo-600" },
    { etiqueta: "Ventas de la Red", valor: `$${ventasRed.toLocaleString()}`, color: "text-indigo-600" },
    { etiqueta: "Comisiones del Mes", valor: `$${comisionesMes.toFixed(2)}`, color: "text-emerald-600" },
    { etiqueta: "Nivel Alcanzado", valor: nivel, color: "text-amber-600" },
  ];

  return (
    <div translate="no" className="notranslate">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-800 notranslate" translate="no">Mi Red de Referidos</h1>
        {loading && <span className="text-xs text-indigo-600 animate-pulse">Sincronizando red...</span>}
      </div>
      <p className="text-slate-500 mb-6">
        Estructura multinivel: gana el {TASA_COMISION[1] * 100} % de nivel 1, {TASA_COMISION[2] * 100} % de nivel 2 y {TASA_COMISION[3] * 100} % de nivel 3.
      </p>

      {/* ===== TARJETAS DE RESUMEN ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {resumen.map((item) => (
          <div key={item.etiqueta} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 uppercase font-semibold">{item.etiqueta}</p>
            <p className={`text-3xl font-bold mt-2 ${item.color}`}>{item.valor}</p>
          </div>
        ))}
      </div>

      {/* ===== ÁRBOL DE REFERIDOS ===== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Jerarquía de tu Red</h2>

        {/* Raíz: el usuario */}
        <div className="bg-slate-900 text-white rounded-lg p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
              {(user?.nombre || red.nombre || "Tú").charAt(0)}
            </div>
            <div>
              <p className="font-semibold">{user?.nombre || red.nombre}</p>
              <p className="text-xs text-slate-300">Nivel alcanzado: {nivel}</p>
            </div>
          </div>
          <p className="font-bold text-emerald-400">
            Comisiones del mes: ${comisionesMes.toFixed(2)}
          </p>
        </div>

        <ul className="space-y-3">
          {red.hijos?.map((hijo) => (
            <NodoReferido key={hijo.id} nodo={hijo} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MiRed;