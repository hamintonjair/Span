'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  MagnifyingGlassIcon, 
  PencilSquareIcon, 
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface Proveedor {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  empresa_id: string;
  nombre: string;
  sku?: string | null;
  stock: number;
  stock_minimo: number;
  precio_venta?: number | null;
  costo_compra: number;
  tipo: 'venta' | 'insumo';
  proveedor_id?: string | null;
  estado: string;
  created_at: string;
  updated_at?: string;
  proveedor?: Proveedor | null;
}

interface MovimientoInventario {
  id: string;
  empresa_id: string;
  producto_id: string;
  tipo_movimiento: 'Entrada' | 'Salida';  // Corregido para coincidir con BD
  cantidad: number;
  notas?: string | null;  // Corregido para coincidir con BD (notas en lugar de motivo)
  created_at: string;
  stock_anterior?: number;  // Agregado para coincidir con BD
  stock_nuevo?: number;     // Agregado para coincidir con BD
  creado_por?: string;     // Agregado para coincidir con BD
  producto?: {
    id: string;
    nombre: string;
    sku?: string | null;
    stock: number;
    stock_minimo: number;
    precio_venta?: number | null;
    costo_compra: number;
    proveedor?: {
      id: string;
      nombre: string;
    } | null;
  };
}

interface AjusteInventario {
  id: string;
  empresa_id: string;
  tipo: 'suma' | 'resta';
  cantidad: number;
  motivo: string;
  created_at: string;
  created_by: string;
}

const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 3000);
  };
  return { showToast, toasts };
};

