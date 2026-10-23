// src/components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  closeMobileMenu: () => void;
}

interface NavItem {
  to: string;
  label: string;
  title: string;
  icon: string;
  soloAdmin?: boolean;
  soloCliente?: boolean;
  notranslate?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    title: "Panel de Control / Dashboard",
    soloAdmin: true,
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    to: "/tienda",
    label: "Tienda",
    title: "Tienda de productos",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  },
  {
    to: "/catalogo",
    label: "Catálogo",
    title: "Catálogo completo",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  {
    to: "/mi-red",
    label: "Mi Red",
    title: "Red de Referidos Multinivel",
    notranslate: true,
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    to: "/mis-pedidos",
    label: "Mis pedidos",
    title: "Mis pedidos realizados",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  },
  {
    to: "/admin/productos",
    label: "Gestionar productos",
    title: "Gestión y CRUD de Productos",
    soloAdmin: true,
    icon: "M12 4v16m8-8H4",
  },
  {
    to: "/admin/pedidos",
    label: "Gestionar pedidos",
    title: "Gestión y Estados de Pedidos",
    soloAdmin: true,
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    to: "/admin/usuarios",
    label: "Usuarios",
    title: "Cuentas y Usuarios",
    soloAdmin: true,
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    to: "/admin/liquidaciones",
    label: "Liquidaciones",
    title: "Gestión de Liquidaciones y Comisiones",
    soloAdmin: true,
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

const Sidebar = ({ isCollapsed, isMobileOpen, closeMobileMenu }: SidebarProps) => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Filtramos las opciones según el rol del usuario
  const items = NAV_ITEMS.filter((item) => {
    if (item.soloAdmin && user?.rol !== "admin") return false;
    if (item.soloCliente && user?.rol !== "cliente") return false;
    return true;
  });

  return (
    <>
      {/* Overlay oscuro en móvil cuando el drawer está abierto */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar con degradado morado / púrpura elegante */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 transform bg-linear-to-b from-indigo-700 via-purple-700 to-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out border-r border-white/10 shadow-xl
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          w-64
          md:relative md:translate-x-0
          ${isCollapsed ? "md:w-20" : "md:w-64"}
        `}
      >
        {/* Encabezado con Nombre de la App y Nombre de la Estudiante */}
        <div className={`p-4 md:p-5 border-b border-white/15 flex flex-col ${isCollapsed ? 'md:items-center' : 'items-start'} whitespace-nowrap`}>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              {isCollapsed ? "MC" : "MultiCatálogo"}
            </span>
          </div>
          {!isCollapsed && (
            <p className="text-xs text-purple-200 font-medium tracking-wide mt-0.5">
              Maria Llerena Hernandez
            </p>
          )}
        </div>

        {/* Lista de navegación */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {items.map((item) => {
            const esActivo =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                translate={item.notranslate ? "no" : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition duration-150 ${
                  item.notranslate ? "notranslate" : ""
                } ${
                  esActivo
                    ? "bg-white/20 text-white font-semibold shadow-xs backdrop-blur-xs"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                } ${isCollapsed ? 'md:justify-center' : ''}`}
                title={item.title}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className={`whitespace-nowrap text-sm ${isCollapsed ? 'md:hidden' : ''} ${item.notranslate ? 'notranslate' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Pie del Sidebar con Rol de Usuario */}
        <div className="p-4 border-t border-white/15 text-xs text-indigo-200">
          {isCollapsed ? (
            <p className="text-center font-bold uppercase">{user?.rol}</p>
          ) : (
            <p className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Conectado como <span className="font-bold uppercase text-white tracking-wide">{user?.rol}</span>
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
