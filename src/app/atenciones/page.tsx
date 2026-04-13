'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { MagnifyingGlassIcon, PlusIcon, MinusIcon, TrashIcon, PlayIcon, CreditCardIcon, ClockIcon } from '@heroicons/react/24/outline';

// Hook de Toast personalizado
const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 3000);
  };

  return { showToast, toasts };
};

// Interfaces TypeScript
interface Producto {
  id: string;
  nombre: string;
  sku?: string;
  stock: number;
  precio_venta: number;
  costo_compra: number;
  tipo: 'venta' | 'insumo';
}

interface Servicio {
  id: string;
  nombre: string;
  precio: number;
  duracion_minutos?: number;
}

interface Cita {
  id: string;
  empresa_id: string;
  cliente_id: string;
  empleado_id: string;
  fecha: string;
  duracion_minutos: number;
  estado: 'pendiente' | 'en_proceso' | 'completada';
  total_estimado: number;
  notas?: string;
  servicios_ids?: string[];
  cliente?: {
    id: string;
    nombre: string;
  };
  empleado?: {
    id: string;
    nombre: string;
  };
  servicios?: Servicio[];
}

interface CarritoItem {
  id: string;
  tipo: 'producto' | 'servicio';
  producto?: Producto;
  servicio?: Servicio;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  subtotal: number;
}

interface Empleado {
  id: string;
  nombre: string;
  rol?: string;
  activo: boolean;
}

