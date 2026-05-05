import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { obtenerDatosTablaAction } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Configurar headers para Server-Sent Events
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Función para enviar eventos al cliente
  const sendEvent = (controller: ReadableStreamDefaultController, data: any) => {
    const event = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(event));
  };

  // Crear stream para SSE
  const stream = new ReadableStream({
    start(controller) {
      // Función asíncrona para procesar el respaldo
      const processBackup = async () => {
        try {
          const { searchParams } = new URL(request.url);
          const adminId = searchParams.get('adminId');

          if (!adminId) {
            sendEvent(controller, { 
              type: 'error', 
              message: 'ID de administrador requerido' 
            });
            controller.close();
            return;
          }

          // Cliente Admin con Service Role
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseServiceKey) {
            sendEvent(controller, { 
              type: 'error', 
              message: 'Faltan variables de entorno de Supabase' 
            });
            controller.close();
            return;
          }

          const supabaseAdmin = createAdminClient();

          // Lista de tablas a respaldar
          const tablas = [
            'configuracion_global', 'planes', 'empresas', 'suscripciones', 'comprobantes', 
            'logs_actividad', 'cajas', 'citas', 'ventas', 'nominas', 'clientes', 'empleados', 
            'prestamos', 'productos', 'servicios', 'categorias', 'comisiones', 'proveedores', 
            'cita_productos', 'detalles_ventas', 'pagos_prestamos', 'movimientos_caja', 
            'usuarios_sistema', 'campanas_marketing', 'movimientos_inventario', 
            'cita_servicios_adicionales', 'comunicacion', 'articulos_ayuda', 'tickets_soporte', 
            'logs_auditoria', 'mensajes_ticket', 'respaldos_datos'
          ];

          const totalTablas = tablas.length;
          let procesadas = 0;

          // Enviar evento de inicio
          sendEvent(controller, {
            type: 'start',
            message: 'Iniciando respaldo completo...',
            total: totalTablas,
            procesadas: 0
          });

          // Objeto para almacenar datos del respaldo
          const backupData: any = {
            metadata: {
              fecha_respaldo: new Date().toISOString(),
              version: '1.0',
              tipo: 'Base de Datos Completa',
              total_tablas: totalTablas,
              creado_por: adminId
            },
            datos: {}
          };

          // Procesar cada tabla
          for (const nombreTabla of tablas) {
            try {
              // Notificar progreso actual
              sendEvent(controller, {
                type: 'progress',
                message: `Respaldando tabla: ${nombreTabla}`,
                tablaActual: nombreTabla,
                procesadas: procesadas + 1,
                total: totalTablas,
                porcentaje: Math.round(((procesadas + 1) / totalTablas) * 100)
              });

              console.log(`🟢 [SSE] Procesando tabla: ${nombreTabla} (${procesadas + 1}/${totalTablas})`);

              // Obtener datos de la tabla
              const result = await obtenerDatosTablaAction(nombreTabla);
              
              // Obtener estructura de columnas
              let columnas: any[] = [];
              try {
                const { data: columnasData, error: rpcError } = await supabaseAdmin.rpc('get_table_columns', { 
                  t_name: nombreTabla 
                });
                
                if (!rpcError && columnasData) {
                  columnas = columnasData;
                }
              } catch (rpcError) {
                console.warn(`⚠️ Error RPC columnas ${nombreTabla}:`, rpcError);
              }
              
              // Guardar datos de la tabla
              const tablaData = {
                columnas: columnas.map((c: any) => c.column_name),
                registros: result.success ? (result.data || []) : []
              };
              
              backupData.datos[nombreTabla] = tablaData;
              
              const registroCount = result.success ? (result.data?.length || 0) : 0;
              
              console.log(`✅ [SSE] ${nombreTabla}: ${registroCount} registros`);

              // Pequeña pausa para no sobrecargar
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
              console.error(`❌ [SSE] Error en tabla ${nombreTabla}:`, error);
              backupData.datos[nombreTabla] = {
                columnas: [],
                registros: [],
                error: error instanceof Error ? error.message : 'Error desconocido'
              };
            }

            procesadas++;
          }

          // Generar nombre de archivo
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0');
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const year = now.getFullYear();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const nombreArchivo = `BACKUP_TOTAL_SISTEMA_MAESTRO_${day}${month}${year}_${hours}${minutes}.json`;

          // Notificar que está subiendo a Storage
          sendEvent(controller, {
            type: 'uploading',
            message: 'Subiendo archivo a Storage...',
            tablaActual: 'Subiendo archivo al Storage...',
            procesadas: totalTablas,
            total: totalTablas,
            porcentaje: 100
          });

          // Convertir a JSON y subir a Storage
          const jsonString = JSON.stringify(backupData, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });

          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('respaldos')
            .upload(nombreArchivo, blob, {
              contentType: 'application/json',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Error al subir archivo: ${uploadError.message}`);
          }

          // Guardar registro en base de datos
          const { data: insertData, error: insertError } = await supabaseAdmin
            .from('respaldos_datos')
            .insert({
              empresa_id: null,
              nombre_archivo: nombreArchivo,
              datos: backupData,
              tipo_respaldo: 'Sistema Maestro TOTAL',
              created_at: now.toISOString()
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(`Error al guardar registro: ${insertError.message}`);
          }

          // Enviar evento de completado
          sendEvent(controller, {
            type: 'complete',
            message: 'Respaldo completado exitosamente',
            tablaActual: 'Completado',
            procesadas: totalTablas,
            total: totalTablas,
            porcentaje: 100,
            nombreArchivo,
            backupId: insertData.id
          });

          console.log('✅ [SSE] Respaldo completado exitosamente');

        } catch (error) {
          console.error('❌ [SSE] Error en proceso de respaldo:', error);
          sendEvent(controller, {
            type: 'error',
            message: error instanceof Error ? error.message : 'Error desconocido',
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        } finally {
          controller.close();
        }
      };

      // Iniciar proceso asíncrono
      processBackup();
    }
  });

  return new Response(stream, { headers });
}
