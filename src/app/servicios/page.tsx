'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  ScissorsIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  TrashIcon,
  TagIcon
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

interface Servicio {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  comision_porcentaje: number;
  duracion_minutos: number;
  estado: 'activo' | 'inactivo';
  categoria_id: string;
  created_at: string;
  updated_at?: string;
  categoria?: {
    id: string;
    nombre: string;
  };
}

interface Categoria {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion?: string | null;
  created_at: string;
}

interface ServicioFormData {
  nombre: string;
  descripcion: string;
  precio: string;
  comision_porcentaje: string;
  duracion_minutos: string;
  estado: 'activo' | 'inactivo';
  categoria_id: string;
}

export default function ServiciosPage() {
  const { user, loading: authLoading } = useJWTAuth();
  const { showToast } = useToast();
  const supabase = createClient();

  // Estados
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [servicioToDelete, setServicioToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServicioFormData>({
    nombre: '',
    descripcion: '',
    precio: '',
    comision_porcentaje: '',
    duracion_minutos: '',
    estado: 'activo',
    categoria_id: ''
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
  const paginatedServicios = filteredServicios.slice(itemOffset, endOffset + 1);
  const pageCount = Math.ceil(totalCount / itemsPerPage);

  // Cargar categorías
  const loadCategorias = async () => {
    if (!user?.empresa_id) return;
    
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre')
        .eq('empresa_id', user.empresa_id)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error cargando categorías:', error);
        return;
      }

      setCategorias(data || []);
    } catch (error) {
      console.error('Error inesperado cargando categorías:', error);
    }
  };

  // Cargar servicios
  const loadServicios = async () => {
    if (!user?.empresa_id) return;
    
    try {
      setLoading(true);
      console.log('Cargando servicios para empresa:', user.empresa_id);
      
      // Query simple para obtener los datos correctamente
      const { data, error, count } = await supabase
        .from('servicios')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });

      console.log('Respuesta de Supabase (servicios):', { data, error, count });

      if (error) {
        console.error('Error cargando servicios:', error);
        showToast('Error cargando servicios: ' + error.message, 'error');
        return;
      }

      // Si tenemos servicios, cargar categorías por separado
      if (data && data.length > 0) {
        const categoriaIds: string[] = [];
        (data as Servicio[]).forEach(s => {
          if (s.categoria_id && !categoriaIds.includes(s.categoria_id)) {
            categoriaIds.push(s.categoria_id);
          }
        });
        
        if (categoriaIds.length > 0) {
          const { data: categoriasData, error: categoriasError } = await supabase
            .from('categorias')
            .select('id, nombre')
            .in('id', categoriaIds);
            
          if (!categoriasError && categoriasData) {
            // Combinar datos
            const serviciosConCategorias: Servicio[] = [];
            for (const servicio of data as Servicio[]) {
              const categoriaEncontrada = categoriasData.find((cat: Categoria) => cat.id === servicio.categoria_id);
              serviciosConCategorias.push({
                ...servicio,
                categoria: categoriaEncontrada || { id: '', nombre: 'Sin categoría' }
              });
            }
            
            console.log('Servicios con categorías:', serviciosConCategorias);
            setServicios(serviciosConCategorias);
            setFilteredServicios(serviciosConCategorias);
            setTotalCount(count || 0);
            setItemOffset(0);
            return;
          }
        }
      }

      // Si no hay servicios o error en categorías, usar datos sin categorías
      console.log('Usando datos sin categorías:', data);
      setServicios(data || []);
      setFilteredServicios(data || []);
      setTotalCount(count || 0);
      setItemOffset(0);
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado: ' + (error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar servicios
  useEffect(() => {
    let filtered = servicios;

    // Filtrar por nombre
    if (searchTerm.trim()) {
      filtered = filtered.filter(servicio =>
        servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (filtroCategoria) {
      filtered = filtered.filter(servicio =>
        servicio.categoria_id === filtroCategoria
      );
    }

    setFilteredServicios(filtered);
    setItemOffset(0); // Resetear a primera página al filtrar
  }, [servicios, searchTerm, filtroCategoria]);

  // Función para manejar el cambio de inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  // Función para guardar servicio
  const handleGuardarServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre.trim()) {
      showToast('El nombre del servicio es requerido', 'error');
      return;
    }

    if (!formData.categoria_id) {
      showToast('Debe seleccionar una categoría', 'error');
      return;
    }

    const precio = parseFloat(formData.precio);
    const comision = parseFloat(formData.comision_porcentaje) / 100; // Convertir de porcentaje a monto
    const duracion = parseInt(formData.duracion_minutos);

    if (isNaN(precio) || precio < 0) {
      showToast('El precio debe ser un número positivo', 'error');
      return;
    }

    if (isNaN(comision) || comision < 0) {
      showToast('La comisión debe ser un número positivo', 'error');
      return;
    }

    if (isNaN(duracion) || duracion <= 0) {
      showToast('La duración debe ser un número mayor a 0', 'error');
      return;
    }
    
    try {
      setCreating(true);
      
      if (editingServicio) {
        // Actualizar servicio existente
        const updateData = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          precio: precio,
          comision_porcentaje: parseFloat(formData.comision_porcentaje),
          duracion_minutos: duracion,
          estado: formData.estado,
          categoria_id: formData.categoria_id
        };
        
        const { error } = await (supabase as any)
          .from('servicios')
          .update(updateData)
          .eq('id', editingServicio.id);
          
        if (error) {
          console.error('Error actualizando servicio:', error);
          showToast('Error actualizando servicio', 'error');
          return;
        }
        
        showToast('Servicio actualizado correctamente', 'success');
      } else {
        // Crear nuevo servicio
        const servicioData = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          precio: precio,
          comision_porcentaje: parseFloat(formData.comision_porcentaje),
          duracion_minutos: duracion,
          estado: formData.estado,
          categoria_id: formData.categoria_id,
          empresa_id: user?.empresa_id,
          created_at: new Date().toISOString()
        };
        
        console.log('Creando servicio:', servicioData);
        
        const { error } = await (supabase as any)
          .from('servicios')
          .insert(servicioData, { head: true });
          
        if (error) {
          console.error('Error creando servicio:', error);
          showToast('Error creando servicio', 'error');
          return;
        }
        
        showToast('Servicio creado correctamente', 'success');
      }
      
      setShowModal(false);
      setEditingServicio(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        comision_porcentaje: '',
        duracion_minutos: '',
        estado: 'activo',
        categoria_id: ''
      });
      await loadServicios();
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Función para editar servicio
  const editarServicio = (servicio: Servicio) => {
    setEditingServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio.toString(),
      comision_porcentaje: servicio.comision_porcentaje.toString(),
      duracion_minutos: servicio.duracion_minutos.toString(),
      estado: servicio.estado,
      categoria_id: servicio.categoria_id
    });
    setShowModal(true);
  };

  // Función para eliminar servicio
  const eliminarServicio = (servicioId: string) => {
    setServicioToDelete(servicioId);
    setShowDeleteModal(true);
  };

  // Función para confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!servicioToDelete) return;
    
    try {
      setLoading(true);
      
      const { error } = await (supabase as any)
        .from('servicios')
        .delete()
        .eq('id', servicioToDelete);
        
      if (error) {
        console.error('Error eliminando servicio:', error);
        showToast('Error eliminando servicio', 'error');
        return;
      }
      
      showToast('Servicio eliminado exitosamente', 'success');
      await loadServicios();
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setServicioToDelete(null);
    }
  };

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setShowDeleteModal(false);
    setServicioToDelete(null);
  };

  useEffect(() => {
    if (user?.empresa_id && !authLoading) {
      loadCategorias();
      loadServicios();
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Servicios</h1>
            <p className="text-gray-600">Administra los servicios ofrecidos en tu salón</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2"
          >
            <ScissorsIcon className="w-5 h-5" />
            Nuevo Servicio
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ScissorsIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Servicios</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TagIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Categorías</p>
                  <p className="text-2xl font-bold text-gray-900">{categorias.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ScissorsIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {servicios.filter(s => s.estado === 'activo').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Filtros y Búsqueda</h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Servicios */}
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
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duración
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
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-500">Cargando servicios...</div>
                      </td>
                    </tr>
                  ) : filteredServicios.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          {searchTerm || filtroCategoria ? 'No se encontraron servicios con los filtros aplicados' : 'No hay servicios registrados'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedServicios.map((servicio) => (
                      <tr key={servicio.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{servicio.nombre}</div>
                          {servicio.descripcion && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{servicio.descripcion}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {servicio.categoria?.nombre || 'Sin categoría'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${servicio.precio.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Comisión: {servicio.comision_porcentaje.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{servicio.duracion_minutos} min</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            servicio.estado === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {servicio.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editarServicio(servicio)}
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => eliminarServicio(servicio.id)}
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
                    <ChevronLeftIcon className="w-4 h-4" />
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
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal para Nuevo/Editar Servicio */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingServicio(null);
                    setFormData({
                      nombre: '',
                      descripcion: '',
                      precio: '',
                      comision_empleado: '',
                      duracion_minutos: '',
                      estado: 'activo',
                      categoria_id: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleGuardarServicio}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna Izquierda */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Servicio *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Ej: Corte de cabello"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría *
                      </label>
                      <select
                        name="categoria_id"
                        value={formData.categoria_id}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categorias.map((categoria) => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio ($) *
                      </label>
                      <input
                        type="number"
                        name="precio"
                        value={formData.precio}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="25.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Precio final que pagará el cliente.
                      </p>
                    </div>
                  </div>
                  
                  {/* Columna Derecha */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comisión del Empleado (%) *
                      </label>
                      <input
                        type="number"
                        name="comision_porcentaje"
                        value={formData.comision_porcentaje}
                        onChange={handleInputChange}
                        required
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="10.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Define aquí la comisión específica para este servicio. Si se deja en 0, el sistema podrá usar la comisión base del empleado.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duración (minutos) *
                      </label>
                      <input
                        type="number"
                        name="duracion_minutos"
                        value={formData.duracion_minutos}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        En minutos. Ayudará a organizar la agenda de citas.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Descripción - Ancho completo */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Describe el servicio..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingServicio(null);
                      setFormData({
                        nombre: '',
                        descripcion: '',
                        precio: '',
                        comision_empleado: '',
                        duracion_minutos: '',
                        estado: 'activo',
                        categoria_id: ''
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
                    {creating ? (editingServicio ? 'Actualizando...' : 'Guardando...') : (editingServicio ? 'Actualizar Servicio' : 'Guardar Servicio')}
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
                  ¿Estás seguro de que deseas eliminar este servicio? Todos los datos asociados serán eliminados permanentemente.
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
