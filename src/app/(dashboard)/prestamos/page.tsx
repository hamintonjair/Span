'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { PanelPrestamos } from '@/components/prestamos/panel-prestamos';

export default function PrestamosPage() {
  const empresaId = '1'; // Simulación - en producción vendría del contexto

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Préstamos</h1>
          <p className="text-gray-600">Gestión de préstamos a empleados</p>
        </div>

        <PanelPrestamos empresaId={empresaId} />
      </div>
    </MainLayout>
  );
}
