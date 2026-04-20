'use client';

import { useState, useEffect } from 'react';
import { useJWTAuth } from '@/hooks/use-jwt-auth';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  const { user, loading } = useJWTAuth();

  // Para admin_global, no mostrar loading aunque empresa_id sea null
  if (loading && (!user || user.rol !== 'admin_global')) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar carga
  if (!user) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  // Layout simple sin sidebar
  return (
    <div className="min-h-screen bg-amber-50">
     
      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
