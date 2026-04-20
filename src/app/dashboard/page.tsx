'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJWTAuth } from '@/hooks/use-jwt-auth';

export default function DashboardRedirect() {
  const { user, loading } = useJWTAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Redirigir según el rol del usuario
    if (user.rol === 'admin_global') {
      router.replace('/dashboard-admin');
    } else if (user.empresa_id) {
      router.replace('/dashboard-empresa');
    } else {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Mostrar loading mientras se redirige
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  );
}
