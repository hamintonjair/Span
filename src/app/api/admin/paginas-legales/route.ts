import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('paginas_legales')
      .select('*')
      .order('slug');

    if (error) {
      console.error('Error en API paginas-legales:', error);
      return NextResponse.json(
        { error: 'Error al cargar páginas legales', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error general en API paginas-legales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, titulo, contenido } = body;

    if (!slug || !titulo || !contenido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: slug, titulo, contenido' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('paginas_legales')
      .update({
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        actualizado_en: new Date().toISOString()
      })
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando página legal:', error);
      return NextResponse.json(
        { error: 'Error al actualizar página legal', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error general en PUT paginas-legales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
