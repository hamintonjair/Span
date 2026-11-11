'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, ArrowLeftIcon, ClockIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ConfiguracionGlobal {
  whatsapp_soporte: string;
  email_soporte: string;
  nombre_titular: string;
  titular: string;
  direccion?: string;
  ciudad?: string;
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

const FAQ_PREDETERMINADAS = [
  {
    id: '1',
    pregunta: '¿Cómo funciona la prueba gratuita de 15 días?',
    respuesta: 'Puedes registrar tu salón y acceder inmediatamente a todas las funcionalidades del plan elegido durante 15 días completos, sin ingresar tarjeta de crédito ni compromisos de permanencia.'
  },
  {
    id: '2',
    pregunta: '¿Para qué tipos de negocio está diseñado Span Business?',
    respuesta: 'Está especializado en Salones de Belleza, Peluquerías, Barberías, Spas, Centros de Estética, Estudios de Uñas y Pestañas, y profesionales del cuidado personal.'
  },
  {
    id: '3',
    pregunta: '¿Cómo se calculan y liquidan las comisiones de los estilistas?',
    respuesta: 'El sistema permite configurar porcentajes personalizados por cada servicio o producto vendido por cada colaborador, calculando en tiempo real las comisiones y facilitando la liquidación de turnos.'
  },
  {
    id: '4',
    pregunta: '¿Qué canales de soporte y capacitación incluyen?',
    respuesta: 'Ofrecemos soporte técnico personalizado por WhatsApp (+57 312 494 35 27) y correo electrónico (soporte@span-business.com), además de guías paso a paso para la configuración inicial.'
  }
];

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
    whatsapp_soporte: '+57 312 494 35 27',
    email_soporte: 'soporte@span-business.com',
    nombre_titular: 'Haminton Mena Mena',
    titular: 'Span Business',
    direccion: 'Carrera 12 # 43 - 136',
    ciudad: 'Quibdó - Chocó, Colombia',
    horario_semana: 'Lunes a Viernes: 8:00 AM - 5:00 PM',
    horario_sabado: 'Sábados: 9:00 AM - 1:00 PM',
    horario_domingo: 'Domingos: Cerrado',
    faq_items: '[]'
  });
  
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isEmpresa = pathname.includes('empresa');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchConfigGlobal = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('whatsapp_soporte, email_soporte, nombre_titular, titular, direccion, ciudad, horario_semana, horario_sabado, horario_domingo, faq_items')
        .single();
      if (data && !error) {
        setConfigGlobal(prev => ({
          ...prev,
          ...data,
          whatsapp_soporte: data.whatsapp_soporte || prev.whatsapp_soporte,
          email_soporte: data.email_soporte || prev.email_soporte,
          titular: data.titular || prev.titular
        }));
      }
    } catch (error) {
      console.error('Error cargando configuración global:', error);
    }
  };

  useEffect(() => {
    fetchConfigGlobal();
  }, []);

  const getFaqItems = () => {
    try {
      const parsed = JSON.parse(configGlobal.faq_items || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      // Usar predeterminadas
    }
    return FAQ_PREDETERMINADAS;
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
      setError('Por favor ingresa tu nombre completo');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return false;
    }
    if (!formData.asunto.trim()) {
      setError('Por favor especifica el asunto de tu consulta');
      return false;
    }
    if (!formData.mensaje.trim()) {
      setError('Por favor escribe tu mensaje o solicitud');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
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
        throw new Error(result.error || 'No se pudo enviar el mensaje');
      }
      
      setSuccess('¡Mensaje enviado con éxito! Un especialista de Span Business te responderá a la brevedad.');
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        empresa: '',
        asunto: '',
        mensaje: ''
      });
      setTimeout(() => setSuccess(''), 6000);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setError(error instanceof Error ? error.message : 'Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Información Oficial de Contacto */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Canales Oficiales de Soporte
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Estamos comprometidos con el crecimiento y la continuidad de tu salón de belleza o barbería.
            </p>
            
            <div className="space-y-5">
              <div className="flex items-start space-x-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <EnvelopeIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Correo Oficial</h3>
                  <a href={`mailto:${configGlobal.email_soporte}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm break-all">
                    {configGlobal.email_soporte}
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Atención personalizada y PQRS</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 bg-green-100 text-green-600 rounded-lg">
                  <PhoneIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">WhatsApp de Asistencia</h3>
                  <a 
                    href={`https://wa.me/${configGlobal.whatsapp_soporte.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-green-600 hover:text-green-700 font-semibold text-sm"
                  >
                    {configGlobal.whatsapp_soporte}
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Respuestas rápidas para empresas activas</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Sede Principal</h3>
                  <p className="text-slate-700 text-sm font-medium">{configGlobal.direccion || 'Carrera 12 # 43 - 136'}</p>
                  <p className="text-xs text-slate-500">{configGlobal.ciudad || 'Quibdó - Chocó, Colombia'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Horario de Atención</h3>
                  <p className="text-xs text-slate-700 font-medium">{configGlobal.horario_semana}</p>
                  <p className="text-xs text-slate-600">{configGlobal.horario_sabado}</p>
                  <p className="text-xs text-slate-500">{configGlobal.horario_domingo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preguntas Frecuentes */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-6">
            <h3 className="text-base font-bold text-indigo-950 mb-3 flex items-center gap-2">
              <span>❓</span> Preguntas Frecuentes
            </h3>
            <div className="space-y-3.5 text-xs">
              {getFaqItems().map((item: any, index: number) => (
                <div key={item.id || index} className="border-b border-indigo-100 pb-3 last:border-b-0 last:pb-0">
                  <p className="font-semibold text-indigo-950 mb-1">{item.pregunta}</p>
                  <p className="text-slate-600 leading-relaxed">{item.respuesta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Formulario de Contacto */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 px-6 sm:px-8 py-5 bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <h2 className="text-xl font-bold text-slate-900">
                Envíanos tu Consulta
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                ¿Deseas una demostración guiada para tu salón o tienes dudas sobre los planes? Te respondemos hoy mismo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                  <span className="font-bold">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="nombre" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                    placeholder="Ej. Laura Gómez"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                    placeholder="laura@misalon.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="telefono" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                    placeholder="+57 300 123 4567"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="empresa" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre de tu Salón o Empresa
                  </label>
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                    placeholder="Ej. Glow Studio Peluquería"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="asunto" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Asunto *
                </label>
                <input
                  type="text"
                  id="asunto"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                  placeholder="¿En qué te podemos asesorar?"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="mensaje" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mensaje *
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all resize-none"
                  placeholder="Cuéntanos cuántos colaboradores tienes o qué dudas deseas resolver..."
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-slate-500 text-center sm:text-left">
                  Tus datos están protegidos conforme a nuestra{' '}
                  <Link href="/privacidad" className="text-indigo-600 hover:underline">Política de Privacidad</Link>.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md ${
                    loading
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando mensaje...
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

  if (isDashboard) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6 flex items-center space-x-3">
          <EnvelopeIcon className="w-7 h-7 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contacto y Asistencia</h1>
            <p className="text-sm text-slate-500">Comunícate con el equipo central de soporte de Span Business</p>
          </div>
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header Público */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Volver al Inicio">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="object-contain">
                    <circle cx="16" cy="16" r="16" fill="#1f2937"/>
                    <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
                    <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
                    <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
                    <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-slate-900 tracking-tight">Span Business</span>
                  <span className="text-[10px] text-slate-500 font-medium -mt-1 hidden sm:block">Software para Salones y Spas</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/" className="text-slate-600 hover:text-indigo-600 text-sm font-medium px-3 py-2">
                Inicio
              </Link>
              <Link href="/login" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-11 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">Inicio</Link>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-slate-900 font-medium">Contacto y Soporte Oficial</span>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="flex-grow w-full">
        {renderContent()}
      </main>

      {/* Footer Unificado */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#1f2937"/>
                <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
                <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
                <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
                <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Span Business</span>
          </div>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
            Plataforma integral de gestión en la nube para Salones de Belleza, Peluquerías, Barberías y Spas.
          </p>
          <div className="flex justify-center flex-wrap gap-6 text-sm text-slate-400 mb-6">
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
            <Link href="/contacto" className="hover:text-white transition-colors underline">Contacto y Soporte</Link>
            <a href="mailto:soporte@span-business.com" className="hover:text-white transition-colors">soporte@span-business.com</a>
          </div>
          <div className="text-xs text-slate-500">
            © 2026 Span Business. Todos los derechos reservados. Nit: 80772379-9. Quibdó - Chocó, Colombia.
          </div>
        </div>
      </footer>
    </div>
  );
}
