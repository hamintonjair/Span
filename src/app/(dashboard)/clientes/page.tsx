'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  PencilSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Implementación simple de toast para evitar errores
const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    if (typeof window !== 'undefined') {
      // Crear elemento toast temporal
      const toast = document.createElement('div');
      toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-yellow-500'
      }`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      // Animación de entrada
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      }, 10);
      
      // Eliminar después de 3 segundos
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 3000);
    }
  };
  
  return { showToast };
};

interface Cliente {
  id: string;
  empresa_id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_nacimiento?: string | null;
  es_vip?: boolean;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

interface ClienteFormData {
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_nacimiento?: string | null;
  es_vip?: boolean;
  estado: 'activo' | 'inactivo';
}

export default function ClientesPage() {
  const { user, loading: authLoading } = useJWTAuth();
  const { showToast } = useToast();
  const supabase = createClient();

  // Estados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: '',
    fecha_nacimiento: null,
    es_vip: false,
    estado: 'activo'
  });
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

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
  const currentClientes = filteredClientes.slice(itemOffset, endOffset + 1);
  const pageCount = Math.ceil(totalCount / itemsPerPage);

  // Validación de email
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Cargar clientes
  const loadClientes = async () => {
    if (!user?.empresa_id) return;
    
    try {
      setLoading(true);
      const { data, error, count } = await supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando clientes:', error);
        showToast('Error cargando clientes', 'error');
        return;
      }

      setClientes(data || []);
      setFilteredClientes(data || []);
      setTotalCount(count || 0); // Usar totalCount del servidor
      setItemOffset(0); // Resetear a primera página al cargar
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes
  useEffect(() => {
    const filtered = clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cedula.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClientes(filtered);
    setItemOffset(0); // Resetear a primera página al filtrar
  }, [clientes, searchTerm]);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre.trim()) {
      showToast('El nombre es requerido', 'error');
      return;
    }
    
    if (!formData.cedula.trim()) {
      showToast('La cédula es requerida', 'error');
      return;
    }
    
    if (!formData.telefono.trim()) {
      showToast('El teléfono es requerido', 'error');
      return;
    }
    
    if (!formData.email.trim()) {
      showToast('El email es requerido', 'error');
      return;
    }
    
    if (!validateEmail(formData.email)) {
      showToast('Por favor, ingresa un email válido', 'error');
      return;
    }
    
    if (!formData.direccion.trim()) {
      showToast('La dirección es requerida', 'error');
      return;
    }
    
    try {
      setCreating(true);
      
      // Crear nuevo cliente
      console.log('user?.empresa_id:', user?.empresa_id, typeof user?.empresa_id);
      
      const clienteData = {
        ...formData,
        empresa_id: user?.empresa_id, // Capturar automáticamente del usuario
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('clienteData:', clienteData);
      
      // CÓDIGO REAL - LA TABLA EXISTE
      const { error } = await supabase
        .from('clientes')
        .insert(clienteData as any);
        
      if (error) {
        console.error('Error creando cliente:', error);
        showToast('Error creando cliente', 'error');
        return;
      }
      
      showToast('Cliente registrado correctamente', 'success');
      setShowModal(false);
      setFormData({
        nombre: '',
        cedula: '',
        telefono: '',
        email: '',
        direccion: '',
        estado: 'activo'
      });
      await loadClientes();
      
      // TEMPORAL: Simulación (comentada)
      /*
      console.log('Creando cliente (simulado):', clienteData);
      
      // Simulación de éxito - COMENTAR CUANDO LA TABLA EXISTA
      showToast('Cliente registrado correctamente (simulado)', 'success');
      setShowModal(false);
      setFormData({
        nombre: '',
        cedula: '',
        telefono: '',
        email: '',
        direccion: '',
        estado: 'activo'
      });
      // await loadClientes(); // Comentar temporalmente
      */
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Función para manejar el cambio de inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    
    // Manejar checkboxes (como es_vip)
    if (target.type === 'checkbox') {
      const checked = (target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // Manejar inputs normales (text, email, tel, date, select, textarea)
      const value = target.value;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Resetear paginación al buscar
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setItemOffset(0);
  };

  // Función para editar cliente
  const editarCliente = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      cedula: cliente.cedula,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      fecha_nacimiento: cliente.fecha_nacimiento,
      es_vip: cliente.es_vip || false,
      estado: cliente.estado
    });
    setShowEditModal(true);
  };

  // Función para ver detalles del cliente
  const verDetallesCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDetailsModal(true);
  };

  // Función para eliminar cliente
  const eliminarCliente = async (clienteId: string) => {
    setClienteToDelete(clienteId);
    setShowDeleteModal(true);
  };

  // Función para confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!clienteToDelete) return;
    
    try {
      setLoading(true);
      
      // CÓDIGO REAL - LA TABLA EXISTE
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteToDelete);
        
      if (error) {
        console.error('Error eliminando cliente:', error);
        showToast('Error eliminando cliente', 'error');
        return;
      }
      
      showToast('Cliente eliminado exitosamente', 'success');
      await loadClientes();
      
      // TEMPORAL: Simulación (comentada)
      /*
      console.log('Eliminando cliente (simulado):', clienteToDelete);
      
      // Simulación de éxito
      showToast('Cliente eliminado exitosamente (simulado)', 'success');
      */
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setClienteToDelete(null);
    }
  };

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setShowDeleteModal(false);
    setClienteToDelete(null);
  };

  // Función para actualizar cliente
  const handleUpdateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCliente) return;
    
    try {
      setCreating(true);
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      // CÓDIGO REAL - LA TABLA EXISTE
      // @ts-ignore
      // @ts-ignore  
      // @ts-ignore
      // @ts-ignore
      // @ts-ignore
      const { error } = await (supabase.from('clientes') as any)
        .update(updateData)
        .eq('id', editingCliente.id);
        
      if (error) {
        console.error('Error actualizando cliente:', error);
        showToast('Error actualizando cliente', 'error');
        return;
      }
      
      showToast('Cliente actualizado exitosamente', 'success');
      setShowEditModal(false);
      setEditingCliente(null);
      setFormData({
        nombre: '',
        cedula: '',
        telefono: '',
        email: '',
        direccion: '',
        estado: 'activo'
      });
      await loadClientes();
      
      // TEMPORAL: Simulación (comentada)
      /*
      console.log('Actualizando cliente (simulado):', updateData);
      console.log('ID del cliente a actualizar:', editingCliente.id);
      
      // Simulación de éxito - COMENTAR CUANDO LA TABLA EXISTA
      showToast('Cliente actualizado exitosamente (simulado)', 'success');
      setShowEditModal(false);
      setEditingCliente(null);
      setFormData({
        nombre: '',
        cedula: '',
        telefono: '',
        email: '',
        direccion: '',
        estado: 'activo'
      });
      // await loadClientes(); // Comentar temporalmente
      */
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (user?.empresa_id && !authLoading) {
      loadClientes();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user?.empresa_id) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-2">Gestiona los clientes de tu salón</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2"
            >
              <UserGroupIcon className="h-4 w-4" />
              Agregar Cliente
            </Button>
            <span className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-gray-50">
              {filteredClientes.length} clientes
            </span>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                variant="outline"
                onClick={loadClientes}
                className="flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Clientes */}
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
                      Cédula
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : currentClientes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? 'No se encontraron clientes con esos criterios' : 'No hay clientes registrados'}
                      </td>
                    </tr>
                  ) : (
                    currentClientes.map((cliente) => (
                      <tr key={cliente.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                            {cliente.es_vip && (
                              <div className="ml-2 flex items-center">
                                <span className="text-yellow-500" title="Cliente VIP">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                  </svg>
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{cliente.cedula}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{cliente.telefono}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{cliente.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={cliente.direccion}>
                            {cliente.direccion}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cliente.estado === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verDetallesCliente(cliente)}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editarCliente(cliente)}
                            >
                      <PencilSquareIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => eliminarCliente(cliente.id)}
                            >
                              <TrashIcon className="h-4 w-4" />
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
                    onClick={() => setItemOffset(Math.min(itemOffset + itemsPerPage, totalCount - itemsPerPage))}
                    disabled={itemOffset + itemsPerPage >= totalCount}
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal para agregar cliente */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Nuevo Cliente</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      nombre: '',
                      cedula: '',
                      telefono: '',
                      email: '',
                      direccion: '',
                      es_vip: false,
                      estado: 'activo'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cédula *
                    </label>
                    <input
                      type="text"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <textarea
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="es_vip"
                        checked={formData.es_vip || false}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                    <label className="ml-3 text-sm font-medium text-gray-700">
                      Marcar como Cliente VIP
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({
                        nombre: '',
                        cedula: '',
                        telefono: '',
                        email: '',
                        direccion: '',
                        estado: 'activo'
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                  >
                    {creating ? 'Guardando...' : 'Guardar Cliente'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para editar cliente */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Editar Cliente</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCliente(null);
                    setFormData({
                      nombre: '',
                      cedula: '',
                      telefono: '',
                      email: '',
                      direccion: '',
                      es_vip: false,
                      estado: 'activo'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCliente}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cédula *
                    </label>
                    <input
                      type="text"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <textarea
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="es_vip"
                        checked={formData.es_vip || false}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                    <label className="ml-3 text-sm font-medium text-gray-700">
                      Marcar como Cliente VIP
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCliente(null);
                      setFormData({
                        nombre: '',
                        cedula: '',
                        telefono: '',
                        email: '',
                        direccion: '',
                        es_vip: false,
                        estado: 'activo'
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                  >
                    {creating ? 'Actualizando...' : 'Actualizar Cliente'}
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
                  ¿Estás seguro de que deseas eliminar este cliente? Todos los datos asociados serán eliminados permanentemente.
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

        {/* Modal de Detalles del Cliente */}
        {showDetailsModal && selectedCliente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <EyeIcon className="w-6 h-6 mr-2 text-blue-600" />
                  Detalles del Cliente
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCliente(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Información Personal */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre Completo</p>
                      <p className="font-medium text-gray-900 flex items-center">
                        {selectedCliente.nombre}
                        {selectedCliente.es_vip && (
                          <span className="ml-2 text-yellow-500" title="Cliente VIP">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cédula</p>
                      <p className="font-medium text-gray-900">{selectedCliente.cedula}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                      <p className="font-medium text-gray-900">
                        {selectedCliente.fecha_nacimiento 
                          ? new Date(selectedCliente.fecha_nacimiento).toLocaleDateString('es-MX')
                          : 'No registrada'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedCliente.estado === 'activo'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PencilIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Información de Contacto
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium text-gray-900">{selectedCliente.telefono}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedCliente.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="font-medium text-gray-900">{selectedCliente.direccion}</p>
                    </div>
                  </div>
                </div>

                {/* Información del Sistema */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ChevronRightIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Información del Sistema
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ID de Cliente</p>
                      <p className="font-medium text-gray-900 text-sm font-mono">{selectedCliente.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Registro</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedCliente.created_at).toLocaleString('es-MX')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Última Actualización</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedCliente.updated_at).toLocaleString('es-MX')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Cliente</p>
                      <p className="font-medium text-gray-900">
                        {selectedCliente.es_vip ? (
                          <span className="flex items-center text-yellow-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            Cliente VIP
                          </span>
                        ) : (
                          <span className="text-gray-600">Cliente Regular</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCliente(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
