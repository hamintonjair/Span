'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { registrarLog } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  ShoppingBagIcon, 
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
  TagIcon
} from '@heroicons/react/24/outline';

interface Proveedor {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  empresa_id: string;
  nombre: string;
  sku?: string;
  stock: number;
  stock_minimo: number;
  precio_venta: number;
  costo_compra: number;
  iva: number; // ← NUEVO CAMPO IVA
  tipo: 'venta' | 'insumo';
  proveedor_id?: string | null;
  estado: string;
  created_at: string;
  updated_at?: string;
  proveedor?: Proveedor | null;
}

interface ProductoFormData {
  nombre: string;
  sku: string;
  stock: string;
  stock_minimo: string;
  precio_venta: string;
  costo_compra: string;
  iva: string; // ← NUEVO CAMPO IVA
  tipo: 'venta' | 'insumo';
  proveedor_id: string;
  estado: string;
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

export default function ProductosPage() {
  const { user, loading: authLoading } = useJWTAuth();
  const { showToast, toasts } = useToast();
  const supabase = createClient();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [viewingProducto, setViewingProducto] = useState<Producto | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'venta' | 'insumo'>('todos');

  const [formData, setFormData] = useState<ProductoFormData>({
    nombre: '',
    sku: '',
    stock: '0',
    stock_minimo: '5',
    precio_venta: '0',
    costo_compra: '0',
    iva: '19', // ← VALOR POR DEFECTO IVA
    tipo: 'venta',
    proveedor_id: '',
    estado: 'activo'
  });

  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1), [itemOffset, itemsPerPage]);
  const endOffset = itemOffset + itemsPerPage - 1;
  const paginatedProductos = filteredProductos.slice(itemOffset, endOffset + 1);
  const pageCount = Math.ceil(totalCount / itemsPerPage);

  const loadProveedores = async () => {
    if (!user?.empresa_id) return;
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .order('nombre');
      if (!error && data) setProveedores(data);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const loadProductos = async () => {
    if (!user?.empresa_id) return;
    try {
      setLoading(true);
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

      // Cargar proveedores para mapear
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
      setFilteredProductos(productosConProveedores);
      setTotalCount(count || 0);
      setItemOffset(0);
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado: ' + (error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = productos;

    // Filtrar por tipo
    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(producto => producto.tipo === tipoFilter);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.sku && producto.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProductos(filtered);
    setItemOffset(0);
  }, [productos, searchTerm, tipoFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Si cambia el tipo a 'insumo', limpiar precio_venta
    if (name === 'tipo' && value === 'insumo') {
      setFormData(prev => ({ ...prev, precio_venta: '0' }));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      showToast('El nombre del producto es requerido', 'error');
      return;
    }
    if (formData.tipo === 'venta' && !formData.precio_venta) {
      showToast('El precio de venta es requerido para productos de venta', 'error');
      return;
    }
    try {
      setCreating(true);
      if (editingProducto) {
        const updateData = {
          nombre: formData.nombre,
          sku: formData.sku || null,
          stock: parseInt(formData.stock) || 0,
          stock_minimo: parseInt(formData.stock_minimo) || 5,
          precio_venta: parseFloat(formData.precio_venta) || 0,
          costo_compra: parseFloat(formData.costo_compra) || 0,
          iva: parseFloat(formData.iva) || 0, // ← NUEVO CAMPO IVA
          tipo: formData.tipo,
          proveedor_id: formData.proveedor_id || null,
          estado: formData.estado
        };
        const { error } = await (supabase as any).from('productos').update(updateData).eq('id', editingProducto.id);
        if (error) {
          console.error('Error actualizando producto:', error);
          showToast('Error actualizando producto', 'error');
          return;
        }
        showToast('Producto actualizado correctamente', 'success');
        
        // Registrar log de auditoría
        await registrarLog(supabase, {
          empresa_id: user?.empresa_id || undefined,
          usuario_id: user?.id,
          accion: 'ACTUALIZAR_PRODUCTO',
          modulo: 'PRODUCTOS',
          detalles: {
            producto_id: editingProducto.id,
            nombre_anterior: editingProducto.nombre,
            nombre_nuevo: formData.nombre,
            precio_anterior: editingProducto.precio_venta,
            precio_nuevo: parseFloat(formData.precio_venta) || 0,
            stock_anterior: editingProducto.stock,
            stock_nuevo: parseInt(formData.stock) || 0,
            actualizado_por: user?.id,
            fecha_actualizacion: new Date().toISOString()
          }
        });
      } else {
        const productoData = {
          nombre: formData.nombre,
          sku: formData.sku || null,
          stock: parseInt(formData.stock) || 0,
          stock_minimo: parseInt(formData.stock_minimo) || 5,
          precio_venta: parseFloat(formData.precio_venta) || 0,
          costo_compra: parseFloat(formData.costo_compra) || 0,
          iva: parseFloat(formData.iva) || 0, // ← NUEVO CAMPO IVA
          tipo: formData.tipo,
          proveedor_id: formData.proveedor_id || null,
          estado: formData.estado,
          empresa_id: user?.empresa_id,
          created_at: new Date().toISOString()
        };
        const { data, error } = await (supabase as any).from('productos').insert(productoData).select('id').single();
        if (error) {
          console.error('Error creando producto:', error);
          showToast('Error creando producto', 'error');
          return;
        }
        showToast('Producto creado correctamente', 'success');
        
        // Registrar log de auditoría
        await registrarLog(supabase, {
          empresa_id: user?.empresa_id || undefined,
          usuario_id: user?.id,
          accion: 'CREAR_PRODUCTO',
          modulo: 'PRODUCTOS',
          detalles: {
            producto_id: (data as any)?.id,
            nombre: formData.nombre,
            precio_venta: parseFloat(formData.precio_venta) || 0,
            stock: parseInt(formData.stock) || 0,
            creado_por: user?.id,
            fecha_creacion: new Date().toISOString()
          }
        });
      }
      setShowModal(false);
      setEditingProducto(null);
      setFormData({
        nombre: '',
        sku: '',
        stock: '0',
        stock_minimo: '5',
        precio_venta: '0',
        costo_compra: '0',
        iva: '19', // ← VALOR POR DEFECTO IVA
        tipo: 'venta',
        proveedor_id: '',
        estado: 'activo'
      });
      await loadProductos();
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setCreating(false);
    }
  };

  const verProducto = (producto: Producto) => {
    setViewingProducto(producto);
    setShowViewModal(true);
  };

  const editarProducto = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      sku: producto.sku || '',
      stock: producto.stock.toString(),
      stock_minimo: producto.stock_minimo.toString(),
      precio_venta: producto.precio_venta?.toString() || '0',
      costo_compra: producto.costo_compra.toString(),
      iva: producto.iva?.toString() || '19', // ← CARGAR IVA EXISTENTE
      tipo: producto.tipo,
      proveedor_id: producto.proveedor_id || '',
      estado: producto.estado
    });
    setShowModal(true);
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
      
      // Registrar log de auditoría
      await registrarLog(supabase, {
        empresa_id: user?.empresa_id || undefined,
        usuario_id: user?.id,
        accion: 'ELIMINAR_PRODUCTO',
        modulo: 'PRODUCTOS',
        detalles: {
          producto_id: productoToDelete,
          eliminado_por: user?.id,
          fecha_eliminacion: new Date().toISOString()
        }
      });
      
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

  const calcularMargen = (precio: number, costo: number) => {
    if (!precio || precio <= 0) return 0; // Validación para evitar división por cero
    if (!costo) return 0;
    return ((precio - costo) / precio * 100); // FÓRMULA CORRECTA: basada en precio de venta
  };

  useEffect(() => {
    if (user?.empresa_id && !authLoading) {
      loadProveedores();
      loadProductos();
    }
  }, [user, authLoading]);

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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="text-gray-600">Administra el inventario de productos del salón</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <PlusIcon className="w-5 h-5" />
            Nuevo Producto
          </Button>
        </div>

        {/* Filtros Rápidos por Tipo */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
              <div className="flex overflow-x-auto gap-2 w-full pb-2 scrollbar-hide">
                <Button
                  variant={tipoFilter === 'todos' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTipoFilter('todos')}
                  className="flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <CubeIcon className="w-4 h-4" />
                  Todos
                </Button>
                <Button
                  variant={tipoFilter === 'venta' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTipoFilter('venta')}
                  className="flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <ShoppingBagIcon className="w-4 h-4" />
                  Para Venta
                </Button>
                <Button
                  variant={tipoFilter === 'insumo' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTipoFilter('insumo')}
                  className="flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <TagIcon className="w-4 h-4" />
                  Insumos
                </Button>
              </div>
              
              <div className="relative w-full sm:w-auto">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card className="w-full max-w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-500">Cargando productos...</div>
                      </td>
                    </tr>
                  ) : paginatedProductos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          {searchTerm || tipoFilter !== 'todos' ? 'No se encontraron productos con los filtros aplicados' : 'No hay productos registrados'}
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
                          <div className={`text-sm font-medium ${
                            producto.stock <= producto.stock_minimo ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            <div className="flex items-center">
                              {producto.stock <= producto.stock_minimo && (
                                <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-red-500" />
                              )}
                              {producto.stock}
                            </div>
                          </div>
                        </td>
                        {/* NUEVA COLUMNA IVA */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.tipo === 'venta' ? (
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              IVA: {producto.iva || 0}%
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.tipo === 'venta' ? (
                            <div>
                              <span>${(producto.precio_venta || 0).toFixed(2)}</span>
                              {producto.precio_venta && producto.costo_compra && (
                                <div className="text-xs text-green-600">
                                  {calcularMargen(producto.precio_venta, producto.costo_compra).toFixed(1)}% margen
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => verProducto(producto)}>
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => editarProducto(producto)}>
                              <PencilSquareIcon className="w-4 h-4" />
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
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full p-4">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  Mostrando {itemOffset + 1} a {Math.min(endOffset + 1, totalCount)} de {totalCount} resultados
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

        {/* Modal Nuevo/Editar Producto */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProducto(null);
                    setFormData({
                      nombre: '',
                      sku: '',
                      stock: '0',
                      stock_minimo: '5',
                      precio_venta: '0',
                      costo_compra: '0',
                      iva: '19', // ← VALOR POR DEFECTO IVA
                      tipo: 'venta',
                      proveedor_id: '',
                      estado: 'activo'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleGuardarProducto}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <div className="relative">
                        <CubeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          required
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                          placeholder="Ej: Tinte para Cabello"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                        placeholder="Ej: TINTE-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                      <select
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                      >
                        <option value="venta">Para Venta</option>
                        <option value="insumo">Insumo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                      <div className="relative">
                        <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          name="proveedor_id"
                          value={formData.proveedor_id}
                          onChange={handleInputChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                        >
                          <option value="">Seleccionar proveedor</option>
                          {proveedores.map(proveedor => (
                            <option key={proveedor.id} value={proveedor.id}>
                              {proveedor.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                      <input
                        type="number"
                        name="stock_minimo"
                        value={formData.stock_minimo}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Venta {formData.tipo === 'venta' ? '*' : '(opcional)'}
                      </label>
                      <div className="relative">
                        <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="number"
                          name="precio_venta"
                          value={formData.precio_venta}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          required={formData.tipo === 'venta'}
                          disabled={formData.tipo === 'insumo'}
                          className={`pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                            formData.tipo === 'insumo' ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      {formData.tipo === 'insumo' && (
                        <p className="text-xs text-gray-500 mt-1">No aplica para insumos</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo Compra</label>
                      <div className="relative">
                        <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="number"
                          name="costo_compra"
                          value={formData.costo_compra}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {/* NUEVO CAMPO IVA */}
                    {formData.tipo === 'venta' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
                        <select
                          name="iva"
                          value={formData.iva}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                        >
                          <option value="0">0% - Exento</option>
                          <option value="5">5% - Reducido</option>
                          <option value="19">19% - General</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Seleccione el porcentaje de IVA aplicable</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                  {formData.tipo === 'venta' && formData.precio_venta && formData.costo_compra && (
                    <div className="p-4 bg-blue-50 rounded-md">
                      <div className="text-sm text-blue-800">
                        <strong>Margen:</strong> {calcularMargen(parseFloat(formData.precio_venta), parseFloat(formData.costo_compra)).toFixed(2)}%
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Precio: ${parseFloat(formData.precio_venta).toFixed(2)} - Costo: ${parseFloat(formData.costo_compra).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProducto(null);
                      setFormData({
                        nombre: '',
                        sku: '',
                        stock: '0',
                        stock_minimo: '5',
                        precio_venta: '0',
                        costo_compra: '0',
                        iva: '19', // ← VALOR POR DEFECTO IVA
                        tipo: 'venta',
                        proveedor_id: '',
                        estado: 'activo'
                      });
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? (editingProducto ? 'Actualizando...' : 'Guardando...') : (editingProducto ? 'Actualizar' : 'Guardar')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ver Detalles */}
        {showViewModal && viewingProducto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Detalles del Producto</h2>
                <button onClick={() => { setShowViewModal(false); setViewingProducto(null); }} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProducto.nombre}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProducto.sku || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        viewingProducto.tipo === 'venta' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {viewingProducto.tipo === 'venta' ? 'Para Venta' : 'Insumo'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        viewingProducto.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingProducto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProducto.proveedor?.nombre || 'Sin proveedor'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                    <div className={`p-3 rounded-md ${viewingProducto.stock <= viewingProducto.stock_minimo ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center">
                        {viewingProducto.stock <= viewingProducto.stock_minimo && (
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-red-500" />
                        )}
                        <p className={`text-sm font-medium ${viewingProducto.stock <= viewingProducto.stock_minimo ? 'text-red-600' : 'text-gray-900'}`}>
                          {viewingProducto.stock}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProducto.stock_minimo}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo Compra</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">${(viewingProducto.costo_compra || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                {/* NUEVO CAMPO IVA EN VISTA */}
                {viewingProducto.tipo === 'venta' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IVA</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProducto.iva || 0}%</p>
                    </div>
                  </div>
                )}
                {viewingProducto.tipo === 'venta' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">${(viewingProducto.precio_venta || 0).toFixed(2)}</p>
                      {viewingProducto.precio_venta && viewingProducto.costo_compra && (
                        <div className="text-xs text-green-600 mt-1">
                          {calcularMargen(viewingProducto.precio_venta, viewingProducto.costo_compra).toFixed(1)}% margen
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => { setShowViewModal(false); setViewingProducto(null); }} className="w-full">
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
