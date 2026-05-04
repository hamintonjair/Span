'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

interface PaginaLegal {
  id: string;
  slug: string;
  titulo: string;
  contenido: string;
  actualizado_en: string;
}

export default function EmpresaPrivacidadPage() {
  const [pagina, setPagina] = useState<PaginaLegal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarPaginaPrivacidad = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/paginas-legales');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error en API paginas-legales:', errorData);
        setError('No se pudo cargar la página de privacidad');
        return;
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        setError('No se pudo cargar la página de privacidad');
        return;
      }

      // Buscar la página de privacidad para empresas
      const paginaPrivacidad = result.data.find((p: PaginaLegal) => p.slug === 'privacidad-empresa');
      
      if (!paginaPrivacidad) {
        setError('No se encontró la página de privacidad para empresas');
        return;
      }

      setPagina(paginaPrivacidad);
      setError('');
    } catch (error) {
      console.error('Error en cargarPaginaPrivacidad:', error);
      setError('Error al cargar la página de privacidad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPaginaPrivacidad();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Política de Privacidad Empresarial
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Para Empresas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        ) : pagina ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header de la página */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <div className="text-center">
                <ShieldCheckIcon className="w-12 h-12 text-white mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">
                  {pagina.titulo}
                </h1>
                <p className="text-blue-100">
                  Última actualización: {new Date(pagina.actualizado_en).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-8">
              <div className="prose prose-slate max-w-none prose-headings:text-black prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl">
                <ReactMarkdown>
                  {pagina.contenido}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
