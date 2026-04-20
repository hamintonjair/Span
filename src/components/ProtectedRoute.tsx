'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import UpgradeRequired from '@/components/UpgradeRequired';

import { MODULES_CONFIG, getModuloConfig } from '@/lib/modulos-config';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string; // Ahora dinámico, no restringido a valores fijos
  moduleInfo: {
    name: string;
    icon: string;
    benefits: string[];
    requiredPlan?: string;
    upgradePrice?: number;
  };
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission, 
  moduleInfo 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { loading, ...permissions } = usePlanPermissions();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);



  useEffect(() => {
    if (!loading) {

      
      // ✅ NUEVA LÓGICA: Verificación dinámica de permisos
      // Buscar el módulo en la configuración
      const moduloConfig = getModuloConfig(requiredPermission);
      
      if (!moduloConfig) {
        console.error(`Módulo no encontrado: ${requiredPermission}`);
        setShowUpgrade(true);
        setPermissionsChecked(true);
        return;
      }

      // Verificar permiso usando la clave del módulo
      const permissionKey = moduloConfig.permissionKey; // Usar 'hasPrioritySupport'
      const hasPermission = (permissions as any)[permissionKey] || false;
     

      // Solo tomar decisiones cuando los permisos están completamente cargados
      const isDataFromBD = permissions.planName !== 'Cargando...' && !loading;
      
      if (!isDataFromBD) {
        setPermissionsChecked(false);
        return;
      }
      
      if (!hasPermission) {
        setShowUpgrade(true);
      } else {
        setShowUpgrade(false);
      }
      setPermissionsChecked(true);
    }
  }, [loading, requiredPermission, permissions]);



  // Solo mostrar upgrade si los permisos han sido verificados y no tiene acceso
  if (showUpgrade) {

    
    // Obtener configuración del módulo para pasarla al componente
    const currentModuleConfig = getModuloConfig(requiredPermission);
    const currentHasPermission = currentModuleConfig ? (permissions as any)[currentModuleConfig.permissionKey] || false : false;
    

    return (
      <UpgradeRequired
        moduleName={moduleInfo.name}
        moduleIcon={moduleInfo.icon}
        benefits={moduleInfo.benefits}
        currentPlan={permissions.planName}
        requiredPlan={moduleInfo.requiredPlan || 'profesional'}
        upgradePrice={moduleInfo.upgradePrice}
      />
    );
  }


  return <>{children}</>;
}
