import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('usuarios_sistema')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 400 }
      );
    }

    // Generar hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario admin
    const { data: newUser, error } = await supabase
      .from('usuarios_sistema')
      .insert({
        email: email,
        password_hash: passwordHash,
        nombre: 'Administrador Global',
        rol: 'admin_global',
        empresa_id: null
      } as any)
      .select('id, email, nombre, rol, empresa_id')
      .single();

    if (error) {
      console.error('Error creando usuario:', error);
      return NextResponse.json(
        { error: 'Error creando usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario admin creado exitosamente',
      user: newUser
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
