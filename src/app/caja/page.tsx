'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { History, Eye, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CajaPage() {
  const router = useRouter();
  const { user } = useJWTAuth();
  const supabase = createClient();
  const [cajaActual, setCajaActual] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [montoApertura, setMontoApertura] = useState('');
  const [showModalApertura, setShowModalApertura] = useState(false);
  const [showModalCierre, setShowModalCierre] = useState(false);
  const [montoCierre, setMontoCierre] = useState('');
  const [ventasAcumuladas, setVentasAcumuladas] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosingCaja, setIsClosingCaja] = useState(false);
  const [historialCierres, setHistorialCierres] = useState<any[]>([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<any>(null);
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [showVistaDetalle, setShowVistaDetalle] = useState(false);
  const [ventasTurno, setVentasTurno] = useState<any[]>([]);
  const [citasTurno, setCitasTurno] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Paginación para historial de cierres
  const [itemsPerPage] = useState(5);
  const [itemOffset, setItemOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calcular página actual basado en offset
  useEffect(() => {
    setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1);
  }, [itemOffset, itemsPerPage]);

  // Datos para mostrar en tabla
  const endOffset = itemOffset + itemsPerPage - 1;
  const currentCierres = historialCierres.slice(itemOffset, endOffset + 1);
  const pageCount = Math.ceil(historialCierres.length / itemsPerPage);

  // Formateador de dinero para Colombia
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Función para obtener nombres de usuarios por sus IDs
  const obtenerNombresUsuarios = async (userIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('id, nombre')
        .in('id', userIds);

      if (error) {
        console.error('Error obteniendo nombres:', error);
        return {};
      }

      // Crear mapa de ID -> nombre
      const nombresMap: { [key: string]: string } = {};
      (data as any[])?.forEach(usuario => {
        nombresMap[usuario.id] = usuario.nombre || 'Sin nombre';
      });

      return nombresMap;
    } catch (error) {
      console.error('Error en obtenerNombresUsuarios:', error);
      return {};
    }
  };

  // Función para obtener ventas del turno
  const obtenerVentasTurno = async (cajaId: string) => {
    try {
      console.log('🔍 Obteniendo ventas para caja_id:', cajaId);
      
      // Primero obtener ventas básicas
      const { data: ventasData, error: ventasError } = await supabase
        .from('ventas')
        .select(`
          id,
          total,
          metodo_pago,
          created_at,
          cliente:clientes!cliente_id(nombre)
        `)
        .eq('caja_id', cajaId)
        .order('created_at', { ascending: false });

      console.log('📦 Resultado ventas básicas:', { ventasData, ventasError });

      if (ventasError) {
        console.error('❌ Error obteniendo ventas básicas:', ventasError);
        return [];
      }

      if (!ventasData || ventasData.length === 0) {
        console.log('✅ No hay ventas para este turno');
        return [];
      }

      // Ahora obtener detalles usando detalles_ventas
      const ventaIds = (ventasData as any[]).map(venta => venta.id);
      console.log('🔍 Buscando detalles para ventas:', ventaIds);

      const { data: detallesData, error: detallesError } = await supabase
        .from('detalles_ventas')
        .select(`
          id,
          venta_id,
          cantidad,
          precio_unitario,
          producto:productos!producto_id(nombre)
        `)
        .in('venta_id', ventaIds);

      console.log('📦 Resultado detalles:', { detallesData, detallesError });

      if (detallesError) {
        console.error('❌ Error obteniendo detalles:', detallesError);
        // Devolver ventas sin detalles
        return ventasData;
      }

      // Crear mapa de detalles por venta_id
      const detallesMap: { [key: string]: any[] } = {};
      (detallesData as any[])?.forEach(detalle => {
        if (!detallesMap[detalle.venta_id]) {
          detallesMap[detalle.venta_id] = [];
        }
        detallesMap[detalle.venta_id].push(detalle);
      });

      // Enriquecer ventas con sus detalles
      const ventasConDetalles = (ventasData as any[]).map(venta => ({
        ...venta,
        items: detallesMap[venta.id] || []
      }));

      console.log('✅ Ventas con detalles:', ventasConDetalles.length);
      return ventasConDetalles;
    } catch (error) {
      console.error('❌ Error en obtenerVentasTurno:', error);
      return [];
    }
  };

  // Función para obtener citas del turno
  const obtenerCitasTurno = async (cajaId: string) => {
    try {
      console.log('🔍 Obteniendo citas para caja_id:', cajaId);
      
      // Primero, vamos a explorar qué columnas tiene la tabla citas sin filtro
      const { data: columnasData, error: columnasError } = await supabase
        .from('citas')
        .select('*')
        .limit(1);

      console.log('🔍 Exploración de columnas citas:', { columnasData, columnasError });

      if (columnasError) {
        console.error('❌ Error explorando citas:', columnasError);
        return [];
      }

      if (columnasData && columnasData.length > 0) {
        console.log('📋 Columnas encontradas en citas:', Object.keys(columnasData[0]));
        console.log('📋 Estructura de una cita:', columnasData[0]);
      }

      // Como citas.caja_id no existe, vamos a intentar obtener citas por fecha
      // Primero necesitamos obtener la fecha de la caja para filtrar citas del mismo día
      const { data: cajaData, error: cajaError } = await supabase
        .from('cajas')
        .select('fecha_apertura, fecha_cierre')
        .eq('id', cajaId)
        .single();

      console.log('📦 Fechas de la caja:', { cajaData, cajaError });

      if (cajaError || !cajaData) {
        console.error('❌ Error obteniendo fechas de caja:', cajaError);
        return [];
      }

      // Obtener citas en el rango de fechas de la caja
      const fechaInicio = new Date((cajaData as any).fecha_apertura).toISOString();
      const fechaFin = new Date((cajaData as any).fecha_cierre).toISOString();

      console.log('📅 Buscando citas entre:', fechaInicio, 'y', fechaFin);

      // Usar el nombre correcto de la columna: servicios_ids (plural)
      const { data, error } = await supabase
        .from('citas')
        .select('id, fecha, cliente_id, servicios_ids')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false });

      console.log('📦 Resultado citas por rango de fechas:', { data, error });

      if (error) {
        console.error('❌ Error obteniendo citas por fechas:', error);
        return [];
      }

      // Si hay datos, obtener nombres adicionales
      if (data && data.length > 0) {
        console.log('🔗 Enriqueciendo citas con nombres...');
        
        // Como servicios_ids es probablemente un array, necesitamos manejarlo diferente
        const clienteIds = Array.from(new Set((data as any[]).map(cita => cita.cliente_id).filter(Boolean)));
        
        // Extraer todos los IDs de servicios de los arrays servicios_ids
        const todosServiciosIds: string[] = [];
        (data as any[]).forEach(cita => {
          if (cita.servicios_ids && Array.isArray(cita.servicios_ids)) {
            todosServiciosIds.push(...cita.servicios_ids);
          }
        });
        
        const servicioIds = Array.from(new Set(todosServiciosIds.filter(Boolean)));

        console.log('👥 Clientes a buscar:', clienteIds);
        console.log('🔧 Servicios a buscar:', servicioIds);

        // Obtener nombres por separado
        const [clientesData, serviciosData] = await Promise.all([
          clienteIds.length > 0 ? supabase
            .from('clientes')
            .select('id, nombre')
            .in('id', clienteIds) : Promise.resolve({ data: [] }),
          servicioIds.length > 0 ? supabase
            .from('servicios')
            .select('id, nombre, precio') // Incluir precio del servicio
            .in('id', servicioIds) : Promise.resolve({ data: [] })
        ]);

        console.log('👤 Clientes encontrados:', clientesData.data);
        console.log('🔨 Servicios encontrados:', serviciosData.data);

        // Crear mapas de lookup
        const clientesMap: { [key: string]: string } = {};
        const serviciosMap: { [key: string]: any } = {}; // Guardar objeto completo con precio
        
        (clientesData.data as any[])?.forEach(cliente => {
          clientesMap[cliente.id] = cliente.nombre || 'Sin nombre';
        });
        
        (serviciosData.data as any[])?.forEach(servicio => {
          serviciosMap[servicio.id] = {
            nombre: servicio.nombre || 'Servicio sin nombre',
            precio: servicio.precio || 0
          };
        });

        // Enriquecer citas con nombres y precios de múltiples servicios
        const citasEnriquecidas = (data as any[]).map(cita => {
          // Obtener todos los servicios de esta cita
          const serviciosDeCita = (cita.servicios_ids || [])
            .map((servicioId: string) => serviciosMap[servicioId])
            .filter(Boolean);

          // Calcular total sumando precios de todos los servicios
          const valorTotal = serviciosDeCita.reduce((sum: number, servicio: any) => 
            sum + (servicio.precio || 0), 0);

          // Crear nombres de servicios separados por comas
          const nombresServicios = serviciosDeCita
            .map((servicio: any) => servicio.nombre)
            .filter(Boolean)
            .join(', ');

          return {
            ...cita,
            valor_total: valorTotal,
            cliente_nombre: clientesMap[cita.cliente_id] || 'Cliente sin nombre',
            servicio_nombre: nombresServicios || 'Servicios sin nombre',
            servicios_detalle: serviciosDeCita // Guardar detalle completo
          };
        });

        console.log('✅ Citas enriquecidas:', citasEnriquecidas);
        return citasEnriquecidas;
      }

      console.log('✅ Citas obtenidas (vacío):', data?.length || 0);
      return [];
    } catch (error) {
      console.error('❌ Error en obtenerCitasTurno:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user?.empresa_id) {
      buscarCajaActual();
      cargarHistorialCierres();
    }
  }, [user?.empresa_id]);

  // Función para mostrar toasts
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Función para redirigir
  const redirectToPOS = () => {
    setTimeout(() => {
      router.push('/ventas/nueva');
    }, 1500);
  };

  const buscarCajaActual = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Consultando estado real en BD...');
      
      // Buscar caja abierta del usuario actual SIN .single() para evitar error 406
      const { data: cajaData, error: cajaError } = await supabase
        .from('cajas')
        .select('*')
        .eq('vendedor_id', user?.id as any)
        .eq('estado', 'abierta')
        .eq('empresa_id', user?.empresa_id as any)
        .maybeSingle(); // Usar maybeSingle() en lugar de single()

      // Evitar el Error 406: Si la respuesta viene vacía o con error, simplemente poner null
      if (cajaError || !cajaData) {
        console.log('ℹ️ No hay cajas abiertas (es normal)');
        setCajaActual(null);
        setVentasAcumuladas(0);
        return;
      }

      console.log('📦 Datos de caja obtenidos de BD:', cajaData);

      // IMPORTANTE: Siempre actualizar el estado, incluso si cajaData es null
      setCajaActual(cajaData);
      
      if (cajaData) {
        console.log('✅ Caja abierta encontrada, actualizando estado');
        
        // Calcular ventas acumuladas
        const { data: ventasData } = await supabase
          .from('ventas')
          .select('total')
          .eq('caja_id', (cajaData as any).id)
          .eq('empresa_id', user?.empresa_id as any);
        
        console.log('💰 ventasData:', ventasData);
        
        const totalVentas = ventasData?.reduce((sum: number, venta: any) => sum + venta.total, 0) || 0;
        setVentasAcumuladas(totalVentas);
        
        console.log('✅ Estado actualizado correctamente:', {
          id: (cajaData as any).id,
          monto_apertura: (cajaData as any).monto_apertura,
          ventasAcumuladas: totalVentas
        });
      }
    } catch (error) {
      console.error('Error buscando caja actual:', error);
      setCajaActual(null); // En caso de error, asegurar null
      setVentasAcumuladas(0);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorialCierres = async () => {
    try {
      console.log('📋 Cargando historial de cierres...');
      
      // Consulta simple sin relaciones (fallback)
      const { data, error } = await supabase
        .from('cajas')
        .select('*')
        .eq('empresa_id', user?.empresa_id as any)
        .eq('estado', 'cerrada')
        .not('fecha_cierre', 'is', null)
        .order('fecha_cierre', { ascending: false });

      if (error) {
        console.error('Error cargando historial:', error);
        return;
      }

      console.log('📋 Historial cargado:', data);

      // Obtener todos los IDs de usuarios para consultar nombres
      const userIds = new Set<string>();
      (data as any[])?.forEach(caja => {
        if (caja.vendedor_id) userIds.add(caja.vendedor_id);
        if (caja.creado_por) userIds.add(caja.creado_por);
      });

      // Obtener nombres de usuarios
      const nombresMap = await obtenerNombresUsuarios(Array.from(userIds));

      // Enriquecer datos con nombres
      const historialEnriquecido = (data as any[])?.map(caja => ({
        ...caja,
        vendedor_nombre: nombresMap[caja.vendedor_id] || 'Desconocido',
        auditor_nombre: nombresMap[caja.creado_por] || 'Desconocido'
      })) || [];

      console.log('📋 Historial enriquecido:', historialEnriquecido);
      setHistorialCierres(historialEnriquecido);
    } catch (error) {
      console.error('Error en cargarHistorialCierres:', error);
      setHistorialCierres([]);
    }
  };

  const abrirCaja = async () => {
    if (!montoApertura || parseFloat(montoApertura) < 0) {
      showToast('error', 'Por favor ingrese un monto de apertura válido');
      return;
    }

    setIsLoading(true);
    try {
      // Objeto completo para depuración
      const cajaData = {
        vendedor_id: user?.id,
        empresa_id: user?.empresa_id,
        monto_apertura: parseFloat(montoApertura), // ← Usar monto_apertura consistentemente
        estado: 'abierta',
        fecha_apertura: new Date().toISOString()
      };
      
      console.log('📦 Objeto a insertar en cajas:', cajaData);
      console.log('💰 Valor original montoApertura:', montoApertura);
      console.log('💰 Valor parseado parseFloat(montoApertura):', parseFloat(montoApertura));
      console.log('👤 Usuario:', user);

      // @ts-ignore - Ignorar errores de TypeScript para inserción
      const { error } = await supabase
        .from('cajas')
        .insert(cajaData as any);

      if (error) {
       
        throw error;
      }

      // Éxito - mostrar toast y redirigir
      showToast('success', '¡Jornada iniciada! Ya puede realizar ventas.');
      setMontoApertura('');
      buscarCajaActual();
      redirectToPOS();
    } catch (error) {
      console.error('Error abriendo caja:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showToast('error', `Error al abrir caja: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cerrarCaja = async () => {
    if (!montoCierre || parseFloat(montoCierre) < 0) {
      showToast('error', 'Por favor ingrese el monto de cierre físico');
      return;
    }

    setIsClosingCaja(true);
    try {
      // Validación de ID Crítica
      if (!cajaActual?.id) {
        showToast('error', 'No se encontró el ID de la caja activa');
        throw new Error('No se encontró el ID de la caja activa');
      }

      // Calcular valores
      const montoEsperado = (cajaActual?.monto_apertura || 0) + (ventasAcumuladas || 0);
      
      console.log('🔍 Cerrando caja con ID:', cajaActual.id);
      console.log('💰 Monto físico:', parseFloat(montoCierre));
      console.log('💰 Monto esperado:', montoEsperado);
      console.log('📊 Ventas acumuladas:', ventasAcumuladas);
      console.log('🏦 Monto apertura desde BD:', cajaActual?.monto_apertura);
      
      // Depuración: Asegurar que el UUID no tenga espacios o caracteres extraños
      console.log('Fila encontrada para actualizar:', cajaActual.id);
      
      // VERIFICACIÓN DIRECTA: Buscar la fila antes de actualizar
      console.log('🔍 Verificando si la fila existe en BD...');
      const { data: filaExistente, error: errorBusqueda } = await (supabase as any)
        .from('cajas')
        .select('*')
        .eq('id', cajaActual.id)
        .single();
      
      if (errorBusqueda) {
        console.error('❌ Error buscando fila:', errorBusqueda);
        console.error('❌ Código:', errorBusqueda.code);
        console.error('❌ Mensaje:', errorBusqueda.message);
        throw new Error(`No se puede encontrar la fila: ${errorBusqueda.message}`);
      }
      
      if (!filaExistente) {
        console.error('❌ CRÍTICO: La fila no existe en la tabla');
        console.error('❌ ID buscado:', cajaActual.id);
        throw new Error('La caja no existe en la base de datos');
      }
      
      console.log('✅ Fila encontrada:', filaExistente);
      console.log('🔄 Procediendo con el update...');
      
      // Verificación previa: mostrar el estado actual
      console.log('📊 Estado ANTES del update:', {
        id: cajaActual.id,
        estado: filaExistente.estado,
        monto_cierre: filaExistente.monto_cierre,
        fecha_cierre: filaExistente.fecha_cierre,
        monto_esperado: filaExistente.monto_esperado
      });
      
      // Intento 1: Update estándar optimizado para RLS
      console.log('🔧 Ejecutando update con estos valores:');
      console.log('  - estado: cerrada');
      console.log('  - monto_cierre:', Number(montoCierre));
      console.log('  - fecha_cierre:', new Date().toISOString());
      console.log('  - monto_esperado:', Number(montoEsperado));
      console.log('  - WHERE id:', cajaActual.id);
      console.log('  - WHERE empresa_id:', user?.empresa_id);
      console.log('  - WHERE vendedor_id:', user?.id);
      
      // Limpieza de Nulos: Asegurar que cajaActual.id no sea null
      if (!cajaActual?.id) {
        console.error('❌ cajaActual.id es null');
        throw new Error('ID de caja no disponible');
      }
      
      // Debug: Mostrar datos del usuario para RLS
      console.log('👤 Datos del usuario para RLS:', {
        id: user?.id,
        empresa_id: user?.empresa_id,
        rol: user?.rol
      });
      
      // Usar RPC administrativo con SERVICE ROLE para bypass completo de RLS
      console.log('🚀 Usando RPC administrativo para bypass RLS...');
      
      const { error } = await (supabase as any).rpc('admin_cerrar_caja', {
        p_caja_id: cajaActual.id,
        p_fecha_cierre: new Date().toISOString(),
        p_monto_cierre: Number(montoCierre),
        p_monto_esperado: Number(montoEsperado),
        p_cerrado_por: user?.id  // Trazabilidad: ID del admin que cierra
      });
      
      console.log('📦 Resultado del RPC administrativo:', { error });
      
      // Lógica de Éxito: Si !error, considera que la caja se cerró
      if (!error) {
        console.log('✅ Éxito real - RPC administrativo funcionó');
        
        // Llama a buscarCajaActual() para refrescar la vista
        console.log('🔄 Refrescando estado de caja...');
        await buscarCajaActual();
        
        // Limpiar estados y mostrar historial
        console.log('🧹 Limpiando estados y activando vista de historial...');
        setMontoCierre('');
        setShowModalCierre(false);
        
        // Recargar historial para mostrar el cierre recién agregado
        await cargarHistorialCierres();
        
        console.log('✅ Caja cerrada exitosamente en la base de datos');
      } else {
        console.error('❌ Error en RPC administrativo:', error);
        console.error('❌ Código de error:', error.code);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Detalles:', error.details);
        throw new Error(`RPC falló: ${error.message}`);
      }

      console.log('✅ Caja cerrada exitosamente en la base de datos');
      console.log(' Limpiando estado local...');
      
      // Actualizar estado local solo después de confirmar éxito en BD
      showToast('success', '¡Caja cerrada exitosamente!');
      setShowModalCierre(false);
      setMontoCierre('');
      setCajaActual(null);
      setVentasAcumuladas(0);
      
      console.log('✅ Estado local limpiado');
    } catch (error) {
      console.error('Error cerrando caja:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showToast('error', `Error al cerrar caja: ${errorMessage}`);
    } finally {
      setIsClosingCaja(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estado de caja...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Caja</h1>
          <p className="text-gray-600">Control de apertura y cierre de caja diaria</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Estado de Caja</h2>
              <p className="text-gray-600">Gestión de apertura y cierre</p>
            </div>
          </div>

                {cajaActual ? (
                    // Vista de caja abierta
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-green-800">Caja Abierta</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <span className="text-gray-600 block mb-1">Fecha Apertura</span>
                                    <p className="font-semibold text-gray-900">{new Date(cajaActual.fecha_apertura).toLocaleString('es-CO')}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <span className="text-gray-600 block mb-1">Monto Inicial</span>
                                    <p className="font-semibold text-gray-900">{formatMoney(cajaActual?.monto_apertura || 0)}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <span className="text-gray-600 block mb-1">Ventas Acumuladas</span>
                                    <p className="font-semibold text-green-600 text-lg">{formatMoney(ventasAcumuladas)}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <span className="text-gray-600 block mb-1">Monto Esperado</span>
                                    <p className="font-semibold text-blue-600 text-lg">{formatMoney((cajaActual?.monto_apertura || 0) + ventasAcumuladas)}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowModalCierre(true)}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-semibold">Cerrar Caja</span>
                        </button>
                    </div>
                ) : (
                    // Vista de caja cerrada
                    <div className="text-center py-12">
                        <div className="mb-8">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Caja Cerrada</h3>
                            <p className="text-gray-600 mb-6">No hay una caja activa en este momento</p>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 max-w-md">
                                <div className="flex items-center space-x-3 mb-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 .895 3 2-1.343 2-3m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-lg font-semibold text-blue-800">Iniciar Nueva Jornada</h4>
                                        <p className="text-blue-600">Abra una nueva caja para comenzar a vender</p>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        // Limpiar estados al iniciar nueva caja
                                        setCajaActual(null);
                                        setVentasAcumuladas(0);
                                        setMontoApertura('');
                                        // Abrir modal para ingresar monto de apertura
                                        setShowModalApertura(true);
                                    }}
                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-semibold">Iniciar Nueva Caja</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Sección de Historial de Cierres */}
        {historialCierres.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mt-8">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                        <History className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Historial de Cierres</h2>
                        <p className="text-gray-600">Registro de todas las cajas cerradas</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Cierre</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Cierre</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Esperado</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentCierres.map((caja) => {
                                const balance = (caja.monto_cierre || 0) - (caja.monto_esperado || 0);
                                return (
                                    <tr key={caja.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(caja.fecha_cierre).toLocaleString('es-CO')}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {caja.vendedor_nombre || 'N/A'}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatMoney(caja.monto_cierre || 0)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {formatMoney(caja.monto_esperado || 0)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                balance < 0 
                                                    ? 'bg-red-100 text-red-800' 
                                                    : balance > 0 
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {balance < 0 
                                                    ? `Faltante: ${formatMoney(Math.abs(balance))}`
                                                    : balance > 0 
                                                        ? `Sobrante: ${formatMoney(balance)}`
                                                        : 'Cuadrado'
                                                }
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            <button
                                                onClick={async () => {
                                                    console.log('🔍 Click en detalles para caja:', caja.id);
                                                    setCajaSeleccionada(caja);
                                                    setShowVistaDetalle(true);
                                                    
                                                    try {
                                                        console.log('🚀 Cargando datos del turno...');
                                                        // Cargar ventas del turno
                                                        const [ventas, citas] = await Promise.all([
                                                            obtenerVentasTurno(caja.id),
                                                            obtenerCitasTurno(caja.id)
                                                        ]);
                                                        
                                                        console.log('📊 Datos cargados:', { ventas: ventas.length, citas: citas.length });
                                                        setVentasTurno(ventas);
                                                        setCitasTurno(citas);
                                                    } catch (error) {
                                                        console.error('❌ Error cargando datos del turno:', error);
                                                    }
                                                }}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Ver detalles completos"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {pageCount > 1 && (
                    <div className="flex items-center justify-end px-4 py-2 bg-gray-50 border-t border-gray-200 mt-0">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setItemOffset(Math.max(0, itemOffset - itemsPerPage))}
                                disabled={itemOffset === 0}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-gray-600">
                                Página {currentPage} de {pageCount}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setItemOffset(Math.min(itemOffset + itemsPerPage, historialCierres.length - itemsPerPage))}
                                disabled={itemOffset + itemsPerPage >= historialCierres.length}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Vista de Detalle de Turno Completa */}
        {showVistaDetalle && cajaSeleccionada && (
            <div className="min-h-screen bg-gray-50">
                {/* Encabezado */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Detalle de Turno</h1>
                                <p className="text-sm text-gray-600">
                                    Turno #{cajaSeleccionada.id?.slice(-8) || 'N/A'} | 
                                    {new Date(cajaSeleccionada.fecha_cierre).toLocaleDateString('es-CO')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowVistaDetalle(false);
                                    setCajaSeleccionada(null);
                                    setVentasTurno([]);
                                    setCitasTurno([]);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Volver al Historial
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Encabezado del Turno */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Turno</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Vendedor:</p>
                                <p className="font-medium">{cajaSeleccionada.vendedor_nombre || 'Desconocido'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Auditor:</p>
                                <p className="font-medium">{cajaSeleccionada.auditor_nombre || 'Desconocido'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Fecha Apertura:</p>
                                <p className="font-medium">{new Date(cajaSeleccionada.fecha_apertura).toLocaleString('es-CO')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Fecha Cierre:</p>
                                <p className="font-medium">{new Date(cajaSeleccionada.fecha_cierre).toLocaleString('es-CO')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección de Ventas */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ventas del Turno</h2>
                        {ventasTurno.length > 0 ? (
                            <div className="space-y-6">
                                {ventasTurno.map((venta) => (
                                    <div key={`venta-${venta.id}`} className="border border-gray-200 rounded-lg p-4">
                                        {/* Encabezado de la venta */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    Cliente: {venta.cliente?.nombre || 'Cliente sin nombre'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Pago: {venta.metodo_pago || 'No especificado'} | 
                                                    {new Date(venta.created_at).toLocaleString('es-CO')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-green-600">
                                                    {formatMoney(venta.total || 0)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Lista de Productos */}
                                        {venta.items && venta.items.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-medium text-gray-700 mb-2">Productos:</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio Unitario</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {(venta.items as any[]).map((item: any, index: number) => (
                                                                <tr key={`item-${index}`}>
                                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                                        {item.producto?.nombre || 'Producto sin nombre'}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                                                        {item.cantidad || 0}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                                                        {formatMoney(item.precio_unitario || 0)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                                                        {formatMoney((item.cantidad || 0) * (item.precio_unitario || 0))}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No se encontraron ventas en este turno</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Revisa la consola para ver los detalles de la consulta
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sección de Citas */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Citas del Turno</h2>
                        {citasTurno.length > 0 ? (
                            <div className="space-y-4">
                                {citasTurno.map((cita) => (
                                    <div key={`cita-${cita.id}`} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    Cliente: {cita.cliente_nombre || 'Cliente sin nombre'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Servicio: {cita.servicio_nombre || 'Servicio sin nombre'}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(cita.fecha).toLocaleString('es-CO')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-blue-600">
                                                    {formatMoney(cita.valor_total || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No se encontraron citas en este turno</p>
                            </div>
                        )}
                    </div>

                    {/* Cómputo de Totales por Método de Pago */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen por Método de Pago</h2>
                        <div className="space-y-3">
                            {/* Agrupar ventas por método de pago */}
                            {(() => {
                                const metodosPago: { [key: string]: number } = {};
                                ventasTurno.forEach(venta => {
                                    const metodo = venta.metodo_pago || 'No especificado';
                                    metodosPago[metodo] = (metodosPago[metodo] || 0) + (venta.total || 0);
                                });

                                return Object.entries(metodosPago).map(([metodo, total]) => (
                                    <div key={metodo} className="flex justify-between items-center py-2 border-b">
                                        <span className="font-medium text-gray-700">
                                            Total {metodo}:
                                        </span>
                                        <span className="font-bold text-lg text-gray-900">
                                            {formatMoney(total)}
                                        </span>
                                    </div>
                                ));
                            })()}
                            
                            {/* Total de Citas */}
                            {citasTurno.length > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="font-medium text-gray-700">
                                        Total Citas:
                                    </span>
                                    <span className="font-bold text-lg text-blue-600">
                                        {formatMoney(citasTurno.reduce((sum, cita) => sum + (cita.valor_total || 0), 0))}
                                    </span>
                                </div>
                            )}
                            
                            {/* Base de Apertura */}
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="font-medium text-gray-700">
                                    Base de Apertura:
                                </span>
                                <span className="font-bold text-lg text-purple-600">
                                    {formatMoney(cajaSeleccionada.monto_apertura || 0)}
                                </span>
                            </div>
                            
                            {/* Gran Total del Turno (incluyendo apertura) */}
                            <div className="flex justify-between items-center pt-4 border-t-2">
                                <span className="font-semibold text-gray-900 text-lg">
                                    Gran Total del Turno:
                                </span>
                                <span className="font-bold text-xl text-green-600">
                                    {formatMoney(
                                        (cajaSeleccionada.monto_apertura || 0) +
                                        ventasTurno.reduce((sum, venta) => sum + (venta.total || 0), 0) +
                                        citasTurno.reduce((sum, cita) => sum + (cita.valor_total || 0), 0)
                                    )}
                                </span>
                            </div>
                            
                            {/* Total Actividades (sin apertura) */}
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-gray-600">
                                    Total Actividades (Ventas + Citas):
                                </span>
                                <span className="font-medium text-gray-700">
                                    {formatMoney(
                                        ventasTurno.reduce((sum, venta) => sum + (venta.total || 0), 0) +
                                        citasTurno.reduce((sum, cita) => sum + (cita.valor_total || 0), 0)
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Modal de Apertura de Caja */}
        {showModalApertura && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100 animate-slideUp">
                    {/* Header con icono animado */}
                    <div className="text-center mb-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Nueva Caja</h3>
                        <p className="text-gray-600">Comience su jornada con el monto inicial</p>
                    </div>
                    
                    {/* Tarjeta de monto con diseño mejorado */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 .895 3 2-1.343 2-3m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Monto de Apertura
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-lg font-semibold">$</span>
                            </div>
                            <input
                                type="number"
                                value={montoApertura}
                                onChange={(e) => setMontoApertura(e.target.value)}
                                className="w-full pl-10 pr-4 py-4 text-2xl font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                <svg className="w-4 h-4 inline mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Dinero físico en caja
                            </p>
                            {montoApertura && parseFloat(montoApertura) > 0 && (
                                <div className="flex items-center text-green-600 text-sm font-medium animate-fadeIn">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Válido
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Montos sugeridos */}
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">Montos rápidos:</p>
                        <div className="grid grid-cols-4 gap-2">
                            {[10000, 20000, 50000, 100000].map((monto) => (
                                <button
                                    key={monto}
                                    onClick={() => setMontoApertura(monto.toString())}
                                    className="py-2 px-3 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                                >
                                    {formatMoney(monto)}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Botones con diseño mejorado */}
                    <div className="flex space-x-3">
                        <button
                            onClick={() => {
                                setShowModalApertura(false);
                                setMontoApertura('');
                            }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                        >
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                        </button>
                        <button
                            onClick={abrirCaja}
                            disabled={isLoading || !montoApertura || parseFloat(montoApertura) < 0}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Iniciando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                    <span>Iniciar Caja</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Footer informativo */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Importante:</p>
                                <p>Este monto representa el dinero físico que dejará en la caja al comenzar su jornada. Asegúrese de contar el efectivo antes de confirmar.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Modal de Cierre de Caja */}
        {showModalCierre && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold mb-4">Cerrar Caja</h3>
                    
                    <div className="space-y-4 mb-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <span className="text-gray-600 block mb-1">Monto Inicial</span>
                            <p className="font-medium">{formatMoney(cajaActual?.monto_apertura || 0)}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm text-gray-600">Ventas del Día</p>
                            <p className="font-medium text-green-600">{formatMoney(ventasAcumuladas)}</p>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm text-gray-600">Monto Esperado</p>
                            <p className="font-medium text-blue-600">{formatMoney((cajaActual?.monto_apertura || 0) + ventasAcumuladas)}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monto Físico en Caja
                            </label>
                            <input
                                type="number"
                                value={montoCierre}
                                onChange={(e) => setMontoCierre(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                        
                        {montoCierre && (
                            <div className={`p-3 rounded ${parseFloat(montoCierre) === ((cajaActual?.monto_apertura || 0) + ventasAcumuladas) ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                <p className="text-sm font-medium">
                                    {parseFloat(montoCierre) === ((cajaActual?.monto_apertura || 0) + ventasAcumuladas) 
                                        ? '✅ Cuadra perfectamente' 
                                        : `⚠️ Diferencia: $${Math.abs(parseFloat(montoCierre) - ((cajaActual?.monto_apertura || 0) + ventasAcumuladas)).toLocaleString('es-CO')}`
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex space-x-3">
                        <button
                            onClick={() => {
                                setShowModalCierre(false);
                                setMontoCierre('');
                            }}
                            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={cerrarCaja}
                            disabled={isClosingCaja}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                            {isClosingCaja ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Cerrando...</span>
                                </>
                            ) : (
                                <span>Cerrar Caja</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Toast Notifications */}
        {toast && (
            <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
                toast.type === 'success' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
            }`}>
                <div className="flex items-center space-x-2">
                    {toast.type === 'success' ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                    <span className="font-medium">{toast.message}</span>
                </div>
            </div>
        )}
    </MainLayout>
  );
}
