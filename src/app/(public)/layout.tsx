'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface PublicLayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
}

export default function PublicLayout({ children, title, showBackButton = true }: PublicLayoutProps) {
  const getNombreEmpresa = () => 'Span';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Igual que landing page */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
              )}
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
                <span className="text-xl font-bold text-gray-900">{getNombreEmpresa()}</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Botón de Contacto en el nav */}
              <Link 
                href="/contacto" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4 mr-2" />
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
            <span className="text-gray-900 font-medium">{title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Igual que landing page */}
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
              <span className="text-xl font-bold">{getNombreEmpresa()}</span>
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
              © 2024 {getNombreEmpresa()}. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
