'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';

export default function LimpiarSesionPage() {
  const router = useRouter();

  useEffect(() => {
    // Limpiar todas las cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
    });
    
    // Limpiar localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirigir al login después de 2 segundos
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  }, []);

  return (
    <MainLayout>
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          🧹 Limpiando Sesión
        </div>
        <div style={{ color: '#666', textAlign: 'center' }}>
          Serás redirigido al login en unos segundos...
        </div>
      </div>
    </MainLayout>
  );
}
