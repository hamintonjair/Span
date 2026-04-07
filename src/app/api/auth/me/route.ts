import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Devolver información del usuario
    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        email: payload.email,
        nombre: payload.nombre,
        rol: payload.rol,
        empresa_id: payload.empresa_id
      }
    });

  } catch (error) {
    console.error('Error verificando token:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