export default function InventarioPage() {
  const { user, loading: authLoading } = useJWTAuth();
  const { showToast, toasts } = useToast();
  const supabase = createClient();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    tipo: 'Entrada', // Primera letra mayúscula
    cantidad: '',
    motivo: ''
  });

  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1), [itemOffset, itemsPerPage]);
  const pageCount = Math.ceil(totalCount / itemsPerPage);

  const loadProductos = async () => {
    if (!user?.empresa_id) return;
    
    // Resetear productoSeleccionado para evitar filtros incorrectos
    if (productoSeleccionado) {
      console.log('Limpiando productoSeleccionado para evitar error 400:', productoSeleccionado);
      setProductoSeleccionado(null);
    }
    
    try {
      setLoading(true);
      
      // Cargar productos sin JOIN para evitar errores
      const { data, error, count } = await supabase
        .from('productos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error cargando productos:', error);
        showToast('Error cargando productos: ' + error.message, 'error');
        return;
      }

      // Cargar proveedores por separado para mapear
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('proveedores')
        .select('id, nombre')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo');

      // Mapear proveedores a productos
      const productosConProveedores = (data as Producto[] || []).map(producto => {
        const proveedor = proveedoresData?.find((p: Proveedor) => p.id === producto.proveedor_id);
        return {
          ...producto,
          proveedor: proveedor || null
        };
      });

      console.log('Productos cargados:', productosConProveedores);
      setProductos(productosConProveedores);
      setTotalCount(count || 0);
      setItemOffset(0);
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado: ' + (error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMovimientos = async () => {
    if (!user?.empresa_id) return;
    
    console.log('=== INICIO loadMovimientos ===');
    console.log('user.empresa_id:', user?.empresa_id);
    console.log('productoSeleccionado actual:', productoSeleccionado);
    
    try {
      // Cargar movimientos sin JOIN para evitar errores - consulta más simple
      const { data, error } = await supabase
        .from('movimientos_inventario')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      console.log('Respuesta movimientos:', { data, error });
      
      if (!error && data) {
        console.log('Movimientos cargados, cantidad:', data.length);
        
        // Cargar productos por separado para mapear - CONSULTA SIMPLE SIN JOIN
        const productoIds = data.map((m: any) => m.producto_id).filter(Boolean);
        console.log('ProductoIds a buscar:', productoIds);

        const { data: productosData, error: productosError } = await supabase
          .from('productos')
          .select('id, nombre, sku, stock, stock_minimo, precio_venta, costo_compra, proveedor_id')
          .eq('empresa_id', user.empresa_id)
          .in('id', productoIds);

        console.log('Consulta productos SIMPLE:', {
          empresa_id: user.empresa_id,
          productoIds,
          error: productosError
        });

        // Cargar proveedores por separado
        const { data: proveedoresData, error: proveedoresError } = await supabase
          .from('proveedores')
          .select('id, nombre')
          .eq('empresa_id', user.empresa_id)
          .eq('estado', 'activo');

        console.log('Proveedores cargados:', { proveedoresData, error: proveedoresError });

        if (!productosError && productosData && !proveedoresError && proveedoresData) {
          // Mapear proveedores a productos
          const productosConProveedores = productosData.map((producto: any) => {
            const proveedor = proveedoresData.find((p: any) => p.id === producto.proveedor_id);
            return {
              ...producto,
              proveedor: proveedor || null
            };
          });

          console.log('Productos con proveedores mapeados:', productosConProveedores);

          // Mapear productos a movimientos
          const movimientosConProductos = data.map((movimiento: any) => {
            console.log('Procesando movimiento:', movimiento);
            
            const producto = productosConProveedores.find((p: any) => p.id === movimiento.producto_id);
            
            // Validar que el movimiento tenga tipo
            const tipoMovimiento = movimiento.tipo || 'SIN TIPO';
            console.log('Tipo de movimiento:', tipoMovimiento);
            
            const productoInfo = producto ? {
              id: producto.id || '',
              nombre: producto.nombre || '',
              sku: producto.sku || '',
              stock: producto.stock || 0,
              stock_minimo: producto.stock_minimo || 0,
              precio_venta: producto.precio_venta || 0,
              costo_compra: producto.costo_compra || 0,
              proveedor: producto.proveedor || null
            } : {
              id: '',
              nombre: '',
              sku: '',
              stock: 0,
              stock_minimo: 0,
              precio_venta: 0,
              costo_compra: 0,
              proveedor: null
            };

            return {
              ...movimiento,
              producto: productoInfo
            };
          });
          
          console.log('MovimientosConProductos:', movimientosConProductos);
          setMovimientos(movimientosConProductos);
        }
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    } finally {
      console.log('=== FIN loadMovimientos ===');
    }
  };

  // Filtrado optimizado con useMemo para evitar bucles infinitos
  const filteredProductos = useMemo(() => {
    let filtered = productos;
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.sku && producto.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  }, [productos, searchTerm]);

  const endOffset = itemOffset + itemsPerPage - 1;
  const paginatedProductos = useMemo(() => {
    return filteredProductos.slice(itemOffset, endOffset + 1);
  }, [filteredProductos, itemOffset, itemsPerPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);

  const handleGuardarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) {
      showToast('Debe seleccionar un producto', 'error');
      return;
    }
    if (!formData.motivo.trim()) {
      showToast('El motivo del ajuste es requerido', 'error');
      return;
    }
    if (!formData.cantidad) {
      showToast('La cantidad del ajuste es requerida', 'error');
      return;
    }
    try {
      setCreating(true);
      
      // Calcular nuevo stock
      const cantidadAjuste = parseInt(formData.cantidad);
      const nuevoStock = formData.tipo === 'Entrada' 
        ? productoSeleccionado.stock + cantidadAjuste
        : productoSeleccionado.stock - cantidadAjuste;

      if (nuevoStock < 0) {
        showToast('El stock no puede ser negativo', 'error');
        return;
      }

      // Actualizar stock del producto
      const { error: updateError } = await (supabase as any)
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', productoSeleccionado.id);

      if (updateError) {
        console.error('Error actualizando stock:', updateError);
        showToast('Error actualizando stock', 'error');
        return;
      }

      // Guardar movimiento en historial
      const movimientoData = {
        producto_id: productoSeleccionado.id,
        tipo_movimiento: formData.tipo === 'Entrada' ? 'Entrada' : 'Salida', // Primera letra mayúscula
        cantidad: cantidadAjuste,
        stock_anterior: productoSeleccionado.stock,
        stock_nuevo: nuevoStock,
        notas: formData.motivo, // Usar 'notas' en lugar de 'motivo'
        empresa_id: user?.empresa_id,
        creado_por: user?.id || ''
        // creado_en y created_at los genera automáticamente la BD
      };

      const { error: movimientoError } = await (supabase as any)
        .from('movimientos_inventario')
        .insert(movimientoData);

      if (movimientoError) {
        console.error('Error guardando movimiento:', movimientoError);
        showToast('Error guardando movimiento', 'error');
        return;
      }
      
      showToast('Ajuste de inventario registrado correctamente', 'success');
      setShowAjusteModal(false);
      setProductoSeleccionado(null);
      setFormData({ tipo: 'Entrada', cantidad: '', motivo: '' }); // Reset con valores correctos
      await loadProductos();
      await loadMovimientos();
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setCreating(false);
    }
  };

  const abrirModalAjuste = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setFormData({ tipo: 'Entrada', cantidad: '', motivo: '' }); // Reset con valores correctos
    setShowAjusteModal(true);
  };

  const verProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setShowViewModal(true);
  };

  const eliminarProducto = (productoId: string) => {
    setProductoToDelete(productoId);
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = async () => {
    if (!productoToDelete) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('productos').delete().eq('id', productoToDelete);
      if (error) {
        console.error('Error eliminando producto:', error);
        showToast('Error eliminando producto', 'error');
        return;
      }
      showToast('Producto eliminado exitosamente', 'success');
      await loadProductos();
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setProductoToDelete(null);
    }
  };

  const cancelarEliminacion = () => {
    setShowDeleteModal(false);
    setProductoToDelete(null);
  };

  const calcularValorTotal = () => {
    return productos.reduce((total, producto) => {
      return total + (producto.stock * producto.costo_compra);
    }, 0);
  };

  const getProductosEnAlerta = () => {
    return productos.filter(producto => producto.stock <= producto.stock_minimo);
  };

  const getStockPercentage = (stock: number, stockMinimo: number) => {
    const percentage = (stock / stockMinimo) * 100;
    return Math.min(percentage, 100);
  };

  useEffect(() => {
    console.log('Estado actual en useEffect:', {
      user: user?.empresa_id,
      authLoading,
      productoSeleccionado,
      searchTerm,
      showAjusteModal,
      showViewModal,
      showDeleteModal
    });
    
    if (user?.empresa_id && !authLoading) {
      loadProductos();
      loadMovimientos();
    }
  }, [user?.empresa_id, authLoading]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </MainLayout>
    );
  }

  if (!user?.empresa_id) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">Acceso restringido</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
            <p className="text-gray-600">Control y auditoría de inventario del salón</p>
          </div>
          <Button
            onClick={() => setShowAjusteModal(true)}
            className="flex items-center gap-2"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            Ajuste de Inventario
          </Button>
        </div>

        {/* Resumen Superior */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Valor Total del Inventario</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {calcularValorTotal().toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Suma de (Stock × Costo Compra)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Productos en Alerta</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {getProductosEnAlerta().length}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Productos con stock bajo
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Total Productos</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {productos.length}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Productos registrados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Productos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Stock Actual</h3>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="text-gray-500">Cargando productos...</div>
                      </td>
                    </tr>
                  ) : productos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedProductos.map((producto) => (
                      <tr key={producto.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                          <div className="text-sm text-gray-500">
                            {producto.proveedor?.nombre || 'Sin proveedor'} • {producto.tipo === 'venta' ? 'Venta' : 'Insumo'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className={`text-sm font-medium ${
                              producto.stock <= producto.stock_minimo ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {producto.stock}
                            </div>
                            <div className="text-xs text-gray-500">
                              (Min: {producto.stock_minimo})
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <div className={`w-full bg-gray-200 rounded-full h-2 ${
                              getStockPercentage(producto.stock, producto.stock_minimo) >= 100 
                                ? 'bg-green-500' 
                                : getStockPercentage(producto.stock, producto.stock_minimo) >= 50 
                                  ? 'bg-yellow-500' 
                                  : getStockPercentage(producto.stock, producto.stock_minimo) >= 25 
                                    ? 'bg-orange-500' 
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${getStockPercentage(producto.stock, producto.stock_minimo)}%` }}
                          />
                          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {getStockPercentage(producto.stock, producto.stock_minimo)}%
                            </span>
                          </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => abrirModalAjuste(producto)}>
                              <AdjustmentsHorizontalIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => verProducto(producto)}>
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => eliminarProducto(producto.id)}>
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {itemOffset + 1} a {Math.min(endOffset + 1, totalCount)} de {totalCount} productos
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setItemOffset(Math.max(0, itemOffset - itemsPerPage))} disabled={itemOffset === 0}>
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-700">Página {currentPage} de {pageCount}</span>
                  <Button variant="outline" size="sm" onClick={() => setItemOffset(Math.min(itemOffset + itemsPerPage, totalCount - itemsPerPage))} disabled={itemOffset + itemsPerPage >= totalCount}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Últimos Movimientos */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Últimos Movimientos</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="text-gray-500">No hay movimientos registrados</div>
                      </td>
                    </tr>
                  ) : (
                    movimientos.map((movimiento) => (
                      <tr key={movimiento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(movimiento.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{movimiento.producto?.nombre}</div>
                            <div className="text-sm text-gray-500">
                              {movimiento.producto?.sku && `SKU: ${movimiento.producto.sku}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            movimiento.tipo_movimiento === 'Entrada' 
                              ? 'bg-green-100 text-green-800' 
                              : movimiento.tipo_movimiento === 'Salida'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {movimiento.tipo_movimiento && typeof movimiento.tipo_movimiento === 'string' ? movimiento.tipo_movimiento.charAt(0).toUpperCase() + movimiento.tipo_movimiento.slice(1) : 'SIN TIPO'}
                          </span>  
                          {movimiento.tipo_movimiento === 'Salida' && <ArrowUpTrayIcon className="w-3 h-3 mr-1" />}
                          {movimiento.tipo_movimiento && typeof movimiento.tipo_movimiento === 'string' ? movimiento.tipo_movimiento.charAt(0).toUpperCase() + movimiento.tipo_movimiento.slice(1) : 'SIN TIPO'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`font-medium ${
                            movimiento.tipo_movimiento === 'Entrada' ? 'text-green-600' : 
                            movimiento.tipo_movimiento === 'Salida' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {movimiento.tipo_movimiento === 'Entrada' ? '+' : ''}{movimiento.cantidad}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.notas || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal Ajuste de Inventario */}
        {showAjusteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Ajuste de Inventario - {productoSeleccionado?.nombre}
                </h2>
                <button
                  onClick={() => {
                    setShowAjusteModal(false);
                    setProductoSeleccionado(null);
                    setFormData({ tipo: 'Entrada', cantidad: '', motivo: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleGuardarAjuste}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{productoSeleccionado?.nombre}</p>
                      <p className="text-xs text-gray-500">SKU: {productoSeleccionado?.sku || 'No especificado'}</p>
                      <p className="text-xs text-gray-500">Stock Actual: {productoSeleccionado?.stock}</p>
                    </div>
                  </div>
                  {productoSeleccionado && (
                  <div className="p-4 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-800">
                      <strong>Nuevo Stock:</strong> {formData.tipo === 'Entrada' 
                        ? productoSeleccionado.stock + (parseInt(formData.cantidad) || 0)
                        : productoSeleccionado.stock - (parseInt(formData.cantidad) || 0)
                      }
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {formData.tipo === 'Entrada' ? '+' : '-'}{formData.cantidad || 0} unidades
                    </div>
                  </div>
                )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ajuste *</label>
                    <select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                    >
                      <option value="Entrada">Entrada (+)</option>
                      <option value="Salida">Salida (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                      placeholder="Ej: 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
                    <textarea
                      name="motivo"
                      value={formData.motivo}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                      placeholder="Ej: Rotura de gaseosa, conteo físico, ajuste de sistema, etc..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAjusteModal(false);
                      setProductoSeleccionado(null);
                      setFormData({ tipo: 'Entrada', cantidad: '', motivo: '' });
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Registrando...' : 'Registrar Ajuste'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ver Detalles */}
        {showViewModal && productoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Detalles del Producto</h2>
                <button onClick={() => { setShowViewModal(false); setProductoSeleccionado(null); }} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{productoSeleccionado.nombre}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{productoSeleccionado.sku || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        productoSeleccionado.tipo === 'venta' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {productoSeleccionado.tipo === 'venta' ? 'Para Venta' : 'Insumo'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        productoSeleccionado.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {productoSeleccionado.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{productoSeleccionado.proveedor?.nombre || 'Sin proveedor'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                    <div className={`p-3 rounded-md ${productoSeleccionado.stock <= productoSeleccionado.stock_minimo ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center">
                        {productoSeleccionado.stock <= productoSeleccionado.stock_minimo && (
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-red-500" />
                        )}
                        <p className={`text-sm font-medium ${productoSeleccionado.stock <= productoSeleccionado.stock_minimo ? 'text-red-600' : 'text-gray-900'}`}>
                          {productoSeleccionado.stock}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{productoSeleccionado.stock_minimo}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo Compra</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">${(productoSeleccionado.costo_compra || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                {productoSeleccionado.tipo === 'venta' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">${(productoSeleccionado.precio_venta || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => { setShowViewModal(false); setProductoSeleccionado(null); }} className="w-full">
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmación Eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-700">¿Estás seguro de que deseas eliminar este producto?</p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={cancelarEliminacion} disabled={loading}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={confirmarEliminacion} disabled={loading}>
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
