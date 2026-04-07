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
    const token = await new SignJWT(payload)
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
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Error verifying JWT:', error);
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
