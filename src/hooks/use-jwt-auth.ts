'use client';

import { useAuth } from '@/context/AuthContext';

// Re-exportar la interfaz para compatibilidad
export interface UserProfile {
  id: string;
  empresa_id: string | null;
  nombre: string;
  email: string;
  rol: string;
}

// Hook refactorizado para usar el AuthContext
export function useJWTAuth() {
  const { user, loading, login, logout } = useAuth();
  
  return { user, loading, login, logout };
}
