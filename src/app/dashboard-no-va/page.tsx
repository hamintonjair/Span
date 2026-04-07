'use client';

import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

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

  // Redirigir según el rol
  if (user.rol === 'admin_global') {
    router.push('/admin-dashboard');
    return null;
  }

  if (user.empresa_id) {
    router.push('/dashboard-empresa');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {user.rol === 'admin_global' ? 'Panel de Administración Global' : 'Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2">
              Bienvenido, {user.nombre}
            </p>
          </div>

          {user.rol === 'admin_global' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Empresas</h3>
                  <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Empresas registradas
                  </p>
                  <Link href="/admin-global">
                    <Button className="mt-4 w-full" variant="outline">
                      Gestionar Empresas
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Usuarios</h3>
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Usuarios totales
                  </p>
                  <Button className="mt-4 w-full" variant="outline" disabled>
                    Ver Usuarios
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Ingresos</h3>
                  <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$0</div>
                  <p className="text-xs text-muted-foreground">
                    Ingresos mensuales
                  </p>
                  <Button className="mt-4 w-full" variant="outline" disabled>
                    Ver Reportes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Analytics</h3>
                  <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">
                    Crecimiento mensual
                  </p>
                  <Button className="mt-4 w-full" variant="outline" disabled>
                    Ver Estadísticas
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Redirigiendo a tu dashboard...
              </h2>
              <p className="text-gray-600">
                Serás redirigido automáticamente a tu panel correspondiente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
