import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Crear cliente para verificar el usuario usando cookies
    const cookieStore = cookies();
    const supabase = createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    console.log('Session data:', session);
    console.log('Auth error:', authError);

    if (authError || !session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado o sesión no encontrada' },
        { status: 401 }
      );
    }

    // Obtener empresa_id del usuario
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', session.user.id)
      .single();

    console.log('Usuario auth_id:', session.user.id);
    console.log('UserData:', userData);
    console.log('UserError:', userError);

    if (userError || !userData || !(userData as any).empresa_id) {
      console.error('Usuario no tiene empresa asociada:', userError);
      return NextResponse.json(
        { error: 'Usuario no tiene empresa asociada' },
        { status: 404 }
      );
    }

    const empresaId = (userData as any).empresa_id;
    console.log('Empresa ID encontrada:', empresaId);

    // Obtener parámetros de paginación
    const { searchParams } = new URL(request.url);
    const limit = 5; // Fixed limit of 5 as requested
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log(`Parámetros de paginación - limit: ${limit}, offset: ${offset}`);

    // Usar admin client para obtener comprobantes con paginación
    const adminSupabase = createAdminClient();
    
    // Primero obtener el total
    const { count: totalCount, error: countError } = await adminSupabase
      .from('comprobantes')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    if (countError) {
      console.error('Error obteniendo total de comprobantes:', countError);
      return NextResponse.json(
        { error: 'Error obteniendo total de comprobantes' },
        { status: 500 }
      );
    }
    
    // Obtener los comprobantes paginados
    console.log(`Buscando comprobantes para empresa_id: ${empresaId}, limit: ${limit}, offset: ${offset}`);
    console.log(`Range: from ${offset} to ${offset + limit - 1}`);
    
    const { data: comprobantes, error: comprobantesError } = await adminSupabase
      .from('comprobantes')
      .select(`
        id,
        nombre_archivo,
        url_archivo,
        tipo_archivo,
        tamano_bytes,
        estado,
        verificado,
        notas,
        fecha_envio,
        fecha_verificacion,
        verificado_por,
        creado_en,
        actualizado_en
      `)
      .eq('empresa_id', empresaId)
      .order('fecha_envio', { ascending: false })
      .range(offset, offset + limit - 1);

    if (comprobantesError) {
      console.error('Error obteniendo comprobantes:', comprobantesError);
      return NextResponse.json(
        { error: 'Error obteniendo comprobantes' },
        { status: 500 }
      );
    }

    console.log(`Comprobantes encontrados: ${comprobantes?.length || 0}`, comprobantes);

    // Registrar log de consulta de historial
    const logData = {
      usuario_id: session.user.id,
      empresa_id: empresaId,
      accion: 'CONSULTAR_HISTORIAL_COMPROBANTES',
      modulo: 'COMPROBANTES',
      descripcion: `Consulta de historial de comprobantes - Total: ${totalCount || 0}`,
      detalles: JSON.stringify({
        limit,
        offset,
        total_encontrados: totalCount || 0,
        resultados_pagina: comprobantes?.length || 0
      })
    };

    console.log('Insertando log de consulta:', logData);

    const { error: logError } = await adminSupabase
      .from('logs_actividad')
      .insert(logData);

    if (logError) {
      console.error('Error registrando log de consulta:', logError);
      // No fallamos la petición si el log falla
    } else {
      console.log('Log de consulta registrado exitosamente');
    }

    return NextResponse.json({
      success: true,
      data: comprobantes || [], // Changed from 'comprobantes' to 'data' as requested
      total: totalCount || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (totalCount || 0)
    });

  } catch (error) {
    console.error('Error en GET /api/comprobantes/mis-comprobantes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
