import { NextRequest, NextResponse } from 'next/server';
import { clearJWTCookie } from '@/lib/jwt';
import { createAdminClient } from '@/lib/supabase/admin';
import { registrarLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Registrar log de auditoría para logout
    await registrarLog(createAdminClient(), {
      empresa_id: undefined, // Logout no está asociado a empresa específica
      usuario_id: undefined, // Usuario ya no está disponible después de logout
      accion: 'LOGOUT',
      modulo: 'AUTH',
      detalles: {
        logout_fecha: new Date().toISOString(),
        logout_ip: request.headers.get('x-forwarded-for') || 'unknown',
        logout_tipo: 'manual'
      }
    });

    // Crear respuesta y limpiar cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    });

    clearJWTCookie(response);

    return response;

  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
