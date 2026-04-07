'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';

export default function MarketingPage() {
  const { planName } = usePlanPermissions();

  return (
    <ProtectedRoute
      requiredPermission="marketing"
      moduleInfo={{
        name: 'Marketing',
        icon: '📢',
        benefits: [
          'Campañas de email marketing',
          'Gestiona redes sociales integradas',
          'Programa de lealtad para clientes',
          'Análisis de campañas en tiempo real',
          'Segmentación de clientes avanzada',
          'Automatización de marketing'
        ],
        requiredPlan: 'Premium',
        upgradePrice: 149.99
      }}
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-600">Impulsa tu negocio con herramientas de marketing</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="font-semibold text-pink-900 mb-2">Campañas Activas</h3>
              <p className="text-2xl font-bold text-pink-600">8</p>
              <p className="text-sm text-pink-600">3 finalizando esta semana</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-2">Tasa de Apertura</h3>
              <p className="text-2xl font-bold text-indigo-600">24.5%</p>
              <p className="text-sm text-indigo-600">+3.2% vs mes anterior</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Clientes Leales</h3>
              <p className="text-2xl font-bold text-green-600">342</p>
              <p className="text-sm text-green-600">18 nuevos este mes</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Campañas Recientes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaña</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviados</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apertura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">Promoción de Verano</td>
                    <td className="px-6 py-4">Email</td>
                    <td className="px-6 py-4">1,250</td>
                    <td className="px-6 py-4">28.4%</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Activa</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Descuento 2x1</td>
                    <td className="px-6 py-4">SMS</td>
                    <td className="px-6 py-4">850</td>
                    <td className="px-6 py-4">92.1%</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Activa</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Nuevo Producto</td>
                    <td className="px-6 py-4">Email</td>
                    <td className="px-6 py-4">2,100</td>
                    <td className="px-6 py-4">19.8%</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">Finalizando</span>
                    </td>
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
