import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    // Obtener parámetro de filtro de estado
    const { searchParams } = new URL(request.url);
    const estadoFiltro = searchParams.get('estado');
    
    let query = adminClient
      .from('contactos_pendientes')
      .select('*')
      .order('creado_en', { ascending: false });
    
    // Aplicar filtro si se proporciona
    if (estadoFiltro && estadoFiltro !== 'todos') {
      query = query.eq('estado', estadoFiltro);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error en API contactos-pendientes:', error);
      return NextResponse.json(
        { error: 'Error al cargar contactos pendientes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error general en API contactos-pendientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, estado } = body;
    
    // Normalizar estado a minúsculas sin tildes
    const estadoNormalizado = estado.toLowerCase().normalize('NFD').replace(/[\u0301\u0300]/g, '');

    if (!id || !estado) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: id, estado' },
        { status: 400 }
      );
    }

    if (!['pendiente', 'enviado', 'error', 'leido', 'atendido'].includes(estadoNormalizado)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    
    const updateData: any = {
      estado: estadoNormalizado,
      actualizado_en: new Date().toISOString()
    };

    if (estadoNormalizado === 'enviado') {
      updateData.enviado_en = new Date().toISOString();
      updateData.error_message = null;
    } else if (estadoNormalizado === 'leído') {
      updateData.leido_en = new Date().toISOString();
    } else if (estadoNormalizado === 'atendido') {
      updateData.atendido_en = new Date().toISOString();
    } else if (estadoNormalizado === 'error') {
      updateData.enviado_en = null;
    }

    const { data, error } = await adminClient
      .from('contactos_pendientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando contacto:', error);
      return NextResponse.json(
        { error: 'Error al actualizar contacto', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error general en PUT contactos-pendientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Falta el parámetro id' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    
    const { error } = await adminClient
      .from('contactos_pendientes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando contacto:', error);
      return NextResponse.json(
        { error: 'Error al eliminar contacto', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contacto eliminado correctamente'
    });

  } catch (error) {
    console.error('Error general en DELETE contactos-pendientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
