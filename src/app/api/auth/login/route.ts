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

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    console.log('Intentando login con email:', normalizedEmail);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Faltan variables de entorno de Supabase');
      return NextResponse.json({
        error: 'Variables de entorno no configuradas en el servidor (NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY).'
      }, { status: 500 });
    }

    const supabase = createAdminClient();

    // Buscar usuario en usuarios_sistema usando búsqueda insensible a mayúsculas/minúsculas
    const { data: user, error } = await supabase
      .from('usuarios_sistema')
      .select('id, email, nombre, rol, empresa_id, password_hash')
      .ilike('email', normalizedEmail)
      .single();

    console.log('Usuario encontrado:', !!user);
    if (error) {
      console.log('Error en búsqueda de usuario:', error);
    }

    if (error || !user) {
      console.log('Usuario no encontrado:', normalizedEmail);
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
    try {
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
    } catch (auditError) {
      console.error('Error registrando log de auditoría en login:', auditError);
    }

    // Crear respuesta y establecer cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      token,
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
