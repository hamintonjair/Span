'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  ShoppingCartIcon,
  UserIcon,
  CogIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  BellIcon,
  TagIcon,
  TruckIcon,
  TableCellsIcon,
  MegaphoneIcon, 
  PresentationChartBarIcon,
  ArrowRightOnRectangleIcon,
  StarIcon,
  QuestionMarkCircleIcon,
  LifebuoyIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  section?: 'main' | 'saas' | 'platform';
  requiresPermission?: 'inventory' | 'commissions' | 'marketing' | 'analytics' | 'nominas' | 'priority_support';
}

interface SidebarProps {
  userRole: 'admin_global' | 'admin_empresa' | 'estilista' | 'recepcionista' | 'empleado' | 'soporte' | 'ventas';
  empresaNombre?: string;
  userName?: string;
}

const getSidebarItems = (userRole: string): SidebarItem[] => [
  // Dashboard principal
  {
    title: 'Dashboard',
    href: (userRole === 'admin_global' || userRole === 'soporte' || userRole === 'ventas') ? '/admin/dashboard-admin' : '/dashboard-empresa',
    icon: <HomeIcon className="w-5 h-5" />,
    roles: ['admin_global', 'admin_empresa', 'estilista', 'recepcionista', 'empleado', 'soporte', 'ventas'],
    section: 'main'
  },

  // Finanzas (solo admin_global y roles administrativos)
  {
    title: 'Finanzas',
    href: (userRole === 'admin_global' || userRole === 'soporte' || userRole === 'ventas') ? '/admin/finanzas' : '/finanzas-empresa',
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    roles: ['admin_global', 'admin_empresa', 'soporte', 'ventas'],
    section: 'main'
  },

  // Auditoría (solo admin_global y roles administrativos)
  {
    title: 'Auditoría',
    href: '/admin/auditoria',
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    roles: ['admin_global', 'soporte', 'ventas'],
    section: 'saas'
  },

  // Comunicación (solo admin_global y roles administrativos)
  {
    title: 'Comunicación',
    href: '/admin/comunicacion',
    icon: <BellIcon className="w-5 h-5" />,
    roles: ['admin_global', 'soporte', 'ventas'],
    section: 'saas'
  },

  // Administración SaaS (solo admin_global y roles administrativos)
  {
    title: 'Empresas',
    href: '/admin/empresas',
    icon: <BuildingOfficeIcon className="w-5 h-5" />,
    roles: ['admin_global', 'soporte', 'ventas'],
    section: 'saas'
  },
  {
    title: 'Suscripciones',
    href: '/admin/suscripciones',
    icon: <CreditCardIcon className="w-5 h-5" />,
    roles: ['admin_global', 'soporte', 'ventas'],
    section: 'saas'
  },
  {
    title: 'Planes y Beneficios',
    href: '/admin/planes',
    icon: <Cog6ToothIcon className="w-5 h-5" />,
    roles: ['admin_global', 'soporte', 'ventas'],
    section: 'saas'
  },

  // Operaciones de salón (roles de empresa)
  {
    title: 'Mi Suscripción',
    href: '/suscripcion',
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    roles: ['admin_empresa'],
    section: 'main'
  },
  // Auditoría (solo admin_empresa)
  {
    title: 'Auditoría',
    href: '/auditoria',
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    roles: ['admin_empresa'],
    section: 'main'
  },
  {
    title: 'POS',
    href: '/ventas/nueva',
    icon: <CreditCardIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista', 'estilista'],
    section: 'main'
  },
  {
    title: 'Historial de Ventas',
    href: '/ventas',
    icon: <DocumentTextIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista'],
    section: 'main'
  },
  {
    title: 'Citas',
    href: '/citas',
    icon: <CalendarIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'estilista', 'recepcionista'],
    section: 'main'
  },
  {
    title: 'Gestión de Citas',
    href: '/citas/gestion',
    icon: <TableCellsIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'estilista', 'recepcionista'],
    section: 'main'
  },
  {
    title: 'Clientes',
    href: '/clientes',
    icon: <UserIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista', 'empleado'],
    section: 'main'
  },
  {
    title: 'Productos',
    href: '/productos',
    icon: <ShoppingCartIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista'],
    section: 'main'
  },
  {
    title: 'Servicios',
    href: '/servicios',
    icon: <DocumentTextIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista'],
    section: 'main'
  },
  {
    title: 'Proveedores',
    href: '/proveedores',
    icon: <TruckIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista'],
    section: 'main'
  },

  // Gestión (admin_empresa)
  {
    title: 'Empleados',
    href: '/empleados',
    icon: <UserGroupIcon className="w-5 h-5" />,
    roles: ['admin_empresa'],
    section: 'main'
  },
  {
    title: 'Categorías',
    href: '/categorias',
    icon: <TagIcon className="w-5 h-5" />,
    roles: ['admin_empresa'],
    section: 'main'
  },
  {
    title: 'Usuarios',
    href: (userRole === 'admin_global' || userRole === 'soporte' || userRole === 'ventas') ? '/admin/usuarios' : '/usuarios',
    icon: <UsersIcon className="w-5 h-5" />,
    roles: ['admin_global', 'admin_empresa', 'soporte', 'ventas'],
    section: 'main'
  },

  // Finanzas
  {
    title: 'Caja',
    href: '/caja',
    icon: <CreditCardIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista','estilista'],
    section: 'main'
  },
  {
    title: 'Préstamos',
    href: '/prestamos',
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    roles: ['admin_empresa','recepcionista'],
    section: 'main'
  },
  {
    title: 'Nóminas',
    href: '/nomina',
    icon: <CurrencyDollarIcon  className="w-5 h-5" />,
    roles: ['admin_empresa'],
    section: 'main',
    requiresPermission: 'nominas'
  },

  // Módulos Premium (restringidos por plan)
  {
    title: 'Inventario',
    href: '/inventario',
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista'],
    section: 'main',
    requiresPermission: 'inventory'
  },
  {
    title: 'Comisiones',
    href: '/mis-comisiones',
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista'],
    section: 'main',
    requiresPermission: 'commissions'
  },
{
    title: 'Marketing',
    href: '/marketing',
    // Cambiamos a Megaphone para representar publicidad/captación
    icon: <MegaphoneIcon className="w-5 h-5" />, 
    roles: ['admin_empresa'],
    section: 'main',
    requiresPermission: 'marketing'
  },
  {
    title: 'Analytics',
    href: '/analytics',
    // Cambiamos a PresentationChartBar para un look de reportes profesionales
    icon: <PresentationChartBarIcon className="w-5 h-5" />,
    roles: ['admin_empresa'],
    section: 'main',
    requiresPermission: 'analytics'
  },
  {
    title: 'Soporte Prioritario',
    href: '/soporte',
    icon: <StarIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'estilista', 'recepcionista'],
    section: 'main',
    requiresPermission: 'priority_support'
  },

  // Mi Plataforma (admin_global y admin_empresa)
  {
    title: 'Ayuda',
    href: '/ayuda',
    icon: <QuestionMarkCircleIcon className="w-5 h-5" />,
    roles: ['admin_global', 'admin_empresa', 'estilista', 'recepcionista'],
    section: 'platform'
  },
  {
    title: 'Soporte',
    href: '/dashboard/soporte',
    icon: <LifebuoyIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'estilista', 'recepcionista'],
    section: 'platform'
  },
  {
    title: 'Centro de Ayuda',
    href: '/dashboard/centro-ayuda',
    icon: <BookOpenIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'estilista', 'recepcionista', 'empleado'],
    section: 'platform'
  },
  {
    title: 'Centro de Ayuda',
    href: '/admin/centro-ayuda',
    icon: <BookOpenIcon className="w-5 h-5" />,
    roles: ['admin_global', 'soporte', 'ventas'],
    section: 'platform'
  },
  {
    title: 'Configuración',
    href: (userRole === 'admin_global' || userRole === 'soporte' || userRole === 'ventas') ? '/admin/configuracion' : '/configuracion',
    icon: <CogIcon className="w-5 h-5" />,
    roles: ['admin_global', 'admin_empresa', 'soporte', 'ventas'],
    section: 'platform'
  },
  {
    title: 'Soporte',
    href: '/admin/soporte',
    icon: <LifebuoyIcon className="w-5 h-5" />,
    roles: ['admin_global', 'soporte', 'ventas'],
    section: 'platform'
  },
  {
    title: 'Staff Técnico',
    href: '/admin/staff',
    icon: <UserGroupIcon className="w-5 h-5" />,
    roles: ['admin_global', 'soporte', 'ventas'],
    section: 'platform'
  }
];

