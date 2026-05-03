'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { MagnifyingGlassIcon, PlusIcon, MinusIcon, TrashIcon, UserIcon, CreditCardIcon, BanknotesIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Formateador de dinero para Colombia
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

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
  iva: number; // ← CAMPO IVA DINÁMICO
  tipo: 'venta' | 'insumo';
  proveedor?: any;
}

interface Cliente {
  id: string;
  nombre: string;
  cedula: string;
  telefono?: string;
  email?: string;
}

interface CarritoItem {
  id: string;
  tipo: 'producto';
  producto?: Producto;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  subtotal: number;
  impuesto_item: number; // ← IMPUESTO INDIVIDUAL POR ITEM
}

interface Venta {
  id: string;
  cliente_id?: string;
  subtotal: number;
  total: number;
  metodo_pago: string;
  impuestos: number;
  descuentos: number;
  estado: string;
  created_at: string;
}

interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id?: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  subtotal: number;
}

// Componente principal POS
export default function VentasNuevaPage() {
  const { user } = useJWTAuth();
  const { showToast, toasts } = useToast();
  const supabase = createClient();

  // Estados principales
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [empresa, setEmpresa] = useState<any>(null);
  const [cajaAbierta, setCajaAbierta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verificandoCaja, setVerificandoCaja] = useState(true);

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;

  // Estados de totales
  const [subtotal, setSubtotal] = useState(0);
  const [impuestos, setImpuestos] = useState(0);
  const [descuentos, setDescuentos] = useState(0);
  const [total, setTotal] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.empresa_id) {
      cargarProductos();
      cargarClientes();
      cargarEmpresa();
      verificarCajaAbierta();
    }
  }, [user?.empresa_id]);

  // Verificar si hay caja abierta
  const verificarCajaAbierta = async () => {
    try {
      // @ts-ignore - Ignorar errores de TypeScript para consulta de caja
      const { data: cajaData, error } = await supabase
        .from('cajas')
        .select('*')
        .eq('vendedor_id', user?.id as any)
        .eq('estado', 'abierta')
        .eq('empresa_id', user?.empresa_id as any)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error verificando caja:', error);
      }

      setCajaAbierta(cajaData);

      // Si no hay caja abierta, mostrar modal elegante
      if (!cajaData) {
        // No redirigir automáticamente, mostrar modal
        setCajaAbierta(null);
      }
    } catch (error) {
      console.error('Error verificando caja abierta:', error);
    } finally {
      setVerificandoCaja(false);
    }
  };

  // Función para extraer ID de Google Drive y convertir a URL directa
  const processGoogleDriveUrl = (url: string) => {
    // Si la URL ya está en formato directo, devolverla
    if (url.includes('lh3.googleusercontent.com')) {
      return url;
    }

    // Extraer ID de Google Drive y convertir a formato directo
    const driveRegex = /drive\.google\.com\/file\/d\/([^\/]+)\/view/;
    const match = url.match(driveRegex);

    if (match) {
      // Extraer el ID y convertir a formato directo
      const id = match[1];
      return id ? `https://lh3.googleusercontent.com/u/0/d/${id}=w1000?authuser=0` : '';
    }
    
    // Si no es de Drive, devolver la URL original
    return url;
  };

  // Cargar datos de empresa para ticket
  const cargarEmpresa = async () => {
    if (!user?.empresa_id) return;

    try {
      // @ts-ignore - Ignorar errores de TypeScript para consulta de empresa
      const { data, error } = await supabase
        .from('empresas')
        .select('nombre, nit, telefono, direccion, ciudad, mensaje_ticket, logo_url')
        .eq('id', user.empresa_id)
        .single();

      if (error) throw error;
      
      if (data) {
        // Procesar la URL del logo si es de Google Drive
        // @ts-ignore - Ignorar errores de TypeScript para datos de empresa
        const processedData = {
          // @ts-ignore - Ignorar errores de TypeScript para spread operator
          ...data,
          // @ts-ignore - Ignorar errores de TypeScript para acceso a logo_url
          logo_url: processGoogleDriveUrl(data.logo_url || '')
        };
        setEmpresa(processedData);
      }
    } catch (error) {
      console.error('Error cargando empresa:', error);
    }
  };

  // Cargar productos - SOLO PRODUCTOS CON PRECIO > 0
  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('empresa_id', user?.empresa_id as any)
        .eq('estado', 'activo')
        .eq('tipo', 'venta')
        .gt('precio_venta', 0) // ← SOLO PRECIOS MAYORES A 0
        .gt('stock', 0) // ← SOLO PRODUCTOS CON STOCK MAYOR A 0
        .order('nombre');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      showToast('Error cargando productos', 'error');
    }
  };

  // Cargar clientes
  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', user?.empresa_id as any)
        .eq('estado', 'activo')
        .order('nombre');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      showToast('Error cargando clientes', 'error');
    }
  };

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter((producto: Producto) => 
    producto.nombre && 
    producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
    producto.precio_venta > 0 && // ← DOBLE FILTRO: SOLO PRECIOS > 0
    producto.stock > 0 // ← FILTRO DE STOCK: SOLO PRODUCTOS CON STOCK > 0
  );

  // Paginación de productos
  const indiceUltimoProducto = paginaActual * productosPorPagina;
  const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;
  const productosPaginados = productosFiltrados.slice(indicePrimerProducto, indiceUltimoProducto);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientes.filter((cliente: Cliente) => 
    cliente.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    cliente.cedula.includes(busquedaCliente)
  );

  // Agregar producto al carrito con IVA dinámico
  const agregarAlCarrito = (producto: Producto) => {
    const precioTotal = producto.precio_venta * 1;
    const impuestoItem = precioTotal * (producto.iva / 100); // ← IVA DINÁMICO
    
    const nuevoItem: CarritoItem = {
      id: `producto_${producto.id}_${Date.now()}`,
      tipo: 'producto' as const,
      producto: producto,
      cantidad: 1,
      precio_unitario: producto.precio_venta, // ← PRECIO REAL
      descuento: 0,
      subtotal: producto.precio_venta, // ← PRECIO REAL
      impuesto_item: impuestoItem // ← IMPUESTO INDIVIDUAL
    };

    setCarrito([...carrito, nuevoItem]);
    showToast(`${producto.nombre} agregado al carrito`, 'success');
  };

  // Actualizar cantidad de item con recálculo de IVA
  const actualizarCantidad = (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;

    setCarrito(carrito.map((item: any) => {
      if (item.id === itemId) {
        const precioTotal = item.precio_unitario * nuevaCantidad;
        const impuestoItem = precioTotal * (item.producto?.iva || 0) / 100; // ← IVA DINÁMICO
        const nuevoSubtotal = item.precio_unitario * nuevaCantidad;
        
        return { 
          ...item, 
          cantidad: nuevaCantidad, 
          subtotal: nuevoSubtotal,
          impuesto_item: impuestoItem // ← ACTUALIZAR IMPUESTO
        };
      }
      return item;
    }));
  };

  // Eliminar item del carrito
  const eliminarDelCarrito = (itemId: string) => {
    setCarrito(carrito.filter((item: any) => item.id !== itemId));
    showToast('Item eliminado del carrito', 'success');
  };

  // Seleccionar cliente
  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente('');
    showToast(`Cliente seleccionado: ${cliente.nombre}`, 'success');
  };

  // Calcular totales con IVA dinámico
  useEffect(() => {
    const nuevoSubtotal = carrito.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const nuevoImpuestos = carrito.reduce((sum, item) => sum + (item.impuesto_item || 0), 0); // ← SUMA DE IMPUESTOS INDIVIDUALES
    const nuevoTotal = nuevoSubtotal + nuevoImpuestos - descuentos;
    
    setSubtotal(nuevoSubtotal);
    setImpuestos(nuevoImpuestos);
    setTotal(Math.max(0, nuevoTotal));
  }, [carrito, descuentos]);

  // Procesar venta
  const procesarVenta = async () => {
    if (carrito.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }

    if (!clienteSeleccionado) {
      showToast('Debes seleccionar un cliente', 'error');
      return;
    }

    setLoading(true);
    try {
      // Generar número de factura aleatorio de 9 dígitos
      const numFactura = Math.floor(100000000 + Math.random() * 900000000).toString();
    
      // Insertar venta principal
     
      
      const ventaParaInsertar = {
        empresa_id: user?.empresa_id,
        cliente_id: clienteSeleccionado.id, // ← UUID DEL CLIENTE SELECCIONADO
        vendedor_id: user?.id, // ← USUARIO DEL SISTEMA LOGUEADO QUE VENDE
        caja_id: cajaAbierta?.id, // ← ID DE CAJA ABIERTA
        subtotal: parseFloat(subtotal.toString()), // ← ASEGURAR NUMÉRICO
        total: parseFloat(total.toString()), // ← ASEGURAR NUMÉRICO
        metodo_pago: metodoPago,
        impuestos: parseFloat(impuestos.toString()), // ← ASEGURAR NUMÉRICO
        descuentos: parseFloat(descuentos.toString()), // ← ASEGURAR NUMÉRICO
        estado: 'completada',
        fecha: new Date().toISOString(),
        numero_factura: numFactura // Agregar número de factura
      };
      
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert(ventaParaInsertar as any)
        .select()
        .single();

      if (ventaError) throw ventaError;

      // Insertar detalles de venta usando detalles_ventas - LIMPIO SIN EMPLEADO_ID
      const detalles = carrito.map((item: any) => ({
        venta_id: (ventaData as any).id,           // ← UUID de la venta
        producto_id: item.producto?.id || null,     // ← UUID del producto
        cantidad: parseInt(item.cantidad.toString()), // ← ASEGURAR NUMÉRICO
        precio_unitario: parseFloat(item.precio_unitario.toString()), // ← ASEGURAR NUMÉRICO
        descuento: parseFloat((item.descuento || 0).toString()), // ← ASEGURAR NUMÉRICO
        subtotal: parseFloat(item.subtotal.toString()) // ← ASEGURAR NUMÉRICO
      }));

      const { error: detallesError } = await (supabase as any)
        .from('detalles_ventas')
        .insert(detalles as any);

      if (detallesError) throw detallesError;

      // Verificar que la venta se haya creado correctamente
      if (!ventaData || !(ventaData as any).id) {
        throw new Error('No se pudo obtener el ID de la venta generada');
      }

      // Registrar movimientos de inventario y actualizar stock
      const movimientosExitosos = [];
      for (const item of carrito) {
        if (item.producto) {
          try {
            // 1. Obtener stock actual del producto
            const stockActual = item.producto.stock;
            
            // 2. Calcular nuevo stock
            const nuevoStock = stockActual - item.cantidad;
            
            // 3. Registrar movimiento en movimientos_inventario con stock_anterior y stock_nuevo
            const movimientoData = {
              producto_id: item.producto.id,
              cantidad: parseInt(item.cantidad.toString()), // ← Cantidad que sale (positivo)
              tipo_movimiento: 'venta', // ← TIPO EXACTO 'venta'
              empresa_id: user?.empresa_id,
              motivo: `Venta POS Nro ${(ventaData as any).id}`, // ← MOTIVO CON ID DE VENTA
              stock_anterior: stockActual, // ← STOCK ANTES DE LA VENTA
              stock_nuevo: nuevoStock, // ← STOCK DESPUÉS DE LA VENTA
              created_at: new Date().toISOString()
            };

            const { error: movimientoError } = await (supabase as any)
              .from('movimientos_inventario')
              .insert(movimientoData as any);

            if (movimientoError) {
              console.error('Error en movimiento de inventario:', movimientoError);
              // CONTINUAR AUNQUE EL MOVIMIENTO FALLE - La venta ya está hecha
            } else {
              movimientosExitosos.push(item.producto.id);
              
              // 4. Actualizar stock del producto (CRÍTICO) - EL DESCUENTO REAL
              const { error: updateError } = await (supabase as any)
                .from('productos')
                .update({ 
                  stock: nuevoStock // ← NUEVO STOCK CALCULADO
                } as any)
                .eq('id', item.producto.id as any);

              if (updateError) {
                console.error('Error actualizando stock:', updateError);
                throw updateError; // ← SÍ lanzar error si falla el stock
              }
            }

          } catch (itemError) {
            console.error(`Error procesando item ${item.producto?.id}:`, itemError);
            // Continuar con otros items pero registrar el error
          }
        }
      }

      // Mensaje de éxito con información de movimientos
      if (movimientosExitosos.length === carrito.length) {
        showToast('Venta procesada correctamente con todos los movimientos de inventario', 'success');
      } else if (movimientosExitosos.length > 0) {
        showToast(`Venta procesada (${movimientosExitosos.length}/${carrito.length} movimientos de inventario registrados)`, 'success');
      } else {
        showToast('Venta procesada (sin movimientos de inventario - revisar logs)', 'success');
      }
      
      // Sincronizar interfaz - Refrescar productos para mostrar stock actualizado
      await cargarProductos(); // ← RECARGAR PRODUCTOS CON STOCK ACTUALIZADO
      
      // Limpiar carrito y resetear estados
      setCarrito([]);
      setDescuentos(0);
      setClienteSeleccionado(null);
      setShowPagoModal(false);
      setEfectivoRecibido('');

      // Redirigir a página de impresión con el ID de la venta
      window.location.href = `/ventas/imprimir/${(ventaData as any).id}`;

    } catch (error) {
      console.error('Error procesando venta:', error);
      showToast('Error procesando venta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calcular cambio
  const cambio = parseFloat(efectivoRecibido || '0') - total;

  // Validar si se puede cobrar
  const puedeCobrar = carrito.length > 0 && clienteSeleccionado !== null;

  // Funciones de paginación
  const irAPaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const irAPaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-gray-500">Cargando...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
              {clienteSeleccionado && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  {clienteSeleccionado.nombre}
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
          {/* Columna Izquierda - Catálogo de Productos */}
          <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
            {/* Barra de búsqueda */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Grid de Productos - SOLO CON PRECIO > 0 Y PAGINACIÓN */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {productosPaginados.map((producto: Producto) => (
                  <div
                    key={`producto_${producto.id}`}
                    onClick={() => agregarAlCarrito(producto)}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      {producto.nombre}
                    </div>
                    {/* PRECIO REAL - SIEMPRE MAYOR A 0 */}
                    <div className="text-lg font-bold text-green-600">
                      {formatMoney(producto.precio_venta)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Stock: <span className={`font-semibold ${producto.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {producto.stock}
                      </span> | IVA: {producto.iva}%
                      {producto.stock <= 5 && (
                        <span className="ml-2 text-red-600 font-medium">¡Últimas unidades!</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles de Paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Página {paginaActual} de {totalPaginas} ({productosFiltrados.length} productos)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={irAPaginaAnterior}
                      disabled={paginaActual === 1}
                      className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="w-4 h-4 mr-1" />
                      Anterior
                    </button>
                    <button
                      onClick={irAPaginaSiguiente}
                      disabled={paginaActual === totalPaginas}
                      className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha - Carrito y Cliente */}
          <div className="w-1/2 bg-white flex flex-col">
            {/* Buscador de Clientes - CORREGIDO CON RELATIVE */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente (nombre o cédula)..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Lista de clientes filtrados - CORREGIDO CON CLASES TAILWIND */}
              {busquedaCliente && (
                <div className="absolute z-50 w-full bg-white shadow-xl border border-gray-200 rounded-b-lg max-h-48 overflow-y-auto mt-1">
                  {clientesFiltrados.map((cliente: Cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => seleccionarCliente(cliente)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{cliente.nombre}</div>
                      <div className="text-sm text-gray-500">Cédula: {cliente.cedula}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Header del carrito */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Carrito</h2>
            </div>

            {/* Lista del carrito */}
            <div className="flex-1 p-4 overflow-y-auto">
              {carrito.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-lg mb-2">Carrito vacío</div>
                  <div className="text-sm">Agrega productos para comenzar</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {carrito.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {item.producto?.nombre}
                          </div>
                          {/* PRECIO UNITARIO CORRECTO */}
                          <div className="text-sm text-gray-500">
                            {formatMoney(item.precio_unitario)} c/u
                          </div>
                        </div>
                        <button
                          onClick={() => eliminarDelCarrito(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
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
                        </div>

                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatMoney(item.subtotal)}
                          </div>
                          <div className="text-xs text-gray-500">
                            IVA: {formatMoney(item.impuesto_item)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel de totales */}
            <div className="border-t border-gray-200 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuestos (IVA):</span>
                  <span>{formatMoney(impuestos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Descuentos:</span>
                  <input
                    type="number"
                    value={descuentos}
                    onChange={(e) => setDescuentos(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowPagoModal(true)}
                disabled={!puedeCobrar}
                className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Cobrar
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Pago */}
        {showPagoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Procesar Pago</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                {metodoPago === 'efectivo' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Efectivo Recibido
                    </label>
                    <input
                      type="number"
                      value={efectivoRecibido}
                      onChange={(e) => setEfectivoRecibido(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="0.00"
                    />
                    {cambio > 0 && (
                      <div className="mt-2 text-sm text-green-600">
                        Cambio: {formatMoney(cambio)}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-xl font-black text-green-600">
                  <span>Total a Pagar:</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPagoModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarVenta}
                  disabled={loading || (metodoPago === 'efectivo' && parseFloat(efectivoRecibido || '0') < total) || !cajaAbierta}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Procesando...' : 'Confirmar Venta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de bloqueo si no hay caja abierta */}
        {!verificandoCaja && !cajaAbierta && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 bg-red-100 rounded-full">
                  <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Caja Cerrada</h3>
                  <p className="text-gray-600 text-lg">Debe abrir una sesión para vender</p>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-amber-800">
                      Para procesar ventas, primero necesita abrir caja con el monto inicial del día
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    window.location.href = '/caja';
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-semibold">Ir a Abrir Caja</span>
                </button>
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