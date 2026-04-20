'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';

interface Cita {
  id: string;
  empresa_id: string;
  fecha: string;
  estado: string;
}

export const useCancelacionAutomatica = () => {
  const { user } = useJWTAuth();

  useEffect(() => {
    if (!user?.empresa_id) return;

    const verificarYCancelarCitasPasadas = async () => {
      try {

        // Obtener fecha y hora actual (JavaScript ya maneja la zona horaria del navegador)
        const ahora = new Date();
        
        // Buscar citas pendientes
        const { data: citasPendientes, error: errorConsulta } = await (supabase as any)
          .from('citas')
          .select('id, fecha, estado')
          .eq('empresa_id', user.empresa_id)
          .eq('estado', 'pendiente');

        if (errorConsulta) {
          return;
        }

        if (!citasPendientes || citasPendientes.length === 0) {
          console.log('✅ No hay citas pendientes para verificar (Hook Global)');
          return;
        }


        // Filtrar citas que realmente están pasadas (más de 15 minutos de retraso)
        const citasPasadas = citasPendientes.filter((cita: Cita) => {
          // JavaScript entiende perfectamente el formato ISO con offset
          const fechaCita = new Date(cita.fecha);
          
          // Calcular el límite: fecha de la cita + 15 minutos
          const limite = new Date(fechaCita.getTime() + 15 * 60000);
          
          // Si la hora actual es mayor al límite, la cita está pasada
          const estaPasada = ahora > limite;
     
          
          
          return estaPasada;
        });

        if (citasPasadas.length === 0) {
          return;
        }


        // Formatear fecha y hora actual para notas
        const fechaActual = ahora.toLocaleString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        // Cancelar cada cita pasada
        for (const cita of citasPasadas) {
          const { error: errorUpdate } = await (supabase as any)
            .from('citas')
            .update({
              estado: 'cancelada',
              notas: `Anulada automáticamente por incumplimiento - ${fechaActual}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', cita.id);

          if (errorUpdate) {
            console.error(`Error cancelando cita ${cita.id} (Hook Global):`, errorUpdate);
          } else {
            console.log(`✅ Cita ${cita.id} cancelada automáticamente (Hook Global)`);
          }
        }

        // Emitir evento personalizado para notificar a otros componentes
        window.dispatchEvent(new CustomEvent('citasCanceladasAutomaticamente', {
          detail: { 
            cantidad: citasPasadas.length,
            fecha: fechaActual 
          }
        }));

      } catch (error) {
        console.error('Error en cancelación automática (Hook Global):', error);
      }
    };

    // Ejecutar inmediatamente y luego cada 30 segundos
    verificarYCancelarCitasPasadas();
    const intervalo = setInterval(verificarYCancelarCitasPasadas, 30000);

    return () => {
      clearInterval(intervalo);
    };
  }, [user?.empresa_id]);

  return null;
};
