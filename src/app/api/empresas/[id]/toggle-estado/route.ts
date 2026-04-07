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
        estado: nuevoEstado,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', empresaId)
      .select('id, nombre, estado, plan_id, limite_empleados');

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

    // Registrar en logs de actividad (solo columnas que existen)
    const logData: any = {
      // usuario_id: 'admin-global-temp', // Comentado hasta tener JWT real
      empresa_id: empresaId,
      accion: 'CAMBIO_ESTADO',
      modulo: 'EMPRESAS',
      descripcion: `Cambio de estado de "${empresaAnterior.nombre}" de "${empresaAnterior.estado}" a "${nuevoEstado}"`
    };

    // Intentar agregar datos_anteriores y datos_nuevos si las columnas existen
    try {
      logData.datos_anteriores = { estado: empresaAnterior.estado };
      logData.datos_nuevos = { estado: nuevoEstado };
    } catch (e) {
      // Si las columnas no existen, continuamos sin ellas
      console.log('Columnas datos_anteriores/datos_nuevos no disponibles en logs_actividad, continuando sin ellas');
    }

    // Intentar agregar ip_address y user_agent si existen
    try {
      logData.ip_address = request.ip || 'unknown';
      logData.user_agent = request.headers.get('user-agent') || 'unknown';
    } catch (e) {
      // Si las columnas no existen, continuamos sin ellas
      console.log('Columnas ip_address/user_agent no disponibles en logs_actividad, continuando sin ellas');
    }

    const { error: logError } = await supabase
      .from('logs_actividad')
      .insert(logData);

    if (logError) {
      console.error('Error registrando log:', logError);
      // No fallamos la petición si el log falla
    }

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
