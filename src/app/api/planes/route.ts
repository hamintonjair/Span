import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: planes, error } = await supabase
      .from('planes')
      .select('*')
      .order('precio', { ascending: true });

    if (error) {
      console.error('Error obteniendo planes:', error);
      return NextResponse.json(
        { error: 'Error obteniendo planes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      planes: planes || []
    });

  } catch (error) {
    console.error('Error en GET /api/planes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