export function Sidebar({ userRole, empresaNombre, userName }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [configGlobal, setConfigGlobal] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useJWTAuth();
  const { loading, ...permissions } = usePlanPermissions();

  // Obtener configuración global
  useEffect(() => {
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
          setConfigGlobal(data);
        }
      } catch (error) {
        console.error('Error general cargando configuración global:', error);
      }
    };

    fetchConfigGlobal();
  }, []);

  // Función para obtener el nombre de la empresa
  const getNombreEmpresa = () => {
    return configGlobal?.titular;
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      window.location.href = '/login';
    }
  };

  const filteredItems = getSidebarItems(userRole).filter((item: SidebarItem) => item.roles.includes(userRole));

  // Agrupar items por sección para roles administrativos
  const groupedItems = (userRole === 'admin_global' || userRole === 'soporte' || userRole === 'ventas') ? {
    main: filteredItems.filter((item: SidebarItem) => item.section === 'main'),
    saas: filteredItems.filter((item: SidebarItem) => item.section === 'saas'),
    platform: filteredItems.filter((item: SidebarItem) => item.section === 'platform')
  } : { main: filteredItems };

  const renderSection = (title: string, items: SidebarItem[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-6">
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2 px-3">
            {title}
          </h3>
        )}
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            
            // Verificar si el item requiere permiso y Si el usuario tiene acceso
            let hasPermission = true;
            if (item.requiresPermission && !loading) {
              hasPermission = 
                item.requiresPermission === 'inventory' ? permissions.canUseInventory :
                item.requiresPermission === 'commissions' ? permissions.canUseCommissions :
                item.requiresPermission === 'marketing' ? permissions.canUseMarketing :
                item.requiresPermission === 'nominas' ? (permissions as any).canUseNominas :
                item.requiresPermission === 'analytics' ? (permissions as any).canUseAnalytics :
                item.requiresPermission === 'priority_support' ? (permissions as any).hasPrioritySupport :
                false;
            }

            return (
              <li key={item.href}>
                <Link
                  href={!hasPermission && !loading ? '/suscripcion' : item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-700 text-white shadow-lg'
                      : 'hover:bg-amber-800 text-amber-100'
                  } ${!hasPermission && !loading ? 'opacity-75' : ''}`}
                >
                  {item.icon}
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="font-medium">{item.title}</span>
                      {item.requiresPermission && !loading && !hasPermission && (
                        <LockClosedIcon className="w-4 h-4 text-amber-300" title="Requiere plan superior" />
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className={`bg-gradient-to-b from-amber-900 to-amber-950 text-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-amber-800">
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${isCollapsed ? 'hidden' : 'block'}`}>
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{getNombreEmpresa()}</h1>
              {empresaNombre && (
                <p className="text-xs text-amber-200">{empresaNombre}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-amber-800 rounded-lg transition-colors"
          >
            {isCollapsed ? <Bars3Icon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {(userRole === 'admin_global' || userRole === 'soporte' || userRole === 'ventas') ? (
          <>
            {renderSection('Principal', groupedItems.main || [])}
            {renderSection('Administración SaaS', groupedItems.saas || [])}
            {renderSection('Mi Plataforma', groupedItems.platform || [])}
          </>
        ) : (
          renderSection('Menú', groupedItems.main || [])
        )}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-amber-800">
        <div className={`flex items-center space-x-3 ${isCollapsed ? 'hidden' : 'block'}`}>
          <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{userName || 'Usuario'}</p>
            <p className="text-xs text-amber-200 capitalize">{userRole.replace('_', ' ')}</p>
          </div>
        </div>
        {!isCollapsed && (
          <button 
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 bg-amber-800 hover:bg-amber-700 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        )}
      </div>
    </div>
  );
}
