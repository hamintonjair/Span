'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { createClient } from '@/lib/supabase-client';

interface Comprobante {
  id: string;
  empresa_id: string;
  plan_id: string;
  nombre_archivo: string;
  url_archivo: string;
  tamano_bytes: number;
  monto: number;
  estado: string;
  notas: string;
  fecha_envio: string;
  creado_en: string;
  verificado_por?: string;
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

export default function FinanzasPage() {
  const router = useRouter();
  const { user } = useJWTAuth();
  const [activeTab, setActiveTab] = useState<'validacion' | 'historial' | 'completo'>('validacion');
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [empresasList, setEmpresasList] = useState<{id: string, nombre: string}[]>([]);

  const supabase = createClient();

  useEffect(() => {
    // Verificar si el usuario es admin_global
    if (user && user.rol !== 'admin_global') {
      router.push('/dashboard');
      return;
    }
    
    if (user && user.rol === 'admin_global') {
      cargarComprobantes();
      cargarEmpresasList();
    }
  }, [user, router]);

  const cargarEmpresasList = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error cargando lista de empresas:', error);
        return;
      }

      setEmpresasList(data || []);
    } catch (error) {
      console.error('Error en cargarEmpresasList:', error);
    }
  };

  const cargarComprobantes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
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
        `);

      if (activeTab === 'validacion') {
        query = query.eq('estado', 'pendiente').order('creado_en', { ascending: false });
      } else if (activeTab === 'historial') {
        query = query.in('estado', ['aprobado', 'rechazado']).order('fecha_envio', { ascending: false });
        
        if (selectedEmpresa) {
          query = query.eq('empresa_id', selectedEmpresa);
        }
      } else if (activeTab === 'completo') {
        // Historial completo - todos los registros
        query = query.order('fecha_envio', { ascending: false });
        
        if (selectedEmpresa) {
          query = query.eq('empresa_id', selectedEmpresa);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error cargando comprobantes:', error);
        return;
      }

      setComprobantes(data || []);
    } catch (error) {
      console.error('Error en cargarComprobantes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.rol === 'admin_global') {
      cargarComprobantes();
    }
  }, [activeTab, selectedEmpresa, user]);

  const aprobarComprobante = async (comprobanteId: string) => {
    setProcesando(comprobanteId);
    try {
      const response = await fetch(`/api/comprobantes/${comprobanteId}/aprobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'aprobar',
          verificado_por: user?.nombre
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error aprobando comprobante');
      }

      // Mostrar toast de éxito
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      toast.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 00-2 0v2a1 1 0 002 0v-2a1 1 0 00-2 0zm0 4a1 1 0 102 0v2a1 1 0 102 0v-2a1 1 0 00-2 0z" clip-rule="evenodd"></path>
        </svg>
        <span>✅ Suscripción activada con éxito</span>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
      
      await cargarComprobantes();
      
    } catch (error) {
      console.error('Error aprobando comprobante:', error);
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      toast.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 00-2 0v2a1 1 0 002 0v-2a1 1 0 00-2 0zm0 4a1 1 0 102 0v2a1 1 0 102 0v-2a1 1 0 00-2 0z" clip-rule="evenodd"></path>
        </svg>
        <span>${error instanceof Error ? error.message : 'Error al aprobar comprobante'}</span>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 5000);
    } finally {
      setProcesando(null);
    }
  };

  const rechazarComprobante = async (comprobanteId: string) => {
    const notas = prompt('Motivo del rechazo:');
    if (!notas) return;

    setProcesando(comprobanteId);
    try {
      const response = await fetch(`/api/comprobantes/${comprobanteId}/aprobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'rechazar',
          notas,
          verificado_por: user?.nombre
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error rechazando comprobante');
      }

      // Mostrar toast de éxito
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      toast.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 00-2 0v2a1 1 0 002 0v-2a1 1 0 00-2 0zm0 4a1 1 0 102 0v2a1 1 0 102 0v-2a1 1 0 00-2 0z" clip-rule="evenodd"></path>
        </svg>
        <span>Comprobante rechazado exitosamente</span>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);

      await cargarComprobantes();
      
    } catch (error) {
      console.error('Error rechazando comprobante:', error);
      alert('Error al rechazar comprobante');
    } finally {
      setProcesando(null);
    }
  };

  const verComprobante = async (comprobante: Comprobante) => {
    // Obtener configuración global para IVA
    const { data: config } = await supabase
      .from('configuracion_global')
      .select('iva_porcentaje')
      .single();

    const ivaPorcentaje = config?.iva_porcentaje || 16;
    
    // Calcular monto real si no existe
    let montoReal = comprobante.monto;
    if (!montoReal && comprobante.planes?.precio) {
      montoReal = comprobante.planes.precio * (1 + (ivaPorcentaje / 100));
    }

    // Crear modal grande para ver comprobante
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="text-lg font-semibold">Ver Comprobante</h3>
          <button class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div class="flex-1 overflow-auto p-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 class="font-semibold mb-2">Información del Comprobante</h4>
              <div class="space-y-2 text-sm">
                <p><strong>Empresa:</strong> ${comprobante.empresas?.nombre || 'N/A'}</p>
                <p><strong>Plan:</strong> ${comprobante.planes?.nombre || 'N/A'}</p>
                <p><strong>Estado:</strong> <span class="px-2 py-1 text-xs rounded-full ${
                  comprobante.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                  comprobante.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }">${comprobante.estado}</span></p>
                <p><strong>Monto del Pago:</strong> <span class="text-lg font-bold text-green-600">$${montoReal?.toFixed(2) || '0.00'}</span></p>
                <p><strong>Fecha:</strong> ${new Date(comprobante.fecha_envio).toLocaleDateString()}</p>
                ${comprobante.verificado_por ? `<p><strong>Verificado por:</strong> ${comprobante.verificado_por}</p>` : ''}
                ${comprobante.notas ? `<p><strong>Notas:</strong> ${comprobante.notas}</p>` : ''}
              </div>
            </div>
            <div>
              <h4 class="font-semibold mb-2">Documento</h4>
              <iframe src="${comprobante.url_archivo}" class="w-full h-96 border rounded"></iframe>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal
    const closeBtn = modal.querySelector('button');
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  };

  // Función para obtener tipo de trámite
  const getTipoTramite = (comprobante: Comprobante) => {
    if (comprobante.plan_id) {
      return 'Suscripción';
    }
    return 'Cambio de Plan';
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
            <h1 className="text-3xl font-bold text-gray-900">💰 Finanzas</h1>
            <p className="text-gray-600">Gestión de pagos y comprobantes</p>
          </div>
          <Button
            onClick={cargarComprobantes}
            className="bg-blue-600 hover:bg-blue-700"
          >
            🔄 Actualizar
          </Button>
        </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('validacion')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'validacion'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Validación de Comprobantes
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'historial'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Historial Aprobados/Rechazados
              </button>
              <button
                onClick={() => setActiveTab('completo')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'completo'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Historial Completo
              </button>
            </nav>
          </div>

          {/* Filtro de empresa para historial y completo */}
          {(activeTab === 'historial' || activeTab === 'completo') && (
            <div className="mb-6">
              <select
                value={selectedEmpresa}
                onChange={(e) => setSelectedEmpresa(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las empresas</option>
                {empresasList.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lista de comprobantes */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === 'validacion' ? 'Comprobantes Pendientes' : activeTab === 'historial' ? 'Historial de Pagos' : 'Historial Completo'} ({comprobantes.length})
              </h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando comprobantes...</p>
                </div>
              ) : comprobantes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay comprobantes {activeTab === 'validacion' ? 'pendientes' : activeTab === 'historial' ? 'en el historial' : 'en el historial completo'}
                </div>
              ) : (
                <div className="space-y-4">
                  {comprobantes.map((comprobante) => (
                    <div key={comprobante.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {comprobante.empresas?.nombre || 'Empresa desconocida'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              comprobante.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                              comprobante.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {comprobante.estado}
                            </span>
                            {activeTab !== 'validacion' && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {getTipoTramite(comprobante)}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Plan:</span> {comprobante.planes?.nombre}
                            </div>
                            <div>
                              <span className="font-medium">Monto:</span> ${comprobante.monto?.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Archivo:</span> {comprobante.nombre_archivo}
                            </div>
                            <div>
                              <span className="font-medium">Fecha:</span> {new Date(comprobante.fecha_envio).toLocaleDateString()}
                            </div>
                            {comprobante.verificado_por && (
                              <div>
                                <span className="font-medium">Verificado por:</span> {comprobante.verificado_por}
                              </div>
                            )}
                          </div>

                        <div className="mt-3">
                          <button
                            onClick={() => verComprobante(comprobante)}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Ver comprobante
                          </button>
                        </div>
                      </div>

                      {activeTab === 'validacion' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => aprobarComprobante(comprobante.id)}
                            disabled={procesando === comprobante.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {procesando === comprobante.id ? '...' : '✅ Aprobar'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => rechazarComprobante(comprobante.id)}
                            disabled={procesando === comprobante.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {procesando === comprobante.id ? '...' : '❌ Rechazar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
