'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { registrarLog } from '@/lib/audit';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Componente Badge inline para evitar problemas de importación
const Badge = ({ className = '', variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }) => {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "text-foreground"
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return React.createElement('div', { className, ...props });
};

interface Comision {
  id: string;
  empresa_id: string;
  empleado_id: string;
  venta_id: string;
  monto_base: number;
  porcentaje_aplicado: number;
  monto_comision: number;
  estado: 'pendiente' | 'pagado';
  created_at: string;
  nombre_completo?: string; // Nombre completo del empleado mapeado
  nombres_servicios?: string[]; // Nombres de servicios mapeados
  cedula?: string; // Cédula del empleado
  sueldo_base?: number; // Sueldo base del empleado
}

export default function MisComisionesPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'pagado'>('todos');
  const [nombresEmpleados, setNombresEmpleados] = useState<Record<string, string>>({});
  const [nombresServicios, setNombresServicios] = useState<Record<string, string>>({});
  
  // Estados para búsqueda y filtros avanzados
  const [busquedaEmpleado, setBusquedaEmpleado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Estados para paginación (consistente con clientes)
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // Calcular paginación
  const endOffset = itemOffset + itemsPerPage;
  const pageCount = Math.ceil(totalCount / itemsPerPage);
  const currentPage = Math.floor(itemOffset / itemsPerPage) + 1;

  // Función para obtener nombres de empleados
  const cargarNombresEmpleados = async () => {
    try {
      const { data: emps, error } = await supabase
        .from('empleados')
        .select('id, nombre_completo, cedula, sueldo_base, empresa_id')
        .eq('empresa_id', user?.empresa_id);
      
      const nombresMap: Record<string, any> = {};
      emps?.forEach((emp: any) => {
        nombresMap[emp.id] = {
          nombre_completo: emp.nombre_completo,
          cedula: emp.cedula,
          sueldo_base: emp.sueldo_base
        };
      });
      
      setNombresEmpleados(nombresMap);
    } catch (error) {
      console.error('Error cargando nombres de empleados:', error);
    }
  };

  // Función para obtener nombres de servicios
  const obtenerNombresServicios = async (serviciosIds: string[]) => {
    try {
      const { data: servicios } = await supabase
        .from('servicios')
        .select('id, nombre')
        .in('id', serviciosIds);
      
      const nombresMap: Record<string, string> = {};
      servicios?.forEach((serv: any) => {
        nombresMap[serv.id] = serv.nombre;
      });
      
      setNombresServicios(nombresMap);
    } catch (error) {
      console.error('Error cargando nombres de servicios:', error);
    }
  };

  // Cargar comisiones con paginación y filtros
  const cargarComisiones = async () => {
    try {
      setLoading(true);
      
      // Construir consulta base
      let query = supabase
        .from('comisiones')
        .select('id, empresa_id, empleado_id, venta_id, monto_base, porcentaje_aplicado, monto_comision, estado, created_at', { count: 'exact' })
        .eq('empresa_id', user?.empresa_id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (user?.rol !== 'admin_global' && user?.rol !== 'admin_empresa') {
        query = query.eq('empleado_id', user?.id);
      }

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      // Filtro por rango de fechas
      if (fechaInicio) {
        query = query.gte('created_at', new Date(fechaInicio).toISOString());
      }
      if (fechaFin) {
        query = query.lte('created_at', new Date(fechaFin + 'T23:59:59').toISOString());
      }

      // Aplicar paginación
      const from = itemOffset;
      const to = itemOffset + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error cargando comisiones:', error);
      } else {
        setTotalCount(count || 0);
        
        // Obtener IDs únicos para mapeo
        const empleadoIds = Array.from(new Set(data?.map((c: any) => c.empleado_id) || []));
        const ventaIds = Array.from(new Set(data?.map((c: any) => c.venta_id) || []));
        
        // Cargar nombres de empleados
        const { data: emps } = await supabase
          .from('empleados')
          .select('id, nombre_completo, cedula, sueldo_base, empresa_id')
          .eq('empresa_id', user?.empresa_id);
        
        const nombresMapDirecto: Record<string, any> = {};
        emps?.forEach((emp: any) => {
          nombresMapDirecto[emp.id] = {
            nombre_completo: emp.nombre_completo,
            cedula: emp.cedula,
            sueldo_base: emp.sueldo_base
          };
        });
        
        // Obtener servicios de cada venta
        const serviciosPorVenta: Record<string, string[]> = {};
        for (const ventaId of ventaIds) {
          const { data: detalles } = await supabase
            .from('detalles_ventas')
            .select('servicio_id')
            .eq('venta_id', ventaId)
            .not('servicio_id', 'is', null);
          
          const servicioIds = detalles?.map((d: any) => d.servicio_id) || [];
          serviciosPorVenta[ventaId] = servicioIds;
        }
        
        // Obtener nombres de servicios
        const todosServiciosIds = Object.values(serviciosPorVenta).flat();
        await obtenerNombresServicios(todosServiciosIds);
        
        // Enriquecer comisiones
        const comisionesEnriquecidas = (data || []).map((comision: any) => {
          const serviciosIds = serviciosPorVenta[comision.venta_id] || [];
          const nombresServ = serviciosIds.map((id: string) => nombresServicios[id]).filter(Boolean);
          const empleadoData = nombresMapDirecto[comision.empleado_id] || {};
          
          return {
            ...comision,
            nombre_completo: empleadoData.nombre_completo || 'Empleado',
            nombres_servicios: nombresServ,
            cedula: empleadoData.cedula,
            sueldo_base: empleadoData.sueldo_base
          };
        });
        
        // Filtrar por nombre de empleado si hay búsqueda
        let comisionesFiltradas = comisionesEnriquecidas;
        if (busquedaEmpleado.trim()) {
          comisionesFiltradas = comisionesEnriquecidas.filter((comision: any) =>
            comision.nombre_completo?.toLowerCase().includes(busquedaEmpleado.toLowerCase())
          );
        }
        
        setComisiones(comisionesFiltradas);
        setNombresEmpleados(nombresMapDirecto);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };




  // Obtener descripción del servicio/producto
  const getServicioProducto = (comision: Comision) => {
    if (comision.nombres_servicios && comision.nombres_servicios.length > 0) {
      const servicios = comision.nombres_servicios.slice(0, 2);
      return servicios.join(', ') || 'Servicio';
    }
    return 'Servicio';
  };

  // Calcular totales
  const totalPendiente = comisiones
    .filter((c: Comision) => c.estado === 'pendiente')
    .reduce((sum: number, c: Comision) => sum + c.monto_comision, 0);
  
  const totalPagado = comisiones
    .filter((c: Comision) => c.estado === 'pagado')
    .reduce((sum: number, c: Comision) => sum + c.monto_comision, 0);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  useEffect(() => {
    if (user) {
      cargarComisiones();
    }
  }, [user, itemOffset]);

  useEffect(() => {
    // Resetear paginación al cambiar filtros
    if (user) {
      setItemOffset(0);
      cargarComisiones();
    }
  }, [filtroEstado, busquedaEmpleado, fechaInicio, fechaFin]);

  // Resetear paginación al buscar
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusquedaEmpleado(e.target.value);
    setItemOffset(0);
  };

  // Función para vaciar según filtros
  const vaciarPorFiltros = async () => {
    if (!confirm('¿Está seguro de que desea eliminar las comisiones que coinciden con los filtros actuales? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      let query = supabase
        .from('comisiones')
        .delete()
        .eq('empresa_id', user?.empresa_id);

      // Aplicar mismos filtros que en carga
      if (user?.rol !== 'admin_global' && user?.rol !== 'admin_empresa') {
        query = query.eq('empleado_id', user?.id);
      }

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      if (fechaInicio) {
        query = query.gte('created_at', new Date(fechaInicio).toISOString());
      }
      if (fechaFin) {
        query = query.lte('created_at', new Date(fechaFin + 'T23:59:59').toISOString());
      }

      const { error } = await query;

      if (error) {
        console.error('Error eliminando comisiones:', error);
        alert('Error al eliminar comisiones');
      } else {
        alert('Comisiones eliminadas correctamente');
        
        // Registrar log de auditoría
        await registrarLog(supabase, {
          empresa_id: user?.empresa_id || undefined,
          usuario_id: user?.id,
          accion: 'ELIMINAR_COMISION',
          modulo: 'COMISIONES',
          detalles: {
            filtro_aplicado: filtroEstado,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            eliminado_por: user?.id,
            rol_usuario: user?.rol,
            fecha_eliminacion: new Date().toISOString()
          }
        });
        
        setItemOffset(0);
        cargarComisiones();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar comisiones');
    }
  };

// Componente de Gráfico de Pastel Simple (CSS puro)
const SimpleDoughnutChart = ({ data, formatMoneyFn }: { 
  data: { labels: string[]; values: number[]; colors: string[] }; 
  formatMoneyFn: (amount: number) => string;
}) => {
  const total = data.values.reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Sin datos</div>
        <div className="text-gray-400 text-xs">No hay comisiones</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
        {data.values.map((value, index) => {
          if (value <= 0) return null;
          const percentage = (value / total) * 100;
          return (
            <div
              key={index}
              className="absolute inset-0 rounded-full border-8 border-transparent"
              style={{
                borderTopColor: data.colors[index],
                transform: `rotate(${index === 0 ? 0 : (data.values.slice(0, index).reduce((a, b) => a + b, 0) / total) * 360}deg)`,
                clipPath: index === data.values.length - 1 ? 'none' : `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((percentage * Math.PI) / 180)}% ${50 - 50 * Math.sin((percentage * Math.PI) / 180)}%)`
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 space-y-1 w-full">
        {data.labels.map((label, index) => {
          if (data.values[index] <= 0) return null;
          return (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div 
                  className="w-2 h-2 rounded-full mr-2" 
                  style={{ backgroundColor: data.colors[index] }}
                />
                <span>{label}</span>
              </div>
              <span className="font-semibold">
                {formatMoneyFn(data.values[index])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente de Gráfico de Barras Simple (CSS puro)
const SimpleBarChart = ({ data, formatMoneyFn }: { 
  data: { labels: string[]; values: number[]; colors: string[] }; 
  formatMoneyFn: (amount: number) => string;
}) => {
  const maxValue = Math.max(...data.values);
  
  if (maxValue === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Sin datos</div>
        <div className="text-gray-400 text-xs">No hay comisiones</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full h-24 flex items-end justify-center gap-4">
        {data.labels.map((label, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="w-full max-w-8 bg-gray-200 rounded-t relative" style={{ height: '100%' }}>
              <div
                className="absolute bottom-0 w-full rounded-t"
                style={{
                  height: `${maxValue > 0 ? (data.values[index] / maxValue) * 100 : 0}%`,
                  backgroundColor: data.colors[index],
                  minHeight: data.values[index] > 0 ? '4px' : '0'
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 w-full flex justify-center gap-4">
        {data.labels.map((label, index) => (
          <div key={index} className="text-center flex-1">
            <div className="text-xs truncate">{label}</div>
            <div className="text-xs font-semibold">{formatMoneyFn(data.values[index])}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

return (
  <MainLayout>
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.rol === 'admin_global' || user?.rol === 'admin_empresa' ? 'Todas las Comisiones' : 'Mis Comisiones'}
        </h1>
        <p className="text-gray-600 mt-1">
          {user?.rol === 'admin_global' || user?.rol === 'admin_empresa' 
            ? 'Gestiona todas las comisiones del sistema' 
            : 'Revisa tus ganancias por comisiones'
          }
        </p>
      </div>

      {/* Filtros y Totales con Gráficos Integrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600">Pendientes</div>
            <div className="text-2xl font-bold text-amber-600">
              {formatMoney(totalPendiente)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600">Pagadas</div>
            <div className="text-2xl font-bold text-green-600 mb-4">
              {formatMoney(totalPagado)}
            </div>
            {/* Gráfico de Pastel Real */}
            <div className="h-40 border border-gray-200 rounded p-2 flex items-center justify-center">
              <SimpleDoughnutChart 
                data={{
                  labels: ['Pendientes', 'Pagadas'],
                  values: [totalPendiente, totalPagado],
                  colors: ['#f59e0b', '#10b981']
                }}
                formatMoneyFn={formatMoney}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600">Total Ganado</div>
            <div className="text-2xl font-bold text-blue-600 mb-4">
              {formatMoney(totalPendiente + totalPagado)}
            </div>
            {/* Gráfico de Barras Real */}
            <div className="h-40 border border-gray-200 rounded p-2 flex items-center justify-center">
              <SimpleBarChart 
                data={{
                  labels: ['Pendientes', 'Pagadas'],
                  values: [totalPendiente, totalPagado],
                  colors: ['#f59e0b', '#10b981']
                }}
                formatMoneyFn={formatMoney}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Filtros Avanzados</div>
            
            {/* Búsqueda por empleado */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Buscar Empleado</label>
              <input
                type="text"
                value={busquedaEmpleado}
                onChange={handleSearchChange}
                placeholder="Nombre del empleado..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Filtro por estado */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="pagado">Pagadas</option>
              </select>
            </div>
            
            {/* Filtro por rango de fechas */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <Button
              onClick={() => {
                setItemOffset(0);
                cargarComisiones();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              Aplicar Filtros
            </Button>
            
            <Button
              onClick={vaciarPorFiltros}
              className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
              size="sm"
            >
              Vaciar por Filtros
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Comisiones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Comisiones</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comisiones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {(user?.rol === 'admin_global' || user?.rol === 'admin_empresa') ? 'Empleado' : 'Cliente'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comisión
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comisiones.map((comision) => (
                    <tr key={comision.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(comision.created_at).toLocaleString('es-MX')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(user?.rol === 'admin_global' || user?.rol === 'admin_empresa') 
                          ? `Empleado ID: ${comision.empleado_id}`
                          : 'Tu comisión'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Venta #{comision.venta_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatMoney(comision.monto_base)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        <div>
                          <div>{formatMoney(comision.monto_comision)}</div>
                          <div className="text-xs text-gray-500">{Math.round(comision.porcentaje_aplicado)}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge
                          className={
                            comision.estado === 'pendiente'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }
                        >
                          {comision.estado === 'pendiente' ? 'Pendiente' : 'Pagado'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {filtroEstado === 'todos' 
                  ? 'Aún no tienes comisiones registradas'
                  : `No tienes comisiones ${filtroEstado}s`
                }
              </div>
            </div>
          )}
          
          {/* Paginación (consistente con clientes) */}
          {pageCount > 0 && (
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Mostrando {itemOffset + 1} a {Math.min(endOffset + 1, totalCount)} de {totalCount} resultados
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItemOffset(Math.max(0, itemOffset - itemsPerPage))}
                  disabled={itemOffset === 0}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItemOffset(Math.min(totalCount - itemsPerPage, itemOffset + itemsPerPage))}
                  disabled={itemOffset >= totalCount - itemsPerPage}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}
