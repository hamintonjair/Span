'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { createClient } from '@/lib/supabase-client';

interface Auditoria {
  id: string;
  empresa_id: string;
  plan_id: string;
  nombre_archivo: string;
  monto: number;
  estado: string;
  verificado_por: string;
  fecha_envio: string;
  creado_en: string;
  empresas?: {
    id: string;
    nombre: string;
  };
  planes?: {
    id: string;
    nombre: string;
    precio: number;
  };
}

export default function AuditoriaPage() {
  const router = useRouter();
  const { user } = useJWTAuth();
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Verificar si el usuario es admin_global
    if (user && user.rol !== 'admin_global') {
      router.push('/dashboard');
      return;
    }
    
    if (user && user.rol === 'admin_global') {
      cargarAuditorias();
    }
  }, [user, router]);

  const cargarAuditorias = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('comprobantes')
        .select(`
          *,
          empresas (
            id,
            nombre
          ),
          planes (
            id,
            nombre,
            precio
          )
        `)
        .not('verificado_por', 'is', null)
        .order('fecha_envio', { ascending: false });

      if (error) {
        console.error('Error cargando auditorías:', error);
        return;
      }

      setAuditorias(data || []);
    } catch (error) {
      console.error('Error en cargarAuditorias:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar autenticación y rol
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (user.rol !== 'admin_global') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔍 Auditoría</h1>
            <p className="text-gray-600">Registro de aprobaciones y validaciones</p>
          </div>
          <Button
            onClick={cargarAuditorias}
            className="bg-blue-600 hover:bg-blue-700"
          >
            🔄 Actualizar
          </Button>
        </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <div className="w-6 h-6 bg-green-600 rounded"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Aprobaciones</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {auditorias.filter(a => a.estado === 'aprobado').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <div className="w-6 h-6 bg-red-600 rounded"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Rechazos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {auditorias.filter(a => a.estado === 'rechazado').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Auditores Activos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(auditorias.map(a => a.verificado_por)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de auditoría */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                Registro de Auditoría ({auditorias.length})
              </h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando auditorías...</p>
                </div>
              ) : auditorias.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay registros de auditoría
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verificado Por
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditorias.map((auditoria) => (
                        <tr key={auditoria.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(auditoria.fecha_envio).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {auditoria.empresas?.nombre || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {auditoria.planes?.nombre || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${auditoria.monto?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              auditoria.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                              auditoria.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {auditoria.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {auditoria.verificado_por}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
