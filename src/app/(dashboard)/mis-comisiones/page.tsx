'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { createClient } from '@/lib/supabase-client';
import { MainLayout } from '@/components/layout/main-layout';

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
  ventas?: {
    clientes?: { nombre: string };
    detalles_ventas?: Array<{
      productos?: { nombre: string };
      servicios?: { nombre: string };
    }>;
  };
  empleados?: {
    nombre: string;
  };
}

export default function MisComisionesPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loading, setLoading] = useState(true);
  const [liquidando, setLiquidando] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'pagado'>('todos');

  // Cargar comisiones
  const cargarComisiones = async () => {
    try {
      setLoading(true);
      
      
      let query = supabase
        .from('comisiones')
        .select('id, empresa_id, empleado_id, venta_id, monto_base, porcentaje_aplicado, monto_comision, estado, created_at')
        .eq('empresa_id', user?.empresa_id)
        .order('created_at', { ascending: false });

      // Si no es admin, filtrar por empleado actual
      if (user?.rol !== 'admin_global' && user?.rol !== 'admin_empresa') {
        console.log('Filtrando por empleado:', user?.id);
        query = query.eq('empleado_id', user?.id);
      }

      // Aplicar filtro de estado
      if (filtroEstado !== 'todos') {
        console.log('Aplicando filtro de estado:', filtroEstado);
        query = query.eq('estado', filtroEstado);
      }

      console.log('Consulta final:', query);

      const { data, error } = await query;

      if (error) {
        console.error('Error cargando comisiones:', error);
      } else {
        console.log('Comisiones encontradas:', data?.length || 0);
        console.log('Datos:', data);
        setComisiones(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Liquidar comisión (solo admin)
  const liquidarComision = async (comisionId: string) => {
    try {
      setLiquidando(comisionId);
      
      // Obtener información de la comisión para el movimiento de caja
      const { data: comisionData, error: comisionError } = await supabase
        .from('comisiones')
        .select('*')
        .eq('id', comisionId)
        .single();
      
      if (comisionError || !comisionData) {
        console.error('Error obteniendo comisión:', comisionError);
        return;
      }

      // Verificar si hay caja activa
      const { data: cajaActiva, error: cajaError } = await supabase
        .from('cajas')
        .select('*')
        .eq('empresa_id', user?.empresa_id)
        .eq('estado', 'abierta')
        .single();
      
      if (cajaError || !cajaActiva) {
        alert('No hay una caja activa. Debe abrir una caja para liquidar comisiones.');
        return;
      }

      // Actualizar estado de la comisión
      const { error: updateError } = await supabase
        .from('comisiones')
        .update({ estado: 'pagado' })
        .eq('id', comisionId);

      if (updateError) {
        console.error('Error actualizando comisión:', updateError);
        return;
      }

      // Crear movimiento de salida en caja
      const movimientoData = {
        caja_id: cajaActiva.id,
        empresa_id: user?.empresa_id,
        tipo: 'salida',
        categoria: 'Pago de Comisión',
        monto: comisionData.monto_comision,
        descripcion: `Liquidación de comisión - Empleado: ${comisionData.empleados?.nombre}`,
        fecha: new Date().toISOString(),
        referencia_id: comisionId,
        referencia_tipo: 'comision'
      };

      const { error: movimientoError } = await supabase
        .from('movimientos_caja')
        .insert(movimientoData);

      if (movimientoError) {
        console.error('Error creando movimiento de caja:', movimientoError);
        alert('Comisión liquidada pero hubo un error al registrar el movimiento de caja.');
      } else {
        console.log('Movimiento de caja creado exitosamente:', movimientoData);
      }

      // Recargar comisiones
      await cargarComisiones();
      
    } catch (error) {
      console.error('Error liquidando comisión:', error);
    } finally {
      setLiquidando(null);
    }
  };

  // Obtener descripción del servicio/producto
  const getServicioProducto = (comision: Comision) => {
    if (comision.ventas?.detalles_ventas && comision.ventas.detalles_ventas.length > 0) {
      const detalles = comision.ventas.detalles_ventas;
      const servicios = detalles
        .filter(d => d.servicios?.nombre)
        .map(d => d.servicios?.nombre)
        .slice(0, 2);
      const productos = detalles
        .filter(d => d.productos?.nombre)
        .map(d => d.productos?.nombre)
        .slice(0, 2);
      
      return [...servicios, ...productos].join(', ') || 'Servicio/Producto';
    }
    return 'Servicio/Producto';
  };

  // Calcular totales
  const totalPendiente = comisiones
    .filter(c => c.estado === 'pendiente')
    .reduce((sum, c) => sum + c.monto_comision, 0);
  
  const totalPagado = comisiones
    .filter(c => c.estado === 'pagado')
    .reduce((sum, c) => sum + c.monto_comision, 0);

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
  }, [user, filtroEstado]);

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

      {/* Filtros y Totales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(totalPagado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600">Total Ganado</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatMoney(totalPendiente + totalPagado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Filtrar por</div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="pagado">Pagadas</option>
            </select>
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
                    {(user?.rol === 'admin_global' || user?.rol === 'admin_empresa') && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
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
                      {(user?.rol === 'admin_global' || user?.rol === 'admin_empresa') && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {comision.estado === 'pendiente' && (
                            <Button
                              onClick={() => liquidarComision(comision.id)}
                              disabled={liquidando === comision.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              {liquidando === comision.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                'Liquidar'
                              )}
                            </Button>
                          )}
                          {comision.estado === 'pagado' && (
                            <span className="text-green-600 text-sm">Pagada</span>
                          )}
                        </td>
                      )}
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
                  : `No hay comisiones ${filtroEstado === 'pendiente' ? 'pendientes' : 'pagadas'}`
                }
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Las comisiones se generan automáticamente cuando realizas ventas
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}
