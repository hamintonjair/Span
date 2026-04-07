import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    
    const supabase = createAdminClient();
    console.log('🔍 BACKEND DEBUG: Cliente admin creado con SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    const comprobanteId = params.id?.trim(); // ✅ Limpiar ID
    
    console.log('🔍 BACKEND DEBUG: Comprobante ID a buscar:', comprobanteId);

    // VERIFICACIÓN DIRECTA: Buscar si el comprobante existe
    console.log('🔍 BACKEND DEBUG: Verificación directa - buscando comprobante...');
    const { data: verificacionDirecta, error: verificacionError } = await supabase
      .from('comprobantes')
      .select('id, empresa_id, plan_id, estado')
      .eq('id', comprobanteId)
      .single();

    console.log('🔍 BACKEND DEBUG: Verificación directa:', {
      comprobanteId,
      encontrado: !!verificacionDirecta,
      datos: verificacionDirecta,
      error: verificacionError?.message
    });

    if (verificacionError || !verificacionDirecta) {
      console.error('❌ BACKEND ERROR: Comprobante no encontrado en verificación directa');
      return NextResponse.json({ 
        error: 'Comprobante no encontrado',
        debug: {
          id_buscado: comprobanteId,
          verificacion_error: verificacionError?.message,
          encontrado: !!verificacionDirecta
        }
      }, { status: 404 });
    }

    const body = await request.json();
    const { action = 'aprobar', notas } = body;

    console.log('🔍 BACKEND DEBUG: Action recibido:', action);

    const { data: comprobanteData, error: fetchError } = await supabase
      .from('comprobantes')
      .select(`
        *,
        planes (
          id,
          nombre,
          precio,
          descripcion,
          limite_usuarios,
          limite_sucursales,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          soporte_prioritario
        )
      `)
      .eq('id', comprobanteId)
      .single();

    console.log('🔍 BACKEND DEBUG: Comprobante encontrado:', {
      id: comprobanteData?.id,
      empresa_id: comprobanteData?.empresa_id,
      plan_id: comprobanteData?.plan_id,
      existe: !!comprobanteData,
      fetchError: fetchError?.message
    });

    if (fetchError || !comprobanteData) {
      console.error('❌ BACKEND ERROR: Comprobante no encontrado en tabla comprobantes');
      
      // Verificación adicional: buscar en tabla empresas por si acaso
      console.log('🔍 BACKEND DEBUG: Buscando comprobante en empresas...');
      const { data: empresaConComprobante, error: empresaError } = await supabase
        .from('empresas')
        .select('id, plan_id, plan_nombre')
        .eq('plan_id', comprobanteId)
        .single();
        
      if (empresaConComprobante) {
        console.log('🔍 BACKEND DEBUG: Comprobante encontrado en empresas:', empresaConComprobante);
        return NextResponse.json({ 
          error: 'Comprobante ya fue procesado anteriormente',
          details: 'Este plan ya está asignado a una empresa',
          empresa_info: empresaConComprobante
        }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    console.log('🔍 DEBUG: Comprobante recuperado:', {
      comprobante_id: comprobanteData.id,
      empresa_id: comprobanteData.empresa_id,
      plan_id: comprobanteData.plan_id,
      plan_nombre: comprobanteData.planes?.nombre,
      plan_precio: comprobanteData.planes?.precio,
      plan_descripcion: comprobanteData.planes?.descripcion,
      limite_usuario: comprobanteData.planes?.limite_usuario,
      limite_sucursal: comprobanteData.planes?.limite_sucursal,
      beneficios: {
        tiene_inventario: comprobanteData.planes?.tiene_inventario,
        tiene_comisiones: comprobanteData.planes?.tiene_comisiones,
        tiene_marketing: comprobanteData.planes?.tiene_marketing,
        soporte_prioritario: comprobanteData.planes?.soporte_prioritario
      }
    });

    if (action === 'rechazar') {
      const { data: updatedComprobante, error: updateError } = await supabase
        .from('comprobantes')
        .update({ 
          estado: 'rechazado',
          verificado: false,
          notas: (notas && notas.trim()) ? notas.trim() : null, // ✅ Guardar nota solo si contiene texto
          actualizado_en: new Date().toISOString()
        })
        .eq('id', comprobanteId);

      if (updateError) {
        return NextResponse.json({ error: 'Error rechazando comprobante' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Comprobante rechazado exitosamente'
      });
    }

    // APROBAR COMPROBANTE - TRANSACCIÓN SIMPLIFICADA
    console.log('🔍 DEBUG: Iniciando aprobación del comprobante:', comprobanteId);
    console.log('🔍 DEBUG: Datos del comprobante:', {
      empresa_id: comprobanteData.empresa_id,
      plan_id: comprobanteData.plan_id,
      estado_actual: comprobanteData.estado
    });

    // 1. Actualizar estado del comprobante
    const { data: updatedComprobante, error: updateComprobanteError } = await supabase
      .from('comprobantes')
      .update({ 
        estado: 'aprobado',
        verificado: true,
        fecha_verificacion: new Date().toISOString(),
        notas: (notas && notas.trim()) ? notas.trim() : null, // ✅ Guardar nota solo si contiene texto
        actualizado_en: new Date().toISOString()
      })
      .eq('id', comprobanteId)
      .select()
      .single();

    if (updateComprobanteError) {
      console.error('❌ BACKEND ERROR: Error actualizando comprobante:', updateComprobanteError);
      return NextResponse.json({ error: 'Error actualizando comprobante', details: updateComprobanteError.message }, { status: 500 });
    }

    console.log('✅ BACKEND: Comprobante actualizado correctamente');

    // 3. SINCRONIZACIÓN DE TABLAS - Actualizar empresa con el plan del comprobante
    console.log('🔍 BACKEND DEBUG: Sincronizando empresa con plan del comprobante...');
    
    // ✅ CORRECCIÓN: Obtener plan_id y estado desde la empresa actual, no desde el comprobante
    const { data: empresaActual, error: fetchEmpresaError } = await supabase
      .from('empresas')
      .select('plan_id, estado')
      .eq('id', comprobanteData.empresa_id)
      .single();
      
    if (fetchEmpresaError) {
      console.error('❌ BACKEND ERROR: Error obteniendo plan_id de la empresa:', fetchEmpresaError);
      return NextResponse.json({ 
        error: 'Error obteniendo información de la empresa',
        details: fetchEmpresaError.message
      }, { status: 500 });
    }
    
    // Calcular nueva fecha de vencimiento (30 días desde hoy)
    const nuevaFechaVencimiento = new Date();
    nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30);
    
    console.log('🔍 BACKEND DEBUG: Datos para actualizar empresa:', {
      empresa_id: comprobanteData.empresa_id,
      plan_id_actual: empresaActual?.plan_id,
      plan_id_del_comprobante: comprobanteData.plan_id,
      plan_id_a_usar: empresaActual?.plan_id, // ✅ Usar el plan_id actual de la empresa
      estado_anterior: empresaActual?.estado || 'desconocido',
      nuevo_estado: 'activo', // ✅ Siempre activar al aprobar pago (minúsculas)
      nueva_fecha_vencimiento: nuevaFechaVencimiento.toISOString()
    });

    console.log('🔍 BACKEND DEBUG: Nueva fecha de vencimiento calculada:', {
      fecha_actual: new Date().toISOString(),
      fecha_vencimiento: nuevaFechaVencimiento.toISOString(),
      dias_sumados: 30
    });

    const { error: updateEmpresaError } = await supabase
      .from('empresas')
      .update({
        plan_id: empresaActual?.plan_id, // ✅ Mantener el plan_id actual de la empresa
        estado: 'activo', // ✅ CAMBIAR ESTADO: de suspendido a activo (minúsculas)
        fecha_vencimiento: nuevaFechaVencimiento.toISOString(), // ✅ Actualizar fecha de vencimiento
        actualizado_en: new Date().toISOString()
      })
      .eq('id', comprobanteData.empresa_id);

    if (updateEmpresaError) {
      console.error('❌ BACKEND ERROR: Error actualizando empresa:', updateEmpresaError);
      return NextResponse.json({ 
        error: 'Error actualizando empresa',
        details: updateEmpresaError.message,
        debug: {
          empresa_id: comprobanteData.empresa_id,
          plan_id: comprobanteData.plan_id,
          plan_nombre: comprobanteData.planes?.nombre,
          error_code: updateEmpresaError.code
        }
      }, { status: 500 });
    }

    console.log('✅ BACKEND: Empresa sincronizada correctamente');
    console.log('🔍 BACKEND DEBUG: Empresa actualizada con:', {
      empresa_id: comprobanteData.empresa_id,
      plan_id_mantenido: empresaActual?.plan_id,
      nuevo_estado_suscripcion: 'activa'
    });

    // 3. GESTIÓN DE SUSCRIPCIÓN (simplificada)
    const proximoVencimiento = new Date();
    proximoVencimiento.setDate(proximoVencimiento.getDate() + 30);

    // Obtener suscripción actual
    const { data: suscripcionActual, error: fetchSuscripcionError } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('empresa_id', comprobanteData.empresa_id)
      .single();

    if (fetchSuscripcionError && fetchSuscripcionError.code !== 'PGRST116') {
      console.error('❌ ERROR obteniendo suscripción actual:', fetchSuscripcionError);
    }

    // Insertar nueva suscripción
    const { data: nuevaSuscripcion, error: insertSuscripcionError } = await supabase
      .from('suscripciones')
      .insert({
        empresa_id: comprobanteData.empresa_id,
        plan_id: empresaActual?.plan_id, // ✅ Usar plan_id de la empresa, no del comprobante
        monto: comprobanteData.monto,
        estado: 'activo',
        metodo_pago: 'transferencia',
        estado_pago: 'pagado',
        verificado: true,
        comprobante_url: comprobanteData.url_archivo,
        comprobante_id: comprobanteData.id,
        proximo_vencimiento: proximoVencimiento.toISOString(),
        actualizado_en: new Date().toISOString(),
        creado_en: new Date().toISOString()
      })
      .select()
      .single();

    if (insertSuscripcionError) {
      console.error('❌ ERROR insertando nueva suscripción:', insertSuscripcionError);
      // No retornar error porque el comprobante y empresa ya están actualizados
    } else {
      console.log('✅ Nueva suscripción creada correctamente');
      
      // Eliminar suscripción anterior si existe
      if (suscripcionActual) {
        const { error: deleteSuscripcionError } = await supabase
          .from('suscripciones')
          .delete()
          .eq('id', suscripcionActual.id);

        if (deleteSuscripcionError) {
          console.error('❌ ERROR eliminando suscripción anterior:', deleteSuscripcionError);
        } else {
          console.log('✅ Suscripción anterior eliminada correctamente');
        }
      }
    }

    console.log('✅ Proceso de aprobación completado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Cambio de plan aprobado y suscripción reemplazada correctamente',
      data: {
        comprobante: updatedComprobante,
        plan: comprobanteData.planes,
        nueva_suscripcion: nuevaSuscripcion,
        suscripcion_anterior_eliminada: !!suscripcionActual,
        proximo_vencimiento: proximoVencimiento.toISOString()
      }
    });

  } catch (error) {
    console.error('Error en POST /api/comprobantes/[id]/aprobar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}