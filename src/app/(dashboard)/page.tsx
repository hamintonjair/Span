'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, loading } = useJWTAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.rol === 'admin_global' ? 'Panel de Administración' : 'Dashboard'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user.rol === 'admin_global' 
              ? 'Gestión global del sistema' 
              : 'Bienvenido a tu panel de gestión'
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Citas Hoy</h3>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 respecto a ayer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Clientes</h3>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">248</div>
              <p className="text-xs text-muted-foreground">
                +12% respecto al mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Ingresos</h3>
              <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450</div>
              <p className="text-xs text-muted-foreground">
                +8% respecto al mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Servicios</h3>
              <ClipboardDocumentListIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Activos este mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Agendar Cita</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Gestiona las citas del salón
              </p>
              <Button 
                onClick={() => router.push('/citas')}
                className="w-full"
              >
                Ir a Citas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Clientes</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Administra la base de clientes
              </p>
              <Button 
                onClick={() => router.push('/clientes')}
                className="w-full"
              >
                Ver Clientes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Servicios</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Gestiona los servicios ofrecidos
              </p>
              <Button 
                onClick={() => router.push('/servicios')}
                className="w-full"
              >
                Ver Servicios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Actividad Reciente</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nueva cita agendada</p>
                  <p className="text-xs text-gray-500">María García - Corte de cabello</p>
                </div>
                <span className="text-xs text-gray-500">Hace 5 min</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo cliente registrado</p>
                  <p className="text-xs text-gray-500">Juan Pérez - Tel: 555-0123</p>
                </div>
                <span className="text-xs text-gray-500">Hace 1 hora</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pago recibido</p>
                  <p className="text-xs text-gray-500">Servicio: Tinte y corte - $45</p>
                </div>
                <span className="text-xs text-gray-500">Hace 2 horas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
