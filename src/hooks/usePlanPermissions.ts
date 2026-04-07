'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';

export interface PlanPermissions {
  canUseInventory: boolean;
  canUseCommissions: boolean;
  canUseMarketing: boolean;
  hasPrioritySupport: boolean;
  planName: string;
  planPrice: number;
  loading: boolean;
}

export const usePlanPermissions = (): PlanPermissions => {
  const { user } = useJWTAuth();
  const [permissions, setPermissions] = useState<PlanPermissions>({
    canUseInventory: false,
    canUseCommissions: false,
    canUseMarketing: false,
    hasPrioritySupport: false,
    planName: 'Básico',
    planPrice: 29.99,
    loading: true
  });

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.empresa_id) {
        setPermissions(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('empresas')
          .select(`
            *,
            planes (*)
          `)
          .eq('id', user.empresa_id)
          .single();

        if (error || !data) {
          console.error('Error cargando permisos del plan:', error);
          setPermissions(prev => ({ ...prev, loading: false }));
          return;
        }

        const empresaData = data as any;
        const planData = empresaData.planes || {};

        // Determinar permisos según el plan
        const planNombre = planData?.nombre || empresaData.plan_nombre || 'Básico';
        const planPrecio = planData?.precio || empresaData.plan_precio || 29.99;

        // Lógica de permisos según el plan
        let canUseInventory = false;
        let canUseCommissions = false;
        let canUseMarketing = false;
        let hasPrioritySupport = false;

        // Plan Básico ($29.99): Solo Agenda y Ventas
        if (planPrecio >= 29.99) {
          canUseInventory = false;
          canUseCommissions = false;
          canUseMarketing = false;
          hasPrioritySupport = false;
        }

        // Plan Profesional ($79.99): + Inventario y Comisiones
        if (planPrecio >= 79.99) {
          canUseInventory = true;
          canUseCommissions = true;
          canUseMarketing = false;
          hasPrioritySupport = false;
        }

        // Plan Premium ($149.99): + Marketing y Soporte Prioritario
        if (planPrecio >= 149.99) {
          canUseInventory = true;
          canUseCommissions = true;
          canUseMarketing = true;
          hasPrioritySupport = true;
        }

        setPermissions({
          canUseInventory,
          canUseCommissions,
          canUseMarketing,
          hasPrioritySupport,
          planName: planNombre,
          planPrice: planPrecio,
          loading: false
        });

      } catch (error) {
        console.error('Error en usePlanPermissions:', error);
        setPermissions(prev => ({ ...prev, loading: false }));
      }
    };

    loadPermissions();
  }, [user?.empresa_id]);

  return permissions;
};
