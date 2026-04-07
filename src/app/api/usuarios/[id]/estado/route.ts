import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { activo } = await request.json();
    
    if (typeof activo !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo activo debe ser un booleano' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Actualizar estado del usuario - simple y directo
    const { error } = await supabase
      .from('usuarios_sistema')
      .update({ 
        activo: activo
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error actualizando usuario:', error);
      return NextResponse.json(
        { error: 'No se pudo actualizar el estado del usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
