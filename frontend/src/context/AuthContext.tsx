import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../services/api';

export interface UsuarioAuth {
  id: string;
  username: string;
  email: string;
  rol: string;
}

interface AuthContextType {
  usuario: UsuarioAuth | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(() => {
    const savedUser = localStorage.getItem('krumly_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('krumly_token');
  });
  const [cargando, setCargando] = useState(false);

  const login = async (email: string, password: string) => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciales inválidas o error de inicio de sesión');
      }

      const data = await res.json();
      const accessToken = data.accessToken || data.token;
      const user = data.usuario || data.user;

      if (!accessToken) {
        throw new Error('No se recibió el token de autenticación del servidor');
      }

      setToken(accessToken);
      setUsuario(user);

      localStorage.setItem('krumly_token', accessToken);
      localStorage.setItem('krumly_user', JSON.stringify(user));
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('krumly_token');
    localStorage.removeItem('krumly_user');
  };

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
