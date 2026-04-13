'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Search, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Play, Eye, Filter, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useRouter } from 'next/navigation';
import { useCancelacionAutomatica } from '@/hooks/use-cancelacion-automatica';

// Formateador de dinero para Colombia
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Interfaces TypeScript
interface Cita {
  id: string;
  empresa_id: string;
  cliente_id: string;
  empleado_id: string;
  fecha: string;
  estado: 'pendiente' | 'confirmada' | 'en_atencion' | 'atendido' | 'finalizado' | 'completada' | 'cancelada' | 'anulada' | 'vencida';
  total_estimado: number;
  servicios_ids: string[];
  notas?: string | null;
  created_at: string;
  updated_at: string;
  servicios_adicionales?: any[];
  productos_adicionales?: any[];
}

interface Cliente {
  id: string;
  empresa_id: string;
  nombre: string;
  cedula?: string;
  email?: string;
  telefono?: string;
  created_at: string;
  updated_at: string;
}

interface Empleado {
  id: string;
  empresa_id: string;
  nombre_completo: string;
  email_empleado: string;
  telefono?: string;
  direccion?: string;
  cedula?: string;
  estado: string;
  sueldo_base?: number;
  porcentaje_comision?: number;
  fecha_contratacion?: string;
  created_at: string;
  updated_at: string;
}

