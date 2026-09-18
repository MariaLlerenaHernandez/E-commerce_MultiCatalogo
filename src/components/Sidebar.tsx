import { Link } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/catalogo", label: "Catálogo", icon: "🛍️" },
  { to: "/mi-red", label: "Mi Red", icon: "👥" },
];

const Sidebar = ({ isOpen, onClose, isCollapsed }: SidebarProps) => {
  return (
    <>
      {/* Overlay oscuro solo en móvil cuando el sidebar está expandido */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`inset-y-0 left-0 z-40 bg-slate-900 text-white flex flex-col
        transition-all duration-200 ease-in-out
        ${isOpen ? "fixed w-64" : "static w-20"}
        md:static
        ${isCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="p-6 text-2xl font-bold border-b border-slate-700 whitespace-nowrap overflow-hidden">
          <span className={`${isOpen ? "hidden" : "inline"} ${isCollapsed ? "md:inline" : "md:hidden"}`}>
            MC
          </span>
          <span className={`${isOpen ? "inline" : "hidden"} ${isCollapsed ? "md:hidden" : "md:inline"}`}>
            MultiCatálogo
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              title={item.label}
              className={`flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition ${
                isOpen ? "" : "justify-center"
              } ${isCollapsed ? "md:justify-center" : "md:justify-start"}`}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <span
                className={`${isOpen ? "inline" : "hidden"} ${
                  isCollapsed ? "md:hidden" : "md:inline"
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};
export default Sidebar;