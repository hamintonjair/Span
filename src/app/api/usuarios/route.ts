import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Cliente con SERVICE_ROLE_KEY para operaciones administrativas
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // Obtener todos los usuarios con sus empresas
    const { data: usuarios, error } = await supabaseAdmin!
      .from('usuarios_sistema')
      .select(`
        id,
        nombre,
        email,
        rol,
        empresa_id,
        creado_en: created_at,
        ultimo_login: last_sign_in_at,
        empresas:empresa_id (
          nombre
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return NextResponse.json(
        { error: 'Error al obtener usuarios' },
        { status: 500 }
      );
    }

    // Formatear datos para el frontend
    const usuariosFormateados = usuarios.map(usuario => ({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      empresa_id: usuario.empresa_id,
      empresa_nombre: (usuario.empresas as any)?.nombre || null,
      creado_en: usuario.creado_en,
      ultimo_login: usuario.ultimo_login
    }));

    return NextResponse.json({ 
      success: true, 
      usuarios: usuariosFormateados 
    });

  } catch (error) {
    console.error('Error en GET /api/usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    const { nombre, email, password, rol, empresa_id, creador_id, creador_rol } = await request.json();

    // Validaciones básicas
    if (!nombre || !email || !password || !rol) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Validar rol
    if (!['admin_global', 'dueño', 'empleado'].includes(rol)) {
      return NextResponse.json(
        { error: 'Rol no válido' },
        { status: 400 }
      );
    }

    // Validación de seguridad: un dueño no puede crear admin_global
    if (creador_rol === 'dueño' && rol === 'admin_global') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear este rol de usuario' },
        { status: 403 }
      );
    }

    // Validar empresa_id según el rol del creador
    let empresaIdFinal = empresa_id;
    
    if (creador_rol === 'dueño') {
      // Si es dueño, usar su empresa_id
      empresaIdFinal = empresa_id;
    } else if (creador_rol === 'admin_global') {
      // Si es admin_global, el admin_global no tiene empresa_id
      empresaIdFinal = rol === 'admin_global' ? null : empresa_id;
    }

    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabaseAdmin!.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar el correo
      user_metadata: {
        nombre,
        rol
      }
    });

    if (authError) {
      console.error('Error creando usuario en auth:', authError);
      return NextResponse.json(
        { error: 'Error al crear usuario en autenticación', details: authError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario en auth.users' },
        { status: 500 }
      );
    }

    // 2. Crear registro en usuarios_sistema
    const usuarioData = {
      id: authData.user.id,
      nombre,
      email,
      rol,
      empresa_id: empresaIdFinal
    };

    const { error: insertError } = await supabaseAdmin
      .from('usuarios_sistema')
      .insert(usuarioData);

    if (insertError) {
      // Si falla el insert, eliminar el usuario de auth.users
      try {
        await supabaseAdmin!.auth.admin.deleteUser(authData.user.id);
      } catch (error) {
        console.error('Error eliminando usuario de auth.users:', error);
      }
      console.error('Error insertando en usuarios_sistema:', insertError);
      return NextResponse.json(
        { error: 'Error al guardar datos del usuario', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      usuario: {
        id: authData.user.id,
        nombre,
        email,
        rol,
        empresa_id: empresaIdFinal
      }
    });

  } catch (error) {
    console.error('Error en API route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Eliminar usuario
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    const { userId, eliminador_id, eliminador_rol } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    // Validar permisos
    if (eliminador_rol !== 'admin_global') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar usuarios' },
        { status: 403 }
      );
    }

    // 1. Eliminar de usuarios_sistema
    const { error: deleteError } = await supabaseAdmin!
      .from('usuarios_sistema')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error eliminando de usuarios_sistema:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar usuario del sistema', details: deleteError.message },
        { status: 500 }
      );
    }

    // 2. Eliminar de auth.users
    const { error: authDeleteError } = await supabaseAdmin!.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Error eliminando de auth.users:', authDeleteError);
      // No retornar error si solo falla la eliminación de auth
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE API route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
