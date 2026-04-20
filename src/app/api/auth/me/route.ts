import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    console.log('Verificando token en /api/auth/me...');
    
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token encontrado:', !!token);

    if (!token) {
      console.log('No se encontró token en las cookies');
      return NextResponse.json(
        { error: 'No autorizado - no token found' },
        { status: 401 }
      );
    }

    console.log('Verificando token JWT...');
    // Verificar token
    const payload = await verifyJWT(token);

    if (!payload) {
      console.log('Token inválido o expirado');
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    console.log('Token válido, payload:', payload);

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
