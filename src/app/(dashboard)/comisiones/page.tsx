'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';

export default function ComisionesPage() {
  const { planName } = usePlanPermissions();

  return (
    <ProtectedRoute
      requiredPermission="commissions"
      moduleInfo={{
        name: 'Comisiones',
        icon: '💰',
        benefits: [
          'Calcula comisiones automáticas',
          'Motiva a tu equipo con incentivos',
          'Reportes de rendimiento individual',
          'Configura diferentes tipos de comisión',
          'Integración con ventas y servicios',
          'Pagos de comisiones transparentes'
        ],
        requiredPlan: 'Profesional',
        upgradePrice: 79.99
      }}
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Comisiones</h1>
          <p className="text-gray-600">Gestiona las comisiones de tu equipo</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Comisiones del Mes</h3>
              <p className="text-2xl font-bold text-purple-600">$3,240</p>
              <p className="text-sm text-purple-600">12 empleados</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Ventas Generadas</h3>
              <p className="text-2xl font-bold text-blue-600">$45,680</p>
              <p className="text-sm text-blue-600">7% comisión promedio</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Mejor Vendedor</h3>
              <p className="text-2xl font-bold text-green-600">María G.</p>
              <p className="text-sm text-green-600">$850 en comisiones</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Comisiones por Empleado</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ventas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comisión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">María García</td>
                    <td className="px-6 py-4">$12,150</td>
                    <td className="px-6 py-4">7%</td>
                    <td className="px-6 py-4 font-semibold">$850.50</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Juan Rodríguez</td>
                    <td className="px-6 py-4">$9,820</td>
                    <td className="px-6 py-4">6%</td>
                    <td className="px-6 py-4 font-semibold">$589.20</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Ana Martínez</td>
                    <td className="px-6 py-4">$8,450</td>
                    <td className="px-6 py-4">5%</td>
                    <td className="px-6 py-4 font-semibold">$422.50</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
