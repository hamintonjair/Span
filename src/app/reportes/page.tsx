'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface ReporteData {
  totalVentas: number;
  totalGastos: number;
  totalCitas: number;
  totalClientes: number;
  totalProductos: number;
  totalEmpleados: number;
  ventasPorMes: Array<{ mes: string; monto: number }>;
  gastosPorCategoria: Array<{ categoria: string; monto: number }>;
  serviciosMasSolicitados: Array<{ nombre: string; count: number }>;
  productosMasVendidos: Array<{ nombre: string; cantidad: number; monto: number }>;
}

export default function ReportesPage() {
  const { user, loading } = useAuth();
  const [reporteData, setReporteData] = useState<ReporteData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  
  const supabase = createClient();

  useEffect(() => {
    if (user?.empresa_id) {
      cargarReporte();
    }
  }, [user, fechaInicio, fechaFin]);

  const cargarReporte = async () => {
    if (!user?.empresa_id) return;

    try {
      setLoadingData(true);
      
      // TEMPORAL: Simulación hasta crear tablas ventas y gastos
      console.log('Cargando reporte con fechas:', { fechaInicio, fechaFin });
      
      const ventasSimuladas = [
        { total: 1500, created_at: '2024-01-15' },
        { total: 2300, created_at: '2024-01-20' },
        { total: 1800, created_at: '2024-02-10' }
      ];
      
      const gastosSimulados = [
        { monto: 500, categoria: 'renta', fecha: '2024-01-05' },
        { monto: 300, categoria: 'servicios', fecha: '2024-01-15' },
        { monto: 200, categoria: 'suministros', fecha: '2024-02-01' }
      ];
      
      const citasSimuladas = [1, 2, 3, 4, 5]; // 5 citas

      // Contar clientes
      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id);

      // Contar productos
      const { count: totalProductos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo');

      // Contar empleados
      const { count: totalEmpleados } = await supabase
        .from('empleados')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo');

      // Procesar datos simulados
      const totalVentas = ventasSimuladas?.reduce((sum: number, v: any) => sum + v.total, 0) || 0;
      const totalGastos = gastosSimulados?.reduce((sum: number, g: any) => sum + g.monto, 0) || 0;
      const totalCitas = citasSimuladas?.length || 0;

      // Agrupar ventas por mes
      const ventasPorMes = ventasSimuladas?.reduce((acc: any, venta: any) => {
        const mes = new Date(venta.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });
        if (!acc[mes]) acc[mes] = 0;
        acc[mes] += venta.total;
        return acc;
      }, {} as Record<string, number>);

      // Agrupar gastos por categoría
      const gastosPorCategoria = gastosSimulados?.reduce((acc: any, gasto: any) => {
        if (!acc[gasto.categoria]) acc[gasto.categoria] = 0;
        acc[gasto.categoria] += gasto.monto;
        return acc;
      }, {} as Record<string, number>);

      setReporteData({
        totalVentas,
        totalGastos,
        totalCitas,
        totalClientes: totalClientes || 0,
        totalProductos: totalProductos || 0,
        totalEmpleados: totalEmpleados || 0,
        ventasPorMes: Object.entries(ventasPorMes).map(([mes, monto]) => ({ mes, monto: Number(monto) })),
        gastosPorCategoria: Object.entries(gastosPorCategoria).map(([categoria, monto]) => ({ categoria, monto: Number(monto) })),
        serviciosMasSolicitados: [],
        productosMasVendidos: []
      });
    } catch (error) {
      console.error('Error cargando reporte:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleExportarPDF = () => {
    if (!reporteData) return;
    
    alert('Función de exportación PDF en desarrollo...');
  };

  const handleExportarExcel = () => {
    if (!reporteData) return;
    
    alert('Función de exportación Excel en desarrollo...');
  };

  if (loading || loadingData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando reporte...</div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !user.empresa_id) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: No se pudo obtener el ID de la empresa</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Reportes</h1>
            <p className="text-gray-600">Análisis y estadísticas del negocio</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExportarPDF} variant="outline">
              📄 Exportar PDF
            </Button>
            <Button onClick={handleExportarExcel} variant="outline">
              📊 Exportar Excel
            </Button>
          </div>
        </div>

        {/* Filtros de Fecha */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Período del Reporte</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principales */}
        {reporteData && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  ${reporteData.totalVentas.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">Total Ventas</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">
                  ${reporteData.totalGastos.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">Total Gastos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-600">
                  ${(reporteData.totalVentas - reporteData.totalGastos).toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">Utilidad Neta</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {reporteData.totalCitas}
                </div>
                <p className="text-sm text-gray-600">Total Citas</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {reporteData.totalClientes}
                </div>
                <p className="text-sm text-gray-600">Total Clientes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-indigo-600">
                  {reporteData.totalProductos}
                </div>
                <p className="text-sm text-gray-600">Total Productos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-teal-600">
                  {reporteData.totalEmpleados}
                </div>
                <p className="text-sm text-gray-600">Total Empleados</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos y Tablas Detalladas */}
        {reporteData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas por Mes */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Ventas por Mes</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reporteData.ventasPorMes.map((venta, index) => (
                    <div key={venta.mes} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{venta.mes}</span>
                      <span className="text-sm font-bold text-green-600">${venta.monto.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gastos por Categoría */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Gastos por Categoría</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reporteData.gastosPorCategoria.map((gasto, index) => (
                    <div key={gasto.categoria} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 capitalize">{gasto.categoria}</span>
                      <span className="text-sm font-bold text-red-600">${gasto.monto.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
