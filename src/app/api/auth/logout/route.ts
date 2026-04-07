import { NextRequest, NextResponse } from 'next/server';
import { clearJWTCookie } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
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
