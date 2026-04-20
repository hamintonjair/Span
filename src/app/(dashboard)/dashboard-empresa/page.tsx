'use client';

import { SimpleLayout } from '@/components/layout/simple-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-client';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  UserPlus,
  CreditCard,
  Plus,
  ShoppingCart,
  Wallet,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Componente de banner para mensajes globales
function MensajeGlobalBanner() {
  const [mensajeGlobal, setMensajeGlobal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    console.log('Cargando mensaje global...'); // Debug
    cargarMensajeGlobal();
  }, []);

  const cargarMensajeGlobal = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('mensaje_global')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando mensaje global:', error);
        return;
      }

      console.log('Mensaje global cargado:', data?.mensaje_global); // Debug
      setMensajeGlobal(data?.mensaje_global || null);
    } catch (error) {
      console.error('Error en cargarMensajeGlobal:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoizar el banner para evitar duplicación
  const bannerContent = useMemo(() => {
    if (!mounted || loading || !mensajeGlobal) {
      console.log('No renderizar banner:', { mounted, loading, mensajeGlobal }); // Debug
      return null;
    }


    return (
      <div className="mb-6 w-full">
        <div className="bg-amber-900 border border-amber-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Comunicado Importante</h3>
              <p className="text-amber-100 whitespace-pre-wrap">{mensajeGlobal}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }, [mounted, loading, mensajeGlobal]);

  return bannerContent;
}

export default function DashboardEmpresaPage() {
  const { user, loading } = useJWTAuth();
  const router = useRouter();
  const supabase = createClient();
  
  // Función para obtener color de estado
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
  
  // Estado para datos de gráficas
  const [ingresosSemanaData, setIngresosSemanaData] = useState<any[]>([]);
  const [ingresosCitasData, setIngresosCitasData] = useState<any[]>([]);
  const [estadoCitasData, setEstadoCitasData] = useState<any[]>([]);
  const [alertasInventario, setAlertasInventario] = useState<any[]>([]);
  const [ingresosHoy, setIngresosHoy] = useState<number>(0);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [filtroVentas, setFiltroVentas] = useState<'semana' | 'hoy' | 'mes' | 'anio'>('hoy');

  // Función para obtener ingresos de hoy
  const loadIngresosHoy = async () => {
    if (!user?.empresa_id) return;
    
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Obtener ingresos de cajas cerradas hoy
      const { data: cajasCerradas, error: cajasError } = await supabase
        .from('cajas')
        .select('monto_cierre')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'cerrada')
        .gte('fecha_cierre', startOfDay.toISOString())
        .lte('fecha_cierre', endOfDay.toISOString());

      if (cajasError) {
        console.error('Error cargando cajas cerradas de hoy:', cajasError);
        return;
      }

      // Obtener ingresos de ventas completadas hoy
      const { data: ventasHoy, error: ventasError } = await supabase
        .from('ventas')
        .select('total')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'completada')
        .gte('fecha', startOfDay.toISOString())
        .lte('fecha', endOfDay.toISOString());

      if (ventasError) {
        console.error('Error cargando ventas de hoy:', ventasError);
        return;
      }

      // Calcular total de ingresos
      const totalCajas = cajasCerradas?.reduce((sum, caja) => sum + (caja.monto_cierre || 0), 0) || 0;
      const totalVentas = ventasHoy?.reduce((sum, venta) => sum + (venta.total || 0), 0) || 0;
      const ingresosTotales = totalCajas + totalVentas;

      setIngresosHoy(ingresosTotales);
      console.log('Ingresos de hoy calculados:', ingresosTotales);
    } catch (error) {
      console.error('Error en loadIngresosHoy:', error);
    }
  };

  // Función para obtener cajas cerradas según filtro
  const loadVentasPOSPorFiltro = async (filtro: 'semana' | 'hoy' | 'mes' | 'anio') => {
    if (!user?.empresa_id) return;
    
    try {
      let startDate: Date;
      let endDate: Date;
      let etiquetas: string[];

      switch (filtro) {
        case 'hoy':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          etiquetas = ['Hoy'];
          break;
        
        case 'mes':
          startDate = new Date();
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          endDate.setDate(0);
          endDate.setHours(23, 59, 59, 999);
          // Etiquetas para días del mes (1-31)
          etiquetas = Array.from({length: endDate.getDate()}, (_, i) => `${i + 1}`);
          break;
        
        case 'anio':
          startDate = new Date();
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setMonth(11, 31);
          endDate.setHours(23, 59, 59, 999);
          // Etiquetas para meses del año
          etiquetas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          break;
        
        default: // semana
          startDate = new Date();
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          etiquetas = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
          break;
      }

      // Obtener cajas cerradas (solo monto_cierre)
      const { data: cajasCerradas, error: cajasError } = await supabase
        .from('cajas')
        .select('monto_cierre, fecha_cierre, fecha_apertura')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'cerrada')
        .gte('fecha_cierre', startDate.toISOString())
        .lte('fecha_cierre', endDate.toISOString());

      console.log(`Cajas cerradas filtradas por ${filtro}:`, cajasCerradas);
      console.log('Error en cajas cerradas:', cajasError);

      if (cajasError) {
        console.error(`Error cargando cajas cerradas ${filtro}:`, cajasError);
        return;
      }

      // Agrupar datos según el filtro
      let datosAgrupados: {dia: string, monto: number}[] = [];

      if (filtro === 'hoy') {
        // Para hoy, mostrar un solo dato
        const totalHoy = cajasCerradas?.reduce((sum, caja) => sum + (caja.monto_cierre || 0), 0) || 0;
        datosAgrupados = [{ dia: 'Hoy', monto: totalHoy }];
      } else if (filtro === 'semana') {
        // Agrupar por día de la semana
        datosAgrupados = etiquetas.map(dia => ({ dia, monto: 0 }));
        cajasCerradas?.forEach(caja => {
          const diaCierre = new Date(caja.fecha_cierre).getDay();
          const diaIndex = diaCierre === 0 ? 6 : diaCierre - 1; // Ajustar para que lunes sea 0
          if (diaIndex >= 0 && diaIndex < 7) {
            datosAgrupados[diaIndex].monto += caja.monto_cierre || 0;
          }
        });
      } else if (filtro === 'mes') {
        // Agrupar por día del mes
        datosAgrupados = etiquetas.map(dia => ({ dia, monto: 0 }));
        cajasCerradas?.forEach(caja => {
          const diaCierre = new Date(caja.fecha_cierre).getDate() - 1; // 0-indexed
          if (diaCierre >= 0 && diaCierre < datosAgrupados.length) {
            datosAgrupados[diaCierre].monto += caja.monto_cierre || 0;
          }
        });
      } else if (filtro === 'anio') {
        // Agrupar por mes del año
        datosAgrupados = etiquetas.map(mes => ({ dia: mes, monto: 0 }));
        cajasCerradas?.forEach(caja => {
          const mesCierre = new Date(caja.fecha_cierre).getMonth();
          if (mesCierre >= 0 && mesCierre < 12) {
            datosAgrupados[mesCierre].monto += caja.monto_cierre || 0;
          }
        });
      }

      setIngresosSemanaData(datosAgrupados);
    } catch (error) {
      console.error(`Error en loadVentasPOSPorFiltro (${filtro}):`, error);
    }
  };

  // Función para obtener ingresos de citas completadas con servicios y productos
  const loadIngresosCitasPorFiltro = async (filtro: 'semana' | 'hoy' | 'mes' | 'anio') => {
    if (!user?.empresa_id) return;
    
    try {
      let startDate: Date;
      let endDate: Date;
      let etiquetas: string[];

      switch (filtro) {
        case 'hoy':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          etiquetas = ['Hoy'];
          break;
        
        case 'mes':
          startDate = new Date();
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          endDate.setDate(0);
          endDate.setHours(23, 59, 59, 999);
          // Etiquetas para días del mes (1-31)
          etiquetas = Array.from({length: endDate.getDate()}, (_, i) => `${i + 1}`);
          break;
        
        case 'anio':
          startDate = new Date();
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setMonth(11, 31);
          endDate.setHours(23, 59, 59, 999);
          // Etiquetas para meses del año
          etiquetas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          break;
        
        default: // semana
          startDate = new Date();
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          etiquetas = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
          break;
      }

      // Obtener ventas de citas completadas (con cita_id no nulo y estado completada)
      const { data: ventasCitas, error: ventasCitasError } = await supabase
        .from('ventas')
        .select(`
          id,
          total,
          fecha,
          cita_id,
          detalles_ventas (
            id,
            producto_id,
            servicio_id,
            cantidad,
            precio_unitario,
            subtotal
          )
        `)
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'completada')
        .not('cita_id', 'is', null)
        .gte('fecha', startDate.toISOString())
        .lte('fecha', endDate.toISOString());

      console.log(`Ventas de citas completadas filtradas por ${filtro}:`, ventasCitas);
      console.log('Error en ventas de citas completadas:', ventasCitasError);

      if (ventasCitasError) {
        console.error(`Error cargando ventas de citas completadas ${filtro}:`, ventasCitasError);
        return;
      }

      // Agrupar datos según el filtro
      let datosAgrupados: {dia: string, monto: number}[] = [];

      if (filtro === 'hoy') {
        // Para hoy, mostrar un solo dato
        const totalHoy = ventasCitas?.reduce((sum, venta) => sum + (venta.total || 0), 0) || 0;
        datosAgrupados = [{ dia: 'Hoy', monto: totalHoy }];
      } else if (filtro === 'semana') {
        // Agrupar por día de la semana
        datosAgrupados = etiquetas.map(dia => ({ dia, monto: 0 }));
        ventasCitas?.forEach(venta => {
          const diaVenta = new Date(venta.fecha).getDay();
          const diaIndex = diaVenta === 0 ? 6 : diaVenta - 1; // Ajustar para que lunes sea 0
          if (diaIndex >= 0 && diaIndex < 7) {
            datosAgrupados[diaIndex].monto += venta.total || 0;
          }
        });
      } else if (filtro === 'mes') {
        // Agrupar por día del mes
        datosAgrupados = etiquetas.map(dia => ({ dia, monto: 0 }));
        ventasCitas?.forEach(venta => {
          const diaVenta = new Date(venta.fecha).getDate() - 1; // 0-indexed
          if (diaVenta >= 0 && diaVenta < datosAgrupados.length) {
            datosAgrupados[diaVenta].monto += venta.total || 0;
          }
        });
      } else if (filtro === 'anio') {
        // Agrupar por mes del año
        datosAgrupados = etiquetas.map(mes => ({ dia: mes, monto: 0 }));
        ventasCitas?.forEach(venta => {
          const mesVenta = new Date(venta.fecha).getMonth();
          if (mesVenta >= 0 && mesVenta < 12) {
            datosAgrupados[mesVenta].monto += venta.total || 0;
          }
        });
      }

      // Usar el estado separado para ingresos de citas
      setIngresosCitasData(datosAgrupados);
    } catch (error) {
      console.error(`Error en loadIngresosCitasPorFiltro (${filtro}):`, error);
    }
  };

  // Función para obtener alertas de inventario
  const loadAlertasInventario = async () => {
    if (!user?.empresa_id) return;
    
    try {
      console.log('Cargando alertas de inventario para empresa:', user.empresa_id);
      
      // Obtener todos los productos de la empresa
      const { data: productos, error } = await supabase
        .from('productos')
        .select('id, nombre, stock, stock_minimo')
        .eq('empresa_id', user.empresa_id)
        .order('stock', { ascending: true });

      console.log('Todos los productos:', productos);
      console.log('Error en productos:', error);
      console.log('Detalles del error:', JSON.stringify(error, null, 2));

      if (error) {
        console.error('Error cargando productos:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje de error:', error.message);
        console.error('Detalles:', error.details);
        return;
      }

      // Filtrar productos con stock bajo (stock <= stock_minimo)
      const productosConBajoStock = (productos || []).filter(
        producto => producto.stock <= producto.stock_minimo
      );

      console.log('Productos con bajo stock:', productosConBajoStock);
      setAlertasInventario(productosConBajoStock);
    } catch (error) {
      console.error('Error en loadAlertasInventario:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  // Función para obtener estado de citas del día
  const loadEstadoCitasHoy = async () => {
    if (!user?.empresa_id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
      const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();

      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select('estado')
        .eq('empresa_id', user.empresa_id)
        .gte('fecha', startOfDay)
        .lte('fecha', endOfDay);

      if (citasError) {
        console.error('Error cargando estado citas:', citasError);
        return;
      }

      // Contar citas por estado
      const estadoCount = {
        'Finalizadas': 0,
        'Pendientes': 0,
        'Canceladas': 0
      };

      citasData?.forEach(cita => {
        const estado = cita.estado?.toLowerCase();
        if (estado === 'completada' || estado === 'finalizado' || estado === 'atendido') {
          estadoCount['Finalizadas']++;
        } else if (estado === 'pendiente' || estado === 'confirmada' || estado === 'en_atencion') {
          estadoCount['Pendientes']++;
        } else if (estado === 'cancelada' || estado === 'anulada' || estado === 'vencida') {
          estadoCount['Canceladas']++;
        }
      });

      const estadoCitasData = [
        { nombre: 'Finalizadas', valor: estadoCount['Finalizadas'], color: '#10b981' },
        { nombre: 'Pendientes', valor: estadoCount['Pendientes'], color: '#f59e0b' },
        { nombre: 'Canceladas', valor: estadoCount['Canceladas'], color: '#ef4444' }
      ];

      setEstadoCitasData(estadoCitasData);
    } catch (error) {
      console.error('Error en loadEstadoCitasHoy:', error);
    }
  };

  // Cargar datos de gráficas
  useEffect(() => {
    if (user?.empresa_id) {
      setLoadingCharts(true);
      Promise.all([
        loadVentasPOSPorFiltro(filtroVentas),
        loadIngresosCitasPorFiltro(filtroVentas),
        loadEstadoCitasHoy(),
        loadAlertasInventario(),
        loadIngresosHoy()
      ]).finally(() => {
        setLoadingCharts(false);
      });
    }
  }, [user?.empresa_id, filtroVentas]);
  
  // Estado para las citas del día
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const appointmentsPerPage = 5;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Verificar si el usuario tiene empresa_id
    if (user && !user.empresa_id && user.rol !== 'admin_global') {
      router.push('/login');
      return;
    }
    
    // Permitir que admin_global vea el dashboard-empresa si lo desea
    // No redirigir automáticamente a admin-dashboard
  }, [user, router]);

  // Cargar citas del día desde Supabase
  const loadAppointments = async () => {
    if (!user?.empresa_id) return;
    
    try {
      setAppointmentsLoading(true);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log('Cargando citas para empresa:', user.empresa_id, 'fecha:', today);
      
      // Primero verificar si hay citas sin filtro de fecha
      const { data: allCitas, error: allError } = await supabase
        .from('citas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .limit(5);

      // Ahora verificar con filtro de fecha - rango del día completo
      const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
      const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();
      
      console.log('Rango de fecha:', { startOfDay, endOfDay });
      
      const { data, error, count } = await supabase
        .from('citas')
        .select(`
          *,
          clientes!inner (
            id,
            nombre
          ),
          empleados!inner (
            id,
            nombre_completo
          )
        `, { count: 'exact' })
        .eq('empresa_id', user.empresa_id)
        .gte('fecha', startOfDay)
        .lte('fecha', endOfDay)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * appointmentsPerPage, currentPage * appointmentsPerPage - 1);

      console.log('Citas filtradas por fecha:', data);
      console.log('Error en citas filtradas:', error);
      console.log('Count total:', count);

      if (error) {
        console.error('Error cargando citas:', error);
        setAppointments([]);
        return;
      }

      setAppointments(data || []);
      setTotalAppointments(count || 0);
      
      console.log('Estado final - appointments:', data?.length || 0, 'total:', count);
    } catch (error) {
      console.error('Error en loadAppointments:', error);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.empresa_id) {
      loadAppointments();
    }
  }, [user?.empresa_id, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Si es admin_global, no debería estar aquí
  if (user.rol === 'admin_global') {
    return null;
  }

  return (
    <SimpleLayout>
      {/* Contenido principal con paleta clara/blanca BeautyPro */}
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Banner de mensaje global - Ancho completo */}
          <MensajeGlobalBanner key="global-banner" />

          {/* Header con saludo principal */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Hola, {user.nombre}</h1>
            <p className="text-gray-600 mt-2 text-lg">
              Bienvenido a tu panel de control
            </p>
          </div>

          {/* Tarjetas de Resumen (KPIs) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 hover:shadow-amber-600/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Ingresos de Hoy</h3>
                <Wallet className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ${ingresosHoy.toLocaleString('es-CO')}
                </div>
                <p className="text-xs text-gray-500">
                  Total recaudado hoy
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 hover:shadow-amber-600/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Citas de Hoy</h3>
                <Calendar className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">12</div>
                <p className="text-xs text-gray-500">
                  Citas programadas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 hover:shadow-amber-600/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Comisiones Pendientes</h3>
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">$120.000</div>
                <p className="text-xs text-gray-500">
                  Por pagar a empleados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 hover:shadow-amber-600/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Nuevos Clientes</h3>
                <UserPlus className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">3</div>
                <p className="text-xs text-gray-500">
                  Registrados esta semana
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas de Estadísticas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfica de Ventas */}
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
              <CardHeader className="border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Cajas Cerradas</h3>
                    <p className="text-gray-600 text-sm">Montos de cierre por período</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={filtroVentas === 'semana' ? 'primary' : 'outline'} 
                      size="sm" 
                      className={filtroVentas === 'semana' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}
                      onClick={() => setFiltroVentas('semana')}
                    >
                      Semana
                    </Button>
                    <Button 
                      variant={filtroVentas === 'hoy' ? 'primary' : 'outline'} 
                      size="sm" 
                      className={filtroVentas === 'hoy' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}
                      onClick={() => setFiltroVentas('hoy')}
                    >
                      Hoy
                    </Button>
                    <Button 
                      variant={filtroVentas === 'mes' ? 'primary' : 'outline'} 
                      size="sm" 
                      className={filtroVentas === 'mes' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}
                      onClick={() => setFiltroVentas('mes')}
                    >
                      Mes
                    </Button>
                    <Button 
                      variant={filtroVentas === 'anio' ? 'primary' : 'outline'} 
                      size="sm" 
                      className={filtroVentas === 'anio' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}
                      onClick={() => setFiltroVentas('anio')}
                    >
                      Año
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loadingCharts ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
                      <BarChart data={ingresosSemanaData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="dia" 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#374151' }}
                          itemStyle={{ color: '#111827' }}
                          formatter={(value: any) => [`$${value.toLocaleString('es-MX')}`, 'Caja Cerrada']}
                        />
                        <Bar 
                          dataKey="monto" 
                          fill="#3b82f6"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gráfica de Ingresos de la Semana */}
            <Card className="bg-stone-900 border-stone-700 hover:shadow-lg transition-all duration-300">
              <CardHeader className="border-stone-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black">Ingresos de Citas</h3>
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-sm text-black">Ventas de citas completadas con servicios y productos</p>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loadingCharts ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
                      <LineChart data={ingresosCitasData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="dia" 
                          stroke="#d97706"
                          tick={{ fill: '#d97706' }}
                        />
                        <YAxis 
                          stroke="#d97706"
                          tick={{ fill: '#d97706' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#d97706' }}
                          itemStyle={{ color: '#fbbf24' }}
                          formatter={(value: any) => [`$${value.toLocaleString('es-MX')}`, 'Ingreso de Cita']}
                        />
                        <Line 
                          type="monotone"
                          dataKey="monto" 
                          stroke="#d97706"
                          strokeWidth={3}
                          dot={{ fill: '#fbbf24', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gráfica de Estado de Citas (Hoy) */}
            <Card className="bg-stone-900 border-stone-700 hover:shadow-lg transition-all duration-300">
              <CardHeader className="border-stone-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-black">Estado de Citas (Hoy)</h3>
                    <p className="text-black text-sm">Distribución de citas por estado</p>
                  </div>
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loadingCharts ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
                      <PieChart>
                      <Pie
                        data={estadoCitasData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="valor"
                      >
                        {estadoCitasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#d97706' }}
                        itemStyle={{ color: '#fbbf24' }}
                        formatter={(value: any, name: any) => [value, name]}
                      />
                      <Legend 
                        verticalAlign="middle" 
                        align="right" 
                        layout="vertical"
                        wrapperStyle={{
                          color: '#d97706',
                          fontSize: '14px'
                        }}
                        formatter={(value: any, entry: any) => (
                          <span style={{ color: '#d97706' }}>
                            {entry.payload.nombre}: {entry.payload.valor}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas de Inventario */}
          <Card className="bg-white border-gray-200 mb-8">
            <CardHeader className="border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Alertas de Inventario</h3>
              <p className="text-gray-600 text-sm">Productos con stock bajo</p>
            </CardHeader>
            <CardContent>
              {loadingCharts ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                </div>
              ) : alertasInventario.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <p className="text-gray-600 font-medium">No hay alertas de inventario</p>
                  <p className="text-sm text-gray-500 mt-1">Todos los productos tienen stock adecuado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertasInventario.map((producto) => {
                    const nivelCritico = producto.stock <= producto.stock_minimo * 0.5;
                    const colorClass = nivelCritico 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-yellow-50 border-yellow-200';
                    const iconColor = nivelCritico ? 'text-red-600' : 'text-yellow-600';
                    
                    return (
                      <div key={producto.id} className={`flex items-center justify-between p-3 ${colorClass} border rounded-lg`}>
                        <div className="flex items-center gap-3">
                          <AlertCircle className={`w-5 h-5 ${iconColor}`} />
                          <div>
                            <p className="font-medium text-gray-900">{producto.nombre}</p>
                            <p className="text-sm text-gray-600">
                              Stock: {producto.stock} unidades (Mínimo: {producto.stock_minimo})
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-amber-600 hover:bg-amber-700"
                          onClick={() => router.push('/inventario')}
                        >
                          Ir
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla de Citas del Día */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="border-stone-800">
              <h3 className="text-xl font-semibold text-gray-900">Citas de Hoy</h3>
              <p className="text-gray-600 text-sm">Próximas citas programadas</p>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-stone-400">No hay citas programadas para hoy</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-3 font-medium text-gray-700 border-r">Fecha</th>
                          <th className="text-left p-3 font-medium text-gray-700 border-r">Cliente</th>
                          <th className="text-left p-3 font-medium text-gray-700 border-r">Empleado</th>
                          <th className="text-left p-3 font-medium text-gray-700 border-r">Total</th>
                          <th className="text-center p-3 font-medium text-gray-700 border-r">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appointment) => (
                          <tr key={appointment.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 border-r">
                              <div className="text-sm">
                                {appointment.fecha ? new Date(appointment.fecha).toLocaleDateString('es-MX') : 'Sin fecha'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.fecha ? new Date(appointment.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                            </td>
                            <td className="p-3 border-r">
                              <div className="font-medium text-gray-900">
                                {appointment.clientes?.nombre || 'Cliente sin nombre'}
                              </div>
                            </td>
                            <td className="p-3 border-r">
                              <div className="font-medium text-gray-900">
                                {appointment.empleados?.nombre_completo || 'Empleado sin nombre'}
                              </div>
                            </td>
                            <td className="p-3 border-r">
                              <div className="font-medium text-gray-900">
                                ${appointment.total_estimado ? appointment.total_estimado.toFixed(2) : '0.00'}
                              </div>
                            </td>
                            <td className="p-3 border-r text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(appointment.estado || '')}`}>
                                {appointment.estado ? appointment.estado.replace('_', ' ') : 'Desconocido'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Mostrando {appointments.length} de {totalAppointments} citas
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-600 hover:bg-gray-100"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-600 hover:bg-gray-100"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalAppointments / appointmentsPerPage), prev + 1))}
                        disabled={currentPage >= Math.ceil(totalAppointments / appointmentsPerPage)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleLayout>
  );
}
