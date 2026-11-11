'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserProfile {
  id: string;
  empresa_id: string | null;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const getUserFromToken = async () => {
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      const validStoredToken = (storedToken && storedToken !== 'null' && storedToken !== 'undefined') ? storedToken : null;

      const headers: Record<string, string> = {};
      if (validStoredToken) {
        headers['Authorization'] = `Bearer ${validStoredToken}`;
      }

      // Timeout de seguridad de 3 segundos para que nunca se quede colgado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch('/api/auth/me', { 
          headers,
          credentials: 'include',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-token');
          }
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn('Timeout o error verificando sesión:', fetchErr);
        setUser(null);
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      const validStoredToken = (storedToken && storedToken !== 'null' && storedToken !== 'undefined') ? storedToken : null;
      const headers: Record<string, string> = {};
      if (validStoredToken) {
        headers['Authorization'] = `Bearer ${validStoredToken}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch('/api/auth/me', { 
          headers,
          credentials: 'include',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        clearTimeout(timeoutId);
        setUser(null);
      }
    } catch (error) {
      console.error('AuthProvider: Error refrescando usuario:', error);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('auth-token', data.token);
        }
        setUser(data.user);
        setLoading(false);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('AuthProvider: Error en login:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
      }
      setUser(null);
      setLoading(false);
      // Petición de logout en background sin bloquear
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    } catch (error) {
      console.error('AuthProvider: Error en logout:', error);
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserFromToken();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 32 32" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="object-contain"
            >
              <circle cx="16" cy="16" r="16" fill="#1f2937"/>
              <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
              <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
              <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
              <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
            </svg>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
