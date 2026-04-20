'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BellIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ServerIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';

interface DashboardStats {
  totalEmpresas: number;
  empresasActivas: number;
  empresasNuevas: number;
  totalUsuarios: number;
  usuariosActivos: number;
  ingresosMensuales: number;
  ingresosTotales: number;
  suscripcionesActivas: number;
  suscripcionesPendientes: number;
}

interface EmpresaReciente {
  id: string;
  nombre: string;
  nit: string;
  plan: string;
  estado: string;
  fecha_creacion: string;
  usuarios_count: number;
}

interface ActividadReciente {
  id: string;
  tipo: string;
  descripcion: string;
  empresa_id: string;
  empresa_nombre: string;
  usuario_id: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  
  // Estados
  const [stats, setStats] = useState<DashboardStats>({
    totalEmpresas: 0,
    empresasActivas: 0,
    empresasNuevas: 0,
    totalUsuarios: 0,
    usuariosActivos: 0,
    ingresosMensuales: 0,
    ingresosTotales: 0,
    suscripcionesActivas: 0,
    suscripcionesPendientes: 0
  });
  
  const [empresasRecientes, setEmpresasRecientes] = useState<EmpresaReciente[]>([]);
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar estadísticas
  const cargarStats = async () => {
    try {
      // Total de empresas
      const { count: totalEmpresas } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true });

      // Empresas activas (con suscripción activa)
      const { count: empresasActivas } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activo');

      // Empresas nuevas (últimos 30 días)
      const fechaHace30Dias = new Date();
      fechaHace30Dias.setDate(fechaHace30Dias.getDate() - 30);
      
