'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useCancelacionAutomatica } from '@/hooks/use-cancelacion-automatica';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useJWTAuth();
  
  // Inicializar cancelación automática global
  useCancelacionAutomatica();

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

  // Permitir renderizado para admin_global aunque empresa_id sea null
  return (
    <div className="min-h-screen bg-amber-50 flex">
      {/* Sidebar */}
      <Sidebar 
        userRole={user.rol as 'admin_global' | 'admin_empresa' | 'estilista' | 'recepcionista' | 'empleado'}
        empresaNombre={user.rol === 'admin_global' ? 'Administración Global' : undefined}
        userName={user.nombre}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-amber-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.rol === 'admin_global' ? 'BeautyPro Admin' : 'BeautyPro'}
              </h1>
              <p className="text-sm text-gray-600">
                {user.rol === 'admin_global' ? 'Panel de Administración Global' : 'Sistema de Gestión de Salón de Belleza'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                <p className="text-xs text-gray-600 capitalize">
                  {user.rol === 'admin_global' ? 'Administrador Global' : user.rol.replace('_', ' ')}
                </p>
              </div>
              
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {user.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-amber-50">
          {children}
        </main>
      </div>
    </div>
  );
}
