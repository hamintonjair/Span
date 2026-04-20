import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production');

export interface JWTPayload {
  userId: string;
  email: string;
  rol: string;
  empresa_id: string | null;
  nombre: string;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  try {
    const token = await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      rol: payload.rol,
      empresa_id: payload.empresa_id,
      nombre: payload.nombre
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
      .sign(JWT_SECRET);
    
    return token;
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw new Error('Failed to sign JWT');
  }
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    console.log('Verificando JWT con secret length:', JWT_SECRET.length);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('JWT verificado exitosamente');
    
    // Convertir el payload al tipo JWTPayload esperado
    const jwtPayload: JWTPayload = {
      userId: payload.userId as string,
      email: payload.email as string,
      rol: payload.rol as string,
      empresa_id: payload.empresa_id as string | null,
      nombre: payload.nombre as string
    };
    
    return jwtPayload;
  } catch (error) {
    console.error('Error verificando JWT:', error);
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        console.log('JWT expirado');
      } else if (error.message.includes('signature')) {
        console.log('Error de firma JWT - posible mismatch de secret');
      } else if (error.message.includes('malformed')) {
        console.log('JWT malformado');
      }
    }
    return null;
  }
}

export function setJWTCookie(response: any, token: string) {
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function clearJWTCookie(response: any) {
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
