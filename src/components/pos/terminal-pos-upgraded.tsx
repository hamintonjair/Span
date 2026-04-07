'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase-client';

interface Cita {
  id: string;
  cliente_id: string | null;
  empleado_id: string;
  fecha: string;
  estado: string;
  total_estimado: number;
  servicios_ids: string[];
  notas?: string;
  clientes?: {
    nombre?: string;
    email?: string;
    telefono?: string;
  };
  empleados?: {
    perfiles?: {
      nombre?: string;
    };
  };
}

interface Producto {
  id: string;
  nombre: string;
  precio_venta: number;
  stock: number;
  categoria: string;
  estado: string;
}

interface Servicio {
  id: string;
  nombre: string;
  precio: number;
  duracion_minutos: number;
  estado: string;
}

interface CarritoItem {
  tipo: 'producto' | 'servicio';
  id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

interface TerminalPOSProps {
  empresaId: string;
}

export function TerminalPOSUpgraded({ empresaId }: TerminalPOSProps) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [showUpsellingModal, setShowUpsellingModal] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [showReciboModal, setShowReciboModal] = useState(false);
  const [ventaProcesada, setVentaProcesada] = useState<any>(null);
  const [emailCliente, setEmailCliente] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');

  const supabase = createClient();

  useEffect(() => {
    if (!empresaId || empresaId === '1') {
      console.error('empresa_id inválido:', empresaId);
      return;
    }
    cargarDatos();
  }, [empresaId]);

