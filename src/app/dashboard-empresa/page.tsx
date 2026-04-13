'use client';

import { SimpleLayout } from '@/components/layout/simple-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-client';
import {
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Componente de banner para mensajes globales
function MensajeGlobalBanner() {
  const [mensajeGlobal, setMensajeGlobal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    console.log('Cargando mensaje global...'); // Debug
    cargarMensajeGlobal();
  }, []);

  const cargarMensajeGlobal = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('mensaje_global')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando mensaje global:', error);
        return;
      }

      console.log('Mensaje global cargado:', data?.mensaje_global); // Debug
      setMensajeGlobal(data?.mensaje_global);
    } catch (error) {
      console.error('Error en cargarMensajeGlobal:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoizar el banner para evitar duplicación
  const bannerContent = useMemo(() => {
    if (!mounted || loading || !mensajeGlobal) {
      console.log('No renderizar banner:', { mounted, loading, mensajeGlobal }); // Debug
      return null;
    }


    return (
      <div className="mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📢</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Comunicado Importante</h3>
              <p className="text-amber-800 whitespace-pre-wrap">{mensajeGlobal}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }, [mounted, loading, mensajeGlobal]);

  return bannerContent;
}

export default function DashboardEmpresaPage() {
  const { user, loading } = useJWTAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Verificar si el usuario tiene empresa_id
    if (user && !user.empresa_id && user.rol !== 'admin_global') {
      router.push('/login');
      return;
    }
    
    // Permitir que admin_global vea el dashboard-empresa si lo desea
    // No redirigir automáticamente a admin-dashboard
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Si es admin_global, no debería estar aquí
  if (user.rol === 'admin_global') {
    return null;
  }

  return (
    <SimpleLayout>
      {/* Contenido principal que ocupa todo el espacio restante */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Banner de mensaje global - Solo una vez */}
          <MensajeGlobalBanner key="global-banner" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Bienvenido, {user.nombre}
            </p>
          </div>

          {/* Tarjetas de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Citas Hoy</h3>
                <CalendarIcon className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500">
                  Citas programadas para hoy
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Clientes</h3>
                <UsersIcon className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500">
                  Clientes registrados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Ventas Mes</h3>
                <CurrencyDollarIcon className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">$0</div>
                <p className="text-xs text-gray-500">
                  Total ventas este mes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Servicios</h3>
                <ClipboardDocumentListIcon className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500">
                  Servicios ofrecidos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">📅 Nueva Cita</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Agendar una nueva cita para un cliente</p>
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => router.push('/(dashboard)/citas')}
                >
                  Ir a Citas
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">💰 Punto de Venta</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Registrar una venta o cobro</p>
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => router.push('/(dashboard)/pos')}
                >
                  Ir a POS
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">👥 Nuevo Cliente</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Registrar un nuevo cliente</p>
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => router.push('/(dashboard)/clientes')}
                >
                  Ir a Clientes
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Información del Plan */}
          <Card className="bg-white">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">📋 Mi Suscripción</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Plan Actual</p>
                  <p className="text-lg font-semibold text-gray-900">Básico</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <p className="text-lg font-semibold text-green-600">Activa</p>
                </div>
              </div>
              <div className="mt-6">
                <Button 
                  variant="outline"
                  className="border-amber-600 text-amber-600 hover:bg-amber-50"
                  onClick={() => router.push('/(dashboard)/suscripcion')}
                >
                  Gestionar Suscripción
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleLayout>
  );
}
