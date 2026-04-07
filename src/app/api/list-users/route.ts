import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Obtener todos los usuarios del sistema
    const { data: usuarios, error } = await supabase
      .from('usuarios_sistema')
      .select('id, email, nombre, rol, empresa_id')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener empresas para mostrar información
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id, nombre, estado, fecha_vencimiento');

    return NextResponse.json({
      success: true,
      usuarios: usuarios || [],
      empresas: empresas || []
    });

  } catch (error) {
    console.error('Error en list-users:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
