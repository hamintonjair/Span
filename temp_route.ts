import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comprobanteId = params.id;
    const supabase = createClient();

    // Obtener datos del comprobante
    const { data: comprobanteData, error: comprobanteError } = await supabase
      .from('comprobantes')
      .select('*')
      .eq('id', comprobanteId)
      .single();

    if (comprobanteError || !comprobanteData) {
      return NextResponse.json(
        { error: 'Comprobante no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar comprobante como aprobado
    const { error: updateComprobanteError } = await supabase
      .from('comprobantes')
      .update({
        estado: 'aprobado',
        verificado: true,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', comprobanteId);

    if (updateComprobanteError) {
      console.error('Error actualizando comprobante:', updateComprobanteError);
      return NextResponse.json(
        { error: 'Error aprobando comprobante' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comprobante aprobado exitosamente',
      comprobante: {
        id: comprobanteId,
        estado: 'aprobado',
        verificado: true
      }
    });

  } catch (error) {
    console.error('Error en POST /api/comprobantes/[id]/aprobar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