interface Servicio {
  id: string;
  empresa_id: string;
  nombre: string;
  precio: number;
  duracion_minutos: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

export default function GestionCitasPage() {
  const { user, loading } = useJWTAuth();
  const router = useRouter();

  // Estados para datos
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estados para filtros y paginación
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  // Estados para toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Función para mostrar toast
  const mostrarToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Declarar función cargarDatos antes de cualquier useEffect
  const cargarDatos = async () => {
    if (!user || !user.empresa_id) {
      mostrarToast('Usuario no autenticado o sin empresa asignada', 'error');
      return;
    }

    setLoadingData(true);
    try {
      console.log('🔄 Cargando datos de gestión de citas...');

      // Cargar clientes
      const { data: clientesData, error: clientesError } = await (supabase as any)
        .from('clientes')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('nombre');

      if (clientesError) {
        console.error('Error en clientes:', clientesError);
        throw clientesError;
      }
      setClientes(clientesData || []);
      console.log('✅ Clientes cargados:', clientesData?.length || 0);

      // Cargar empleados
      const { data: empleadosData, error: empleadosError } = await (supabase as any)
        .from('empleados')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .order('nombre_completo');

      if (empleadosError) {
        console.error('Error en empleados:', empleadosError);
        throw empleadosError;
      }
      setEmpleados(empleadosData || []);
      console.log('✅ Empleados cargados:', empleadosData?.length || 0);

      // Cargar servicios
      const { data: serviciosData, error: serviciosError } = await (supabase as any)
        .from('servicios')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .order('nombre');

      if (serviciosError) {
        console.error('Error en servicios:', serviciosError);
        throw serviciosError;
      }
      setServicios(serviciosData || []);
      console.log('✅ Servicios cargados:', serviciosData?.length || 0);

      // Cargar TODAS las citas (sin filtro de estado)
      const { data: citasData, error: citasError } = await (supabase as any)
        .from('citas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('fecha', { ascending: false });

      if (citasError) {
        console.error('Error en citas:', citasError);
        throw citasError;
      }
      setCitas(citasData || []);
      console.log('✅ Citas cargadas (todas):', citasData?.length || 0);
      
      // Mostrar cuántas citas están completadas
      const citasCompletadas = citasData?.filter((cita: any) => cita.estado === 'completada' || cita.estado === 'finalizado') || [];
      console.log('📊 Citas completadas:', citasCompletadas.length);
      console.log('📋 IDs de citas completadas:', citasCompletadas.map((c: any) => ({ id: c.id, estado: c.estado })));

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      mostrarToast('Error al cargar los datos. Por favor, intenta nuevamente.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // Inicializar cancelación automática global
  useCancelacionAutomatica();

  // Efecto para actualización automática de notas cada 5 segundos
  useEffect(() => {
    const intervaloActualizacion = setInterval(() => {
      // Solo actualizar el estado para forzar re-renderizado de notas
      // Esto hace que los conteos regresivos se actualicen en tiempo real
      setCitas(prev => [...prev]);
    }, 5000); // Actualizar cada 5 segundos para tiempo real

    return () => {
      clearInterval(intervaloActualizacion);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!user.empresa_id) {
      mostrarToast('Tu usuario no tiene una empresa asignada. Contacta al administrador.', 'error');
      return;
    }
    cargarDatos();
  }, [user, loading]);

  // Efecto para escuchar eventos de cancelación automática
  useEffect(() => {
    const manejarCancelacionAutomatica = (event: CustomEvent) => {
      const { cantidad, fecha } = event.detail;
      console.log('📅 Recibido evento de cancelación automática en gestión:', { cantidad, fecha });
      
      // Recargar datos para actualizar la lista
      cargarDatos();
      
      // Mostrar notificación
      if (cantidad > 0) {
        mostrarToast(`${cantidad} cita(s) cancelada(s) automáticamente por incumplimiento`, 'info');
      }
    };

    // Agregar listener para el evento personalizado
    window.addEventListener('citasCanceladasAutomaticamente', manejarCancelacionAutomatica as EventListener);
    
    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener('citasCanceladasAutomaticamente', manejarCancelacionAutomatica as EventListener);
    };
  }, [cargarDatos, mostrarToast]);

  const getCitaConDatos = (cita: Cita) => {
    const cliente = clientes.find((c: Cliente) => c.id === cita.cliente_id);
    const empleado = empleados.find((e: Empleado) => e.id === cita.empleado_id);
    const serviciosCita = servicios.filter((s: Servicio) => cita.servicios_ids?.includes(s.id));
    
    return {
      ...cita,
      clienteNombre: cliente?.nombre || 'Cliente desconocido',
      clienteCedula: cliente?.cedula || 'N/A',
      clienteTelefono: cliente?.telefono || 'N/A',
      empleadoNombre: empleado?.nombre_completo || 'Empleado desconocido',
      serviciosNombres: serviciosCita.map(s => s.nombre).join(', ') || 'Sin servicios',
      serviciosPrecio: serviciosCita.reduce((acc, s) => acc + (s.precio || 0), 0)
    };
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmada': return 'bg-green-100 text-green-800 border-green-200';
      case 'en_atencion': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'atendido': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'finalizado': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completada': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200';
      case 'anulada': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'vencida': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Clock className="w-4 h-4" />;
      case 'confirmada': return <CheckCircle className="w-4 h-4" />;
      case 'en_atencion': return <Play className="w-4 h-4" />;
      case 'atendido': return <Eye className="w-4 h-4" />;
      case 'finalizado': return <CheckCircle className="w-4 h-4" />;
      case 'completada': return <CheckCircle className="w-4 h-4" />;
      case 'cancelada': return <XCircle className="w-4 h-4" />;
      case 'anulada': return <XCircle className="w-4 h-4" />;
      case 'vencida': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getBotonAccion = (cita: Cita, enModal: boolean = false) => {
    switch (cita.estado) {
      case 'pendiente':
      case 'confirmada':
        return (
          <Button
            size="sm"
            onClick={() => iniciarAtencion(cita.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="w-3 h-3 mr-1" />
            Iniciar Atención
          </Button>
        );
      
      case 'en_atencion':
        return (
          <Button
            size="sm"
            onClick={() => verAtencion(cita.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver Atención
          </Button>
        );
      
      case 'atendido':
        return (
          <Button
            size="sm"
            onClick={() => verAtencion(cita.id)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Eye className="w-3 h-3 mr-1" />
            Continuar Atención
          </Button>
        );
      
      default:
        // En el modal no mostrar botón "Ver Detalles"
        if (enModal) {
          return null;
        }
        
        return (
          <Button
            size="sm"
            onClick={() => verDetalles(cita)}
            variant="outline"
            className="text-gray-600 border-gray-300"
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver Detalles
          </Button>
        );
    }
  };

  const iniciarAtencion = async (citaId: string) => {
    try {
      const cita = citas.find((c: Cita) => c.id === citaId);
      if (!cita) {
        mostrarToast('Error: Cita no encontrada', 'error');
        return;
      }

      console.log('Verificando caja abierta para iniciar atención:', citaId);

      // Verificar si hay caja abierta antes de permitir iniciar atención
      const { data: cajaActiva, error: cajaError } = await (supabase as any)
        .from('cajas')
        .select('id')
        .eq('empresa_id', user?.empresa_id || '')
        .eq('estado', 'abierta')
        .maybeSingle() as { data: { id: string } | null, error: any };

      if (cajaError || !cajaActiva) {
        mostrarToast('Debe abrir una caja antes de iniciar atención', 'error');
        return;
      }

      console.log('Caja abierta verificada:', cajaActiva.id);

      console.log('🔄 Iniciando atención para cita:', citaId);

      // Cambiar estado a 'en_atencion'
      const { error } = await (supabase as any)
        .from('citas')
        .update({ 
          estado: 'en_atencion',
          updated_at: new Date().toISOString()
        })
        .eq('id', citaId);

      if (error) {
        console.error('Error actualizando estado de cita:', error);
        throw error;
      }

      console.log('✅ Estado de cita actualizado a "en_atencion"');

      // Recargar datos
      await cargarDatos();

      // Construir URL con parámetros
      const params = new URLSearchParams({
        cita_id: citaId,
        cliente_id: cita.cliente_id,
        empleado_id: cita.empleado_id,
        servicios_ids: cita.servicios_ids.join(',')
      });
      
      // Navegar a la página de atención
      router.push(`/atencion?${params.toString()}`);

    } catch (error) {
      console.error('❌ Error iniciando atención:', error);
      mostrarToast('Error al iniciar atención', 'error');
    }
  };

  const verAtencion = async (citaId: string) => {
    const cita = citas.find((c: Cita) => c.id === citaId);
    if (!cita) {
      mostrarToast('Error: Cita no encontrada', 'error');
      return;
    }

    // Simplificar URL - solo pasar cita_id
    router.push(`/atencion?cita_id=${citaId}`);
  };

  const verDetalles = async (cita: Cita) => {
    console.log('🔍 Ver detalles de cita:', cita);
    console.log('🔍 Estado:', cita.estado);
    console.log('🔍 Cita ID:', cita.id);
    
    try {
      // Cargar servicios adicionales y productos de la cita
      const [serviciosAdicionales, productosAdicionales] = await Promise.all([
        supabase
          .from('cita_servicios_adicionales')
          .select(`
            id,
            cantidad,
            precio_unitario,
            subtotal,
            servicios(id, nombre, precio)
          `)
          .eq('cita_id', cita.id),
        supabase
          .from('cita_productos')
          .select(`
            id,
            cantidad,
            precio_unitario,
            subtotal,
            productos(id, nombre, precio_venta)
          `)
          .eq('cita_id', cita.id)
      ]);

      const citaConDatos = {
        ...cita,
        servicios_adicionales: serviciosAdicionales.data || [],
        productos_adicionales: productosAdicionales.data || []
      };

      setSelectedCita(citaConDatos);
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error cargando detalles adicionales:', error);
      setSelectedCita(cita);
      setShowDetalleModal(true);
    }
  };

  // Filtrar citas
  const citasFiltradas = citas.filter(cita => {
    const cumpleEstado = filtroEstado === 'todos' || cita.estado === filtroEstado;
    const citaConDatos = getCitaConDatos(cita);
    const cumpleBusqueda = !busqueda || 
      citaConDatos.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      citaConDatos.empleadoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      citaConDatos.serviciosNombres.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleEstado && cumpleBusqueda;
  });

  // Paginación
  const totalPages = Math.ceil(citasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const citasPaginadas = citasFiltradas.slice(startIndex, endIndex);

  // Estadísticas
  const estadisticas = {
    total: citas.length,
    pendientes: citas.filter(c => c.estado === 'pendiente').length,
    confirmadas: citas.filter(c => c.estado === 'confirmada').length,
    enAtencion: citas.filter(c => c.estado === 'en_atencion').length,
    atendidas: citas.filter(c => c.estado === 'atendido').length,
    completadas: citas.filter(c => c.estado === 'completada').length,
    canceladas: citas.filter(c => c.estado === 'cancelada').length,
    anuladas: citas.filter(c => c.estado === 'anulada').length,
    vencidas: citas.filter(c => c.estado === 'vencida').length
  };

  if (loading || loadingData) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-gray-500 mb-2">
              {loading ? 'Verificando autenticación...' : 'Cargando datos de gestión...'}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              No tienes acceso a esta sección.
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Toast de Notificaciones */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' && <span className="mr-2">✅</span>}
            {toast.type === 'error' && <span className="mr-2">❌</span>}
            {toast.type === 'info' && <span className="mr-2">ℹ️</span>}
            {toast.message}
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Citas</h1>
          <p className="text-gray-600">Administra todas las citas del sistema con filtros avanzados</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
              <div className="text-sm text-blue-600">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</div>
              <div className="text-sm text-yellow-600">Pendientes</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{estadisticas.enAtencion}</div>
              <div className="text-sm text-purple-600">En Atención</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticas.completadas}</div>
              <div className="text-sm text-green-600">Completadas</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{estadisticas.canceladas + estadisticas.anuladas}</div>
              <div className="text-sm text-red-600">Canceladas</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por cliente, empleado o servicio..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filtroEstado === 'todos' ? 'primary' : 'outline'}
                  onClick={() => setFiltroEstado('todos')}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Todos
                </Button>
                <Button
                  variant={filtroEstado === 'pendiente' ? 'primary' : 'outline'}
                  onClick={() => setFiltroEstado('pendiente')}
                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  Pendientes
                </Button>
                <Button
                  variant={filtroEstado === 'en_atencion' ? 'primary' : 'outline'}
                  onClick={() => setFiltroEstado('en_atencion')}
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  En Atención
                </Button>
                <Button
                  variant={filtroEstado === 'completada' ? 'primary' : 'outline'}
                  onClick={() => setFiltroEstado('completada')}
                  className="bg-green-100 text-green-800 hover:bg-green-200"
                >
                  Completadas
                </Button>
                <Button
                  variant={filtroEstado === 'cancelada' || filtroEstado === 'anulada' ? 'primary' : 'outline'}
                  onClick={() => setFiltroEstado('anulada')}
                  className="bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Anuladas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Citas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Lista de Citas ({citasFiltradas.length})
              </span>
              <Button onClick={cargarDatos} variant="outline" size="sm">
                Actualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-3 font-medium text-gray-700 border-r">Fecha</th>
                    <th className="text-left p-3 font-medium text-gray-700 border-r">Cliente</th>
                    <th className="text-left p-3 font-medium text-gray-700 border-r">Empleado</th>
                    <th className="text-left p-3 font-medium text-gray-700 border-r">Servicios</th>
                    <th className="text-left p-3 font-medium text-gray-700 border-r">Total</th>
                    <th className="text-center p-3 font-medium text-gray-700 border-r">Estado</th>
                    <th className="text-left p-3 font-medium text-gray-700 border-r">Notas</th>
                    <th className="text-center p-3 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {citasPaginadas.map((cita) => {
                    const citaConDatos = getCitaConDatos(cita);
                    return (
                      <tr key={cita.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 border-r">
                          <div className="text-sm">
                            {new Date(cita.fecha).toLocaleDateString('es-MX')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(cita.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium">{citaConDatos.clienteNombre}</div>
                          <div className="text-xs text-gray-500">{citaConDatos.clienteCedula}</div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium">{citaConDatos.empleadoNombre}</div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="text-sm max-w-xs truncate" title={citaConDatos.serviciosNombres}>
                            {citaConDatos.serviciosNombres}
                          </div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium">
                            ${cita.total_estimado.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3 border-r text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(cita.estado)}`}>
                            {getEstadoIcon(cita.estado)}
                            {cita.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 border-r">
                          {cita.notas && (
                            <div className="text-sm max-w-xs">
                              {cita.notas.includes('Anulada automáticamente') ? (
                                <span className="text-red-600 font-medium" title={cita.notas}>
                                  🤖 Cancelación automática
                                </span>
                              ) : (
                                <span className="text-gray-600 truncate" title={cita.notas}>
                                  {cita.notas}
                                </span>
                              )}
                            </div>
                          )}
                          {cita.estado === 'pendiente' && (
                            <div className="text-sm max-w-xs mt-1">
                              {(() => {
                                const ahora = new Date();
                                const fechaCita = new Date(cita.fecha);
                                const limiteCancelacion = new Date(fechaCita.getTime() + 15 * 60000);
                                const minutosRestantes = Math.floor((limiteCancelacion.getTime() - ahora.getTime()) / 60000);
                                
                                if (minutosRestantes <= 0) {
                                  return (
                                    <span className="text-red-600 font-medium animate-pulse" title="Esta cita será cancelada automáticamente pronto">
                                      ⚠️ Se cancelará automáticamente
                                    </span>
                                  );
                                } else if (minutosRestantes <= 5) {
                                  return (
                                    <span className="text-orange-600 font-medium" title={`Se cancelará en ${minutosRestantes} minutos`}>
                                      ⏰ Se cancelará en {minutosRestantes} min
                                    </span>
                                  );
                                } else if (minutosRestantes <= 15) {
                                  return (
                                    <span className="text-yellow-600 font-medium" title={`Se cancelará en ${minutosRestantes} minutos`}>
                                      📅 Se cancelará en {minutosRestantes} min
                                    </span>
                                  );
                                } else {
                                  // Para citas que aún no están próximas a cancelarse
                                  const minutosParaCita = Math.floor((fechaCita.getTime() - ahora.getTime()) / 60000);
                                  if (minutosParaCita > 0) {
                                    return (
                                      <span className="text-blue-600 font-medium" title={`La cita es en ${minutosParaCita} minutos`}>
                                        🕐 En {minutosParaCita} min
                                      </span>
                                    );
                                  } else {
                                    // La cita ya pasó pero aún no se cancela (dentro de los 15 min de gracia)
                                    return (
                                      <span className="text-purple-600 font-medium" title="Cita en progreso">
                                        🎯 En curso
                                      </span>
                                    );
                                  }
                                }
                              })()}
                            </div>
                          )}
                          {(cita.estado === 'completada' || cita.estado === 'finalizado') && (
                            <div className="text-sm max-w-xs mt-1">
                              <span className="text-green-600 font-medium" title="Cita completada exitosamente">
                                ✅ Cita completada
                              </span>
                            </div>
                          )}
                          {cita.estado === 'en_atencion' && (
                            <div className="text-sm max-w-xs mt-1">
                              <span className="text-purple-600 font-medium" title="Cita actualmente en atención">
                                🎯 En atención
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {getBotonAccion(cita)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, citasFiltradas.length)} de {citasFiltradas.length} citas
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalles */}
      {showDetalleModal && selectedCita && (
        <Modal
          isOpen={showDetalleModal}
          onClose={() => setShowDetalleModal(false)}
          title="Detalles de Cita"
          size="lg"
        >
          <div className="bg-white rounded-lg p-6">
            {(() => {
              const citaConDatos = getCitaConDatos(selectedCita);
              return (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Información General</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">ID:</span>
                        <span className="ml-2">{selectedCita.id.slice(-8)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span>
                        <span className="ml-2">
                          {new Date(selectedCita.fecha).toLocaleString('es-MX')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span>
                        <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(selectedCita.estado)}`}>
                          {getEstadoIcon(selectedCita.estado)}
                          {selectedCita.estado.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Total:</span>
                        <span className="ml-2 font-semibold">
                          {formatMoney(selectedCita.total_estimado)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Cliente</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Nombre:</span>
                        <span className="ml-2">{citaConDatos.clienteNombre}</span>
                      </div>
                      <div>
                        <span className="font-medium">Cédula:</span>
                        <span className="ml-2">{citaConDatos.clienteCedula}</span>
                      </div>
                      <div>
                        <span className="font-medium">Teléfono:</span>
                        <span className="ml-2">{citaConDatos.clienteTelefono}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Empleado</h3>
                    <div className="text-sm">
                      <span className="font-medium">Nombre:</span>
                      <span className="ml-2">{citaConDatos.empleadoNombre}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Servicios</h3>
                    <div className="text-sm">
                      <span className="font-medium">Servicios:</span>
                      <span className="ml-2">{citaConDatos.serviciosNombres}</span>
                    </div>
                    <div className="text-sm mt-1">
                      <span className="font-medium">Valor servicios:</span>
                      <span className="ml-2">{formatMoney(citaConDatos.serviciosPrecio)}</span>
                    </div>
                  </div>

                  {/* Servicios Adicionales */}
                  {selectedCita.servicios_adicionales && selectedCita.servicios_adicionales.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Servicios Adicionales</h3>
                      <div className="space-y-2">
                        {selectedCita.servicios_adicionales.map((servicio: any, index: number) => (
                          <div key={index} className="text-sm bg-gray-50 p-3 rounded">
                            <div className="font-medium">{servicio.servicios?.nombre || 'Servicio no encontrado'}</div>
                            <div className="flex justify-between mt-1">
                              <span>Cantidad: {servicio.cantidad}</span>
                              <span>Precio unitario: {formatMoney(servicio.precio_unitario || 0)}</span>
                              <span className="font-semibold">Subtotal: {formatMoney(servicio.subtotal || 0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Productos Adicionales */}
                  {selectedCita.productos_adicionales && selectedCita.productos_adicionales.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Productos Adicionales</h3>
                      <div className="space-y-2">
                        {selectedCita.productos_adicionales.map((producto: any, index: number) => (
                          <div key={index} className="text-sm bg-blue-50 p-3 rounded">
                            <div className="font-medium">{producto.productos?.nombre || 'Producto no encontrado'}</div>
                            <div className="flex justify-between mt-1">
                              <span>Cantidad: {producto.cantidad}</span>
                              <span>Precio unitario: {formatMoney(producto.precio_unitario || 0)}</span>
                              <span className="font-semibold">Subtotal: {formatMoney(producto.subtotal || 0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCita.notas && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Notas</h3>
                      <div className="text-sm bg-gray-50 p-3 rounded">
                        {selectedCita.notas}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetalleModal(false)}
                      className="flex-1"
                    >
                      Cerrar
                    </Button>
                    {/* Botón para reimprimir factura si la cita está completada */}
                    {(() => {
                      console.log('🔍 Evaluando botón reimprimir:', {
                        estado: selectedCita.estado,
                        cita_id: selectedCita.id,
                        mostrar: (selectedCita.estado === 'completada' || selectedCita.estado === 'finalizado')
                      });
                      
                      // Mostrar botón para citas completadas
                      return (selectedCita.estado === 'completada' || selectedCita.estado === 'finalizado');
                    })() && (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          console.log('🖨️ Iniciando reimprimir factura...');
                          console.log('📋 Cita ID:', selectedCita.id);
                          
                          // Siempre buscar venta por cita_id (relación correcta)
                          try {
                            const { data: ventaData, error: ventaError } = await (supabase as any)
                              .from('ventas')
                              .select('id, numero_factura')
                              .eq('cita_id', selectedCita.id)
                              .maybeSingle();
                            
                            console.log('Resultado búsqueda venta:', { ventaData, ventaError });
                            
                            if (ventaData) {
                              console.log('Venta encontrada:', ventaData);
                              console.log('Número de factura:', ventaData.numero_factura);
                              window.open(`/ventas/imprimir/${ventaData.id}`, '_blank');
                            } else {
                              console.error('No se encontró venta para la cita:', selectedCita.id);
                              mostrarToast('No se encontró factura asociada a esta cita', 'error');
                            }
                          } catch (error) {
                            console.error('Error buscando venta:', error);
                            mostrarToast('Error al buscar la factura', 'error');
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Reimprimir Factura
                      </Button>
                    )}
                    {getBotonAccion(selectedCita, true)}
                  </div>
                </div>
              );
            })()}
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}
