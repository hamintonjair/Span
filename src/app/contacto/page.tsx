'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ConfiguracionGlobal {
  whatsapp_soporte: string;
  email_soporte: string;
  nombre_titular: string;
  titular: string;
  horario_semana: string;
  horario_sabado: string;
  horario_domingo: string;
  faq_items: string;
}

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  asunto: string;
  mensaje: string;
}

export default function ContactoPage() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    asunto: '',
    mensaje: ''
  });
  
  const [configGlobal, setConfigGlobal] = useState<ConfiguracionGlobal>({
    // Valores por defecto - importantes para fallback y renderizado inicial
    whatsapp_soporte: '+1 234 567 890',
    email_soporte: 'contacto@span.com',
    nombre_titular: '',
    titular: 'Span',
    horario_semana: 'Lunes - Viernes: 9:00 AM - 6:00 PM',
    horario_sabado: 'Sábados: 10:00 AM - 2:00 PM',
    horario_domingo: 'Domingos: Cerrado',
    faq_items: '[]'
  });
  
  const pathname = usePathname();
  
  // Determinar si estamos en dashboard o landing page
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isEmpresa = pathname.includes('empresa');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Obtener configuración global
  const fetchConfigGlobal = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('whatsapp_soporte, email_soporte, nombre_titular, titular, horario_semana, horario_sabado, horario_domingo, faq_items')
        .single();
      if (data) {
        setConfigGlobal(data);
      }
    } catch (error) {
      console.error('Error cargando configuración global:', error);
      // Mantener valores por defecto
    }
  };

  useEffect(() => {
    fetchConfigGlobal();
  }, []);

  // Procesar FAQ items
  const getFaqItems = () => {
    try {
      return JSON.parse(configGlobal.faq_items || '[]');
    } catch (error) {
      console.error('Error procesando FAQ items:', error);
      return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('El email no es válido');
      return false;
    }
    
    if (!formData.asunto.trim()) {
      setError('El asunto es requerido');
      return false;
    }
    
    if (!formData.mensaje.trim()) {
      setError('El mensaje es requerido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar el mensaje');
      }
      
      setSuccess('Mensaje enviado exitosamente. Nos pondremos en contacto contigo pronto.');
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        empresa: '',
        asunto: '',
        mensaje: ''
      });
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setError(error instanceof Error ? error.message : 'Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado del contenido principal
  const renderContent = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información de Contacto */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Información de Contacto
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <p className="text-gray-600">{configGlobal.email_soporte || 'contacto@span.com'}</p>
                  <p className="text-sm text-gray-500">Respuesta en 24-48 horas</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <PhoneIcon className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">WhatsApp</h3>
                  <p className="text-gray-600">{configGlobal.whatsapp_soporte}</p>
                  <p className="text-sm text-gray-500">Respuesta rápida</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <BuildingOfficeIcon className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Empresa</h3>
                  <p className="text-gray-600">{configGlobal.titular || 'Span Software'}</p>
                  <p className="text-sm text-gray-500">Gestión empresarial moderna</p>
                </div>
              </div>
            </div>
            
            {/* Horario de atención */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-gray-900 mb-3">Horario de Atención</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{configGlobal.horario_semana || 'Lunes - Viernes: 9:00 AM - 6:00 PM'}</p>
                <p>{configGlobal.horario_sabado || 'Sábados: 10:00 AM - 2:00 PM'}</p>
                <p>{configGlobal.horario_domingo || 'Domingos: Cerrado'}</p>
              </div>
            </div>
          </div>

          {/* Preguntas Frecuentes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              ❓ Preguntas Frecuentes
            </h3>
            <div className="text-sm text-blue-700 space-y-2">
              {getFaqItems().length > 0 ? (
                getFaqItems().map((item: any, index: number) => (
                  <div key={item.id || index}>
                    <p><strong>{item.pregunta}</strong></p>
                    <p>{item.respuesta}</p>
                    {index < getFaqItems().length - 1 && <p className="pt-2"></p>}
                  </div>
                ))
              ) : (
                <>
                  <p><strong>¿Cuánto tardan en responder?</strong></p>
                  <p>Normalmente respondemos en 24-48 horas hábiles.</p>
                  
                  <p className="pt-2"><strong>¿Ofrecen soporte técnico?</strong></p>
                  <p>Sí, tenemos soporte técnico especializado para todos nuestros productos.</p>
                  
                  <p className="pt-2"><strong>¿Puedo solicitar una demo?</strong></p>
                  <p>Claro, envíanos un mensaje y coordinaremos una demo personalizada.</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Formulario de Contacto */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {/* Header del Formulario */}
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Envíanos un Mensaje
              </h2>
              <p className="text-gray-600 mt-1">
                Nos encantaría saber de ti. Completa el formulario y te responderemos pronto.
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Tu nombre completo"
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="tu@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teléfono */}
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="+1 234 567 890"
                    disabled={loading}
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Nombre de tu empresa"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Asunto */}
              <div>
                <label htmlFor="asunto" className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto *
                </label>
                <input
                  type="text"
                  id="asunto"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="¿En qué podemos ayudarte?"
                  disabled={loading}
                />
              </div>

              {/* Mensaje */}
              <div>
                <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  placeholder="Describe detalladamente tu consulta o solicitud..."
                  disabled={loading}
                />
              </div>

              {/* Botón de Envío */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-colors ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Mensaje'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // Si estamos en dashboard, renderizar solo el contenido sin layout adicional
  if (isDashboard) {
    return (
      <div className="w-full">
        {/* Header simple dentro del dashboard */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <EnvelopeIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Contacto {isEmpresa ? 'Empresarial' : ''}
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
                <span className="text-xl font-bold text-gray-900">{configGlobal.titular || 'Span'}</span>
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
            <span className="text-gray-900 font-medium">Contacto</span>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {renderContent()}

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
              <span className="text-xl font-bold">{configGlobal.titular || 'Span'}</span>
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
              © 2024 {configGlobal.titular || 'Span'}. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
