import { Link } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean; // Drawer abierto (solo móvil)
  onClose: () => void;
  isCollapsed: boolean; // true => 80px y solo iconos (escritorio)
}

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/catalogo", label: "Catálogo", icon: "🛍️" },
  { to: "/mi-red", label: "Mi Red", icon: "👥" },
];

const Sidebar = ({ isOpen, onClose, isCollapsed }: SidebarProps) => {
  return (
    <>
      {/* Overlay oscuro solo en móvil cuando el drawer está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Móvil: drawer fuera de pantalla (w-64) que se desliza al abrir.
          Escritorio (md+): fijo en el flujo, w-64 o w-20 (80px) según isCollapsed. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col
        transition-all duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:static md:translate-x-0 md:shrink-0
        ${isCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="p-6 text-2xl font-bold border-b border-slate-700 whitespace-nowrap overflow-hidden">
          <span className={isCollapsed ? "hidden md:inline" : "hidden"}>MC</span>
          <span className={isCollapsed ? "md:hidden" : ""}>MultiCatálogo</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              title={item.label}
              className={`flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition ${
                isCollapsed ? "md:justify-center" : ""
              }`}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <span className={isCollapsed ? "md:hidden" : ""}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};
export default Sidebar;
