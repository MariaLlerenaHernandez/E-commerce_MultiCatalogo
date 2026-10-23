// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// 1. Tipos de rol que maneja la aplicación
export type Rol = 'admin' | 'cliente';

// 2. Usuario autenticado: correo + rol (lo entrega la API en /api/login)
export interface Usuario {
  email: string;
  rol: Rol;
  nombre?: string;
}

// 3. Datos de sesión que se persisten en localStorage
interface SesionData {
  user: Usuario;
  token: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: Usuario | null;
  token: string | null;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'multicatalogo_sesion';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Al montar, intentamos restaurar la sesión desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const sesion: SesionData = JSON.parse(saved);
        if (sesion.user && sesion.token) {
          setUser(sesion.user);
          setToken(sesion.token);
          setIsAuthenticated(true);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = (usuario: Usuario, tkn: string) => {
    setIsAuthenticated(true);
    setUser(usuario);
    setToken(tkn);
    // Persistimos en localStorage para sobrevivir refrescos de página
    const sesion: SesionData = { user: usuario, token: tkn };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};