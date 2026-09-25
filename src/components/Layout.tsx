import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useLayout } from "../context/LayoutContext";

const Layout = () => {
  const { isCollapsed, sidebarOpen, closeSidebar, toggleSidebar, toggleCollapse } = useLayout();

  // Escritorio (md = 768px o más): colapsa el sidebar. Móvil: abre/cierra el drawer.
  const handleMenu = () => {
    if (window.matchMedia("(min-width: 768px)").matches) toggleCollapse();
    else toggleSidebar();
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        isMobileOpen={sidebarOpen}
        closeMobileMenu={closeSidebar}
        isCollapsed={isCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar toggleSidebar={handleMenu} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Layout;
