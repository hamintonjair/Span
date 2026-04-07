import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comprobanteId = params.id;
    const body = await request.json();
    const { notas } = body;

    if (!comprobanteId) {
      return NextResponse.json(
        { error: 'ID de comprobante es requerido' },
        { status: 400 }
      );
    }

    if (!notas || !notas.trim()) {
      return NextResponse.json(
        { error: 'Las notas de rechazo son obligatorias' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Obtener el comprobante
    const { data: comprobante, error: fetchError } = await supabase
      .from('comprobantes')
      .select('*')
      .eq('id', comprobanteId)
      .single();

    if (fetchError || !comprobante) {
      console.error('Error obteniendo comprobante:', fetchError);
      return NextResponse.json(
        { error: 'Comprobante no encontrado' },
        { status: 404 }
      );
    }

    // Obtener información de la empresa por separado
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nombre, estado, fecha_vencimiento')
      .eq('id', comprobante.empresa_id)
      .single();

    if (empresaError) {
      console.error('Error obteniendo empresa:', empresaError);
      // Continuamos aunque no encontremos la empresa
    }

    // Actualizar comprobante como rechazado
    const { error: updateError } = await supabase
      .from('comprobantes')
      .update({ 
        estado: 'rechazado',
        verificado: false,
        notas: notas.trim(),
        actualizado_en: new Date().toISOString()
      })
      .eq('id', comprobanteId);

    if (updateError) {
      console.error('Error rechazando comprobante:', updateError);
      return NextResponse.json(
        { error: 'Error rechazando el comprobante' },
        { status: 500 }
      );
    }

    console.log(`✅ Comprobante ${comprobanteId} rechazado. Motivo: ${notas.trim()}`);

    // Registrar en logs de actividad
    const logData = {
      usuario_id: 'admin-global-temp',
      empresa_id: comprobante.empresa_id,
      accion: 'RECHAZAR_COMPROBANTE',
      modulo: 'COMPROBANTES',
      descripcion: `Comprobante rechazado para ${empresa?.nombre || 'Empresa'}`,
      detalles: JSON.stringify({
        comprobante_id: comprobanteId,
        motivo: notas.trim()
      }),
      ip_address: request.ip || 'unknown',
      fecha: new Date().toISOString()
    };

    try {
      await supabase.from('logs_actividad').insert(logData);
    } catch (logError) {
      console.log('Columnas adicionales no disponibles en logs_actividad');
    }

    return NextResponse.json({
      success: true,
      message: 'Comprobante rechazado exitosamente',
      comprobante: {
        ...comprobante,
        estado: 'rechazado',
        verificado: false,
        notas: notas.trim()
      },
      empresa: empresa
    });

  } catch (error) {
    console.error('Error en POST /api/comprobantes/[id]/rechazar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
