import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Crear usuario admin global de prueba
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .upsert({
        email: 'admin@beautypro.com',
        nombre: 'Administrador Global',
        rol: 'admin_global',
        empresa_id: null,
        password_hash: passwordHash
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando usuario admin:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // También crear una empresa de prueba
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .upsert({
        nombre: 'Salón de Belleza Test',
        estado: 'activo',
        plan_id: 'plan_basico',
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      }, {
        onConflict: 'nombre'
      })
      .select()
      .single();

    if (empresaError) {
      console.error('Error creando empresa:', empresaError);
    }

    // Crear usuario empresa de prueba
    const empresaPasswordHash = await bcrypt.hash('empresa123', 10);
    
    const { data: userEmpresa, error: userEmpresaError } = await supabase
      .from('usuarios_sistema')
      .upsert({
        email: 'empresa@beautypro.com',
        nombre: 'Usuario Empresa',
        rol: 'admin_empresa',
        empresa_id: empresa?.id || null,
        password_hash: empresaPasswordHash
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (userEmpresaError) {
      console.error('Error creando usuario empresa:', userEmpresaError);
    }

    return NextResponse.json({
      success: true,
      message: 'Usuarios de prueba creados exitosamente',
      admin: data,
      empresa: empresa,
      userEmpresa: userEmpresa
    });

  } catch (error) {
    console.error('Error en setup:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
