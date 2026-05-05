import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signJWT, setJWTCookie, JWTPayload } from '@/lib/jwt';
import { createAdminClient } from '@/lib/supabase/admin';
import { registrarLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    console.log('Intentando login con email:', email);

    const supabase = createAdminClient();

    // Buscar usuario en usuarios_sistema
    const { data: user, error } = await supabase
      .from('usuarios_sistema')
      .select('id, email, nombre, rol, empresa_id, password_hash')
      .eq('email', email)
      .single();

    console.log('Usuario encontrado:', user);
    console.log('Error en búsqueda:', error);

    if (error || !user) {
      console.log('Usuario no encontrado o error:', error);
      return NextResponse.json(
        { error: 'Credenciales inválidas - usuario no encontrado' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, (user as any).password_hash);
    
    console.log('Contraseña válida:', isPasswordValid);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas - contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Crear payload JWT
    const payload: JWTPayload = {
      userId: (user as any).id,
      email: (user as any).email,
      rol: (user as any).rol,
      empresa_id: (user as any).empresa_id,
      nombre: (user as any).nombre
    };

    // Generar JWT
    const token = await signJWT(payload);

    // Registrar log de auditoría para login exitoso
    await registrarLog(createAdminClient(), {
      empresa_id: (user as any).empresa_id || undefined,
      usuario_id: (user as any).id,
      accion: 'LOGIN',
      modulo: 'AUTH',
      detalles: {
        usuario_id: (user as any).id,
        usuario_email: (user as any).email,
        usuario_nombre: (user as any).nombre,
        usuario_rol: (user as any).rol,
        empresa_id: (user as any).empresa_id,
        login_fecha: new Date().toISOString(),
        login_ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    // Crear respuesta y establecer cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: (user as any).id,
        email: (user as any).email,
        nombre: (user as any).nombre,
        rol: (user as any).rol,
        empresa_id: (user as any).empresa_id
      }
    });

    // Establecer cookie HttpOnly
    setJWTCookie(response, token);

    // Limpiar caché para asegurar que toda la aplicación detecte la nueva sesión
    revalidatePath('/', 'layout');

    return response;

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
