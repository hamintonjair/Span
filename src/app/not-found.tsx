'use client';

import Link from 'next/link';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
  const { user } = useJWTAuth();
  const router = useRouter();

  useEffect(() => {
    // Si hay un usuario autenticado, redirigir según su rol
    if (user) {
      if (user.rol === 'admin_global') {
        router.push('/admin/dashboard-admin');
      } else if (user.empresa_id) {
        router.push('/dashboard-empresa');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página no encontrada</h2>
        <p className="text-gray-600 mb-8">La página que estás buscando no existe.</p>
        <Link 
          href="/dashboard"
          className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
