'use client';

import React, { useState, useMemo, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  ChevronDown,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function AnalyticsPage() {
  const [filtroFecha, setFiltroFecha] = useState('Este Mes');
  const [loadingData, setLoadingData] = useState(false);
  const [ingresosData, setIngresosData] = useState<any[]>([]);
  const [estilistasData, setEstilistasData] = useState<any[]>([]);
  const [nominasData, setNominasData] = useState<any[]>([]);
  const [currentPageNominas, setCurrentPageNominas] = useState(1);
  const [serviciosData, setServiciosData] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    ingresosTotales: 0,
    totalCitas: 0,
    ticketPromedio: 0
  });

  const { user } = useJWTAuth();

  // Función para cargar datos dinámicos desde la base de datos
  const loadAnalyticsData = async () => {
    if (!user?.empresa_id) return;

    setLoadingData(true);
    try {
      const supabase = createClient();

      // Calcular rango de fechas según el filtro
      let startDate: Date;
      let endDate: Date;

      switch (filtroFecha) {
        case 'Este Mes':
          startDate = new Date();
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          endDate.setDate(0);
          endDate.setHours(23, 59, 59, 999);
          break;

        case 'Últimos 3 Meses':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 2); // -2 para incluir los últimos 3 meses completos
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setDate(endDate.getDate() + 2); // Agregar 2 días para asegurar incluir todo el período actual
          endDate.setHours(0, 0, 0, 0);
          break;

        case 'Este Año':
          startDate = new Date();
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setMonth(11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;

        default:
          startDate = new Date();
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      // Cargar datos de ingresos por mes
      const { data: ingresosData, error: ingresosError } = await supabase
        .from('ventas')
        .select('total, fecha')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'completada')
        .gte('fecha', startDate.toISOString())
        .lte('fecha', endDate.toISOString())
        .order('fecha', { ascending: true });

      // Cargar datos de citas
      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select('id')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'completada')
        .gte('fecha', startDate.toISOString())
        .lte('fecha', endDate.toISOString());

      // Cargar datos de empleados (estilistas) con sus ingresos
      const { data: empleadosData, error: empleadosError } = await supabase
        .from('empleados')
        .select('nombre_completo, id')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo');

      // Usar datos de nóminas para el ranking de estilistas
      const ingresosPorEmpleado: any[] = [];
      
      // Primero verificar si existen nóminas en general
      const { data: allNominas, error: allNominasError } = await supabase
        .from('nominas')
        .select('fecha_inicio, fecha_fin, estado, total_pagar')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'pagado')
        .order('fecha_inicio', { ascending: false })
        .limit(5);

      console.log('Todas las nóminas (últimas 5):', allNominas);
      if (allNominas && allNominas.length > 0) {
        console.log('Fechas de nóminas existentes:');
        allNominas.forEach((nomina, index) => {
          console.log(`  ${index + 1}. Inicio: ${nomina.fecha_inicio}, Fin: ${nomina.fecha_fin}, Total: ${nomina.total_pagar}`);
        });
      }

      // Obtener nóminas del período con datos de empleados
      console.log('Buscando nóminas en rango:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        filtro: filtroFecha
      });

      const { data: nominasRankingData, error: nominasRankingError } = await supabase
        .from('nominas')
        .select(`
          *,
          empleados(nombre_completo)
        `)
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'pagado')
        .gte('fecha_inicio', startDate.toISOString())
        .lte('fecha_fin', endDate.toISOString());

      console.log('Nóminas para ranking:', nominasRankingData);
      console.log('Error en nóminas:', nominasRankingError);

      if (nominasRankingData && nominasRankingData.length > 0) {
        // Agrupar por empleado sumando sus nóminas
        const agrupadoPorEmpleado: { [key: string]: { nombre: string; ingresos: number } } = {};
        
        for (const nomina of nominasRankingData as any[]) {
          const empleadoId = nomina.empleado_id;
          const nombreEmpleado = nomina.empleados?.nombre_completo || 'Empleado sin nombre';
          const totalPagar = nomina.total_pagar || 0;
          
          if (!agrupadoPorEmpleado[empleadoId]) {
            agrupadoPorEmpleado[empleadoId] = {
              nombre: nombreEmpleado,
              ingresos: 0
            };
          }
          
          agrupadoPorEmpleado[empleadoId].ingresos += totalPagar;
        }
        
        // Convertir a array y ordenar
        ingresosPorEmpleado.push(...Object.values(agrupadoPorEmpleado));
      }

      console.log('Ingresos por empleado procesados:', ingresosPorEmpleado);

      ingresosPorEmpleado.sort((a, b) => b.ingresos - a.ingresos);

      // Cargar datos de nóminas
      console.log('Buscando nóminas para Resumen en rango:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        filtro: filtroFecha
      });

      const { data: nominasData, error: nominasError } = await supabase
        .from('nominas')
        .select(`
          *,
          empleados(nombre_completo)
        `)
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'pagado')
        .gte('fecha_inicio', startDate.toISOString())
        .lte('fecha_fin', endDate.toISOString())
        .order('fecha_inicio', { ascending: false });

      console.log('Nóminas para Resumen:', nominasData);
      console.log('Error en Resumen de nóminas:', nominasError);

      // Cargar datos de servicios
      const { data: serviciosData, error: serviciosError } = await supabase
        .from('servicios')
        .select('nombre')
        .eq('empresa_id', user.empresa_id);

      // Calcular distribución de servicios (esto requeriría una tabla de detalles de ventas)
      const distribucionServicios = [
        { nombre: 'Cortes', valor: 35, color: '#d97706' },
        { nombre: 'Tintes', valor: 25, color: '#f59e0b' },
        { nombre: 'Manicura', valor: 20, color: '#eab308' },
        { nombre: 'Otros', valor: 20, color: '#a16207' }
      ];

      // Agrupar ingresos por mes
      const ingresosPorMes: { [key: string]: number } = {};
      if (ingresosData) {
        ingresosData.forEach((venta: any) => {
          const mes = new Date(venta.fecha).toLocaleDateString('es-MX', { month: 'short' });
          if (!ingresosPorMes[mes]) {
            ingresosPorMes[mes] = 0;
          }
          ingresosPorMes[mes] += venta.total || 0;
        });
      }

      const ingresosMensualesArray = Object.entries(ingresosPorMes).map(([mes, ingresos]) => ({
        mes,
        ingresos
      }));

      // Calcular KPIs
      const ingresosTotales = ingresosMensualesArray.reduce((sum, item) => sum + (item.ingresos || 0), 0);
      const totalCitas = citasData?.length || 0;
      const ticketPromedio = totalCitas > 0 ? ingresosTotales / totalCitas : 0;

      setIngresosData(ingresosMensualesArray);
      console.log('Datos de estilistas a asignar:', ingresosPorEmpleado);
      setEstilistasData(ingresosPorEmpleado);
      setNominasData(nominasData || []);
      setServiciosData(distribucionServicios);
      setKpis({
        ingresosTotales,
        totalCitas,
        ticketPromedio
      });

    } catch (error) {
      console.error('Error cargando datos de analytics:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Cargar datos cuando cambia el filtro o al montar
  useEffect(() => {
    loadAnalyticsData();
  }, [filtroFecha, user?.empresa_id]);

  return (
    <ProtectedRoute requiredPermission="analytics" moduleInfo={{
      name: "Analíticas y Reportes",
      icon: "BarChart3",
      benefits: ["Reportes avanzados", "Métricas en tiempo real", "Análisis de tendencias"],
      requiredPlan: "profesional"
    }}>
      <MainLayout>
        <div className="min-h-screen bg-amber-50 p-6">
          {/* Encabezado y Filtros */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-black">Analíticas y Reportes</h1>
              <p className="text-stone-400 mt-2">
                Análisis avanzado de datos y métricas de tu negocio
              </p>
            </div>

            {/* Selector de fecha */}
            <div className="relative">
              <select 
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-48 px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none cursor-pointer text-sm font-medium"
              >
                <option value="Este Mes">Este Mes</option>
                <option value="Últimos 3 Meses">Últimos 3 Meses</option>
                <option value="Este Año">Este Año</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293 3.293a1 1 0 001.414 1.414l-4-4a1 1 0 00-1.414 0L5.293 7.293z"/>
                  <path d="M4.293 12.707a1 1 0 010 1.414l4 4a1 1 0 001.414-1.414l-4-4a1 1 0 00-1.414 0z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen (KPIs) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-stone-900 border-stone-300">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-900 rounded-lg p-3">
                    <DollarSign className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-stone-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-black">
                      ${kpis.ingresosTotales.toLocaleString('es-MX')}
                    </p>
                    <p className="text-sm text-green-600">+12.5%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-stone-900 border-stone-300">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-900 rounded-lg p-3">
                    <Calendar className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-stone-600">Total Citas Atendidas</p>
                    <p className="text-2xl font-bold text-black">{kpis.totalCitas}</p>
                    <p className="text-sm text-green-600">+8.2%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-stone-900 border-stone-300">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-900 rounded-lg p-3">
                    <TrendingUp className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-stone-600">Ticket Promedio</p>
                    <p className="text-2xl font-bold text-black">
                      ${Math.round(kpis.ticketPromedio).toLocaleString('es-MX')}
                    </p>
                    <p className="text-sm text-green-600">+5.3%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nóminas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Resumen de Nóminas */}
            <div className="lg:col-span-2">
              <Card className="bg-stone-900 border-stone-300">
                <CardHeader>
                  <CardTitle className="text-black font-semibold flex items-center">
                    <Users className="mr-2 h-5 w-5 text-amber-500" />
                    Resumen de Nóminas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-300">
                          <th className="text-left py-3 px-4 text-black font-medium">Empleado</th>
                          <th className="text-right py-3 px-4 text-black font-medium">Sueldo Base</th>
                          <th className="text-right py-3 px-4 text-black font-medium">Comisiones</th>
                          <th className="text-right py-3 px-4 text-black font-medium">Total a Pagar</th>
                          <th className="text-center py-3 px-4 text-black font-medium">Período</th>
                          <th className="text-center py-3 px-4 text-black font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nominasData.length > 0 ? (
                          nominasData
                            .slice((currentPageNominas - 1) * 5, currentPageNominas * 5)
                            .map((nomina: any, index: number) => {
                              return (
                                <tr key={nomina.id} className="border-b border-stone-300 hover:bg-gray-300 hover:text-white transition-colors">
                                  <td className="py-3 px-4 text-black font-medium">
                                    {nomina.empleados?.nombre_completo || 'N/A'}
                                  </td>
                                  <td className="py-3 px-4 text-right text-black">
                                    ${nomina.sueldo_base?.toLocaleString('es-MX') || '0'}
                                  </td>
                                  <td className="py-3 px-4 text-right text-green-400">
                                    ${nomina.total_comisiones?.toLocaleString('es-MX') || '0'}
                                  </td>
                                  <td className="py-3 px-4 text-right text-amber-400 font-semibold">
                                    ${nomina.total_pagar?.toLocaleString('es-MX') || '0'}
                                  </td>
                                  <td className="py-3 px-4 text-center text-black">
                                    {nomina.periodo_tipo === 'semanal'
                                      ? 'Semanal'
                                      : nomina.periodo_tipo === 'quincenal'
                                        ? 'Quincenal'
                                        : nomina.periodo_tipo === 'mensual'
                                          ? 'Mensual'
                                          : nomina.periodo_tipo}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${nomina.estado === 'pagado'
                                          ? 'bg-green-900 text-green-300'
                                          : 'bg-yellow-900 text-yellow-300'
                                        }`}
                                    >
                                      {nomina.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-stone-400">
                              No hay datos de nóminas para el período seleccionado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Controles de paginación */}
                  {nominasData.length > 5 && (
                    <div className="flex justify-between items-center mt-4 px-4">
                      <div className="text-sm text-stone-400">
                        Mostrando {(currentPageNominas - 1) * 5 + 1} - {Math.min(currentPageNominas * 5, nominasData.length)} de {nominasData.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPageNominas(prev => Math.max(1, prev - 1))}
                          disabled={currentPageNominas === 1}
                          className="px-3 py-1 bg-stone-800 text-stone-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700"
                        >
                          Anterior
                        </button>
                        <span className="px-3 py-1 text-stone-300">
                          Página {currentPageNominas} de {Math.ceil(nominasData.length / 5)}
                        </span>
                        <button
                          onClick={() => setCurrentPageNominas(prev => Math.min(Math.ceil(nominasData.length / 5), prev + 1))}
                          disabled={currentPageNominas === Math.ceil(nominasData.length / 5)}
                          className="px-3 py-1 bg-stone-800 text-stone-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Gráficas Avanzadas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tendencia de Ingresos - Ocupa 2/3 del ancho */}
            <div className="lg:col-span-2">
              <Card className="bg-stone-900 border-stone-300">
                <CardHeader>
                  <CardTitle className="text-black font-semibold flex items-center">
                    <LineChart className="mr-2 h-5 w-5 text-amber-500" />
                    Tendencia de Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height={300} minWidth={0}>
                      <RechartsLineChart data={ingresosData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="mes"
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1c130d',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#d97706' }}
                          itemStyle={{ color: '#fbbf24' }}
                          formatter={(value: any) => [`$${value.toLocaleString('es-MX')}`, 'Ingresos']}
                        />
                        <Line
                          type="monotone"
                          dataKey="ingresos"
                          stroke="#d97706"
                          strokeWidth={3}
                          dot={{ fill: '#fbbf24', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Servicios Populares - Ocupa 1/3 del ancho */}
            <div className="lg:col-span-1">
              <Card className="bg-stone-900 border-stone-300">
                <CardHeader>
                  <CardTitle className="text-black font-semibold flex items-center">
                    <PieChart className="mr-2 h-5 w-5 text-amber-500" />
                    Servicios Populares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height={300} minWidth={0}>
                      <RechartsPieChart>
                        <Pie
                          data={serviciosData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="valor"
                        >
                          {serviciosData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1c130d',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#d97706' }}
                          itemStyle={{ color: '#fbbf24' }}
                          formatter={(value: any) => [`${value}%`, 'Porcentaje']}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value: any, entry: any) => (
                            <span style={{ color: '#d97706' }}>
                              {entry.payload.nombre}: {entry.payload.valor}%
                            </span>
                          )}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Rendimiento por Estilista - Ocupa ancho completo */}
          <div className="mt-6">
            <Card className="bg-stone-900 border-stone-300">
              <CardHeader>
                <CardTitle className="text-black font-semibold flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-amber-500" />
                  Top 5 Estilistas por Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height={300} minWidth={0}>
                    <RechartsBarChart data={estilistasData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="nombre"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        interval={0}
                        tickFormatter={(value) => {
                          // Si el nombre es muy largo, dividirlo en 2 líneas
                          if (value && value.length > 15) {
                            const words = value.split(' ');
                            if (words.length >= 2) {
                              const mid = Math.ceil(words.length / 2);
                              return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
                            }
                          }
                          return value;
                        }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1c130d',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#d97706' }}
                        itemStyle={{ color: '#fbbf24' }}
                        formatter={(value: any) => [`$${value.toLocaleString('es-MX')}`, 'Ingresos']}
                      />
                      <Bar
                        dataKey="ingresos"
                        fill="#d97706"
                        radius={[8, 8, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

export default AnalyticsPage;
