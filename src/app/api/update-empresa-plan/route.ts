import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { empresa_id, plan_id } = await request.json();

    if (!empresa_id || !plan_id) {
      return NextResponse.json(
        { error: 'empresa_id y plan_id son requeridos' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('empresas')
      .update({ 
        plan_id: plan_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', empresa_id);

    if (error) {
      console.error('Error actualizando plan:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el plan' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Plan actualizado exitosamente' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en API de actualización de plan:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
