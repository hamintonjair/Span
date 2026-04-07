import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const suscripcionId = params.id;
    const { monto, metodo, notas, fecha_pago } = await request.json();

    // Validaciones básicas
    if (!monto || monto <= 0) {
      return NextResponse.json(
        { error: 'El monto del pago es requerido y debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!fecha_pago) {
      return NextResponse.json(
        { error: 'La fecha de pago es requerida' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Obtener suscripción actual
    const { data: suscripcionActual, error: errorSuscripcion } = await supabase
      .from('suscripciones')
      .select(`
        id,
        empresa_id,
        plan_id,
        estado_pago,
        fecha_vencimiento,
        empresas!inner (
          nombre
        ),
        planes!inner (
          nombre,
          precio
        )
      `)
      .eq('id', suscripcionId)
      .single();

    if (errorSuscripcion || !suscripcionActual) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar suscripción
    const { data: suscripcionActualizada, error: updateError } = await supabase
      .from('suscripciones')
      .update({ 
        estado_pago: 'pagado',
        ultimo_pago: fecha_pago,
        metodo_pago: metodo,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', suscripcionId)
      .select(`
        id,
        empresa_id,
        plan_id,
        estado_pago,
        fecha_inicio,
        fecha_vencimiento,
        ultimo_pago,
        metodo_pago,
        actualizado_en
      `);

    if (updateError) {
      console.error('Error actualizando suscripción:', updateError);
      return NextResponse.json(
        { error: 'Error actualizando suscripción' },
        { status: 500 }
      );
    }

    if (!suscripcionActualizada || suscripcionActualizada.length === 0) {
      return NextResponse.json(
        { error: 'No se pudo actualizar la suscripción' },
        { status: 500 }
      );
    }

    // Calcular nueva fecha de vencimiento (30 días después del pago)
    const nuevaFechaVencimiento = new Date(fecha_pago);
    nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30);

    // Actualizar fecha de vencimiento
    const { error: vencimientoError } = await supabase
      .from('suscripciones')
      .update({ 
        fecha_vencimiento: nuevaFechaVencimiento.toISOString()
      })
      .eq('id', suscripcionId);

    if (vencimientoError) {
      console.error('Error actualizando fecha de vencimiento:', vencimientoError);
      // No fallamos la petición si solo falla la actualización de vencimiento
    }

    // Registrar en logs de actividad
    const { error: logError } = await supabase
      .from('logs_actividad')
      .insert({
        usuario_id: 'admin-global-temp', // TODO: Obtener del JWT
        empresa_id: suscripcionActual.empresa_id,
        accion: 'PAGO_MANUAL',
        modulo: 'SUSCRIPCIONES',
        descripcion: `Registro de pago manual para ${(suscripcionActual.empresas as any)?.nombre}`,
        datos_anteriores: { 
          estado_pago: suscripcionActual.estado_pago,
          ultimo_pago: (suscripcionActual as any).ultimo_pago || null
        },
        datos_nuevos: { 
          estado_pago: 'pagado',
          ultimo_pago: fecha_pago,
          monto,
          metodo,
          notas
        },
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      });

    if (logError) {
      console.error('Error registrando log:', logError);
      // No fallamos la petición si el log falla
    }

    return NextResponse.json({
      success: true,
      message: 'Pago registrado exitosamente',
      pago: {
        id: suscripcionId,
        monto,
        metodo,
        fecha_pago,
        notas,
        nueva_fecha_vencimiento: nuevaFechaVencimiento.toISOString()
      }
    });

  } catch (error) {
    console.error('Error en POST /api/suscripciones/[id]/registrar-pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
