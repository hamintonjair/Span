import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import {
  BanknotesIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  CogIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { obtenerMetricasDashboardAction } from '@/app/actions/admin';
import GraficosDashboard from '@/components/admin/GraficosDashboard';
import { createAdminClient } from '@/lib/supabase/admin';

// Función para formatear moneda colombiana
const formatearMoneda = (cantidad: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cantidad);
};

// Función para formatear fecha relativa
const formatearFechaRelativa = (fecha: string): string => {
  const fechaObj = new Date(fecha);
  const ahora = new Date();
  const diferenciaMs = ahora.getTime() - fechaObj.getTime();
  const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
  
  if (diferenciaDias === 0) {
    return 'Hoy';
  } else if (diferenciaDias === 1) {
    return 'Ayer';
  } else if (diferenciaDias < 7) {
    return `Hace ${diferenciaDias} días`;
  } else if (diferenciaDias < 30) {
    const semanas = Math.floor(diferenciaDias / 7);
    return `Hace ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
  } else {
    return fechaObj.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
};

// Función para formatear hora
const formatearHora = (fecha: string): string => {
  const fechaObj = new Date(fecha);
  return fechaObj.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Página asíncrona del Dashboard Global
export default async function AdminDashboardPage() {
  // Obtener métricas directamente en el servidor
  const metricasResult = await obtenerMetricasDashboardAction();

  // Obtener datos para los gráficos
  const supabaseAdmin = createAdminClient();

  // Datos de Crecimiento (Evolución de Salones por mes)
  const { data: empresas } = await supabaseAdmin
    .from('empresas')
    .select('creado_en')
    .order('creado_en', { ascending: true });

  // Agrupar por mes
  let crecimientoPorMes: any[] = [];
  if (empresas && empresas.length > 0) {
    const agrupado = empresas.reduce((acc: any, empresa: any) => {
      const fecha = new Date(empresa.creado_en);
      const nombreMes = fecha.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
      if (!acc[nombreMes]) {
        acc[nombreMes] = 0;
      }
      acc[nombreMes]++;
      return acc;
    }, {});

    // Ordenar cronológicamente
    const mesesOrdenados = Object.keys(agrupado).sort((a, b) => {
      const [mesA, añoA] = a.split(' ');
      const [mesB, añoB] = b.split(' ');
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const idxA = meses.indexOf(mesA.toLowerCase());
      const idxB = meses.indexOf(mesB.toLowerCase());
      if (añoA !== añoB) return parseInt(añoA) - parseInt(añoB);
      return idxA - idxB;
    });

    crecimientoPorMes = mesesOrdenados.map(mes => ({
      mes: mes.charAt(0).toUpperCase() + mes.slice(1),
      salones: agrupado[mes]
    }));
  }

  // Datos de Distribución de Planes
  const { data: empresasConPlanes } = await supabaseAdmin
    .from('empresas')
    .select('planes(nombre)')
    .not('plan_id', 'is', null);

  let distribucionPlanes: any[] = [];
  const colores = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
  if (empresasConPlanes && empresasConPlanes.length > 0) {
    const agrupado = empresasConPlanes.reduce((acc: any, empresa: any) => {
      const nombrePlan = empresa.planes?.nombre || 'Sin plan';
      if (!acc[nombrePlan]) {
        acc[nombrePlan] = 0;
      }
      acc[nombrePlan]++;
      return acc;
    }, {});

    distribucionPlanes = Object.entries(agrupado).map(([nombre, value], index) => ({
      name: nombre,
      value: value as number,
      color: colores[index % colores.length]
    }));
  }
  
  if (!metricasResult.success) {
    console.error('Error cargando métricas:', metricasResult.error);
  }

  const metricas = metricasResult.data || {
    mrr: 0,
    totalEmpresas: 0,
    activas: 0,
    suspendidas: 0,
    totalUsuarios: 0,
    porcentajeCrecimiento: 0,
    actividadReciente: [],
    distribucionPlanes: [],
    proximosVencimientos: []
  };

  // Obtener comprobantes pendientes para el badge
  const obtenerComprobantesPendientes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/comprobantes-pendientes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return data?.length || 0;
    } catch (error) {
      console.error('Error obteniendo comprobantes pendientes:', error);
      return 0;
    }
  };

  const pendientesCount = await obtenerComprobantesPendientes();

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#fdfaf6] p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Global
          </h1>
          <p className="text-gray-500 text-lg">
            Resumen de rendimiento y métricas de Span
          </p>
        </div>

        {/* Sección de Métricas - Tarjetas Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Ingresos Mensuales (MRR) */}
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 rounded-lg">
                  <BanknotesIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearMoneda(metricas.mrr)}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-sm text-amber-600">
                <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                <span>MRR Real</span>
              </div>
            </CardContent>
          </Card>

          {/* Empresas Totales */}
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Empresas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas.totalEmpresas.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="text-green-600 font-medium">Activas: {metricas.activas}</span>
                <span className="mx-2">•</span>
                <span className="text-red-600 font-medium">Suspendidas: {metricas.suspendidas}</span>
              </div>
            </CardContent>
          </Card>

          {/* Usuarios Globales */}
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Usuarios Globales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas.totalUsuarios.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-sm text-purple-600">
                <UsersIcon className="w-4 h-4 mr-1" />
                <span>Registrados</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Dashboard */}
        <GraficosDashboard datosCrecimiento={crecimientoPorMes} datosPlanes={distribucionPlanes} />

        {/* Sección de Estadísticas - Cuerpo Central */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Salud del Sistema */}
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <ChartBarIcon className="w-5 h-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Salud del Sistema</h3>
              </div>
              
              <div className="space-y-4">
                {/* Distribución visual */}
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    {/* Círculo de progreso */}
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#10b981"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(metricas.activas / Math.max(metricas.totalEmpresas, 1)) * 352} 352`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round((metricas.activas / Math.max(metricas.totalEmpresas, 1)) * 100)}%
                        </p>
                        <p className="text-xs text-gray-500">Activas</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Leyenda */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Activas</span>
                    </div>
                    <span className="font-medium text-green-600">{metricas.activas}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Suspendidas</span>
                    </div>
                    <span className="font-medium text-red-600">{metricas.suspendidas}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crecimiento de Red */}
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <ArrowTrendingUpIcon className="w-5 h-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Crecimiento de Red</h3>
              </div>
              
              <div className="space-y-4">
                {/* Porcentaje de crecimiento */}
                <div className="text-center">
                  {metricas.porcentajeCrecimiento === 100 && metricas.totalEmpresas > 0 ? (
                    // Mes inicial sin historial
                    <div className="space-y-2">
                      <div className="px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-800 inline-block">
                        <ArrowTrendingUpIcon className="w-4 h-4 mr-1 inline" />
                        Mes Inicial
                      </div>
                      <p className="text-sm text-gray-500">Primeras empresas registradas</p>
                    </div>
                  ) : (
                    // Crecimiento normal
                    <div className="space-y-2">
                      <p className="text-4xl font-bold text-gray-900">
                        {metricas.porcentajeCrecimiento >= 0 ? '+' : ''}{metricas.porcentajeCrecimiento.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500">vs. mes anterior</p>
                    </div>
                  )}
                </div>
                
                {/* Indicador visual */}
                <div className="flex items-center justify-center">
                  {metricas.porcentajeCrecimiento === 100 && metricas.totalEmpresas > 0 ? (
                    <div className="px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                      <ArrowTrendingUpIcon className="w-4 h-4 mr-1 inline" />
                      Nuevo
                    </div>
                  ) : (
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      metricas.porcentajeCrecimiento >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {metricas.porcentajeCrecimiento >= 0 ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 mr-1 inline" />
                      ) : (
                        <ArrowTrendingUpIcon className="w-4 h-4 mr-1 inline transform rotate-180" />
                      )}
                      {metricas.porcentajeCrecimiento >= 0 ? 'Crecimiento' : 'Decrecimiento'}
                    </div>
                  )}
                </div>
                
                {/* Estadísticas adicionales */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-900">{metricas.totalEmpresas}</p>
                    <p className="text-xs text-gray-500">Total Salones</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-lg font-semibold text-amber-600">{metricas.activas}</p>
                    <p className="text-xs text-gray-500">Operativos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nueva Sección - Distribución de Planes y Próximos Vencimientos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Distribución de Planes */}
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <ChartBarIcon className="w-5 h-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Salones por Plan</h3>
              </div>
              
              <div className="space-y-4">
                {metricas.distribucionPlanes.length === 0 ? (
                  <div className="text-center py-8">
                    <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay salones con planes asignados</p>
                  </div>
                ) : (
                  metricas.distribucionPlanes.map((plan: any, index: number) => {
                    const maxCantidad = Math.max(...metricas.distribucionPlanes.map((p: any) => p.cantidad));
                    const porcentaje = maxCantidad > 0 ? (plan.cantidad / maxCantidad) * 100 : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{plan.nombre}</span>
                          <span className="text-gray-900 font-semibold">{plan.cantidad}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Próximos Vencimientos */}
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Vencimientos (Próximos 5 días)</h3>
              </div>
              
              <div className="space-y-3">
                {metricas.proximosVencimientos.length === 0 ? (
                  <div className="text-center py-8">
                    <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Ningún salón vence en los próximos días</p>
                  </div>
                ) : (
                  metricas.proximosVencimientos.map((vencimiento: any, index: number) => {
                    const fechaVencimiento = new Date(vencimiento.fecha_vencimiento);
                    const hoy = new Date();
                    const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 rounded-full">
                            <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{vencimiento.nombre}</p>
                            <p className="text-sm text-gray-500">
                              {formatearFechaRelativa(vencimiento.fecha_vencimiento)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            diasRestantes <= 1 
                              ? 'bg-red-100 text-red-800'
                              : diasRestantes <= 3
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {diasRestantes === 0 ? 'Hoy' : 
                             diasRestantes === 1 ? 'Mañana' : 
                             `En ${diasRestantes} días`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accesos Directos - Dashboard Shortcuts */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Acciones Rápidas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gestionar Salones */}
              <Link 
                href="/admin/empresas"
                className="group p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                    <BriefcaseIcon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Gestionar Salones</h4>
                <p className="text-sm text-gray-600">Administra empresas y configuración</p>
              </Link>

              {/* Revisar Pagos */}
              <Link 
                href="/admin/suscripciones"
                className="group p-6 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200 hover:from-amber-100 hover:to-amber-200 transition-all duration-200 relative"
              >
                {pendientesCount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {pendientesCount}
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-600 rounded-lg group-hover:bg-amber-700 transition-colors">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Revisar Pagos</h4>
                <p className="text-sm text-gray-600">
                  {pendientesCount > 0 ? `${pendientesCount} pendientes` : 'Sin pagos pendientes'}
                </p>
              </Link>

              {/* Configuración Global */}
              <Link 
                href="/admin/configuracion"
                className="group p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-600 rounded-lg group-hover:bg-purple-700 transition-colors">
                    <CogIcon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Configuración Global</h4>
                <p className="text-sm text-gray-600">Ajustes y preferencias del sistema</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <ClockIcon className="w-5 h-5 text-amber-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            </div>
            
            <div className="space-y-3">
              {metricas.actividadReciente.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay actividad reciente</p>
                </div>
              ) : (
                metricas.actividadReciente.map((actividad: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        actividad.tipo === 'empresa_creada' 
                          ? 'bg-blue-100' 
                          : 'bg-green-100'
                      }`}>
                        {actividad.tipo === 'empresa_creada' ? (
                          <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {actividad.tipo === 'empresa_creada' 
                            ? `Nueva empresa: ${actividad.nombre}`
                            : `Pago aprobado: ${formatearMoneda(actividad.monto)}`
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatearFechaRelativa(actividad.fecha)} • {formatearHora(actividad.fecha)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}