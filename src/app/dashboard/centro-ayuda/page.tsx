'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { obtenerArticulosPublicadosAction } from '@/app/actions/centro-ayuda';
import { convertToYouTubeEmbed } from '@/utils/youtube';
import { BookOpenIcon, MagnifyingGlassIcon, XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';

// Constante de categorías (reutilizada del admin)
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
  { label: 'Servicios', value: 'SERVICIOS' },
  { label: 'Proveedores', value: 'PROVEEDORES' },
  { label: 'Categorías', value: 'CATEGORIAS' },
  { label: 'Usuarios', value: 'USUARIOS' },
  { label: 'Configuración', value: 'CONFIGURACION' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Analytics', value: 'ANALYTICS' },
  { label: 'Comisiones', value: 'COMISIONES' },
  { label: 'Soporte', value: 'SOPORTE' },
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

export default function CentroAyudaDashboardPage() {
  const [articulos, setArticulos] = useState<ArticuloAyuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODOS');
  const [articuloSeleccionado, setArticuloSeleccionado] = useState<ArticuloAyuda | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar artículos
  const cargarArticulos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando artículos...');
      const result = await obtenerArticulosPublicadosAction();

      console.log('📦 Resultado del server action:', result);

      if (!result.success) {
        console.error('❌ Error cargando artículos:', result.error);
        return;
      }

      console.log('✅ Artículos cargados:', result.data?.length || 0);
      setArticulos(result.data || []);
    } catch (error) {
      console.error('❌ Error general cargando artículos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarArticulos();
  }, []);

  // Filtrar artículos
  const articulosFiltrados = articulos.filter(articulo => {
    const coincideBusqueda = articulo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           articulo.contenido.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCategoria = categoriaFiltro === 'TODOS' || articulo.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  // Ver artículo
  const handleVerArticulo = (articulo: ArticuloAyuda) => {
    console.log('📖 Clic en artículo:', articulo);
    setArticuloSeleccionado(articulo);
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setArticuloSeleccionado(null);
  };

  // Obtener color de categoría
  const getCategoriaColor = (categoria: string) => {
    const colores: { [key: string]: string } = {
      'VENTAS': 'bg-blue-50 text-blue-700 border-blue-200',
      'INVENTARIO': 'bg-green-50 text-green-700 border-green-200',
      'CAJA': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'CITAS': 'bg-purple-50 text-purple-700 border-purple-200',
      'CLIENTES': 'bg-pink-50 text-pink-700 border-pink-200',
      'EMPLEADOS': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'FINANZAS': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'NOMINAS': 'bg-teal-50 text-teal-700 border-teal-200',
      'PRESTAMOS': 'bg-orange-50 text-orange-700 border-orange-200',
      'PRODUCTOS': 'bg-rose-50 text-rose-700 border-rose-200',
      'SERVICIOS': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'PROVEEDORES': 'bg-amber-50 text-amber-700 border-amber-200',
      'CATEGORIAS': 'bg-lime-50 text-lime-700 border-lime-200',
      'USUARIOS': 'bg-violet-50 text-violet-700 border-violet-200',
      'CONFIGURACION': 'bg-slate-50 text-slate-700 border-slate-200',
      'MARKETING': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      'ANALYTICS': 'bg-sky-50 text-sky-700 border-sky-200',
      'COMISIONES': 'bg-red-50 text-red-700 border-red-200',
      'SOPORTE': 'bg-gray-50 text-gray-700 border-gray-200',
      'GENERAL': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colores[categoria] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Centro de Ayuda</h1>
              <p className="text-gray-600">Encuentra tutoriales y guías para usar el sistema</p>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar tutoriales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Filtros de Categoría */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaFiltro('TODOS')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoriaFiltro === 'TODOS'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {CATEGORIAS_MODULOS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoriaFiltro(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categoriaFiltro === cat.value
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Galería de Tarjetas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : articulosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron tutoriales</h3>
            <p className="text-gray-600">
              {searchTerm || categoriaFiltro !== 'TODOS'
                ? 'Intenta con otros términos de búsqueda o categorías'
                : 'No hay tutoriales publicados aún'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articulosFiltrados.map((articulo) => (
              <div
                key={articulo.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => handleVerArticulo(articulo)}
              >
                {/* Imagen de portada */}
                {articulo.imagen_url && (
                  <div className="aspect-video bg-gray-100">
                    <img
                      src={articulo.imagen_url}
                      alt={articulo.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Contenido de la tarjeta */}
                <div className="p-4">
                  {/* Badge de categoría */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoriaColor(articulo.categoria)}`}>
                    {CATEGORIAS_MODULOS.find(c => c.value === articulo.categoria)?.label || articulo.categoria}
                  </span>

                  {/* Título */}
                  <h3 className="mt-2 text-lg font-semibold text-gray-900 line-clamp-2">
                    {articulo.titulo}
                  </h3>

                  {/* Indicadores multimedia */}
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    {articulo.video_url && (
                      <span className="flex items-center gap-1">
                        <PlayIcon className="w-4 h-4" />
                        Video
                      </span>
                    )}
                    {articulo.imagen_url && (
                      <span className="flex items-center gap-1">
                        📷 Imagen
                      </span>
                    )}
                  </div>

                  {/* Botón */}
                  <button className="mt-4 w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors font-medium">
                    Leer Tutorial
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Lectura */}
      {showModal && articuloSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{articuloSeleccionado.titulo}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoriaColor(articuloSeleccionado.categoria)}`}>
                      {CATEGORIAS_MODULOS.find(c => c.value === articuloSeleccionado.categoria)?.label || articuloSeleccionado.categoria}
                    </span>
                    <span className="text-sm text-gray-500">
                      Por: {articuloSeleccionado.autor?.nombre || 'Equipo de Soporte'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Video */}
              {articuloSeleccionado.video_url && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Video Tutorial</h3>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {(() => {
                      const embedUrl = convertToYouTubeEmbed(articuloSeleccionado.video_url);
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
              {articuloSeleccionado.imagen_url && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Imagen</h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={articuloSeleccionado.imagen_url}
                      alt={articuloSeleccionado.titulo}
                      className="w-full rounded-lg object-contain max-h-96"
                    />
                  </div>
                </div>
              )}

              {/* Contenido */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contenido</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {articuloSeleccionado.contenido}
                  </p>
                </div>
              </div>

              {/* Información adicional */}
              <div className="border-t pt-4 text-sm text-gray-500">
                <p>
                  Publicado el {new Date(articuloSeleccionado.creado_en).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </MainLayout>
  );
}
