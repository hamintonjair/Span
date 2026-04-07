'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import UpgradeRequired from '@/components/UpgradeRequired';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: 'inventory' | 'commissions' | 'marketing';
  moduleInfo: {
    name: string;
    icon: string;
    benefits: string[];
    requiredPlan: string;
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

  useEffect(() => {
    if (!loading) {
      const hasPermission = 
        requiredPermission === 'inventory' ? permissions.canUseInventory :
        requiredPermission === 'commissions' ? permissions.canUseCommissions :
        permissions.canUseMarketing;

      if (!hasPermission) {
        setShowUpgrade(true);
      }
    }
  }, [loading, requiredPermission, permissions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (showUpgrade) {
    return (
      <UpgradeRequired
        moduleName={moduleInfo.name}
        moduleIcon={moduleInfo.icon}
        benefits={moduleInfo.benefits}
        currentPlan={permissions.planName}
        requiredPlan={moduleInfo.requiredPlan}
        upgradePrice={moduleInfo.upgradePrice}
      />
    );
  }

  return <>{children}</>;
}
