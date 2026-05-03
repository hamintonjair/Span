'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { registrarLog } from '@/lib/audit';
import { 
  EyeIcon, 
  PrinterIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

// Interfaces
interface Venta {
  id: string; // uuid
  empresa_id: string; // uuid
  cliente_id?: string; // uuid
  subtotal: number; // numeric
  total: number; // numeric
  metodo_pago: string; // varchar
  impuestos: number; // numeric
  descuentos: number; // numeric
  estado: 'completada' | 'anulada' | 'pendiente'; // varchar
  created_at: string; // timestamptz
  clientes?: {
    nombre: string; // varchar
    cedula?: string; // varchar
  };
}

interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id?: string;
  servicio_id?: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  subtotal: number;
  productos?: {
    nombre: string;
    sku?: string;
    tipo: 'venta' | 'insumo';
  };
  servicios?: {
    nombre: string;
  };
}

interface Producto {
  id: string; // uuid
  nombre: string; // varchar
  stock: number; // int4
  tipo: 'venta' | 'insumo'; // varchar
}

// Formateador de dinero
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Componente de Ticket (reutilizado del POS)
const TicketPrint = ({ venta, detalles }: { venta: Venta; detalles: DetalleVenta[] }) => {
  return (
    <div className="bg-white p-4 max-w-xs mx-auto text-sm" id="ticket-print">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">TICKET DE VENTA</h2>
        <p className="text-xs text-gray-600">Fecha: {format(new Date(venta.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs"><strong>Cliente:</strong> {venta.clientes?.nombre || 'Cliente general'}</p>
        <p className="text-xs"><strong>Método:</strong> {venta.metodo_pago}</p>
        <p className="text-xs"><strong>Estado:</strong> {venta.estado}</p>
      </div>

      <div className="border-t border-b border-gray-300 py-2 mb-2">
        <h3 className="font-bold text-sm mb-2">DETALLE</h3>
        {detalles.map((detalle, index) => (
          <div key={detalle.id} className="flex justify-between text-xs mb-1">
            <div className="flex-1">
              <span>{detalle.cantidad}x </span>
              <span>{detalle.productos?.nombre || detalle.servicios?.nombre || 'Item'}</span>
            </div>
            <span className="text-right">{formatMoney(detalle.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatMoney(venta.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Impuestos:</span>
          <span>{formatMoney(venta.impuestos)}</span>
        </div>
        <div className="flex justify-between">
          <span>Descuentos:</span>
          <span>{formatMoney(venta.descuentos)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>TOTAL:</span>
          <span>{formatMoney(venta.total)}</span>
        </div>
      </div>
    </div>
  );
};

export default function VentasPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();

  // Estados principales
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [detallesVenta, setDetallesVenta] = useState<DetalleVenta[]>([]);
  
  // Estados de modales
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showAnulacionModal, setShowAnulacionModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [loadingAnulacion, setLoadingAnulacion] = useState(false);

  // Estados de paginación
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de filtros
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);

  // Cargar ventas
  useEffect(() => {
    if (user?.empresa_id) {
      cargarVentas();
      cargarClientes();
    }
  }, [user?.empresa_id]);

  // Sincronizar página actual con offset
  useEffect(() => setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1), [itemOffset, itemsPerPage]);

  // Resetear offset cuando cambian filtros y recargar ventas
  useEffect(() => {
    if (user?.empresa_id) {
      setItemOffset(0);
    }
  }, [filtroFechaInicio, filtroFechaFin, filtroCliente]);

  // Recargar ventas cuando cambian filtros o offset
  useEffect(() => {
    if (user?.empresa_id) {
      cargarVentas();
    }
  }, [filtroFechaInicio, filtroFechaFin, filtroCliente, itemOffset]);

  const cargarVentas = async () => {
    const timeoutId = setTimeout(() => {
      console.warn('Timeout: La consulta está tomando demasiado tiempo');
      setLoading(false);
    }, 10000); // 10 segundos timeout

    try {
      setLoading(true);

      if (!user?.empresa_id) {
        clearTimeout(timeoutId);
        return;
      }

      // Construir consulta base
      let query = (supabase as any)
        .from('ventas')
        .select(`
          *,
          clientes (
            nombre,
            cedula
          )
        `, { count: 'exact' })
        .eq('empresa_id', user.empresa_id)
        .is('cita_id', null);

      // Aplicar filtros
      if (filtroFechaInicio) {
        query = query.gte('created_at', filtroFechaInicio);
      }
      if (filtroFechaFin) {
        query = query.lte('created_at', filtroFechaFin + ' 23:59:59');
      }
      if (filtroCliente) {
        query = query.eq('cliente_id', filtroCliente);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false });

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error cargando ventas:', error);
        return;
      }

      setVentas(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes para el filtro
  const cargarClientes = async () => {
    try {
      if (!user?.empresa_id) return;

      const { data, error } = await (supabase as any)
        .from('clientes')
        .select('id, nombre, cedula')
        .eq('empresa_id', user.empresa_id)
        .order('nombre');

      if (error) {
        console.error('Error cargando clientes:', error);
        return;
      }

      setClientes(data || []);
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  // Cargar detalles de una venta
  const cargarDetallesVenta = async (ventaId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('detalles_ventas')
        .select(`
          *,
          productos (
            nombre,
            sku,
            tipo
          ),
          servicios (
            nombre
          )
        `)
        .eq('venta_id', ventaId);

      if (error) {
        console.error('Error cargando detalles:', error);
        return;
      }

      setDetallesVenta(data || []);
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  // Ver detalle de venta
  const verDetalle = async (venta: Venta) => {
    setVentaSeleccionada(venta);
    await cargarDetallesVenta(venta.id);
    setShowDetalleModal(true);
  };

  // Imprimir ticket - Redirige a la página de impresión
  const imprimirTicket = (venta: Venta) => {
    window.open(`/ventas/imprimir/${venta.id}?from=historial`, '_blank');
  };

  // Realizar impresión
  const realizarImpresion = () => {
    const printContent = document.getElementById('ticket-print');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket de Venta</title>
              <style>
                body { margin: 0; padding: 20px; font-family: monospace; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
    setShowPrintModal(false);
  };

  // Anular venta
  const anularVenta = async () => {
    if (!ventaSeleccionada) return;

    try {
      setLoadingAnulacion(true);


      try {
        const resultado = await (supabase as any)
          .from('ventas')
          .update({ 
            estado: 'anulada'
          })
          .eq('id', ventaSeleccionada.id);

        if (resultado.error) {
          console.error('Error anulando venta:', resultado.error.message);

          // Verificar específicamente si es error de RLS
          if (resultado.error.message?.includes('row-level security policy')) {
            console.error('ERROR DE RLS: La política de seguridad no permite actualizaciones');
            console.error('Solución: Revisar y actualizar las políticas RLS en Supabase para permitir UPDATE');
          }

          console.error('Detalles completos:', {
            message: resultado.error.message,
            details: resultado.error.details,
            hint: resultado.error.hint,
            code: resultado.error.code
          });
          return;
        }
        
        // Registrar log de auditoría
        await registrarLog(supabase, {
          empresa_id: user?.empresa_id || undefined,
          usuario_id: user?.id,
          accion: 'ANULAR_VENTA',
          modulo: 'VENTAS',
          detalles: {
            venta_id: ventaSeleccionada.id,
            total: ventaSeleccionada.total,
            cliente: ventaSeleccionada.clientes?.nombre || 'Cliente general',
            metodo_pago: ventaSeleccionada.metodo_pago
          }
        });
      } catch (catchError) {
        console.error('Error catch en anulación:', catchError);
        return;
      }

      // 2. Devolver stock de productos físicos
      const productosFisicos = detallesVenta.filter(d => d.productos && d.productos.tipo === 'venta');

      for (const detalle of productosFisicos) {
        if (detalle.producto_id) {
          try {
            const { data: productoData, error: errorStock } = await supabase
              .from('productos')
              .select('stock')
              .eq('id', detalle.producto_id)
              .single();

            if (!errorStock && productoData) {
              // Usamos los tipos correctos basados en la estructura de la BD
              const stockActual = Number((productoData as any).stock) || 0;
              const cantidadDevuelta = Number(detalle.cantidad) || 0;
              const nuevoStock = stockActual + cantidadDevuelta;

              const resultadoStock = await (supabase as any)
                .from('productos')
                .update({ stock: nuevoStock })
                .eq('id', detalle.producto_id);

              if (resultadoStock.error) {
                console.error('Error actualizando stock:', resultadoStock.error);
              }
            }
          } catch (catchError) {
            console.error('Error catch en actualización de stock:', catchError);
          }
        }
      }

      // 3. Recargar ventas
      await cargarVentas();

      // 4. Cerrar modales
      setShowAnulacionModal(false);
      setShowDetalleModal(false);
      setVentaSeleccionada(null);
      setDetallesVenta([]);

    } catch (error) {
      console.error('Error anulando venta:', error);
    } finally {
      setLoadingAnulacion(false);
    }
  };

  // Paginación del lado del cliente
  const endOffset = itemOffset + itemsPerPage - 1;
  const pageCount = Math.ceil(totalCount / itemsPerPage);
  const paginatedVentas = useMemo(() => {
    return ventas.slice(itemOffset, endOffset + 1);
  }, [ventas, itemOffset, itemsPerPage]);

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    // Limpiar todos los filtros en batch
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
    setFiltroCliente('');
    // El itemOffset se reseteará automáticamente por el useEffect
  };

  // Obtener color de estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'anulada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando historial de ventas...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial de Ventas</h1>
          <p className="text-gray-600">Consulta y gestiona todas las ventas realizadas</p>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro de fecha inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <Input
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                />
              </div>

              {/* Filtro de fecha fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <Input
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                />
              </div>

              {/* Filtro de cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Todos los clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={limpiarFiltros}
                variant="outline"
                size="sm"
              >
                Limpiar Filtros
              </Button>
              <div className="text-sm text-gray-600 ml-auto flex items-center">
                Total: {totalCount} ventas
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Ventas */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-left p-2">Total</th>
                    <th className="text-left p-2">Método</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVentas.length > 0 ? (
                    paginatedVentas.map((venta) => (
                      <tr key={venta.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {format(new Date(venta.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </td>
                        <td className="p-2">{venta.clientes?.nombre || 'Cliente general'}</td>
                        <td className="p-2 font-medium">{formatMoney(venta.total)}</td>
                        <td className="p-2 capitalize">{venta.metodo_pago}</td>
                        <td className="p-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEstadoColor(venta.estado)}`}>
                            {venta.estado}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => verDetalle(venta)}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => imprimirTicket(venta)}
                            >
                              <PrinterIcon className="w-4 h-4" />
                            </Button>
                            {venta.estado !== 'anulada' && (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  setVentaSeleccionada(venta);
                                  setShowAnulacionModal(true);
                                }}
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        No se encontraron ventas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pageCount > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-700">
                  Mostrando {itemOffset + 1} a {Math.min(endOffset + 1, totalCount)} de {totalCount} ventas
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItemOffset(Math.max(0, itemOffset - itemsPerPage))}
                    disabled={itemOffset === 0}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-700">Página {currentPage} de {pageCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItemOffset(Math.min(itemOffset + itemsPerPage, totalCount - itemsPerPage))}
                    disabled={itemOffset + itemsPerPage >= totalCount}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalle */}
        {showDetalleModal && ventaSeleccionada && (
          <Modal
            isOpen={showDetalleModal}
            onClose={() => setShowDetalleModal(false)}
            title={`Detalle de Venta - ${ventaSeleccionada.clientes?.nombre || 'Cliente general'}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Fecha:</span>
                  <p>{format(new Date(ventaSeleccionada.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                </div>
                <div>
                  <span className="font-medium">Método de Pago:</span>
                  <p className="capitalize">{ventaSeleccionada.metodo_pago}</p>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEstadoColor(ventaSeleccionada.estado)}`}>
                      {ventaSeleccionada.estado}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Total:</span>
                  <p className="font-bold">{formatMoney(ventaSeleccionada.total)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Productos y Servicios</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Item</th>
                        <th className="text-left p-2">Cantidad</th>
                        <th className="text-left p-2">Precio Unit.</th>
                        <th className="text-left p-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallesVenta.map((detalle) => (
                        <tr key={detalle.id} className="border-b">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">
                                {detalle.productos?.nombre || detalle.servicios?.nombre || 'Item'}
                              </p>
                              {detalle.productos?.sku && (
                                <p className="text-xs text-gray-500">SKU: {detalle.productos.sku}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-2">{detalle.cantidad}</td>
                          <td className="p-2">{formatMoney(detalle.precio_unitario)}</td>
                          <td className="p-2 font-medium">{formatMoney(detalle.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => imprimirTicket(ventaSeleccionada)}
                >
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  Imprimir Ticket
                </Button>
                {ventaSeleccionada.estado !== 'anulada' && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setShowDetalleModal(false);
                      setShowAnulacionModal(true);
                    }}
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Anular Venta
                  </Button>
                )}
                <Button onClick={() => setShowDetalleModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal de Anulación */}
        {showAnulacionModal && ventaSeleccionada && (
          <Modal
            isOpen={showAnulacionModal}
            onClose={() => setShowAnulacionModal(false)}
            title="Confirmar Anulación"
            size="md"
          >
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <h3 className="font-medium text-yellow-800">¿Está seguro de anular esta venta?</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Esta acción no se puede deshacer y devolverá el stock de los productos físicos.
                  </p>
                </div>
              </div>

              <div className="text-sm">
                <p><strong>Venta:</strong> #{ventaSeleccionada.id.slice(-8)}</p>
                <p><strong>Cliente:</strong> {ventaSeleccionada.clientes?.nombre || 'Cliente general'}</p>
                <p><strong>Total:</strong> {formatMoney(ventaSeleccionada.total)}</p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowAnulacionModal(false)}
                  disabled={loadingAnulacion}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={anularVenta}
                  disabled={loadingAnulacion}
                >
                  {loadingAnulacion ? 'Anulando...' : 'Confirmar Anulación'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal de Impresión */}
        {showPrintModal && ventaSeleccionada && (
          <Modal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            title="Vista Previa del Ticket"
            size="md"
          >
            <div className="space-y-4">
              <TicketPrint venta={ventaSeleccionada} detalles={detallesVenta} />

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPrintModal(false)}
                >
                  Cerrar
                </Button>
                <Button onClick={realizarImpresion}>
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </MainLayout>
  );
}
