'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  TagIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  PencilSquareIcon
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
        toast.style.transform = 'translateX(0)';
      }, 100);
      
      // Eliminar después de 3 segundos
      setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }
  };
  
  return { showToast };
};

interface Categoria {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at?: string;
}

interface CategoriaFormData {
  nombre: string;
  descripcion: string;
}

export default function CategoriasPage() {
  const { user, loading: authLoading } = useJWTAuth();
  const { showToast } = useToast();
  const supabase = createClient();

  // Estados
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filteredCategorias, setFilteredCategorias] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoriaFormData>({
    nombre: '',
    descripcion: ''
  });
  const [creating, setCreating] = useState(false);

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
  const paginatedCategorias = filteredCategorias.slice(itemOffset, endOffset + 1);
  const pageCount = Math.ceil(totalCount / itemsPerPage);

  // Cargar categorías
  const loadCategorias = async () => {
    if (!user?.empresa_id) return;
    
    try {
      setLoading(true);
      const { data, error, count } = await supabase
        .from('categorias')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando categorías:', error);
        showToast('Error cargando categorías', 'error');
        return;
      }

      setCategorias(data || []);
      setFilteredCategorias(data || []);
      setTotalCount(count || 0); // Usar totalCount del servidor
      setItemOffset(0); // Resetear a primera página al cargar
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorías
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategorias(categorias);
    } else {
      const filtered = categorias.filter(categoria =>
        categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (categoria.descripcion && categoria.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCategorias(filtered);
      setItemOffset(0); // Resetear a primera página al filtrar
    }
  }, [categorias, searchTerm]);

  // Función para manejar el cambio de inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Resetear paginación al buscar
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setItemOffset(0);
  };

  // Función para guardar categoría
  const handleGuardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      showToast('El nombre de la categoría es requerido', 'error');
      return;
    }
    
    try {
      setCreating(true);
      
      if (editingCategoria) {
        // Actualizar categoría existente
        const updateData = {
          nombre: formData.nombre,
          descripcion: formData.descripcion
        };
        
        const { error } = await (supabase as any)
          .from('categorias')
          .update(updateData)
          .eq('id', editingCategoria.id);
          
        if (error) {
          console.error('Error actualizando categoría:', error);
          showToast('Error actualizando categoría', 'error');
          return;
        }
        
        showToast('Categoría actualizada correctamente', 'success');
      } else {
        // Crear nueva categoría
        const categoriaData = {
          ...formData,
          empresa_id: user?.empresa_id, // Capturar automáticamente del usuario
          created_at: new Date().toISOString()
        };
        
        console.log('Creando categoría:', categoriaData);
        
        // CÓDIGO REAL - LA TABLA EXISTE
        const { error } = await supabase
          .from('categorias')
          .insert(categoriaData as any);
          
        if (error) {
          console.error('Error creando categoría:', error);
          showToast('Error creando categoría', 'error');
          return;
        }
        
        showToast('Categoría creada correctamente', 'success');
      }
      
      setShowModal(false);
      setEditingCategoria(null);
      setFormData({
        nombre: '',
        descripcion: ''
      });
      await loadCategorias();
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Función para editar categoría
  const editarCategoria = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || ''
    });
    setShowModal(true);
  };

  // Función para eliminar categoría
  const eliminarCategoria = (categoriaId: string) => {
    setCategoriaToDelete(categoriaId);
    setShowDeleteModal(true);
  };

  // Función para confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!categoriaToDelete) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', categoriaToDelete);
        
      if (error) {
        console.error('Error eliminando categoría:', error);
        showToast('Error eliminando categoría', 'error');
        return;
      }
      
      showToast('Categoría eliminada exitosamente', 'success');
      await loadCategorias();
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setCategoriaToDelete(null);
    }
  };

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setShowDeleteModal(false);
    setCategoriaToDelete(null);
  };

  useEffect(() => {
    if (user?.empresa_id && !authLoading) {
      loadCategorias();
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
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Acceso Restringido
                </h2>
                <p className="text-gray-600">
                  No tienes una empresa asignada. Contacta al administrador.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
              <p className="text-gray-600 mt-2">Clasificación para servicios y productos</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2"
              >
                <TagIcon className="h-4 w-4" />
                Nueva Categoría
              </Button>
              <span className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-gray-50">
                {filteredCategorias.length} categorías
              </span>
            </div>
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
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Categorías */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Lista de Categorías ({filteredCategorias.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Creación
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCategorias.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? 'No se encontraron categorías con esos criterios' : 'No hay categorías registradas'}
                      </td>
                    </tr>
                  ) : (
                    paginatedCategorias.map((categoria) => (
                      <tr key={categoria.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{categoria.nombre}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={categoria.descripcion || ''}>
                            {categoria.descripcion || 'Sin descripción'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(categoria.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editarCategoria(categoria)}
                            >
                            <PencilSquareIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => eliminarCategoria(categoria.id)}
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

        {/* Modal para Nueva Categoría */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategoria(null);
                    setFormData({
                      nombre: '',
                      descripcion: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGuardarCategoria}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Categoría *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej: Peluquería, Barbería, Uñas..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción (Opcional)
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      placeholder="Breve descripción de la categoría..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                        descripcion: ''
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                  >
                    {creating ? (editingCategoria ? 'Actualizando...' : 'Guardando...') : (editingCategoria ? 'Actualizar Categoría' : 'Guardar Categoría')}
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
                  ¿Estás seguro de que deseas eliminar esta categoría? Todos los datos asociados serán eliminados permanentemente.
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
      </div>
    </MainLayout>
  );
}
