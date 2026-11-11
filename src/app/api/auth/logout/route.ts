import { NextRequest, NextResponse } from 'next/server';
import { clearJWTCookie } from '@/lib/jwt';
import { createAdminClient } from '@/lib/supabase/admin';
import { registrarLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Crear respuesta y limpiar cookie inmediatamente
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    });

    clearJWTCookie(response);

    // Registrar log de auditoría de forma asíncrona sin bloquear la respuesta al usuario
    try {
      const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        registrarLog(createAdminClient(), {
          empresa_id: undefined,
          usuario_id: undefined,
          accion: 'LOGOUT',
          modulo: 'AUTH',
          detalles: {
            logout_fecha: new Date().toISOString(),
            logout_ip: clientIp,
            logout_tipo: 'manual'
          },
          ip_address: clientIp
        }).catch((e) => console.error('Error no crítico registrando log de logout:', e));
      }
    } catch (e) {
      // Ignorar para no bloquear la salida del usuario
    }

    return response;

  } catch (error) {
    console.error('Error en logout:', error);
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    });
    clearJWTCookie(response);
    return response;
  }
}
