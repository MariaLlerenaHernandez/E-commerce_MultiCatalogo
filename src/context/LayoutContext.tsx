import { createContext, useContext, useState, type ReactNode } from 'react';

// 1. Definimos el tipo del estado global del layout
interface LayoutContextType {
  isCollapsed: boolean; // Sidebar reducido a 80px (solo iconos) en escritorio
  toggleCollapse: () => void;
  sidebarOpen: boolean; // Drawer abierto en móvil
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void; // Toggle móvil sidebar
}

// 2. Creamos el contexto
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// 3. Hook personalizado con validación
export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout debe ser usado dentro de un LayoutProvider");
  }
  return context;
};

interface LayoutProviderProps {
  children: ReactNode;
}

// 4. El Provider
export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <LayoutContext.Provider
      value={{ isCollapsed, toggleCollapse, sidebarOpen, openSidebar, closeSidebar, toggleSidebar }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
