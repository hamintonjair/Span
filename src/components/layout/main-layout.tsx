'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useCancelacionAutomatica } from '@/hooks/use-cancelacion-automatica';
import { useSuspensionAutomatica } from '@/hooks/use-suspension-automatica';
import { createClient } from '@/lib/supabase/client';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useJWTAuth();
  const [configGlobal, setConfigGlobal] = useState<any>(null);
  
  // Inicializar cancelación automática global
  useCancelacionAutomatica();
  
  // Inicializar suspensión automática global (solo para admin_global)
  useSuspensionAutomatica();

  // Obtener configuración global
  useEffect(() => {
    const fetchConfigGlobal = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('configuracion_global')
          .select('titular')
          .single();

        if (error) {
          console.error('Error cargando configuración global:', error);
        } else {
          setConfigGlobal(data);
        }
      } catch (error) {
        console.error('Error general cargando configuración global:', error);
      }
    };

    fetchConfigGlobal();
  }, []);

  // Función para obtener el nombre de la empresa
  const getNombreEmpresa = () => {
    return configGlobal?.titular;
  };

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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg 
                  width="28" 
                  height="28" 
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.rol === 'admin_global' ? `${getNombreEmpresa()} Admin` : getNombreEmpresa()}
                </h1>
                <p className="text-sm text-gray-600">
                  {user.rol === 'admin_global' ? 'Panel de Administración Global' : `Sistema de Gestión de ${getNombreEmpresa()}`}
                </p>
              </div>
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
