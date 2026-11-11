'use client';

import Link from 'next/link';
import { 
  Package, 
  Calculator, 
  Shield, 
  BarChart3, 
  ArrowRight,
  Menu,
  X,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  UserCheck,
  CreditCard,
  FileText,
  Settings,
  DollarSign,
  Mail,
  Loader2,
  Sparkles,
  Scissors,
  Calendar,
  Layers,
  HelpCircle,
  Check,
  Phone
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Plan {
  id: string;
  nombre: string;
  precio: number | string;
  max_usuarios: number;
  max_empleados: number;
  tiene_inventario: boolean;
  tiene_comisiones: boolean;
  tiene_marketing: boolean;
  tiene_analytics: boolean;
  tiene_nominas: boolean;
  soporte_prioritario: boolean;
  tiene_trial_gratis?: boolean;
  descripcion: string;
  creado_en?: string;
  actualizado_en?: string;
  created_at?: string;
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [configGlobal, setConfigGlobal] = useState<any>(null);

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('planes')
          .select(`
            id,
            nombre,
            precio,
            max_usuarios,
            max_empleados,
            tiene_inventario,
            tiene_comisiones,
            tiene_marketing,
            tiene_analytics,
            tiene_nominas,
            soporte_prioritario,
            tiene_trial_gratis,
            descripcion
          `)
          .order('precio', { ascending: true });

        if (!error && data) {
          setPlanes(data);
        }
      } catch (error) {
        console.error('Error cargando planes:', error);
      } finally {
        setLoadingPlanes(false);
      }
    };

    fetchPlanes();

    const fetchConfigGlobal = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('configuracion_global')
          .select('titular, email_soporte, whatsapp_soporte')
          .single();

        if (data && !error) {
          setConfigGlobal(data);
        }
      } catch (error) {
        console.error('Error cargando configuración global:', error);
      }
    };

    fetchConfigGlobal();
  }, []);

  const getNombreEmpresa = () => {
    return 'Span Business';
  };

  const getEmailSoporte = () => {
    return configGlobal?.email_soporte || 'soporte@span-business.com';
  };

  const getWhatsappSoporte = () => {
    return configGlobal?.whatsapp_soporte || '+57 312 494 35 27';
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    if (isNaN(numPrice)) return '$0 COP';
    
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
    
    return `${formatted} COP`;
  };

  const renderBeneficiosAvanzados = (plan: Plan) => {
    const beneficios: { label: string; icon: any }[] = [];
    
    if (plan.tiene_inventario) beneficios.push({ label: 'Control Avanzado de Inventario', icon: Package });
    if (plan.tiene_comisiones) beneficios.push({ label: 'Comisiones Automáticas por Estilista', icon: DollarSign });
    if (plan.tiene_nominas) beneficios.push({ label: 'Liquidación de Nóminas y Préstamos', icon: CreditCard });
    if (plan.tiene_marketing) beneficios.push({ label: 'Módulo de Marketing y Clientes', icon: Mail });
    if (plan.tiene_analytics) beneficios.push({ label: 'Analytics y Reportes Financieros', icon: BarChart3 });
    if (plan.soporte_prioritario) beneficios.push({ label: 'Soporte Prioritario y Asistencia', icon: Shield });

    return beneficios;
  };

  const planMasCaro = planes.length > 0 ? 
    planes.reduce((max: any, plan: any) => {
      const maxPrice = parseFloat(max.precio.toString());
      const planPrice = parseFloat(plan.precio.toString());
      return planPrice > maxPrice ? plan : max;
    }, planes[0]) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Banner Superior de Garantía y Prueba Gratis */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium shadow-inner flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" />
        <span>
          <strong>15 Días de Prueba Gratis</strong> en todos los planes • Sin tarjeta de crédito • Acceso inmediato a la suite completa
        </span>
        <Link href="/registro" className="underline font-bold hover:text-indigo-100 hidden sm:inline ml-1">
          Regístrate ahora →
        </Link>
      </div>

      {/* Header/Navbar */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:bg-indigo-700 transition-colors">
                <svg 
                  width="28" 
                  height="28" 
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
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  Span <span className="text-indigo-600">Business</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium -mt-1 hidden sm:block">
                  Gestión para Salones, Barberías & Spas
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
              <Link href="#soluciones" className="hover:text-indigo-600 transition-colors">
                Para tu Negocio
              </Link>
              <Link href="#modulos" className="hover:text-indigo-600 transition-colors">
                Funcionalidades
              </Link>
              <Link href="#planes" className="hover:text-indigo-600 transition-colors">
                Planes y Precios
              </Link>
              <Link href="/contacto" className="hover:text-indigo-600 transition-colors">
                Contacto y Soporte
              </Link>
              <Link 
                href="/login" 
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/registro" 
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm transition-all hover:shadow active:scale-95"
              >
                Prueba 15 Días Gratis
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-700 hover:text-slate-900 p-2 rounded-lg"
                aria-label="Abrir menú"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t border-slate-200 bg-white">
              <Link 
                href="#soluciones" 
                className="block px-3 py-2 text-slate-700 hover:text-indigo-600 font-medium rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Para tu Negocio
              </Link>
              <Link 
                href="#modulos" 
                className="block px-3 py-2 text-slate-700 hover:text-indigo-600 font-medium rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Funcionalidades
              </Link>
              <Link 
                href="#planes" 
                className="block px-3 py-2 text-slate-700 hover:text-indigo-600 font-medium rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Planes y Precios
              </Link>
              <Link 
                href="/contacto" 
                className="block px-3 py-2 text-slate-700 hover:text-indigo-600 font-medium rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contacto
              </Link>
              <div className="pt-2 flex flex-col gap-2">
                <Link 
                  href="/login" 
                  className="w-full text-center py-2.5 border border-slate-300 text-slate-800 rounded-xl font-semibold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/registro" 
                  className="w-full text-center py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Comenzar Prueba Gratis (15 Días)
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200 text-indigo-800 text-xs sm:text-sm font-semibold mb-6">
            <Scissors className="w-4 h-4 text-indigo-600" />
            <span>La Suite #1 para Salones de Belleza, Peluquerías, Barberías y Spas</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight mb-6">
            Control total de tu salón: agenda, comisiones y caja{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              en un solo lugar
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Elimina los cuadernos y errores manuales. Administra las citas de tus clientes, liquida las comisiones de estilistas o barberos en segundos, y lleva el control del inventario y la caja diaria con precisión milimétrica.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link 
              href="/registro"
              className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all font-bold text-lg shadow-lg hover:shadow-indigo-500/25 active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Comenzar Prueba Gratis (15 Días)</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login"
              className="w-full sm:w-auto bg-white text-slate-800 border-2 border-slate-300 px-8 py-4 rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-all font-bold text-lg"
            >
              Acceso a Mi Salón
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-600 stroke-[3]" /> 15 días gratis sin tarjeta
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-600 stroke-[3]" /> Cancela cuando quieras
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-600 stroke-[3]" /> Soporte oficial en español
            </span>
          </div>

          {/* Cifras de confianza contextualizadas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 mb-1">1.000+ Horas</div>
              <p className="text-sm font-semibold text-slate-800 mb-0.5">Ahorradas al mes en gestión</p>
              <p className="text-xs text-slate-500">Automatizando cuadres de caja y cálculo de comisiones de turnos.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 mb-1">50.000+ Citas</div>
              <p className="text-sm font-semibold text-slate-800 mb-0.5">Y ventas procesadas</p>
              <p className="text-xs text-slate-500">En salones, peluquerías, barberías y spas que confían en Span.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 mb-1">99.9% Uptime</div>
              <p className="text-sm font-semibold text-slate-800 mb-0.5">Disponibilidad en la nube</p>
              <p className="text-xs text-slate-500">Acceso 24/7 desde computador, tablet o celular con respaldos automáticos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección: Diseñado para cada tipo de negocio */}
      <section id="soluciones" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Especialización Sectorial
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Diseñado a la medida de tu establecimiento
            </h3>
            <p className="text-slate-600 text-base sm:text-lg">
              Entendemos la dinámica real del sector de belleza y bienestar. Por eso Span Business se adapta a las necesidades específicas de tu equipo:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Salones de Belleza */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-5 font-bold text-xl">
                💇‍♀️
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Salones & Peluquerías</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Control de turnos por estilista, servicios químicos (tintes, alisados), comisiones diferenciadas y venta de productos capilares.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                <li>✓ Liquidación por servicio</li>
                <li>✓ Historial de clientes</li>
                <li>✓ Préstamos a estilistas</li>
              </ul>
            </div>

            {/* Barberías */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-5 font-bold text-xl">
                💈
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Barberías Clásicas & Urbanas</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Punto de venta (POS) ultra rápido en mostrador, asignación inmediata de barbero, turnos espontáneos y control de caja por turnos.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                <li>✓ Cobro rápido en POS</li>
                <li>✓ Métricas por barbero</li>
                <li>✓ Arqueo diario de caja</li>
              </ul>
            </div>

            {/* Spas y Estéticas */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-5 font-bold text-xl">
                🧖‍♀️
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Spas & Centros de Estética</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Programación de citas previas por sala y terapeuta, paquetes de sesiones, notas técnicas de tratamiento y seguimiento comercial.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                <li>✓ Agenda de turnos previa</li>
                <li>✓ Ficha técnica de cliente</li>
                <li>✓ Control de insumos</li>
              </ul>
            </div>

            {/* Uñas y Pestañas */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-5 font-bold text-xl">
                💅
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Nail Bars & Lash Studios</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Catálogo organizado de servicios (manicura, pedicura, extensiones), control de inventario de esmaltes e insumos y fidelización.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                <li>✓ Catálogo de servicios</li>
                <li>✓ Control de stock mínimo</li>
                <li>✓ Base de datos de clientes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Módulos de la Suite */}
      <section id="modulos" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Funcionalidades Integrales
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Todo lo que necesitas para operar sin estrés
            </h3>
            <p className="text-slate-600 text-base sm:text-lg">
              Span Business centraliza las 3 áreas críticas de cualquier salón: ventas en mostrador, gestión del personal y administración financiera.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ventas y Turnos */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Ventas, POS y Citas</h4>
              <p className="text-sm text-slate-600 mb-6">
                Factura servicios y productos rápidamente, agenda citas por calendario y realiza cierres de caja sin descuadres.
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Terminal Punto de Venta (POS) rápido</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Agenda interactiva de citas por profesional</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Apertura y cierre diario de caja con arqueo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Emisión e impresión de tickets térmicos</span>
                </li>
              </ul>
            </div>

            {/* Equipo y Comisiones */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Colaboradores & Comisiones</h4>
              <p className="text-sm text-slate-600 mb-6">
                Define esquemas justos de comisiones y elimina las discusiones al momento de pagar a tus estilistas o barberos.
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Cálculo automático de comisión por cada servicio</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Control de préstamos internos y anticipos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Liquidación periódica y tickets de nómina</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Permisos por rol (admin, recepcionista, estilista)</span>
                </li>
              </ul>
            </div>

            {/* Inventario y Finanzas */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Inventario y Reportes</h4>
              <p className="text-sm text-slate-600 mb-6">
                Conoce exactamente cuánto ganas, cuáles son tus servicios más rentables y evita quedarte sin producto de reventa o tintes.
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Kardex de entradas y salidas de producto</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Alertas automáticas de bajo stock</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Reportes automáticos de cierre diario al correo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Auditoría de seguridad con trazabilidad completa</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Planes Dinámicos Section */}
      <section id="planes" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Planes Transparentes
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Elige el plan ideal para el tamaño de tu salón
            </h3>
            <p className="text-slate-600 text-base sm:text-lg mb-4">
              Todos los planes incluyen <strong>15 días de prueba gratis</strong> sin tarjeta de crédito. Cancela en cualquier momento sin cláusulas de permanencia.
            </p>
            <div className="inline-block bg-indigo-50 border border-indigo-200 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-800">
              Precios en Pesos Colombianos (COP) • IVA incluido • Sin costos ocultos
            </div>
          </div>

          {loadingPlanes ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
              <p className="text-sm text-slate-500">Cargando planes de suscripción...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {planes && planes.length > 0 ? (
                planes.map((plan: Plan) => {
                  const esPlanMasCaro = planMasCaro?.id === plan.id;
                  const beneficios = renderBeneficiosAvanzados(plan);
                  
                  return (
                    <div 
                      key={plan.id} 
                      className={`bg-white rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-200 ${
                        esPlanMasCaro 
                          ? 'border-2 border-indigo-600 shadow-xl ring-4 ring-indigo-50' 
                          : 'border border-slate-200 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {/* Badge Más Popular */}
                      {esPlanMasCaro && (
                        <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase shadow">
                            Recomendado para Salones
                          </span>
                        </div>
                      )}

                      <div>
                        {/* Cabecera del Plan */}
                        <div className="mb-6">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-2xl font-bold text-slate-900">{plan.nombre}</h4>
                            <span className="bg-green-100 text-green-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                              Prueba 15 Días
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 min-h-[32px]">{plan.descripcion}</p>
                          
                          <div className="mt-4 pb-6 border-b border-slate-100">
                            <div className="flex items-baseline">
                              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                {formatPrice(plan.precio)}
                              </span>
                              <span className="text-slate-500 text-sm ml-2 font-medium">/ mes</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">IVA incluido • Pago mensual</p>
                          </div>
                        </div>

                        {/* Capacidad y Límites */}
                        <div className="mb-6">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                            Capacidad del Plan
                          </p>
                          <ul className="space-y-2.5 text-sm text-slate-700">
                            <li className="flex items-center gap-2.5">
                              <Users className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                              <span>Hasta <strong>{plan.max_usuarios}</strong> usuarios de sistema</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                              <UserCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                              <span>Hasta <strong>{plan.max_empleados}</strong> estilistas o barberos</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                              <Store className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                              <span>Sucursal activa en la nube</span>
                            </li>
                          </ul>
                        </div>

                        {/* Módulos Esenciales */}
                        <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                            Módulos Esenciales Incluidos:
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
                            <span>• Ventas y POS</span>
                            <span>• Historial de Ventas</span>
                            <span>• Control de Cajas</span>
                            <span>• Agenda y Citas</span>
                            <span>• Préstamos Internos</span>
                            <span>• Gestión de Clientes</span>
                          </div>
                        </div>

                        {/* Características Avanzadas (Solo si el plan tiene módulos adicionales) */}
                        {beneficios.length > 0 ? (
                          <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">
                              Funciones Avanzadas Incluidas:
                            </p>
                            <ul className="space-y-2.5 text-sm text-slate-800">
                              {beneficios.map((b, idx) => {
                                const IconComponent = b.icon;
                                return (
                                  <li key={idx} className="flex items-center gap-2.5">
                                    <div className="p-1 bg-indigo-100 text-indigo-600 rounded">
                                      <IconComponent className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-medium text-slate-800">{b.label}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : (
                          <div className="mb-8 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-relaxed">
                            💡 Ideal para salones pequeños y barberías que inician y requieren control de ventas, citas y caja básica.
                          </div>
                        )}
                      </div>

                      {/* Botón de Registro con Plan */}
                      <Link 
                        href={`/registro?plan=${plan.id}`}
                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-center transition-all flex items-center justify-center space-x-2 shadow-sm ${
                          esPlanMasCaro
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>Probar 15 Días Gratis</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No hay planes disponibles temporalmente. Por favor contáctanos para asesorarte.
                </div>
              )}
            </div>
          )}

          {/* Caja explicativa de la prueba de 15 días */}
          <div className="mt-16 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto">
            <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              ¿Cómo funciona exactamente la prueba gratis de 15 días?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-600">
              <div>
                <p className="font-bold text-slate-900 mb-1">1. Registro sin tarjeta</p>
                <p>Crea tu cuenta ingresando el nombre de tu salón y tu correo. No solicitamos tarjetas ni datos financieros.</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">2. Acceso total e ilimitado</p>
                <p>Durante 15 días puedes agendar citas reales, probar el POS y liquidar comisiones con tu equipo.</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">3. Tú decides si continuar</p>
                <p>Al terminar la prueba, si estás satisfecho, activas tu plan vía transferencia bancaria. Si no, no se cobra nada.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            ¿Listo para llevar tu salón al siguiente nivel?
          </h2>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto mb-8">
            Únete hoy a los salones, barberías y spas que ya optimizan su tiempo, comisiones y caja con Span Business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/registro"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all text-base"
            >
              Comenzar Mis 15 Días Gratis
            </Link>
            <Link 
              href="/contacto"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-8 py-4 rounded-xl transition-all text-base"
            >
              Hablar con un Asesor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Unificado */}
      <footer className="bg-slate-950 text-white py-14 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#1f2937"/>
                    <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
                    <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
                    <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
                    <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
                  </svg>
                </div>
                <span className="text-2xl font-black tracking-tight">Span Business</span>
              </div>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-4">
                Software de gestión en la nube especializado para Salones de Belleza, Peluquerías, Barberías, Spas y Centros de Estética.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>📍 Carrera 12 # 43 - 136, Quibdó - Chocó, Colombia</span>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Enlaces Rápidos</h5>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link href="#soluciones" className="hover:text-white transition-colors">Para tu Negocio</Link></li>
                <li><Link href="#modulos" className="hover:text-white transition-colors">Funcionalidades</Link></li>
                <li><Link href="#planes" className="hover:text-white transition-colors">Planes y Precios</Link></li>
                <li><Link href="/registro" className="hover:text-white transition-colors">Registro (15 Días Gratis)</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Acceso al Sistema</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal & Soporte</h5>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-white transition-colors">Términos del Servicio</Link></li>
                <li><Link href="/contacto" className="hover:text-white transition-colors">Contacto y Soporte</Link></li>
                <li className="pt-2">
                  <a href={`mailto:${getEmailSoporte()}`} className="text-indigo-400 hover:text-indigo-300 font-medium break-all">
                    {getEmailSoporte()}
                  </a>
                </li>
                <li>
                  <a href={`https://wa.me/${getWhatsappSoporte().replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 font-medium">
                    WhatsApp: {getWhatsappSoporte()}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 text-center text-xs text-slate-500">
            © 2026 Span Business. Todos los derechos reservados. Nit: 80772379-9. Quibdó - Chocó, Colombia.
          </div>
        </div>
      </footer>
    </div>
  );
}
