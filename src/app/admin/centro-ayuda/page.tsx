'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { crearArticuloAyudaAction, actualizarArticuloAyudaAction, eliminarArticuloAyudaAction, obtenerArticulosAyudaAction } from '@/app/actions/centro-ayuda';
import { convertToYouTubeEmbed } from '@/utils/youtube';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useToast } from '@/components/ui/toast';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { 
  DocumentTextIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  BookOpenIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export const CATEGORIAS_MODULOS = [
  { label: 'Ventas', value: 'VENTAS' },
  { label: 'Inventario', value: 'INVENTARIO' },
  { label: 'Caja', value: 'CAJA' },
  { label: 'Citas', value: 'CITAS' },
  { label: 'Clientes', value: 'CLIENTES' },
  { label: 'Empleados', value: 'EMPLEADOS' },
  { label: 'Finanzas', value: 'FINANZAS' },
  { label: 'Nóminas', value: 'NOMINAS' },
  { label: 'Préstamos', value: 'PRESTAMOS' },
  { label: 'Productos', value: 'PRODUCTOS' },
  { label: 'Proveedores', value: 'PROVEEDORES' },
  { label: 'Servicios', value: 'SERVICIOS' },
  { label: 'Usuarios', value: 'USUARIOS' },
  { label: 'Configuración', value: 'CONFIGURACION' },
  { label: 'Soporte', value: 'SOPORTE' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Analytics', value: 'ANALYTICS' },
  { label: 'Categorías', value: 'CATEGORIAS' },
  { label: 'Suscripciones', value: 'SUSCRIPCIONES' },
  { label: 'Comisiones', value: 'COMISIONES' },
  { label: 'General', value: 'GENERAL' }
];

interface ArticuloAyuda {
  id: string;
  titulo: string;
  categoria: string;
  estado: 'publicado' | 'borrador';
  contenido: string;
  video_url?: string;
  imagen_url?: string;
  autor_id: string;
  creado_en: string;
  actualizado_en: string;
  autor?: {
    nombre: string;
  };
}

export default function CentroAyudaPage() {
  const { user } = useJWTAuth();
  const { showToast } = useToast();
  const [articulos, setArticulos] = useState<ArticuloAyuda[]>([]);

  // Funciones para actualización optimista
  const handleArticuloCreado = (nuevoArticulo: ArticuloAyuda) => {
    setArticulos(prev => [nuevoArticulo, ...prev]);
  };

  const handleArticuloActualizado = (articuloActualizado: ArticuloAyuda) => {
    setArticulos(prev => prev.map(articulo => 
      articulo.id === articuloActualizado.id ? articuloActualizado : articulo
    ));
  };

  const handleArticuloEliminado = (articuloId: string) => {
    setArticulos(prev => prev.filter(articulo => articulo.id !== articuloId));
  };
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<ArticuloAyuda | null>(null);
  const [articuloViendo, setArticuloViendo] = useState<ArticuloAyuda | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articuloParaEliminar, setArticuloParaEliminar] = useState<ArticuloAyuda | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: 'VENTAS',
    estado: 'borrador' as 'publicado' | 'borrador',
    contenido: '',
    video_url: '',
    imagen_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cargar artículos
  const cargarArticulos = async () => {
    try {
      setLoading(true);
      
      const result = await obtenerArticulosAyudaAction();

      if (!result.success) {
        console.error('Error cargando artículos:', result.error);
        showToast(result.error || 'Error al cargar los artículos', 'error');
        return;
      }

      setArticulos(result.data || []);
    } catch (error) {
      console.error('Error general cargando artículos:', error);
      showToast('Error inesperado al cargar los artículos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      cargarArticulos();
    }
  }, [user]);

  // Filtrar artículos
  const articulosFiltrados = articulos.filter(articulo => {
    const coincideBusqueda = articulo.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCategoria = categoriaFiltro === 'TODOS' || articulo.categoria === categoriaFiltro;
    const coincideEstado = estadoFiltro === 'TODOS' || articulo.estado === estadoFiltro;
    return coincideBusqueda && coincideCategoria && coincideEstado;
  });

  // Paginación
  const totalPages = Math.ceil(articulosFiltrados.length / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;
  const articulosPaginados = articulosFiltrados.slice(offset, offset + itemsPerPage);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoriaFiltro, estadoFiltro]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      showToast('Usuario no autenticado', 'error');
      return;
    }

    if (!formData.titulo.trim() || !formData.contenido.trim()) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setUploadingImage(true);
      
      // Crear FormData para enviar al server action
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('categoria', formData.categoria);
      formDataToSend.append('estado', formData.estado);
      formDataToSend.append('contenido', formData.contenido);
      formDataToSend.append('video_url', formData.video_url || '');
      formDataToSend.append('autor_id', user.id);
      
      // Agregar archivo de imagen si existe
      if (formData.imagen_url && (formData.imagen_url as any) instanceof File) {
        formDataToSend.append('imagen', formData.imagen_url as any);
      } else if (typeof formData.imagen_url === 'string' && formData.imagen_url) {
        formDataToSend.append('imagen_url', formData.imagen_url);
      }
      
      // Agregar ID si estamos editando
      if (editingArticulo) {
        formDataToSend.append('id', editingArticulo.id);
      }
      
      let result;
      
      if (editingArticulo) {
        result = await actualizarArticuloAyudaAction(formDataToSend, user.id);
      } else {
        result = await crearArticuloAyudaAction(formDataToSend, user.id);
      }

      if (!result.success) {
        showToast(result.error || 'Error al guardar el artículo', 'error');
        return;
      }

      // Actualización optimista
      if (editingArticulo && result.data) {
        handleArticuloActualizado(result.data);
      } else if (!editingArticulo && result.data) {
        handleArticuloCreado(result.data);
      }

      showToast(editingArticulo ? 'Artículo actualizado exitosamente' : 'Artículo creado exitosamente', 'success');
      
      // Cerrar modal y resetear formulario
      setShowModal(false);
      setEditingArticulo(null);
      setFormData({
        titulo: '',
        categoria: 'VENTAS',
        estado: 'borrador',
        contenido: '',
        video_url: '',
        imagen_url: ''
      });
      
    } catch (error) {
      console.error('Error guardando artículo:', error);
      showToast('Error inesperado al guardar el artículo', 'error');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  // Abrir modal para editar
  const handleEdit = (articulo: ArticuloAyuda) => {
    setEditingArticulo(articulo);
    setFormData({
      titulo: articulo.titulo,
      categoria: articulo.categoria,
      estado: articulo.estado,
      contenido: articulo.contenido,
      video_url: articulo.video_url || '',
      imagen_url: articulo.imagen_url || ''
    });
    setShowModal(true);
  };

  // Eliminar artículo
  const handleEliminar = async (articulo: ArticuloAyuda) => {
    setArticuloParaEliminar(articulo);
    setShowDeleteModal(true);
  };

  // Confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!articuloParaEliminar || !user?.id) return;

    try {
      const result = await eliminarArticuloAyudaAction(articuloParaEliminar.id, user.id);
      
      if (!result.success) {
        showToast(result.error || 'Error al eliminar el artículo', 'error');
        setShowDeleteModal(false);
        setArticuloParaEliminar(null);
        return;
      }

      // Actualización optimista
      handleArticuloEliminado(articuloParaEliminar.id);
      showToast('Artículo eliminado exitosamente', 'success');
      
      // Cerrar modal
      setShowDeleteModal(false);
      setArticuloParaEliminar(null);
    } catch (error) {
      console.error('Error eliminando artículo:', error);
      showToast('Error inesperado al eliminar el artículo', 'error');
      setShowDeleteModal(false);
      setArticuloParaEliminar(null);
    }
  };

  // Cancelar eliminación
  const cancelarEliminacion = () => {
    setShowDeleteModal(false);
    setArticuloParaEliminar(null);
  };

  // Ver artículo
  const handleVer = (articulo: ArticuloAyuda) => {
    setArticuloViendo(articulo);
    setShowViewModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setEditingArticulo(null);
    setFormData({
      titulo: '',
      categoria: 'VENTAS',
      estado: 'borrador',
      contenido: '',
      video_url: '',
      imagen_url: ''
    });
  };

  // Obtener color de categoría
  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'general':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'facturacion':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'empleados':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'configuracion':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Obtener texto de categoría
  const getCategoriaTexto = (categoria: string) => {
    switch (categoria) {
      case 'general':
        return 'General';
      case 'facturacion':
        return 'Facturación';
      case 'empleados':
        return 'Empleados';
      case 'configuracion':
        return 'Configuración';
      default:
        return categoria;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabecera */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Centro de Ayuda</h1>
              <p className="mt-2 text-gray-600">Gestiona los artículos de ayuda y tutoriales para los usuarios</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Nuevo Artículo
            </Button>
          </div>
        </div>

        {/* Lista de Artículos */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Artículos de Ayuda</h2>
          </div>
          
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Cargando artículos...</p>
            </div>
          ) : articulos.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay artículos de ayuda creados aún</p>
              <p className="text-sm text-gray-500 mt-2">Crea tu primer artículo para empezar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barra de Filtros */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Búsqueda */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar por título
                    </label>
                    <input
                      type="text"
                      placeholder="Escribe para buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Filtro por Categoría */}
                  <div className="w-full md:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={categoriaFiltro}
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="TODOS">Todas</option>
                      {CATEGORIAS_MODULOS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por Estado */}
                  <div className="w-full md:w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={estadoFiltro}
                      onChange={(e) => setEstadoFiltro(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="publicado">Publicado</option>
                      <option value="borrador">Borrador</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Autor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Multimedia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de creación
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articulosPaginados.map((articulo) => (
                    <tr key={articulo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">{articulo.titulo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoriaColor(articulo.categoria)}`}>
                          {getCategoriaTexto(articulo.categoria)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          articulo.estado === 'publicado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {articulo.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {articulo.autor?.nombre || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          {articulo.imagen_url && (
                            <div className="flex items-center space-x-1">
                              <img 
                                src={articulo.imagen_url} 
                                alt={articulo.titulo}
                                className="w-8 h-8 object-cover rounded"
                              />
                              <span className="text-xs text-blue-600">📷</span>
                            </div>
                          )}
                          {articulo.video_url && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-red-600">🎥</span>
                            </div>
                          )}
                          {!articulo.imagen_url && !articulo.video_url && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="text-xs">
                            {new Date(articulo.creado_en).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            {new Date(articulo.creado_en).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="p-2"
                            onClick={() => handleEdit(articulo)}
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="p-2"
                            onClick={() => handleVer(articulo)}
                            title="Ver"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="p-2"
                            onClick={() => handleEliminar(articulo)}
                            title="Eliminar"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Paginación */}
              {articulosFiltrados.length > itemsPerPage && (
                <div className="flex items-center justify-between bg-white rounded-lg shadow px-4 py-3">
                  <div className="text-sm text-gray-700">
                    Mostrando {offset + 1} - {Math.min(offset + itemsPerPage, articulosFiltrados.length)} de {articulosFiltrados.length} artículos
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de Crear/Editar Artículo */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowModal(false)}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Ej: Cómo crear una nueva venta"
                      />
                    </div>

                    <div>
                      <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría *
                      </label>
                      <select
                        id="categoria"
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Selecciona un módulo...</option>
                        {CATEGORIAS_MODULOS.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                        Estado *
                      </label>
                      <select
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="borrador">Borrador</option>
                        <option value="publicado">Publicado</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contenido" className="block text-sm font-medium text-gray-700 mb-1">
                        Contenido *
                      </label>
                      <textarea
                        id="contenido"
                        value={formData.contenido}
                        onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                        rows={6}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Escribe el contenido del artículo de ayuda..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1">
                          URL de Video de YouTube
                        </label>
                        <input
                          type="url"
                          id="video_url"
                          value={formData.video_url}
                          onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {formData.video_url && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Previsualización del video:</p>
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              {(() => {
                                const embedUrl = convertToYouTubeEmbed(formData.video_url);
                                console.log('🎥 Video URL:', formData.video_url);
                                console.log('🎥 Embed URL:', embedUrl);
                                if (embedUrl) {
                                  return (
                                    <iframe
                                      src={embedUrl}
                                      className="w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  );
                                } else {
                                  return (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                      URL de YouTube no válida
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="imagen_url" className="block text-sm font-medium text-gray-700 mb-1">
                          Imagen Adjunta
                        </label>
                        <input
                          type="file"
                          id="imagen_url"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData({ ...formData, imagen_url: file as any });
                            }
                          }}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {formData.imagen_url && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">
                              {(formData.imagen_url as any).name ? 'Imagen seleccionada:' : 'Imagen actual:'}
                            </p>
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={
                                  (formData.imagen_url as any) instanceof File
                                    ? URL.createObjectURL(formData.imagen_url as any)
                                    : formData.imagen_url as string
                                }
                                alt="Previsualización"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? 'Guardando...' : (editingArticulo ? 'Actualizar Artículo' : 'Crear Artículo')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Ver Artículo */}
        {showViewModal && articuloViendo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Ver Artículo</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowViewModal(false);
                      setArticuloViendo(null);
                    }}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Título y Badges */}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{articuloViendo.titulo}</h1>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoriaColor(articuloViendo.categoria)}`}>
                        {articuloViendo.categoria}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        articuloViendo.estado === 'publicado' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        {articuloViendo.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Por: {articuloViendo.autor?.nombre || 'Desconocido'}
                      </span>
                    </div>
                  </div>

                  {/* Video */}
                  {articuloViendo.video_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Video Tutorial</h3>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        {(() => {
                          const embedUrl = convertToYouTubeEmbed(articuloViendo.video_url);
                          if (embedUrl) {
                            return (
                              <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            );
                          } else {
                            return (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                URL de video no válida
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Imagen */}
                  {articuloViendo.imagen_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Imagen</h3>
                      <div className="bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={articuloViendo.imagen_url}
                          alt={articuloViendo.titulo}
                          className="w-full rounded-lg object-contain max-h-96"
                        />
                      </div>
                    </div>
                  )}

                  {/* Contenido */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contenido</h3>
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {articuloViendo.contenido}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Creado:</span>{' '}
                        {new Date(articuloViendo.creado_en).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}{' '}
                        {new Date(articuloViendo.creado_en).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div>
                        <span className="font-medium">Actualizado:</span>{' '}
                        {new Date(articuloViendo.actualizado_en).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}{' '}
                        {new Date(articuloViendo.actualizado_en).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteModal && articuloParaEliminar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <TrashIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
                    <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700">
                    ¿Estás seguro de que deseas eliminar el artículo:
                  </p>
                  <p className="font-medium text-gray-900 mt-2">
                    "{articuloParaEliminar.titulo}"
                  </p>
                  {articuloParaEliminar.imagen_url && (
                    <p className="text-sm text-gray-500 mt-2">
                      ⚠️ También se eliminará la imagen asociada
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={cancelarEliminacion}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={confirmarEliminacion}
                    className="flex-1"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
