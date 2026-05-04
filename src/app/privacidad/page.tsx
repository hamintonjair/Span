'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PaginaLegal {
  id: string;
  slug: string;
  titulo: string;
  contenido: string;
  actualizado_en: string;
}

export default function PrivacidadPage() {
  const [pagina, setPagina] = useState<PaginaLegal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pathname = usePathname();
  
  // Determinar si estamos en dashboard o landing page
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isEmpresa = pathname.includes('empresa');

  useEffect(() => {
    cargarPaginaPrivacidad();
  }, []);

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

      // Buscar la página de privacidad
      const paginaPrivacidad = result.data.find((p: PaginaLegal) => p.slug === 'privacidad');
      
      if (!paginaPrivacidad) {
        setError('No se encontró la página de privacidad');
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

  
  // Renderizado del contenido principal
  const renderContent = () => (
    <>
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header de la página */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="text-center">
              <ShieldCheckIcon className="w-12 h-12 text-white mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                {loading ? (
                  <div className="h-8 bg-white/20 rounded animate-pulse w-64 mx-auto"></div>
                ) : (
                  pagina?.titulo || 'Política de Privacidad'
                )}
              </h1>
              <p className="text-blue-100">
                {loading ? (
                  <div className="h-4 bg-white/10 rounded animate-pulse w-48 mx-auto mt-2"></div>
                ) : (
                  `Última actualización: ${new Date(pagina?.actualizado_en || '').toLocaleDateString()}`
                )}
              </p>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {loading ? (
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-5/6"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-4/5"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full mt-6"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-4/5 mt-6"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none prose-headings:text-black prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl">
                <ReactMarkdown>
                  {pagina?.contenido || ''}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  // Si estamos en dashboard, renderizar solo el contenido sin layout adicional
  if (isDashboard) {
    return (
      <div className="w-full">
        {/* Header simple dentro del dashboard */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Política de Privacidad {isEmpresa ? 'Empresarial' : ''}
            </h1>
          </div>
          <p className="text-gray-600 mt-1">
            {isEmpresa ? 'Para Empresas' : 'Panel de Administración'}
          </p>
        </div>
        
        {/* Contenido principal */}
        {renderContent()}
      </div>
    );
  }

  // Si estamos en landing page, renderizar con layout público completo
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Público */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 32 32" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="object-contain"
                  >
                    <circle cx="16" cy="16" r="16" fill="#1f2937"/>
                    <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
                    <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
                    <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
                    <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">Span</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/contacto" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Inicio
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Política de Privacidad</span>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {/* Footer Público */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 32 32" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="object-contain"
                >
                  <circle cx="16" cy="16" r="16" fill="#1f2937"/>
                  <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
                  <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
                  <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
                  <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
                </svg>
              </div>
              <span className="text-xl font-bold">Span</span>
            </div>
            <p className="text-slate-400 mb-4">
              Software de gestión empresarial moderno y eficiente
            </p>
            <div className="flex justify-center space-x-6 text-sm text-slate-400">
              <Link href="/privacidad" className="hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="/terminos" className="hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="/contacto" className="hover:text-white transition-colors">
                Contacto
              </Link>
            </div>
            <div className="mt-6 text-sm text-slate-500">
              © 2024 Span. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Función helper para obtener el nombre de la empresa (deberías moverla a un archivo de utilidades)
function getNombreEmpresa(): string {
  return 'Span';
}