// Componente principal de Atenciones
export default function AtencionesPage() {
  const { user } = useJWTAuth();
  const { showToast, toasts } = useToast();
  const supabase = createClient();

  // Estados principales
  const [citas, setCitas] = useState<Cita[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [atencionActiva, setAtencionActiva] = useState<Cita | null>(null);
  const [showProductosModal, setShowProductosModal] = useState(false);
  const [showServiciosModal, setShowServiciosModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados de búsqueda
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaServicio, setBusquedaServicio] = useState('');

  // Calcular total acumulado
  const totalAcumulado = carrito.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  // Cargar citas del día
  useEffect(() => {
    if (user?.empresa_id) {
      cargarCitasDelDia();
      cargarProductos();
      cargarServicios();
      cargarEmpleados();
    }
  }, [user?.empresa_id]);

  const cargarCitasDelDia = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          cliente:clientes(id, nombre),
          empleado:usuarios_sistema(id, nombre)
        `)
        .eq('empresa_id', user?.empresa_id as any)
        .eq('estado', 'pendiente')
        .gte('fecha', today)
        .lte('fecha', `${today}T23:59:59`)
        .order('fecha', { ascending: true });

      if (error) throw error;
      
      // Cargar servicios de cada cita
      const citasConServicios = await Promise.all(
        (data || []).map(async (cita: any) => {
          if (cita.servicios_ids && cita.servicios_ids.length > 0) {
            const { data: serviciosData } = await supabase
              .from('servicios')
              .select('*')
              .in('id', cita.servicios_ids);
            
            return { ...cita, servicios: serviciosData || [] };
          }
          return { ...cita, servicios: [] };
        })
      );

      setCitas(citasConServicios as Cita[]);
    } catch (error) {
      console.error('Error cargando citas del día:', error);
      showToast('Error cargando citas del día', 'error');
    }
  };

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('empresa_id', user?.empresa_id as any)
        .eq('estado', 'activo')
        .eq('tipo', 'venta')
        .order('nombre');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      showToast('Error cargando productos', 'error');
    }
  };

  const cargarServicios = async () => {
    try {
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .eq('empresa_id', user?.empresa_id as any)
        .order('nombre');

      if (error) throw error;
      setServicios(data || []);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      showToast('Error cargando servicios', 'error');
    }
  };

  const cargarEmpleados = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('id, nombre, rol, activo')
        .eq('empresa_id', user?.empresa_id as any)
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setEmpleados(data || []);
    } catch (error) {
      console.error('Error cargando empleados:', error);
      showToast('Error cargando empleados', 'error');
    }
  };

  // Iniciar atención
const iniciarAtencion = async (cita: Cita) => {
  try {
    // 1. Preparamos los datos de actualización. 
    // Incluimos empleado_id para que el Trigger de Supabase no falle.
    const datosActualizacion = {
      estado: 'en_proceso',
      updated_at: new Date().toISOString(),
      empleado_id: cita.empleado_id // Pasamos el ID del profesional asignado
    };

    // 2. Ejecutamos el update con casting 'as any' para silenciar errores de tipado en el linter
    const { error } = await supabase
      .from('citas')
      .update(datosActualizacion as never)
      .eq('id', cita.id);

    if (error) {
      console.error('Error detallado de Supabase:', error);
      throw error;
    }

    // 3. Cargar servicios iniciales al carrito
    if (cita.servicios && cita.servicios.length > 0) {
      const serviciosCarrito: CarritoItem[] = cita.servicios.map((servicio) => ({
        id: `servicio_${servicio.id}_${Date.now()}`,
        tipo: 'servicio' as const,
        servicio: servicio,
        cantidad: 1,
        precio_unitario: servicio.precio || 0,
        descuento: 0,
        subtotal: servicio.precio || 0,
        // IMPORTANTE: Mantenemos el empleado en cada item del carrito
        empleado_id: cita.empleado_id 
      }));

      setCarrito(serviciosCarrito);
    }

    // 4. Actualizar estados locales
    setAtencionActiva({ ...cita, estado: 'en_proceso' });
    setCitas(citas.filter(c => c.id !== cita.id));
    
    // Notificación visual (Toast)
    showToast('Atención iniciada correctamente', 'success');

  } catch (error: any) {
    console.error('Error iniciando atención:', error);
    showToast(error.message || 'Error al iniciar atención', 'error');
  }
};
  // Agregar producto al carrito
  const agregarProducto = (producto: Producto) => {
    const nuevoItem: CarritoItem = {
      id: `producto_${producto.id}_${Date.now()}`,
      tipo: 'producto' as const,
      producto: producto,
      cantidad: 1,
      precio_unitario: producto.precio_venta || 0,
      descuento: 0,
      subtotal: producto.precio_venta || 0
    };

    setCarrito([...carrito, nuevoItem]);
    showToast(`${producto.nombre} agregado`, 'success');
  };

  // Agregar servicio al carrito
  const agregarServicio = (servicio: Servicio) => {
    const nuevoItem: CarritoItem = {
      id: `servicio_${servicio.id}_${Date.now()}`,
      tipo: 'servicio' as const,
      servicio: servicio,
      cantidad: 1,
      precio_unitario: servicio.precio || 0,
      descuento: 0,
      subtotal: servicio.precio || 0
    };

    setCarrito([...carrito, nuevoItem]);
    showToast(`${servicio.nombre} agregado`, 'success');
  };

  // Actualizar cantidad
  const actualizarCantidad = (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;

    setCarrito(carrito.map((item) => {
      if (item.id === itemId) {
        const nuevoSubtotal = item.precio_unitario * nuevaCantidad;
        return { ...item, cantidad: nuevaCantidad, subtotal: nuevoSubtotal };
      }
      return item;
    }));
  };

  // Eliminar del carrito
  const eliminarDelCarrito = (itemId: string) => {
    setCarrito(carrito.filter(item => item.id !== itemId));
    showToast('Item eliminado', 'success');
  };

  // Finalizar y cobrar
  const finalizarYCobrar = async () => {
    if (!atencionActiva) return;

    try {
      setLoading(true);

      // Crear venta
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          empresa_id: user?.empresa_id,
          cliente_id: atencionActiva.cliente_id,
          vendedor_id: user?.id, // ID del empleado que realizó el servicio
          subtotal: totalAcumulado,
          total: totalAcumulado,
          metodo_pago: 'efectivo',
          impuestos: 0,
          descuentos: 0,
          estado: 'completada',
          cita_id: atencionActiva.id,
          fecha: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (ventaError) throw ventaError;

      // Crear detalles de venta
      const detalles = carrito.map((item) => ({
        venta_id: (ventaData as any).id,
        producto_id: item.tipo === 'producto' ? item.producto?.id : null,
        servicio_id: item.tipo === 'servicio' ? item.servicio?.id : null,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario || 0,
        descuento: item.descuento || 0,
        subtotal: item.subtotal || 0
      }));

      const { error: detallesError } = await (supabase as any)
        .from('detalles_ventas')
        .insert(detalles as any);

      if (detallesError) throw detallesError;

      // Actualizar estado de la cita
      const { error: citaError } = await (supabase as any)
        .from('citas')
        .update({ 
          estado: 'completada',
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', atencionActiva.id as any);

      if (citaError) throw citaError;

      // Actualizar inventario de productos
      for (const item of carrito) {
        if (item.tipo === 'producto' && item.producto) {
          await (supabase as any)
            .from('productos')
            .update({ 
              stock: item.producto.stock - item.cantidad 
            } as any)
            .eq('id', item.producto.id as any);
        }
      }

      showToast('Atención finalizada y venta registrada', 'success');
      
      // Limpiar estados
      setAtencionActiva(null);
      setCarrito([]);
      
      // Redirigir al panel de préstamos para continuar la prueba
      setTimeout(() => {
        window.location.href = '/prestamos';
      }, 1500);
      
    } catch (error) {
      console.error('Error finalizando atención:', error);
      showToast('Error finalizando atención', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrados
  const productosFiltrados = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  const serviciosFiltrados = servicios.filter((servicio) =>
    servicio.nombre.toLowerCase().includes(busquedaServicio.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-gray-500">Procesando...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Atenciones</h1>
              {atencionActiva && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <PlayIcon className="w-4 h-4 inline mr-1" />
                  Atención Activa: {atencionActiva.cliente?.nombre}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Usuario: {user?.nombre}</span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex overflow-hidden">
          {!atencionActiva ? (
            // Vista de citas pendientes
            <div className="flex-1 bg-white p-6 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Citas Pendientes del Día</h2>
              
              {citas.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-lg mb-2">No hay citas pendientes</div>
                  <div className="text-sm">Todas las citas han sido atendidas</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {citas.map((cita) => (
                    <div key={cita.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{cita.cliente?.nombre}</h3>
                          <p className="text-sm text-gray-500">{cita.empleado?.nombre}</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {cita.estado}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <ClockIcon className="w-4 h-4 inline mr-1" />
                          {new Date(cita.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        
                        {cita.servicios && cita.servicios.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Servicios:</p>
                            {cita.servicios.map((servicio) => (
                              <div key={servicio.id} className="text-sm text-gray-600">
                                • {servicio.nombre} - ${servicio.precio?.toFixed(2)}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {cita.notas && (
                          <div className="text-sm text-gray-500">
                            <strong>Notas:</strong> {cita.notas}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => iniciarAtencion(cita)}
                        className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                      >
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Iniciar Atención
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Vista de atención activa
            <div className="flex-1 flex">
              {/* Panel izquierdo - Carrito */}
              <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Atención: {atencionActiva.cliente?.nombre}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {atencionActiva.empleado?.nombre}
                  </p>
                </div>

                {/* Carrito */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Servicio inicial */}
                    {atencionActiva.servicios && atencionActiva.servicios.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-2">Servicio Inicial</h3>
                        {atencionActiva.servicios.map((servicio) => (
                          <div key={servicio.id} className="text-sm text-blue-700">
                            • {servicio.nombre} - ${servicio.precio?.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Items adicionales */}
                    {carrito.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">Servicios/Productos Adicionales</h3>
                        {carrito.map((item) => (
                          <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {item.tipo === 'producto' ? item.producto?.nombre : item.servicio?.nombre}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ${item.precio_unitario?.toFixed(2)} c/u
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                                  className="p-1 rounded hover:bg-gray-200"
                                >
                                  <MinusIcon className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center">{item.cantidad}</span>
                                <button
                                  onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                                  className="p-1 rounded hover:bg-gray-200"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => eliminarDelCarrito(item.id)}
                                  className="text-red-500 hover:text-red-700 ml-2"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-right mt-2">
                              <span className="font-medium">
                                ${item.subtotal?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Total acumulado */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Acumulado:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${totalAcumulado.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Panel derecho - Acciones */}
              <div className="w-1/2 bg-gray-50 flex flex-col">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Acciones</h3>
                  
                  <div className="space-y-4">
                    {/* Añadir servicios */}
                    <div>
                      <button
                        onClick={() => setShowServiciosModal(true)}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                      >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Añadir más servicios
                      </button>
                    </div>

                    {/* Añadir productos */}
                    <div>
                      <button
                        onClick={() => setShowProductosModal(true)}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
                      >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Añadir productos
                      </button>
                    </div>

                    {/* Finalizar y cobrar */}
                    <div className="pt-4 border-t border-gray-300">
                      <button
                        onClick={finalizarYCobrar}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 flex items-center justify-center"
                      >
                        <CreditCardIcon className="w-5 h-5 mr-2" />
                        {loading ? 'Procesando...' : 'Finalizar y Cobrar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Servicios */}
        {showServiciosModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Añadir Servicios</h3>
                <button
                  onClick={() => setShowServiciosModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              {/* Barra de búsqueda */}
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar servicios..."
                    value={busquedaServicio}
                    onChange={(e) => setBusquedaServicio(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Grid de servicios */}
              <div className="grid grid-cols-2 gap-4">
                {serviciosFiltrados.map((servicio) => (
                  <div
                    key={servicio.id}
                    onClick={() => {
                      agregarServicio(servicio);
                      setShowServiciosModal(false);
                      setBusquedaServicio('');
                    }}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-blue-50"
                  >
                    <div className="font-medium text-gray-900">{servicio.nombre}</div>
                    <div className="text-blue-600 font-bold">
                      ${(servicio.precio || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Productos */}
        {showProductosModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Añadir Productos</h3>
                <button
                  onClick={() => setShowProductosModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              {/* Barra de búsqueda */}
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Grid de productos */}
              <div className="grid grid-cols-2 gap-4">
                {productosFiltrados.map((producto) => (
                  <div
                    key={producto.id}
                    onClick={() => {
                      agregarProducto(producto);
                      setShowProductosModal(false);
                      setBusquedaProducto('');
                    }}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-green-50"
                  >
                    <div className="font-medium text-gray-900">{producto.nombre}</div>
                    <div className="text-green-600 font-bold">
                      ${(producto.precio_venta || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Stock: {producto.stock}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