      const { count: empresasNuevas } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fechaHace30Dias.toISOString());

      // Total de usuarios
      const { count: totalUsuarios } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })
        .in('rol', ['admin_empresa', 'estilista', 'recepcionista', 'empleado']);

      // Usuarios activos (últimos 7 días)
      const fechaHace7Dias = new Date();
      fechaHace7Dias.setDate(fechaHace7Dias.getDate() - 7);
      
      const { count: usuariosActivos } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', fechaHace7Dias.toISOString());

      // Ingresos mensuales
      const primerDiaMes = new Date();
      primerDiaMes.setDate(1);
      primerDiaMes.setHours(0, 0, 0, 0);
      
      const { data: ingresosMensuales } = await (supabase.from('suscripciones') as any)
        .select('monto')
        .eq('estado', 'pagada')
        .gte('fecha_pago', primerDiaMes.toISOString());

      // Ingresos totales
      const { data: ingresosTotales } = await (supabase.from('suscripciones') as any)
        .select('monto')
        .eq('estado', 'pagada');

      // Suscripciones activas
      const { count: suscripcionesActivas } = await supabase
        .from('suscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pagada');

      // Suscripciones pendientes
      const { count: suscripcionesPendientes } = await supabase
        .from('suscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente');

      // Actualizar stats
      setStats({
        totalEmpresas: totalEmpresas || 0,
        empresasActivas: empresasActivas || 0,
        empresasNuevas: empresasNuevas || 0,
        totalUsuarios: totalUsuarios || 0,
        usuariosActivos: usuariosActivos || 0,
        ingresosMensuales: (ingresosMensuales as any[])?.reduce((sum: number, sub: any) => sum + (sub.monto || 0), 0) || 0,
        ingresosTotales: (ingresosTotales as any[])?.reduce((sum: number, sub: any) => sum + (sub.monto || 0), 0) || 0,
        suscripcionesActivas: suscripcionesActivas || 0,
        suscripcionesPendientes: suscripcionesPendientes || 0
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Cargar empresas recientes
  const cargarEmpresasRecientes = async () => {
    try {
      // Primero obtener las empresas con sus planes
      const { data: empresasData } = await (supabase.from('empresas') as any)
        .select(`
          id,
          nombre,
          nit,
          estado,
          created_at,
          planes(nombre)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (empresasData) {
        // Para cada empresa, obtener el conteo de usuarios
        const empresasConUsuarios = await Promise.all(
          (empresasData as any[]).map(async (empresa: any) => {
            const { count: usuariosCount } = await supabase
              .from('perfiles')
              .select('*', { count: 'exact', head: true })
              .eq('empresa_id', empresa.id)
              .in('rol', ['admin_empresa', 'estilista', 'recepcionista', 'empleado']);

            return {
              id: empresa.id,
              nombre: empresa.nombre,
              nit: empresa.nit,
              estado: empresa.estado,
              fecha_creacion: empresa.created_at,
              plan: empresa.planes?.nombre || 'Sin plan',
              usuarios_count: usuariosCount || 0
            };
          })
        );
        setEmpresasRecientes(empresasConUsuarios);
      }
    } catch (error) {
      console.error('Error cargando empresas recientes:', error);
    }
  };

  // Cargar actividades recientes
  const cargarActividadesRecientes = async () => {
    try {
      const { data } = await (supabase.from('logs_actividad') as any)
        .select(`
          id,
          accion,
          modulo,
          detalles,
          empresa_id,
          usuario_id,
          created_at,
          empresas(nombre),
          perfiles(nombre)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        const actividadesFormateadas = (data as any[]).map((log: any) => {
          return {
            id: log.id,
            tipo: log.accion,
            descripcion: `${log.accion} en ${log.modulo}`,
            empresa_id: log.empresa_id,
            empresa_nombre: log.empresas?.nombre || 'Sistema',
            usuario_id: log.usuario_id,
            usuario_nombre: log.perfiles?.nombre || 'Sistema',
            created_at: log.created_at
          };
        });
        setActividadesRecientes(actividadesFormateadas);
      }
    } catch (error) {
      console.error('Error cargando actividades recientes:', error);
    }
  };

  // Cargar todos los datos
  const cargarDatos = async () => {
    setLoading(true);
    await Promise.all([
      cargarStats(),
      cargarEmpresasRecientes(),
      cargarActividadesRecientes()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.rol === 'admin_global') {
      cargarDatos();
    }
  }, [user]);

  // Formatear moneda
  const formatearMoneda = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  // Obtener color de estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactivo':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard Administración Global</h1>
                <p className="text-gray-400">
                  Panel de control para la gestión del sistema BeautyPro SaaS
                </p>
              </div>
              <Button
                onClick={cargarDatos}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Tarjetas de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Empresas */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">{stats.totalEmpresas}</div>
                  <div className="text-sm text-gray-400">Empresas registradas</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">+{stats.empresasNuevas}</span>
                    <span className="text-gray-500">nuevas este mes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usuarios */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Activos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">{stats.usuariosActivos}</div>
                  <div className="text-sm text-gray-400">Usuarios activos</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">de {stats.totalUsuarios} totales</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingresos */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    Mensual
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    {formatearMoneda(stats.ingresosMensuales)}
                  </div>
                  <div className="text-sm text-gray-400">Ingresos mensuales</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Total: {formatearMoneda(stats.ingresosTotales)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suscripciones */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <CreditCardIcon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    Activas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">{stats.suscripcionesActivas}</div>
                  <div className="text-sm text-gray-400">Suscripciones activas</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-400">{stats.suscripcionesPendientes}</span>
                    <span className="text-gray-500">pendientes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid de contenido secundario */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Empresas Recientes */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BuildingOfficeIcon className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Empresas Recientes</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => window.location.href = '/admin/empresas'}
                  >
                    Ver todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {empresasRecientes.map((empresa) => (
                    <div key={empresa.id} className="p-4 hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-white">{empresa.nombre}</div>
                        <Badge className={getEstadoColor(empresa.estado)}>
                          {empresa.estado}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>NIT: {empresa.nit}</div>
                        <div>Plan: {empresa.plan}</div>
                        <div>Usuarios: {empresa.usuarios_count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actividad Reciente */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-green-400" />
                    <h2 className="text-lg font-semibold text-white">Actividad Reciente</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => window.location.href = '/admin/auditoria'}
                  >
                    Ver auditoría
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {actividadesRecientes.map((actividad) => (
                    <div key={actividad.id} className="p-4 hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-white">{actividad.tipo}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(actividad.created_at).toLocaleString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>{actividad.descripcion}</div>
                        <div>Empresa: {actividad.empresa_nombre}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ChartBarIcon className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Acciones Rápidas</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => window.location.href = '/admin/empresas'}
                  className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white"
                >
                  <BuildingOfficeIcon className="w-4 h-4 mr-3" />
                  Gestionar Empresas
                </Button>
                <Button
                  onClick={() => window.location.href = '/admin/suscripciones'}
                  className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white"
                >
                  <CreditCardIcon className="w-4 h-4 mr-3" />
                  Ver Suscripciones
                </Button>
                <Button
                  onClick={() => window.location.href = '/admin/usuarios'}
                  className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white"
                >
                  <UsersIcon className="w-4 h-4 mr-3" />
                  Administrar Usuarios
                </Button>
                <Button
                  onClick={() => window.location.href = '/admin/auditoria'}
                  className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white"
                >
                  <ClipboardDocumentListIcon className="w-4 h-4 mr-3" />
                  Ver Auditoría
                </Button>
                <Button
                  onClick={() => window.location.href = '/admin/finanzas'}
                  className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white"
                >
                  <CurrencyDollarIcon className="w-4 h-4 mr-3" />
                  Reportes Financieros
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sistema Status */}
          <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ServerIcon className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Estado del Sistema</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Base de Datos: Operativa</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">API: Funcionando</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Autenticación: Activa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
