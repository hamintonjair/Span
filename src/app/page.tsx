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
  Eye,
  Mail,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Interfaz para el tipo de datos del plan
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
  descripcion: string;
  creado_en: string;
  actualizado_en: string;
  created_at: string;
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [planEmpresarial, setPlanEmpresarial] = useState<Plan | null>(null);
  const [loadingPlanEmpresarial, setLoadingPlanEmpresarial] = useState(true);
  const [configGlobal, setConfigGlobal] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Obtener planes de Supabase
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
            descripcion,
            creado_en,
            actualizado_en,
            created_at
          `)
          .order('precio', { ascending: true });

        if (error) {
          console.error('Error cargando planes:', error);
          console.error('Detalles del error:', error);
        } else {
          console.log('Planes cargados:', data);
          setPlanes(data || []);
        }
      } catch (error) {
        console.error('Error general cargando planes:', error);
      } finally {
        setLoadingPlanes(false);
      }
    };

    fetchPlanes();

    // Obtener específicamente el plan empresarial
    const fetchPlanEmpresarial = async () => {
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
            descripcion,
            creado_en,
            actualizado_en,
            created_at
          `)
          .eq('nombre', 'Empresarial')
          .single();

        if (error) {
          console.error('Error cargando plan empresarial:', error);
        } else {
          console.log('Plan empresarial cargado:', data);
          setPlanEmpresarial(data);
        }
      } catch (error) {
        console.error('Error general cargando plan empresarial:', error);
      } finally {
        setLoadingPlanEmpresarial(false);
      }
    };

    fetchPlanEmpresarial();

    // Obtener configuración global
    const fetchConfigGlobal = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('configuracion_global')
          .select('titular')
          .single();

        if (error) {
          console.error('Error cargando configuración global:', error);
        } else {
          console.log('Configuración global cargada:', data);
          setConfigGlobal(data);
        }
      } catch (error) {
        console.error('Error general cargando configuración global:', error);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfigGlobal();
  }, []);

  // Función para obtener el nombre de la empresa
  const getNombreEmpresa = () => {
    return configGlobal?.titular;
  };

  // Función para formatear precio
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    if (isNaN(numPrice)) return '$0';
    
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Función para renderizar beneficios
  const renderBeneficios = (plan: any) => {
    const beneficios: string[] = [];
    
    if (plan.tiene_inventario) beneficios.push('Inventario Avanzado');
    if (plan.tiene_comisiones) beneficios.push('Comisiones Automáticas');
    if (plan.tiene_marketing) beneficios.push('Marketing y Campañas');
    if (plan.tiene_analytics) beneficios.push('Analytics Avanzado');
    if (plan.tiene_nominas) beneficios.push('Nóminas Completo');
    if (plan.soporte_prioritario) beneficios.push('Soporte Prioritario');

    return beneficios;
  };

  // Encontrar el plan con mayor precio
  const planMasCaro = planes.length > 0 ? 
    planes.reduce((max: any, plan: any) => {
      const maxPrice = parseFloat(max.precio.toString());
      const planPrice = parseFloat(plan.precio.toString());
      return planPrice > maxPrice ? plan : max;
    }, planes[0]) : null;

  // Skeleton loader
  if (loadingPlanes) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header/Navbar */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
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
                  <span className="text-xl font-bold text-slate-900">{getNombreEmpresa()}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Skeleton para planes */}
        <section id="planes" className="py-20 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-48 mx-auto"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-8 shadow-lg border border-slate-200">
                  <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-24 mb-6"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-4 bg-slate-200 rounded"></div>
                      ))}
                    </div>
                    <div className="h-10 bg-slate-200 rounded w-full mt-8"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
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
                <span className="text-xl font-bold text-slate-900">{getNombreEmpresa()}</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="#caracteristicas" 
                className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
              >
                Características
              </Link>
              <Link 
                href="#beneficios" 
                className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
              >
                Beneficios
              </Link>
              <Link 
                href="#planes" 
                className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
              >
                Planes
              </Link>
              <Link 
                href="/login" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2"
              >
                <span>Acceso al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900 p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-slate-200">
              <Link 
                href="#caracteristicas" 
                className="block px-3 py-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Características
              </Link>
              <Link 
                href="#beneficios" 
                className="block px-3 py-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Beneficios
              </Link>
              <Link 
                href="#planes" 
                className="block px-3 py-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Planes
              </Link>
              <Link 
                href="/login" 
                className="block mx-3 mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Acceso al Sistema
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Gestiona tu empresa con
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {' '}rapidez y eficiencia
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Software integral para empresas que automatiza inventario, ventas, nóminas y más. 
              Toma el control total de tu negocio con herramientas profesionales y fáciles de usar.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/registro"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 font-semibold text-lg shadow-lg flex items-center space-x-2"
            >
              <span>Comenzar Ahora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login"
              className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-4 rounded-lg hover:bg-indigo-50 transition-all font-semibold text-lg"
            >
              Iniciar Sesión
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">1000+</div>
              <div className="text-slate-600">Empresas activas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">50K+</div>
              <div className="text-slate-600">Transacciones/mes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">99.9%</div>
              <div className="text-slate-600">Uptime garantizado</div>
            </div>
          </div>
        </div>
      </section>

      {/* Características Section */}
      <section id="caracteristicas" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Características Principales
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu empresa de manera eficiente y profesional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Inventario Inteligente */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Inventario Inteligente
              </h3>
              <p className="text-slate-600 mb-4">
                Gestión completa de productos con control de IVA, stock mínimo y alertas automáticas
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Control de stock en tiempo real</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Cálculo automático de IVA</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Alertas de bajo stock</span>
                </li>
              </ul>
            </div>

            {/* Cierres de Caja */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Cierres de Caja
              </h3>
              <p className="text-slate-600 mb-4">
                Reportes automáticos enviados al correo con análisis detallado de ventas
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Reportes automáticos por email</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Análisis de ingresos y egresos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Cierre diario automático</span>
                </li>
              </ul>
            </div>

            {/* Control Total */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Control Total
              </h3>
              <p className="text-slate-600 mb-4">
                Sistema de auditoría completo con roles de empleados y permisos granulares
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Auditoría de todas las acciones</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Roles y permisos configurables</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Registro de actividad completa</span>
                </li>
              </ul>
            </div>

            {/* Análisis de Ventas */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Análisis de Ventas
              </h3>
              <p className="text-slate-600 mb-4">
                Dashboard profesional con métricas en tiempo real y tendencias de negocio
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Métricas en tiempo real</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Gráficos interactivos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Reportes personalizables</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios Section */}
      <section id="beneficios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Beneficios para tu Negocio
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Transforma la forma de gestionar tu empresa con herramientas modernas y eficientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Ahorra Tiempo
              </h3>
              <p className="text-slate-600">
                Automatiza procesos manuales y enfócate en hacer crecer tu negocio
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Mejora Colaboración
              </h3>
              <p className="text-slate-600">
                Trabaja en equipo con roles definidos y acceso centralizado a la información
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Toma Mejores Decisiones
              </h3>
              <p className="text-slate-600">
                Accede a análisis detallados y reportes para decisiones basadas en datos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Módulos Core Section */}
      <section id="modulos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Suite Completa para tu Negocio
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {getNombreEmpresa()} incluye todos los módulos que necesitas para gestionar tu empresa de manera integral
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Ventas y Operaciones */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Ventas y Operaciones</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">POS y Punto de Venta</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Historial de Ventas</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Gestión de Caja</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Gestión de Citas</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Préstamos Internos</span>
                </li>
              </ul>
            </div>

            {/* Catálogo */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Catálogo</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Productos y Servicios</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Categorías</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Proveedores</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Gestión de Clientes</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Control de Inventario</span>
                </li>
              </ul>
            </div>

            {/* Administración */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Administración</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Dashboard Principal</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Finanzas y Reportes</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Auditoría Completa</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Gestión de Usuarios</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Control de Empleados</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Mi Suscripción</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Plan Empresarial Section */}
      <section id="plan-empresarial" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingPlanEmpresarial ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
              <p className="text-slate-600">Cargando plan empresarial...</p>
            </div>
          ) : planEmpresarial ? (
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                {planEmpresarial.nombre}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                {planEmpresarial.descripcion}
              </p>
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-8 max-w-2xl mx-auto shadow-xl">
                <div className="mb-6">
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-5xl font-bold">{formatPrice(planEmpresarial.precio)}</span>
                    <span className="text-xl ml-2">/ mes</span>
                  </div>
                  <p className="text-white/90 text-center">
                    Gestión completa con todas las herramientas empresariales
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-white">Límites del Plan</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-white/80 flex-shrink-0" />
                        <span className="text-white">Hasta {planEmpresarial.max_usuarios} Usuarios</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <UserCheck className="w-5 h-5 text-white/80 flex-shrink-0" />
                        <span className="text-white">Hasta {planEmpresarial.max_empleados} Empleados</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <Store className="w-5 h-5 text-white/80 flex-shrink-0" />
                        <span className="text-white">Sucursales Ilimitadas</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-white">Características VIP</h4>
                    <ul className="space-y-3">
                      {planEmpresarial.tiene_inventario && (
                        <li className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-white/80 flex-shrink-0" />
                          <span className="text-white">Inventario Avanzado</span>
                        </li>
                      )}
                      {planEmpresarial.tiene_comisiones && (
                        <li className="flex items-center space-x-3">
                          <DollarSign className="w-5 h-5 text-white/80 flex-shrink-0" />
                          <span className="text-white">Comisiones Automáticas</span>
                        </li>
                      )}
                      {planEmpresarial.tiene_marketing && (
                        <li className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-white/80 flex-shrink-0" />
                          <span className="text-white">Marketing y Campañas</span>
                        </li>
                      )}
                      {planEmpresarial.tiene_analytics && (
                        <li className="flex items-center space-x-3">
                          <BarChart3 className="w-5 h-5 text-white/80 flex-shrink-0" />
                          <span className="text-white">Analytics Avanzado</span>
                        </li>
                      )}
                      {planEmpresarial.tiene_nominas && (
                        <li className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-white/80 flex-shrink-0" />
                          <span className="text-white">Nóminas Completo</span>
                        </li>
                      )}
                      {planEmpresarial.soporte_prioritario && (
                        <li className="flex items-center space-x-3">
                          <Shield className="w-5 h-5 text-white/80 flex-shrink-0" />
                          <span className="text-white">Soporte Prioritario</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <Link 
                  href={`/registro?plan=${planEmpresarial.id}`}
                  className="w-full bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-slate-50 transition-all transform hover:scale-105 font-bold text-lg shadow-lg flex items-center justify-center space-x-2"
                >
                  <span>Comenzar ahora con Plan {planEmpresarial.nombre}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-slate-600">No se encontró el plan empresarial.</p>
            </div>
          )}
        </div>
      </section>

      {/* Planes Dinámicos Section */}
      <section id="planes" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Planes de Suscripción
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Elige el plan perfecto para tu negocio y escala a tu ritmo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {planes && planes.length > 0 ? (
              planes.map((plan: any) => {
                const esPlanMasCaro = planMasCaro?.id === plan.id;
                const beneficios = renderBeneficios(plan);
                
                return (
                  <div 
                    key={plan.id} 
                    className={`bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all relative ${
                      esPlanMasCaro 
                        ? 'border-2 border-indigo-600 shadow-2xl transform scale-105' 
                        : 'border border-slate-200'
                    }`}
                  >
                    {esPlanMasCaro && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Más Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.nombre}</h3>
                      <div className="flex items-baseline mb-6">
                        <span className={`text-4xl font-bold ${esPlanMasCaro ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {formatPrice(plan.precio)}
                        </span>
                        <span className="text-slate-600 ml-2">/ mes</span>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">
                        {plan.descripcion}
                      </p>
                      
                      {/* Badge de Prueba Gratuita */}
                      {plan.tiene_trial_gratis && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 animate-pulse">
                          🎁 15 Días de Prueba Gratis
                        </div>
                      )}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-indigo-700 font-semibold text-center mb-3">
                          ✨ Suite Completa de {getNombreEmpresa()} Incluida
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Ventas y POS</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Histyorial de Ventas</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Gestión de Cajas</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Gestión de Citas</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Prestamos</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Productos y Servicios</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Categorías</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Proveedores</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Gestion Clientes</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Gestion Usuarios</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Gestión Empleados</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Finanzas</span>
                          </div>
                           <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Auditoría</span>
                          </div>
                           <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-indigo-600">Mi Sucripciones</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-lg font-semibold mb-4 text-slate-900">Límites del Plan</h4>
                      <ul className="space-y-3">
                        <li className="flex items-center space-x-3">
                          <Users className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                          <span className="text-slate-700">Hasta {plan.max_usuarios} Usuarios</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <UserCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                          <span className="text-slate-700">Hasta {plan.max_empleados} Empleados</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Store className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                          <span className="text-slate-700">Sucursales Ilimitadas</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-lg font-semibold mb-4 text-slate-900">Características VIP</h4>
                      <ul className="space-y-3">
                        {beneficios.map((beneficio: string, index: number) => (
                          <li key={index} className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-slate-700">{beneficio}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link 
                      href={`/registro?plan=${plan.id}`}
                      className={`w-full px-6 py-3 rounded-lg transition-all font-semibold text-center block flex items-center justify-center space-x-2 ${
                        esPlanMasCaro
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>Comenzar con este Plan</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-600">No hay planes disponibles en este momento.</p>
              </div>
            )}
          </div>

          {/* Nota sobre límites */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">
              Todos los planes incluyen soporte por email. Los límites de usuarios y empleados se aplican por empresa.
              Puedes cambiar de plan en cualquier momento desde tu panel de configuración.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Únete a miles de empresas que ya están usando {getNombreEmpresa()} para optimizar sus operaciones
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/registro"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-slate-50 transition-all transform hover:scale-105 font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Comenzar Ahora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login"
              className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-lg hover:bg-white/10 transition-all font-semibold text-lg"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
              <Link href="#" className="hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
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
