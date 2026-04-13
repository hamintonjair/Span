'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import Link from 'next/link';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  ShoppingCartIcon,
  UserIcon,
  CogIcon,
  ChartBarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  BellIcon,
  TagIcon,
  TruckIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  section?: 'main' | 'saas' | 'platform';
  requiresPermission?: 'inventory' | 'commissions' | 'marketing';
}

interface SidebarProps {
  userRole: 'admin_global' | 'admin_empresa' | 'estilista' | 'recepcionista' | 'empleado';
  empresaNombre?: string;
  userName?: string;
}

const getSidebarItems = (userRole: string): SidebarItem[] => [
  // Dashboard principal
  {
    title: 'Dashboard',
    href: userRole === 'admin_global' ? '/admin-dashboard' : '/dashboard-empresa',
    icon: <HomeIcon className="w-5 h-5" />,
    roles: ['admin_global', 'admin_empresa', 'estilista', 'recepcionista', 'empleado'],
    section: 'main'
  },

  // Finanzas (solo admin_global y admin_empresa)
  {
    title: 'Finanzas',
    href: userRole === 'admin_global' ? '/finanzas' : '/finanzas-empresa',
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    roles: ['admin_global', 'admin_empresa'],
    section: 'main'
  },

  // Auditoría (solo admin_global)
  {
    title: 'Auditoría',
    href: '/auditoria',
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    roles: ['admin_global'],
    section: 'saas'
  },

  // Comunicación (solo admin_global)
  {
    title: 'Comunicación',
    href: '/comunicacion',
    icon: <BellIcon className="w-5 h-5" />,
    roles: ['admin_global'],
    section: 'saas'
  },

  // Administración SaaS (solo admin_global)
  {
    title: 'Empresas',
    href: '/empresas',
    icon: <BuildingOfficeIcon className="w-5 h-5" />,
    roles: ['admin_global'],
    section: 'saas'
  },
  {
    title: 'Suscripciones',
    href: '/suscripciones',
    icon: <CreditCardIcon className="w-5 h-5" />,
    roles: ['admin_global'],
    section: 'saas'
  },
  {
    title: 'Planes y Beneficios',
    href: '/planes',
    icon: <Cog6ToothIcon className="w-5 h-5" />,
    roles: ['admin_global'],
    section: 'saas'
  },

  // Operaciones de salón (roles de empresa)
  {
    title: 'Mi Suscripción',
    href: '/suscripcion',
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'estilista', 'recepcionista', 'empleado'],
    section: 'main'
  },
  {
    title: 'Punto de Venta',
    href: '/ventas/nueva',
    icon: <CreditCardIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista', 'empleado'],
    section: 'main'
  },
  {
    title: 'Citas',
    href: '/citas',
    icon: <CalendarIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'estilista', 'recepcionista', 'empleado'],
    section: 'main'
  },
  {
    title: 'Gestión de Citas',
    href: '/citas/gestion',
    icon: <TableCellsIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'estilista', 'recepcionista', 'empleado'],
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
    roles: ['admin_empresa', 'recepcionista', 'empleado'],
    section: 'main'
  },
  {
    title: 'Servicios',
    href: '/servicios',
    icon: <DocumentTextIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista', 'empleado'],
    section: 'main'
  },
  {
    title: 'Proveedores',
    href: '/proveedores',
    icon: <TruckIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista', 'empleado'],
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
    href: '/usuarios',
    icon: <UsersIcon className="w-5 h-5" />,
    roles: ['admin_global', 'admin_empresa'],
    section: 'main'
  },

  // Finanzas
  {
    title: 'Caja',
    href: '/caja',
    icon: <CreditCardIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista'],
    section: 'main'
  },
  {
    title: 'Préstamos',
    href: '/prestamos',
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    roles: ['admin_empresa'],
    section: 'main'
  },
  {
    title: 'Nóminas',
    href: '/nominas',
    icon: <ChartBarIcon className="w-5 h-5" />,
    roles: ['admin_empresa'],
    section: 'main'
  },

  // Módulos Premium (restringidos por plan)
  {
    title: 'Inventario',
    href: '/inventario',
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'recepcionista', 'empleado'],
    section: 'main',
    requiresPermission: 'inventory'
  },
  {
    title: 'Comisiones',
    href: '/mis-comisiones',
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    roles: ['admin_empresa', 'estilista', 'recepcionista', 'empleado'],
    section: 'main',
    requiresPermission: 'commissions'
  },
  {
    title: 'Marketing',
    href: '/marketing',
    icon: <ChartBarIcon className="w-5 h-5" />,
    roles: ['admin_empresa'],
    section: 'main',
    requiresPermission: 'marketing'
  },

  // Mi Plataforma (admin_global y admin_empresa)
  {
    title: 'Configuración',
    href: '/configuracion',
    icon: <CogIcon className="w-5 h-5" />,
    roles: ['admin_global', 'admin_empresa'],
    section: 'platform'
  },
  {
    title: 'Staff Técnico',
    href: '/staff-tecnico',
    icon: <UserGroupIcon className="w-5 h-5" />,
    roles: ['admin_global'],
    section: 'platform'
  }
];

export function Sidebar({ userRole, empresaNombre, userName }: SidebarProps) {
  console.log('ROL ACTUAL EN SIDEBAR:', userRole);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useJWTAuth();
  const { loading, ...permissions } = usePlanPermissions();

  const handleLogout = async () => {
    try {
      console.log('Iniciando logout JWT...');
      await logout();
      console.log('Redirigiendo a login...');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error en logout:', error);
      window.location.href = '/login';
    }
  };

  const filteredItems = getSidebarItems(userRole).filter((item: SidebarItem) => item.roles.includes(userRole));

  // Agrupar items por sección para admin_global
  const groupedItems = userRole === 'admin_global' ? {
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
            
            // Verificar si el item requiere permiso y si el usuario tiene acceso
            let hasPermission = true;
            if (item.requiresPermission && !loading) {
              hasPermission = 
                item.requiresPermission === 'inventory' ? permissions.canUseInventory :
                item.requiresPermission === 'commissions' ? permissions.canUseCommissions :
                permissions.canUseMarketing;
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
              <h1 className="font-bold text-lg">BeautyPro</h1>
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
        {userRole === 'admin_global' ? (
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
