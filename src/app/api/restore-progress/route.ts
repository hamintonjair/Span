import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const respaldoId = request.nextUrl.searchParams.get('respaldoId');
  const adminId = request.nextUrl.searchParams.get('adminId');

  if (!respaldoId || !adminId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  console.log('🔄 Iniciando restauración con SSE para respaldoId:', respaldoId);

  // Crear stream para Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const supabase = createAdminClient();
      let isCancelled = false;

      // Función para enviar eventos
      const sendEvent = (type: string, data: any) => {
        if (isCancelled) return;
        
        const event = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      try {

        // Enviar evento de inicio
        sendEvent('start', { 
          message: 'Iniciando restauración del sistema...',
          timestamp: new Date().toISOString()
        });

        // Obtener el respaldo
        const { data: respaldo, error: fetchError } = await supabase
          .from('respaldos_datos')
          .select('*')
          .eq('id', respaldoId)
          .single();

        if (fetchError || !respaldo) {
          sendEvent('error', { 
            message: 'No se encontró el respaldo especificado',
            error: fetchError?.message 
          });
          controller.close();
          return;
        }

        // Validar que sea un respaldo del sistema maestro
        if (respaldo.empresa_id !== null) {
          sendEvent('error', { 
            message: 'Solo se pueden restaurar respaldos del sistema maestro'
          });
          controller.close();
          return;
        }

        // Parsear datos
        let datos: any;
        if (typeof respaldo.datos === 'string') {
          try {
            datos = JSON.parse(respaldo.datos);
          } catch (parseError) {
            sendEvent('error', { 
              message: 'Error al leer los datos del respaldo',
              error: parseError instanceof Error ? parseError.message : 'Error de parseo'
            });
            controller.close();
            return;
          }
        } else {
          datos = respaldo.datos;
        }

        const backupData = datos.datos || datos;

        // Función para transformar datos
        const transformBackupData = (data: any): Record<string, any> => {
          const transformed: Record<string, any> = {};
          
          for (const [tableName, tableData] of Object.entries(data)) {
            if (tableData && typeof tableData === 'object' && 'registros' in tableData) {
              transformed[tableName] = tableData.registros;
            } else {
              transformed[tableName] = tableData;
            }
          }
          
          return transformed;
        };

        const transformedBackupData = transformBackupData(backupData);
        const totalTablas = Object.keys(transformedBackupData).length;
        let tablasProcesadas = 0;

        // Orden de restauración para evitar errores de llaves foráneas
        const ordenRestauracion = [
          'configuracion_global',
          'planes', 
          'empresas',
          'suscripciones',
          'comprobantes',
          'logs_actividad',
          'cajas',
          'citas',
          'ventas',
          'nominas',
          'clientes',
          'empleados',
          'prestamos',
          'productos',
          'servicios',
          'categorias',
          'comisiones',
          'proveedores',
          'cita_productos',
          'detalles_ventas',
          'pagos_prestamos',
          'movimientos_caja',
          'usuarios_sistema',
          'campanas_marketing',
          'movimientos_inventario',
          'cita_servicios_adicionales',
          'comunicacion',
          'articulos_ayuda',
          'tickets_soporte',
          'logs_auditoria',
          'mensajes_ticket',
          'respaldos_datos'
        ];

        sendEvent('progress', {
          processed: 0,
          total: totalTablas,
          currentTable: 'Preparando restauración...',
          percentage: 0,
          message: `Iniciando restauración de ${totalTablas} tablas...`
        });

        // Procesar cada tabla en orden
        for (const tableName of ordenRestauracion) {
          if (isCancelled) {
            sendEvent('cancelled', { message: 'Restauración cancelada por el usuario' });
            controller.close();
            return;
          }

          if (!transformedBackupData[tableName]) {
            continue; // Saltar tablas que no existen en el backup
          }

          tablasProcesadas++;
          const percentage = Math.round((tablasProcesadas / totalTablas) * 100);

          sendEvent('progress', {
            processed: tablasProcesadas,
            total: totalTablas,
            currentTable: tableName,
            percentage,
            message: `Restaurando tabla: ${tableName}`
          });

          try {
            const tableData = Array.isArray(transformedBackupData[tableName]) 
              ? transformedBackupData[tableName] 
              : [transformedBackupData[tableName]].filter(Boolean);

            if (tableData.length > 0) {
              const { error } = await supabase
                .from(tableName)
                .upsert(tableData, { onConflict: 'id' });

              if (error) {
                console.error(`❌ Error restaurando ${tableName}:`, error);
                sendEvent('warning', {
                  table: tableName,
                  error: error.message,
                  message: `Advertencia: Error en tabla ${tableName}`
                });
              } else {
                console.log(`✅ Tabla ${tableName}: ${tableData.length} registros restaurados`);
              }
            }
          } catch (error) {
            console.error(`❌ Error crítico en ${tableName}:`, error);
            sendEvent('error', {
              table: tableName,
              error: error instanceof Error ? error.message : 'Error desconocido',
              message: `Error crítico en tabla ${tableName}`
            });
          }

          // Pequeña pausa para no sobrecargar el servidor
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Enviar evento de completado
        sendEvent('complete', {
          message: 'Restauración completada exitosamente',
          totalTablas,
          timestamp: new Date().toISOString()
        });

        controller.close();

      } catch (error) {
        console.error('Error en restauración SSE:', error);
        sendEvent('error', {
          message: 'Error inesperado durante la restauración',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
