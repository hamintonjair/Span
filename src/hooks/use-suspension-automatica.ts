'use client';

import { useEffect } from 'react';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { ejecutarSuspensionAutomaticaAction } from '@/app/actions/admin';

export const useSuspensionAutomatica = () => {
  const { user } = useJWTAuth();

  useEffect(() => {
    if (user?.rol !== 'admin_global') return;

    const verificarYSuspenderEmpresasVencidas = async () => {
      try {
        console.log('🔍 Hook Global - Iniciando verificación de empresas vencidas...');
        
        const result = await ejecutarSuspensionAutomaticaAction();

        if (result.success) {
          const empresasSuspendidas = result.data?.empresasSuspendidas || 0;
          
          if (empresasSuspendidas > 0) {
            console.log(`✅ Hook Global - ${empresasSuspendidas} empresas suspendidas automáticamente`);
            
            // Emitir evento personalizado para notificar a otros componentes
            window.dispatchEvent(new CustomEvent('empresasSuspendidasAutomaticamente', {
              detail: { 
                cantidad: empresasSuspendidas,
                fecha: new Date().toISOString(),
                empresas: result.data?.empresasProcesadas || []
              }
            }));
          } else {
            console.log('✅ Hook Global - No hay empresas vencidas para suspender');
          }
        } else {
          console.error('❌ Hook Global - Error en suspensión automática:', result.error);
        }
      } catch (error) {
        console.error('❌ Hook Global - Error en verificación de empresas vencidas:', error);
      }
    };

    // Ejecutar inmediatamente y luego cada hora (3600000 ms = 1 hora)
    verificarYSuspenderEmpresasVencidas();
    const intervalo = setInterval(verificarYSuspenderEmpresasVencidas, 3600000);

    return () => {
      clearInterval(intervalo);
    };
  }, [user?.rol]);

  return null;
};
