import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = params.id;
    
    // Debug: Verificar el ID que llega
    console.log('ID recibido en toggle-estado:', empresaId);
    console.log('Tipo de ID:', typeof empresaId);
    
    const { nuevoEstado } = await request.json();

    if (!['activo', 'suspendido'].includes(nuevoEstado)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser "activo" o "suspendido"' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Obtener estado anterior para el log
    const { data: empresaAnterior, error: errorAnterior } = await supabase
      .from('empresas')
      .select('estado, nombre')
      .eq('id', empresaId)
      .single();

    if (errorAnterior || !empresaAnterior) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar estado
    const { data: empresaActualizada, error } = await supabase
      .from('empresas')
      .update({ 
        estado: nuevoEstado
      })
      .eq('id', empresaId)
      .select('id, nombre, estado, plan_id, max_empleados');

    if (error) {
      console.error('Error actualizando estado de empresa:', error);
      return NextResponse.json(
        { error: 'Error actualizando estado de la empresa' },
        { status: 500 }
      );
    }

    if (!empresaActualizada || empresaActualizada.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró la empresa o no se pudo actualizar' },
        { status: 404 }
      );
    }

    const empresaActualizadaData = empresaActualizada[0];

    // Log temporal para debug
    console.log('Estado actualizado exitosamente:', empresaActualizadaData);

    return NextResponse.json({
      success: true,
      message: `Empresa ${nuevoEstado === 'activo' ? 'activada' : 'suspendida'} correctamente`,
      empresa: empresaActualizadaData
    });

  } catch (error) {
    console.error('Error en toggle-estado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
