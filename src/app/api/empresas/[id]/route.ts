import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = params.id;
    
    // Debug: Verificar el ID que llega
    console.log('ID recibido:', empresaId);
    console.log('Tipo de ID:', typeof empresaId);
    
    const { nombre, plan_id, limite_empleados } = await request.json();

    // Validaciones básicas
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la empresa es requerido' },
        { status: 400 }
      );
    }

    if (!plan_id) {
      return NextResponse.json(
        { error: 'El plan es requerido' },
        { status: 400 }
      );
    }

    if (!limite_empleados || limite_empleados < 1) {
      return NextResponse.json(
        { error: 'El límite de empleados debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar que la empresa existe
    const { data: empresaExistente, error: errorExistente } = await supabase
      .from('empresas')
      .select('id, nombre, plan_id, limite_empleados')
      .eq('id', empresaId)
      .single();

    if (errorExistente || !empresaExistente) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el plan existe
    const { data: plan, error: planError } = await supabase
      .from('planes')
      .select('id, nombre, precio')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar empresa
    const { data: empresaActualizada, error } = await supabase
      .from('empresas')
      .update({ 
        nombre: nombre.trim(),
        plan_id,
        limite_empleados,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', empresaId)
      .select('id, nombre, estado, plan_id, limite_empleados, actualizado_en');

    if (error) {
      console.error('Error actualizando empresa:', error);
      return NextResponse.json(
        { error: 'Error actualizando la empresa' },
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
      accion: 'ACTUALIZACION',
      modulo: 'EMPRESAS',
      descripcion: `Actualización de empresa: ${empresaActualizadaData.nombre}`
    };

    // Intentar agregar datos_anteriores y datos_nuevos si las columnas existen
    try {
      logData.datos_anteriores = { 
        nombre: empresaExistente.nombre,
        plan_id: empresaExistente.plan_id,
        limite_empleados: empresaExistente.limite_empleados
      };
      logData.datos_nuevos = { 
        nombre, 
        plan_id, 
        limite_empleados 
      };
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
      message: 'Empresa actualizada correctamente',
      empresa: {
        ...empresaActualizadaData,
        plan_nombre: plan.nombre,
        plan_precio: plan.precio
      }
    });

  } catch (error) {
    console.error('Error en PUT /api/empresas/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = params.id;
    const supabase = createAdminClient();

    const { data: empresa, error } = await supabase
      .from('empresas')
      .select(`
        id,
        nombre,
        estado,
        plan_id,
        limite_empleados,
        creado_en,
        actualizado_en,
        fecha_vencimiento,
        planes!inner (
          id,
          nombre,
          precio,
          limite_usuarios,
          limite_sucursales
        )
      `)
      .eq('id', empresaId);

    if (error) {
      console.error('Error obteniendo empresa:', error);
      return NextResponse.json(
        { error: 'Error obteniendo la empresa' },
        { status: 500 }
      );
    }

    if (!empresa || empresa.length === 0) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Formatear respuesta
    const empresaData = empresa[0];
    const empresaFormateada = {
      id: empresaData.id,
      nombre: empresaData.nombre,
      estado: empresaData.estado,
      plan_id: empresaData.plan_id,
      limite_empleados: empresaData.limite_empleados,
      creado_en: empresaData.creado_en,
      actualizado_en: empresaData.actualizado_en,
      fecha_vencimiento: empresaData.fecha_vencimiento,
      plan_nombre: (empresaData.planes as any)?.nombre,
      plan_precio: (empresaData.planes as any)?.precio,
      plan_limite_usuarios: (empresaData.planes as any)?.limite_usuarios,
      plan_limite_sucursales: (empresaData.planes as any)?.limite_sucursales
    };

    return NextResponse.json({
      success: true,
      empresa: empresaFormateada
    });

  } catch (error) {
    console.error('Error en GET /api/empresas/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
