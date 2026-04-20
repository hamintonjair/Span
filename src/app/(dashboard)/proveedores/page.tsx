'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  BuildingOfficeIcon, 
  MagnifyingGlassIcon, 
  PencilSquareIcon, 
  TrashIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  HomeIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Proveedor {
  id: string;
  empresa_id: string;
  nombre: string;
  contacto_nombre?: string | null;
  telefono?: string | null;
  email?: string | null;
  nit_rut?: string | null;
  direccion?: string | null;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at?: string;
}

interface ProveedorFormData {
  nombre: string;
  contacto_nombre: string;
  telefono: string;
  email: string;
  nit_rut: string;
  direccion: string;
  estado: 'activo' | 'inactivo';
}

// Toast implementation
const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  return { showToast, toasts };
};

export default function ProveedoresPage() {
  const { user, loading: authLoading } = useJWTAuth();
  const { showToast, toasts } = useToast();
  const supabase = createClient();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProveedor, setViewingProveedor] = useState<Proveedor | null>(null);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState<ProveedorFormData>({
    nombre: '',
    contacto_nombre: '',
    telefono: '',
    email: '',
    nit_rut: '',
    direccion: '',
    estado: 'activo'
  });

  // Paginación
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular página actual basado en offset
  useEffect(() => {
    setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1);
  }, [itemOffset, itemsPerPage]);

  // Datos para mostrar en tabla
  const endOffset = itemOffset + itemsPerPage - 1;
  const paginatedProveedores = filteredProveedores.slice(itemOffset, endOffset + 1);
  const pageCount = Math.ceil(totalCount / itemsPerPage);

  // Cargar proveedores
  const loadProveedores = async () => {
    if (!user?.empresa_id) return;
    
    try {
      setLoading(true);
      console.log('Cargando proveedores para empresa:', user.empresa_id);
      
      const { data, error, count } = await supabase
        .from('proveedores')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });

      console.log('Respuesta de Supabase (proveedores):', { data, error, count });

      if (error) {
        console.error('Error cargando proveedores:', error);
        showToast('Error cargando proveedores: ' + error.message, 'error');
        return;
      }

      console.log('Proveedores cargados:', data);
      setProveedores(data || []);
      setFilteredProveedores(data || []);
      setTotalCount(count || 0);
      setItemOffset(0);
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado: ' + (error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar proveedores
  useEffect(() => {
    let filtered = proveedores;

    // Filtrar por nombre o NIT/RUT
    if (searchTerm.trim()) {
      filtered = filtered.filter(proveedor =>
        proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proveedor.nit_rut && proveedor.nit_rut.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProveedores(filtered);
    setItemOffset(0); // Resetear a primera página al filtrar
  }, [proveedores, searchTerm]);

  // Función para manejar el cambio de inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar el cambio de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Función para guardar proveedor
  const handleGuardarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      showToast('La razón social es requerida', 'error');
      return;
    }

    try {
      setCreating(true);
      
      if (editingProveedor) {
        // Actualizar proveedor existente
        const updateData = {
          nombre: formData.nombre,
          contacto_nombre: formData.contacto_nombre || null,
          telefono: formData.telefono || null,
          email: formData.email || null,
          nit_rut: formData.nit_rut || null,
          direccion: formData.direccion || null,
          estado: formData.estado
        };
        
        console.log('Actualizando proveedor:', updateData);
        
        const { error } = await (supabase as any)
          .from('proveedores')
          .update(updateData)
          .eq('id', editingProveedor.id);
          
        if (error) {
          console.error('Error actualizando proveedor:', error);
          showToast('Error actualizando proveedor', 'error');
          return;
        }
        
        showToast('Proveedor actualizado correctamente', 'success');
      } else {
        // Crear nuevo proveedor
        const proveedorData = {
          nombre: formData.nombre,
          contacto_nombre: formData.contacto_nombre || null,
          telefono: formData.telefono || null,
          email: formData.email || null,
          nit_rut: formData.nit_rut || null,
          direccion: formData.direccion || null,
          estado: formData.estado,
          empresa_id: user?.empresa_id,
          created_at: new Date().toISOString()
        };
        
        console.log('Creando proveedor:', proveedorData);
        
        const { error } = await (supabase as any)
          .from('proveedores')
          .insert(proveedorData);
          
        if (error) {
          console.error('Error creando proveedor:', error);
          showToast('Error creando proveedor', 'error');
          return;
        }
        
        showToast('Proveedor creado correctamente', 'success');
      }
      
      setShowModal(false);
      setEditingProveedor(null);
      setFormData({
        nombre: '',
        contacto_nombre: '',
        telefono: '',
        email: '',
        nit_rut: '',
        direccion: '',
        estado: 'activo'
      });
      await loadProveedores();
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Función para ver detalles del proveedor
  const verProveedor = (proveedor: Proveedor) => {
    setViewingProveedor(proveedor);
    setShowViewModal(true);
  };

  // Función para editar proveedor
  const editarProveedor = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      contacto_nombre: proveedor.contacto_nombre || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      nit_rut: proveedor.nit_rut || '',
      direccion: proveedor.direccion || '',
      estado: proveedor.estado || 'activo'
    });
    setShowModal(true);
  };

  // Función para eliminar proveedor
  const eliminarProveedor = (proveedorId: string) => {
    setProveedorToDelete(proveedorId);
    setShowDeleteModal(true);
  };

  // Función para confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!proveedorToDelete) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', proveedorToDelete);
        
      if (error) {
        console.error('Error eliminando proveedor:', error);
        showToast('Error eliminando proveedor', 'error');
        return;
      }
      
      showToast('Proveedor eliminado exitosamente', 'success');
      await loadProveedores();
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setProveedorToDelete(null);
    }
  };

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setShowDeleteModal(false);
    setProveedorToDelete(null);
  };

  useEffect(() => {
    if (user?.empresa_id && !authLoading) {
      loadProveedores();
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
        {/* Toast notifications */}
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

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
            <p className="text-gray-600">Administra a quién le compras los productos del salón</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2"
          >
            <BuildingOfficeIcon className="w-5 h-5" />
            Nuevo Proveedor
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Proveedores</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Con Contacto</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {proveedores.filter(p => p.contacto_nombre).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Búsqueda</h3>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o NIT/RUT..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Proveedores */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NIT/RUT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-gray-500">Cargando proveedores...</div>
                      </td>
                    </tr>
                  ) : filteredProveedores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          {searchTerm ? 'No se encontraron proveedores con los filtros aplicados' : 'No hay proveedores registrados'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedProveedores.map((proveedor) => (
                      <tr key={proveedor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{proveedor.nombre}</div>
                          {proveedor.contacto_nombre && (
                            <div className="text-sm text-gray-500">Contacto: {proveedor.contacto_nombre}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{proveedor.nit_rut || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{proveedor.telefono || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{proveedor.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            proveedor.estado === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {proveedor.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verProveedor(proveedor)}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editarProveedor(proveedor)}
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => eliminarProveedor(proveedor.id)}
                            >
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

            {/* Paginación */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
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
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-700">
                    Página {currentPage} de {pageCount}
                  </span>
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
            </div>
          </CardContent>
        </Card>

        {/* Modal para Nuevo/Editar Proveedor */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProveedor(null);
                    setFormData({
                      nombre: '',
                      contacto_nombre: '',
                      telefono: '',
                      email: '',
                      nit_rut: '',
                      direccion: '',
                      estado: 'activo'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleGuardarProveedor}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna Izquierda */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razón Social *
                      </label>
                      <div className="relative">
                        <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          required
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: Distribuidora de Belleza S.A."
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Contacto
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="contacto_nombre"
                          value={formData.contacto_nombre}
                          onChange={handleInputChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: Juan Pérez"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIT/RUT
                      </label>
                      <div className="relative">
                        <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="nit_rut"
                          value={formData.nit_rut}
                          onChange={handleInputChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: 123456789-0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Columna Derecha */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: +57 300 123 4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: contacto@proveedor.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <div className="relative">
                        <HomeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="direccion"
                          value={formData.direccion}
                          onChange={handleInputChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: Calle 123 #45-67"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProveedor(null);
                      setFormData({
                        nombre: '',
                        contacto_nombre: '',
                        telefono: '',
                        email: '',
                        nit_rut: '',
                        direccion: '',
                        estado: 'activo'
                      });
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                  >
                    {creating ? (editingProveedor ? 'Actualizando...' : 'Guardando...') : (editingProveedor ? 'Actualizar Proveedor' : 'Guardar Proveedor')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
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
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar este proveedor? Todos los datos asociados serán eliminados permanentemente.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelarEliminacion}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmarEliminacion}
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Ver Detalles del Proveedor */}
        {showViewModal && viewingProveedor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Detalles del Proveedor</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingProveedor(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razón Social
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProveedor.nombre}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contacto
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProveedor.contacto_nombre || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProveedor.telefono || 'No especificado'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProveedor.email || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIT/RUT
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProveedor.nit_rut || 'No especificado'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{viewingProveedor.direccion || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      viewingProveedor.estado === 'activo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingProveedor.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingProveedor(null);
                  }}
                  className="w-full"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
