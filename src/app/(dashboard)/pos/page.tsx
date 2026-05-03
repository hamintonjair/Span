'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { TerminalPOSUpgraded } from '@/components/pos/terminal-pos-upgraded';
import { useJWTAuth } from '@/hooks/use-jwt-auth';

export default function POSPage() {
  const { user, loading } = useJWTAuth();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando información del usuario...</div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !user.empresa_id) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            Error: No se pudo obtener el ID de la empresa. Por favor, inicia sesión nuevamente.
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🛒 Punto de Venta</h1>
          <p className="text-gray-600">Terminal de ventas con upselling y gestión de inventario</p>
        </div>

        <TerminalPOSUpgraded empresaId={user.empresa_id} />
      </div>
    </MainLayout>
  );
}
