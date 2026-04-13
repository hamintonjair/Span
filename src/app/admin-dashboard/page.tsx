'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactPaginate from 'react-paginate';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { createClient } from '@/lib/supabase-client';

// Estilos para react-paginate
const paginationStyles = `
  .pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .pagination li {
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .pagination li:hover:not(.active):not(.disabled) {
    background-color: #f3f4f6;
  }
  
  .pagination li.active {
    background-color: #2563eb;
    border-color: #2563eb;
    color: white;
  }
  
  .pagination li.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .break-me {
    border: none;
    padding: 0.5rem 0.75rem;
    cursor: default;
  }
`;

interface Empresa {
  id: string;
  nombre: string;
  plan_id: string;
  estado_suscripcion: string;
  fecha_vencimiento: string;
  perfiles_count?: number;
  empleados_count?: number;
  total_ventas?: number;
}

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useJWTAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [historialPagos, setHistorialPagos] = useState<Comprobante[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComprobantes, setLoadingComprobantes] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  // Estados para paginación y filtro dinámico
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [empresasList, setEmpresasList] = useState<{id: string, nombre: string}[]>([]);
  const [totalCountHistorial, setTotalCountHistorial] = useState(0);
  const [estadisticas, setEstadisticas] = useState({
    totalEmpresas: 0,
    empresasActivas: 0,
    ingresosMensuales: 0,
    pendientesPago: 0
  });

  const supabase = createClient();

  useEffect(() => {
    // Verificar si el usuario es admin_global
    if (user && user.rol !== 'admin_global') {
      router.push('/dashboard');
      return;
    }
    
    if (user && user.rol === 'admin_global') {
      cargarEmpresas();
      cargarComprobantes();
      cargarHistorialPagos();
      cargarEmpresasList();
      cargarEstadisticasGlobales();
    }
  }, [user, router]);

  // useEffect para manejar cambios de página
  useEffect(() => {
    if (user && user.rol === 'admin_global') {
      cargarHistorialPagos(selectedEmpresa, itemOffset);
    }
  }, [itemOffset, selectedEmpresa, user]);

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

  const cargarHistorialPagos = async (empresaId: string = '', offset: number = 0) => {
    try {
      setLoadingHistorial(true);
      
      // Construir la consulta base con rango dinámico
      let query = supabase
        .from('comprobantes')
        .select('*', { count: 'exact' })
        .in('estado', ['aprobado', 'rechazado'])
        .order('fecha_envio', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      // Aplicar filtro de empresa si se seleccionó
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      // Obtener datos adicionales con consultas separadas para evitar problemas de joins
      const { data, error, count } = await query;

      if (error) {
        console.error('Error cargando historial de pagos:', error);
        return;
      }

      // Enriquecer datos con información de empresas y planes
      const enrichedData = await Promise.all(
        (data || []).map(async (comprobante) => {
          // Obtener datos de la empresa
          const { data: empresa } = await supabase
            .from('empresas')
            .select('id, nombre')
            .eq('id', comprobante.empresa_id)
            .single();

          // Obtener datos del plan
          const { data: plan } = await supabase
            .from('planes')
            .select('id, nombre, precio')
            .eq('id', comprobante.plan_id)
            .single();

          return {
            ...comprobante,
            empresas: empresa,
            planes: plan
          };
        })
      );

      setHistorialPagos(enrichedData);
      setTotalCountHistorial(count || 0);
      
    } catch (error) {
      console.error('Error en cargarHistorialPagos:', error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const cargarComprobantes = async () => {
    try {
      setLoadingComprobantes(true);
      
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
        .eq('estado', 'pendiente')
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error cargando comprobantes:', error);
        return;
      }

      setComprobantes(data || []);
    } catch (error) {
      console.error('Error en cargarComprobantes:', error);
    } finally {
      setLoadingComprobantes(false);
    }
  };

  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select(`
          id,
          nombre,
          plan_id,
          estado_suscripcion,
          fecha_vencimiento
        `)
        .order('nombre', { ascending: true });

      if (empresasError) throw empresasError;

      // Para cada empresa, obtener estadísticas
      const empresasConEstadisticas = await Promise.all(
        (empresasData || []).map(async (empresa) => {
          // Contar perfiles
          const { data: perfiles } = await supabase
            .from('perfiles')
            .select('id')
            .eq('empresa_id', empresa.id);

          // Contar empleados
          const { data: empleados } = await supabase
            .from('empleados')
            .select('id')
            .eq('empresa_id', empresa.id);

          // Contar ventas del último mes
          const inicioMes = new Date();
          inicioMes.setDate(1);
          inicioMes.setHours(0, 0, 0, 0);

          const { data: ventas } = await supabase
            .from('ventas')
            .select('total')
            .eq('empresa_id', empresa.id)
            .gte('created_at', inicioMes.toISOString());

          const totalVentas = ventas?.reduce((sum, v) => sum + v.total, 0) || 0;

          return {
            ...empresa,
            perfiles_count: perfiles?.length || 0,
            empleados_count: empleados?.length || 0,
            total_ventas: totalVentas
          };
        })
      );

      setEmpresas(empresasConEstadisticas);
    } catch (error) {
      console.error('Error cargando empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticasGlobales = async () => {
    try {
      // Total Empresas
      const { count: totalEmpresas } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true });

      // Activas (empresas con estado = 'activo')
      const { count: empresasActivas } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .eq('estado_suscripcion', 'activa');

      // Ingresos Mensuales (comprobantes aprobados del mes actual)
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: ingresosData } = await supabase
        .from('comprobantes')
        .select('monto')
        .eq('estado', 'aprobado')
        .gte('fecha_envio', inicioMes.toISOString());

      const ingresosMensuales = ingresosData?.reduce((sum, c) => sum + (c.monto || 0), 0) || 0;

      // Pendientes de Pago (empresas vencidas)
      const { count: pendientesPago } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .eq('estado_suscripcion', 'vencida');

      // Actualizar estadísticas
      setEstadisticas({
        totalEmpresas: totalEmpresas || 0,
        empresasActivas: empresasActivas || 0,
        ingresosMensuales,
        pendientesPago: pendientesPago || 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas globales:', error);
    }
  };

  const handleCambiarEstado = async (empresaId: string, nuevoEstado: string) => {
    setProcesando(empresaId);
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ 
          estado_suscripcion: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', empresaId);

      if (error) throw error;

      // Si se activa, actualizar fecha de vencimiento
      if (nuevoEstado === 'activa') {
        const nuevaFechaVencimiento = new Date();
        nuevaFechaVencimiento.setMonth(nuevaFechaVencimiento.getMonth() + 1);
        
        await supabase
          .from('empresas')
          .update({ 
            fecha_vencimiento: nuevaFechaVencimiento.toISOString().split('T')[0]
          })
          .eq('id', empresaId);
      }

      await cargarEmpresas();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado de la empresa');
    } finally {
      setProcesando(null);
    }
  };

  const handleEliminarEmpresa = async (empresaId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) {
      return;
    }

    setProcesando(empresaId);
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresaId);

      if (error) throw error;

      await cargarEmpresas();
    } catch (error) {
      console.error('Error eliminando empresa:', error);
      alert('Error al eliminar la empresa');
    } finally {
      setProcesando(null);
    }
  };

  const aprobarComprobante = async (comprobanteId: string) => {
    setProcesando(comprobanteId);
    try {
      const response = await fetch(`/api/comprobantes/${comprobanteId}/aprobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'aprobar'
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
      
      // Refresco forzado
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
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
          notas
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

      setComprobantes(prev => prev.filter(c => c.id !== comprobanteId));
      router.refresh();
      await cargarHistorialPagos();
      
    } catch (error) {
      console.error('Error rechazando comprobante:', error);
      alert('Error al rechazar comprobante');
    } finally {
      setProcesando(null);
    }
  };

  const empresasFiltradas = empresas.filter(empresa => {
    const coincideBusqueda = empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideEstado = filtroEstado === 'todos' || empresa.estado_suscripcion === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800';
      case 'suspendida': return 'bg-amber-100 text-amber-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basico': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const estaVencida = (fechaVencimiento: string) => {
    return new Date(fechaVencimiento) < new Date();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando empresas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <style jsx>{paginationStyles}</style>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🌐 Admin Global</h1>
            <p className="text-gray-600">Gestión de todas las empresas BeautyPro</p>
          </div>
          <Button
            onClick={cargarEmpresas}
            className="bg-blue-600 hover:bg-blue-700"
          >
            🔄 Actualizar
          </Button>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Empresas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalEmpresas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.empresasActivas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <div className="w-6 h-6 bg-amber-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendientes de Pago</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.pendientesPago}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <div className="w-6 h-6 bg-purple-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${estadisticas.ingresosMensuales.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprobantes Pendientes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Comprobantes Pendientes ({comprobantes.length})
              </h2>
              <Button
                onClick={cargarComprobantes}
                disabled={loadingComprobantes}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🔄 Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingComprobantes ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando comprobantes...</p>
              </div>
            ) : comprobantes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay comprobantes pendientes
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
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                            {comprobante.estado}
                          </span>
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
                        </div>

                        {comprobante.notas && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Notas:</span> {comprobante.notas}
                          </div>
                        )}

                        <div className="mt-3">
                          <a
                            href={comprobante.url_archivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Ver comprobante
                          </a>
                        </div>
                      </div>

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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Empresas */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Empresas Registradas</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Buscar empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activa">Activas</option>
                  <option value="suspendida">Suspendidas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuarios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ventas Mes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {empresasFiltradas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{empresa.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(empresa.estado_suscripcion)}`}>
                          {empresa.estado_suscripcion}
                        </span>
                        {estaVencida(empresa.fecha_vencimiento) && (
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            Vencida
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(empresa.fecha_vencimiento).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>Perfiles: {empresa.perfiles_count || 0}</div>
                        <div>Empleados: {empresa.empleados_count || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(empresa.total_ventas || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {empresa.estado_suscripcion === 'activa' ? (
                            <Button
                              size="sm"
                              onClick={() => handleCambiarEstado(empresa.id, 'suspendida')}
                              disabled={procesando === empresa.id}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              {procesando === empresa.id ? '...' : 'Suspender'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleCambiarEstado(empresa.id, 'activa')}
                              disabled={procesando === empresa.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {procesando === empresa.id ? '...' : 'Activar'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleEliminarEmpresa(empresa.id)}
                            disabled={procesando === empresa.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {procesando === empresa.id ? '...' : 'Eliminar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
