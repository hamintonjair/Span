'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  empresa_id: string | null;
  nombre: string;
  email: string;
  rol: string;
}

export function useJWTAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserFromToken = async () => {
      try {
        // Obtener el token de la cookie (del lado del cliente no podemos leer HttpOnly cookies directamente)
        // Así que necesitamos un endpoint para obtener el usuario actual
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error obteniendo usuario:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUserFromToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
      setUser(null); // Forzar logout local aunque falle la API
    }
  };

  return { user, loading, login, logout };
}