  const cargarDatos = async () => {
    if (!empresaId || empresaId === '1') {
      console.error('empresa_id inválido en cargarDatos:', empresaId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Cargar citas del día con relaciones
      const hoy = new Date().toISOString().split('T')[0];
      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select('id, cliente_id, empleado_id, fecha, estado, total_estimado, servicios_ids, notas')
        .eq('empresa_id', empresaId)
        .eq('created_at::date', hoy)
        .in('estado', ['pendiente', 'en_proceso'])
        .order('fecha', { ascending: true });

      if (citasError) throw citasError;

      // Cargar productos disponibles
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta, stock, categoria, estado')
        .eq('empresa_id', empresaId)
        .eq('estado', 'activo')
        .gt('stock', 0)
        .order('nombre');

      if (productosError) throw productosError;

      // Cargar servicios disponibles
      const { data: serviciosData, error: serviciosError } = await supabase
        .from('servicios')
        .select('id, nombre, precio, duracion_minutos, estado')
        .eq('empresa_id', empresaId)
        .eq('estado', 'activo')
        .order('nombre');

      if (serviciosError) throw serviciosError;

      setCitas(citasData || []);
      setProductos(productosData || []);
      setServicios(serviciosData || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarCita = (cita: Cita) => {
    setCitaSeleccionada(cita);
    setShowUpsellingModal(true);
    setCarrito([]);
    setEmailCliente(cita.clientes?.email || '');
  };

  const handleAgregarItem = (tipo: 'producto' | 'servicio', item: Producto | Servicio) => {
    const itemExistente = carrito.find(
      i => i.tipo === tipo && i.id === item.id
    );

    const precioUnitario = tipo === 'producto' ? (item as Producto).precio_venta : (item as Servicio).precio;

    if (itemExistente) {
      setCarrito(carrito.map(i =>
        i.tipo === tipo && i.id === item.id
          ? { ...i, cantidad: i.cantidad + 1, total: (i.cantidad + 1) * precioUnitario }
          : i
      ));
    } else {
      setCarrito([
        ...carrito,
        {
          tipo,
          id: item.id,
          nombre: item.nombre,
          cantidad: 1,
          precio_unitario: precioUnitario,
          total: precioUnitario
        }
      ]);
    }
  };

  const handleActualizarCantidad = (index: number, cantidad: number) => {
    if (cantidad <= 0) {
      setCarrito(carrito.filter((_, i) => i !== index));
    } else {
      setCarrito(carrito.map((item, i) =>
        i === index
          ? { ...item, cantidad, total: cantidad * item.precio_unitario }
          : item
      ));
    }
  };

  const calcularTotal = () => {
    const base = citaSeleccionada?.total_estimado || 0;
    const adicionales = carrito.reduce((sum, item) => sum + item.total, 0);
    const impuestos = (base + adicionales) * 0.16; // 16% IVA
    return base + adicionales + impuestos;
  };

  const handleProcesarVenta = async () => {
    if (!citaSeleccionada) return;

    setProcesando(true);
    try {
      // 1. Obtener caja abierta
      const { data: caja, error: cajaError } = await supabase
        .from('cajas')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('estado', 'abierta')
        .single();

      if (cajaError || !caja) {
        throw new Error('No hay una caja abierta. Por favor, abra una caja primero.');
      }

      // 2. Crear la venta
      const subtotal = (citaSeleccionada.total_estimado || 0) + carrito.reduce((sum, item) => sum + item.total, 0);
      const impuestos = subtotal * 0.16;
      const total = subtotal + impuestos;

      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          empresa_id: empresaId,
          caja_id: caja.id,
          cliente_id: citaSeleccionada.cliente_id || null,
          clientemail: citaSeleccionada.clientes?.email || '',
          empleado_id: citaSeleccionada.empleado_id,
          cita_id: citaSeleccionada.id,
          subtotal,
          impuestos,
          total,
          metodo_pago: 'efectivo',
          estado: 'completada',
          fecha: new Date().toISOString()
        })
        .select()
        .single();

      if (ventaError) throw ventaError;

      // 3. Crear detalles de venta
      const detallesVenta = [];
      
      // Agregar servicios de la cita
      if (citaSeleccionada.servicios_ids && citaSeleccionada.servicios_ids.length > 0) {
        for (const servicioId of citaSeleccionada.servicios_ids) {
          const { data: servicio } = await supabase
            .from('servicios')
            .select('nombre, precio')
            .eq('id', servicioId)
            .single();
          
          if (servicio) {
            detallesVenta.push({
              venta_id: venta.id,
              servicio_id: servicioId,
              cantidad: 1,
              precio_unitario: servicio.precio,
              subtotal: servicio.precio
            });
          }
        }
      }

      // Agregar items del carrito
      for (const item of carrito) {
        detallesVenta.push({
          venta_id: venta.id,
          [item.tipo === 'producto' ? 'producto_id' : 'servicio_id']: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.total
        });

        // 4. Actualizar stock de productos
        if (item.tipo === 'producto') {
          const { data: productoActual } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', item.id)
            .single();

          if (productoActual) {
            const nuevoStock = productoActual.stock - item.cantidad;
            await supabase
              .from('productos')
              .update({ stock: nuevoStock })
              .eq('id', item.id);
          }
        }
      }

      // Insertar detalles de venta
      if (detallesVenta.length > 0) {
        await supabase
          .from('detalles_ventas')
          .insert(detallesVenta);
      }

      // 5. Actualizar estado de la cita
      await supabase
        .from('citas')
        .update({ estado: 'finalizada' })
        .eq('id', citaSeleccionada.id);

      // 6. Preparar datos del recibo
      const reciboData = {
        id: venta.id,
        cliente: citaSeleccionada.clientes?.nombre || 'Cliente',
        email: citaSeleccionada.clientes?.email || '',
        fecha: new Date().toLocaleString('es-MX'),
        items: [
          ...(citaSeleccionada.servicios_ids || []).map(id => ({
            nombre: 'Servicio Principal',
            cantidad: 1,
            precio: citaSeleccionada.total_estimado || 0
          })),
          ...carrito.map(item => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio_unitario
          }))
        ],
        subtotal,
        impuestos,
        total
      };

      setVentaProcesada(reciboData);
      setShowReciboModal(true);
      setShowUpsellingModal(false);
      
      // Limpiar estados
      setCitaSeleccionada(null);
      setCarrito([]);
      await cargarDatos();

    } catch (error) {
      console.error('Error al procesar venta:', error);
      alert(`Error al procesar la venta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcesando(false);
    }
  };

  const handleEnviarRecibo = async () => {
    if (!ventaProcesada || !emailCliente) return;

    try {
      // Simulación de envío de email - en producción usar el servicio real
      console.log('Enviando recibo a:', emailCliente, ventaProcesada);
      alert('Recibo enviado exitosamente');
      setShowReciboModal(false);
      setVentaProcesada(null);
    } catch (error) {
      console.error('Error enviando recibo:', error);
      alert('Error al enviar el recibo por email');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso': return 'bg-blue-100 text-blue-800';
      case 'finalizada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">🛒 Terminal Punto de Venta</h2>
          <p className="text-sm text-gray-600">Citas del día - {new Date().toLocaleDateString('es-MX')}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {citas.map((cita) => (
              <div
                key={cita.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">{cita.clientes?.nombre || 'Cliente'}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(cita.estado)}`}>
                        {cita.estado.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Servicios: {cita.servicios_ids?.length || 0} • Estilista: {cita.empleados?.perfiles?.nombre || 'N/A'}</p>
                      <p>{new Date(cita.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} • ${cita.total_estimado?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSeleccionarCita(cita)}
                    disabled={cita.estado === 'finalizada'}
                    className="ml-4"
                  >
                    {cita.estado === 'finalizada' ? 'Completada' : '💳 Cobrar'}
                  </Button>
                </div>
              </div>
            ))}
            
            {citas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay citas programadas para hoy
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Upselling */}
      <Modal
        isOpen={showUpsellingModal}
        onClose={() => setShowUpsellingModal(false)}
        title={`Cobrar - ${citaSeleccionada?.clientes?.nombre || 'Cliente'}`}
        size="xl"
      >
        {citaSeleccionada && (
          <div className="space-y-6">
            {/* Información de la cita */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">📋 Servicio Principal</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Cita ID: {citaSeleccionada.id}</p>
                  <p className="text-sm text-gray-600">Estilista: {citaSeleccionada.empleados?.perfiles?.nombre || 'N/A'}</p>
                </div>
                <p className="font-medium">${(citaSeleccionada.total_estimado || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Productos sugeridos para upselling */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">🛍️ Productos Sugeridos</h4>
                <select
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todas las categorías</option>
                  {Array.from(new Set(productos.map(p => p.categoria)))
                    .filter(cat => cat)
                    .sort()
                    .map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {productos
                  .filter(producto => !categoriaSeleccionada || producto.categoria === categoriaSeleccionada)
                  .slice(0, 6)
                  .map((producto) => (
                    <div key={producto.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{producto.nombre}</p>
                          <p className="text-xs text-gray-500">Stock: {producto.stock}</p>
                          <p className="text-xs text-gray-500">{producto.categoria}</p>
                        </div>
                        <p className="font-medium text-sm">${producto.precio_venta.toFixed(2)}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAgregarItem('producto', producto)}
                        disabled={producto.stock === 0}
                        className="w-full"
                      >
                        {producto.stock === 0 ? 'Sin stock' : 'Agregar'}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Servicios adicionales */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">💇 Servicios Adicionales</h4>
              <div className="grid grid-cols-2 gap-3">
                {servicios.slice(0, 4).map((servicio) => (
                  <div key={servicio.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{servicio.nombre}</p>
                        <p className="text-xs text-gray-500">{servicio.duracion_minutos} min</p>
                      </div>
                      <p className="font-medium text-sm">${servicio.precio.toFixed(2)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAgregarItem('servicio', servicio)}
                      className="w-full"
                    >
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrito */}
            {carrito.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">🛒 Carrito Adicional</h4>
                <div className="space-y-2">
                  {carrito.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.nombre}</p>
                        <p className="text-xs text-gray-500">
                          ${item.precio_unitario.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          value={item.cantidad}
                          onChange={(e) => handleActualizarCantidad(index, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <p className="font-medium text-sm w-20 text-right">
                          ${item.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total y Procesar */}
            <div className="border-t pt-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${((citaSeleccionada.total_estimado || 0) + carrito.reduce((sum, item) => sum + item.total, 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (16%):</span>
                  <span>${(((citaSeleccionada.total_estimado || 0) + carrito.reduce((sum, item) => sum + item.total, 0)) * 0.16).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total a pagar:</span>
                  <span className="text-2xl font-bold text-amber-600">
                    ${calcularTotal().toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleProcesarVenta}
                  disabled={procesando}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {procesando ? 'Procesando...' : '💳 Finalizar Cobro'}
                </Button>
                <Button
                  onClick={() => setShowUpsellingModal(false)}
                  variant="outline"
                  disabled={procesando}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Recibo */}
      <Modal
        isOpen={showReciboModal}
        onClose={() => setShowReciboModal(false)}
        title="🧾 Recibo de Venta"
        size="lg"
      >
        {ventaProcesada && (
          <div className="space-y-4">
            <div className="bg-white p-6 border border-gray-200 rounded-lg">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">BeautyPro Salon</h3>
                <p className="text-sm text-gray-600">Recibo #{ventaProcesada.id}</p>
                <p className="text-sm text-gray-600">{ventaProcesada.fecha}</p>
              </div>
              
              <div className="mb-4">
                <p className="font-medium">Cliente: {ventaProcesada.cliente}</p>
                <p className="text-sm text-gray-600">Email: {ventaProcesada.email}</p>
              </div>

              <div className="border-t border-b py-2 mb-2">
                {ventaProcesada.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span>{item.nombre} x{item.cantidad}</span>
                    <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${ventaProcesada.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA:</span>
                  <span>${ventaProcesada.impuestos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${ventaProcesada.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center mt-4 text-sm text-gray-600">
                <p>¡Gracias por su visita!</p>
                <p>Vuelva pronto</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email para enviar recibo:
                </label>
                <Input
                  type="email"
                  value={emailCliente}
                  onChange={(e) => setEmailCliente(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleEnviarRecibo}
                  disabled={!emailCliente}
                  className="flex-1"
                >
                  📧 Enviar Recibo por Email
                </Button>
                <Button
                  onClick={() => setShowReciboModal(false)}
                  variant="outline"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
