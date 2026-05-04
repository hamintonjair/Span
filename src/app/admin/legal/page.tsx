'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeftIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface PaginaLegal {
  id: string;
  slug: string;
  titulo: string;
  contenido: string;
  actualizado_en: string;
}

export default function LegalAdminPage() {
  const [paginaSeleccionada, setPaginaSeleccionada] = useState<string>('privacidad');
  const [paginas, setPaginas] = useState<PaginaLegal[]>([]);
  const [contenido, setContenido] = useState('');
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarPaginas();
  }, []);

  useEffect(() => {
    const pagina = paginas.find(p => p.slug === paginaSeleccionada);
    if (pagina) {
      setContenido(pagina.contenido);
      setTitulo(pagina.titulo);
    }
  }, [paginaSeleccionada, paginas]);

  const cargarPaginas = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 DEBUG: Iniciando carga de páginas legales...');
      
      // Usar API route para evitar necesidad de SUPABASE_SERVICE_ROLE_KEY en cliente
      console.log('🔍 DEBUG: Usando API route /api/admin/paginas-legales...');
      
      const response = await fetch('/api/admin/paginas-legales', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 DEBUG: Respuesta API:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error en API paginas-legales:', errorData);
        setError(`Error al cargar las páginas legales: ${errorData.error}`);
        return;
      }

      const result = await response.json();
      console.log('🔍 DEBUG: Resultado API:', { result });

      if (!result.success || !result.data) {
        console.warn('⚠️ DEBUG: No se encontraron páginas legales (API)');
        setError('No se encontraron páginas legales. Verifique que la tabla exista y tenga datos.');
        return;
      }

      const paginasData = result.data;
      setPaginas(paginasData);
      console.log('✅ DEBUG: Páginas legales cargadas (API):', paginasData.length, 'páginas');
      
      // Seleccionar la primera página
      if (paginasData.length > 0 && !paginaSeleccionada) {
        const primeraPagina = paginasData[0] as PaginaLegal;
        setPaginaSeleccionada(primeraPagina.slug);
        setContenido(primeraPagina.contenido);
        setTitulo(primeraPagina.titulo);
        console.log('🔍 DEBUG: Seleccionada primera página (API):', primeraPagina.slug);
      }
      
      setError('');
    } catch (error) {
      console.error('Error en cargarPaginas:', error);
      setError('Error al cargar las páginas legales');
    } finally {
      setLoading(false);
    }
  };

  const guardarCambios = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!contenido.trim()) {
        setError('El contenido no puede estar vacío');
        return;
      }

      if (!titulo.trim()) {
        setError('El título no puede estar vacío');
        return;
      }

      console.log('🔍 DEBUG: Guardando cambios vía API route...');
      
      const response = await fetch('/api/admin/paginas-legales', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: paginaSeleccionada,
          titulo: titulo.trim(),
          contenido: contenido.trim()
        }),
      });

      console.log('🔍 DEBUG: Respuesta guardar API:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error guardando página legal (API):', errorData);
        setError(`Error al guardar los cambios: ${errorData.error}`);
        return;
      }

      const result = await response.json();
      console.log('🔍 DEBUG: Resultado guardar API:', { result });

      if (!result.success) {
        setError('Error al guardar los cambios');
        return;
      }

      // Actualizar estado local
      setPaginas(prev => prev.map(pagina => 
        pagina.slug === paginaSeleccionada 
          ? { ...pagina, titulo: titulo.trim(), contenido: contenido.trim(), actualizado_en: new Date().toISOString() }
          : pagina
      ));

      setSuccess('Cambios guardados exitosamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error en guardarCambios:', error);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const paginaActual = paginas.find(p => p.slug === paginaSeleccionada);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <a href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeftIcon className="w-5 h-5" />
              </a>
              <h1 className="text-xl font-semibold text-gray-900">
                Páginas Legales
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                Administración de contenido legal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Selector de Página */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Seleccionar Página
              </h2>
              <div className="space-y-2">
                {paginas.map((pagina) => (
                  <button
                    key={pagina.id}
                    onClick={() => setPaginaSeleccionada(pagina.slug)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      paginaSeleccionada === pagina.slug
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{pagina.titulo}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {pagina.slug === 'privacidad' ? 'Política de privacidad' : 'Términos y condiciones'}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Actualizado: {new Date(pagina.actualizado_en).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                ℹ️ Información
              </h3>
              <p className="text-sm text-blue-700">
                Las páginas legales son visibles públicamente en el sitio web. 
                Los cambios se reflejan inmediatamente después de guardar.
              </p>
            </div>
          </div>

          {/* Editor de Contenido */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Header del Editor */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="text-xl font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      placeholder="Título de la página"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {paginaActual?.slug === 'privacidad' ? 'Política de Privacidad' : 'Términos y Condiciones'}
                    </p>
                  </div>
                  <button
                    onClick={guardarCambios}
                    disabled={saving || loading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      saving || loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </div>

              {/* Área de Edición */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Cargando contenido...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Alertas */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}
                    
                    {success && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-600">{success}</p>
                      </div>
                    )}

                    {/* Textarea de Contenido */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contenido (Markdown soportado)
                      </label>
                      <textarea
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                        rows={20}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors font-mono text-sm"
                        placeholder="Escribe el contenido de la página legal aquí..."
                      />
                    </div>

                    {/* Información de Markdown */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Formato Markdown
                      </h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>• Usa # para títulos (## para subtítulos)</p>
                        <p>• Usa **texto** para negritas</p>
                        <p>• Usa *texto* para cursivas</p>
                        <p>• Usa - para listas</p>
                        <p>• Usa [texto](url) para enlaces</p>
                      </div>
                    </div>

                    {/* Última Actualización */}
                    {paginaActual && (
                      <div className="text-sm text-gray-500 text-right">
                        Última actualización: {new Date(paginaActual.actualizado_en).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
