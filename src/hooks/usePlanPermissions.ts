'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';

export interface PlanPermissions {
  canUseInventory: boolean;
  canUseCommissions: boolean;
  canUseMarketing: boolean;
  canUseNominas: boolean;
  canUseAnalytics: boolean;
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
    canUseNominas: false,
    canUseAnalytics: false,
    hasPrioritySupport: false,
    planName: 'Cargando...',
    planPrice: 0,
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

        // Obtener información del plan (dinámico desde BD)
        const planNombre = planData?.nombre || empresaData.plan_nombre || 'Cargando...';
        const planPrecio = planData?.precio || empresaData.plan_precio || 0;

        // DEBUG: Log para depurar permisos
        console.log('DEBUG - Plan Data:', {
          planNombre,
          planPrecio,
          soporte_prioritario: planData?.soporte_prioritario,
          tiene_inventario: planData?.tiene_inventario,
          tiene_comisiones: planData?.tiene_comisiones,
          tiene_marketing: planData?.tiene_marketing,
          tiene_analytics: planData?.tiene_analytics
        });

        // Usar campos booleanos directamente de la BD
        // Esto hace el sistema completamente dinámico e independiente de precios
        const permissions = {
          canUseInventory: planData?.tiene_inventario || false,
          canUseCommissions: planData?.tiene_comisiones || false,
          canUseMarketing: planData?.tiene_marketing || false,
          canUseNominas: planData?.tiene_nominas || false,
          canUseAnalytics: planData?.tiene_analytics || false,
          hasPrioritySupport: planData?.soporte_prioritario || false,
          planName: planNombre,
          planPrice: planPrecio,
          loading: false
        };

        console.log('DEBUG - Permisos finales:', permissions);
        setPermissions(permissions);

      } catch (error) {
        console.error('Error en usePlanPermissions:', error);
        setPermissions(prev => ({ ...prev, loading: false }));
      }
    };

    loadPermissions();
  }, [user?.empresa_id]);

  return permissions;
};
