import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { registrarLogAdmin } from '@/lib/auditAdmin';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = params.id;
    
    // Debug: Verificar el ID que llega
    console.log('ID recibido:', empresaId);
    console.log('Tipo de ID:', typeof empresaId);
    
    const { nombre, telefono, ciudad, nombre_dueño, email_dueño, password, adminId } = await request.json();

    // Validaciones básicas
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la empresa es requerido' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar que la empresa existe
    const { data: empresaExistente, error: errorExistente } = await supabase
      .from('empresas')
      .select('id, nombre, telefono, ciudad')
      .eq('id', empresaId)
      .single();

    if (errorExistente || !empresaExistente) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar empresa
    const updateData: any = {
      nombre: nombre.trim()
    };

    if (telefono !== undefined) {
      updateData.telefono = telefono || null;
    }

    if (ciudad !== undefined) {
      updateData.ciudad = ciudad || null;
    }

    const { data: empresaActualizada, error } = await supabase
      .from('empresas')
      .update(updateData)
      .eq('id', empresaId)
      .select('id, nombre, telefono, ciudad, estado');

    if (error) {
      console.error('Error actualizando empresa:', error);
      return NextResponse.json(
        { error: 'Error actualizando la empresa' },
        { status: 500 }
      );
    }

    if (!empresaActualizada || empresaActualizada.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró la empresa o no se pudo actualizar' },
        { status: 404 }
      );
    }

    const empresaActualizadaData = empresaActualizada[0];

    // Actualizar usuario si se proporcionan campos del dueño
    if (nombre_dueño || email_dueño || password) {
      const { data: usuario } = await supabase
        .from('usuarios_sistema')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('rol', 'admin_empresa')
        .single();

      if (usuario) {
        const usuarioUpdateData: any = {};
        if (nombre_dueño?.trim()) {
          usuarioUpdateData.nombre = nombre_dueño.trim();
        }
        if (email_dueño?.trim()) {
          usuarioUpdateData.email = email_dueño.trim().toLowerCase();
        }
        // Solo actualizar la contraseña si viene un valor válido
        if (password && password.trim() !== '') {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          usuarioUpdateData.password_hash = hashedPassword;
        }

        if (Object.keys(usuarioUpdateData).length > 0) {
          await supabase
            .from('usuarios_sistema')
            .update(usuarioUpdateData)
            .eq('id', usuario.id);
        }
      }
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId || null,
        accion: 'EDITAR_EMPRESA',
        modulo: 'Empresas',
        detalles: {
          empresa_id: empresaId,
          cambios_solicitados: {
            nombre,
            telefono,
            ciudad,
            nombre_dueño,
            email_dueño
          }
        }
      });
    } catch (e) {
      console.error('Error silencioso en auditoría global (Empresas):', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Empresa actualizada correctamente',
      empresa: empresaActualizadaData
    });

  } catch (error) {
    console.error('Error en PUT /api/empresas/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = params.id;
    const supabase = createAdminClient();

    const { data: empresa, error } = await supabase
      .from('empresas')
      .select(`
        id,
        nombre,
        estado,
        plan_id,
        creado_en,
        actualizado_en,
        fecha_vencimiento,
        nit,
        telefono,
        direccion,
        ciudad,
        mensaje_ticket,
        logo_url,
        planes!inner (
          id,
          nombre,
          precio,
          max_usuarios,
          max_empleados
        )
      `)
      .eq('id', empresaId);

    if (error) {
      console.error('Error obteniendo empresa:', error);
      return NextResponse.json(
        { error: 'Error obteniendo la empresa' },
        { status: 500 }
      );
    }

    if (!empresa || empresa.length === 0) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Formatear respuesta
    const empresaData = empresa[0];
    const empresaFormateada = {
      id: empresaData.id,
      nombre: empresaData.nombre,
      estado: empresaData.estado,
      plan_id: empresaData.plan_id,
      creado_en: empresaData.creado_en,
      actualizado_en: empresaData.actualizado_en,
      fecha_vencimiento: empresaData.fecha_vencimiento,
      nit: empresaData.nit,
      telefono: empresaData.telefono,
      direccion: empresaData.direccion,
      ciudad: empresaData.ciudad,
      mensaje_ticket: empresaData.mensaje_ticket,
      logo_url: empresaData.logo_url,
      plan_nombre: (empresaData.planes as any)?.nombre,
      plan_precio: (empresaData.planes as any)?.precio,
      plan_max_usuarios: (empresaData.planes as any)?.max_usuarios,
      plan_max_empleados: (empresaData.planes as any)?.max_empleados
    };

    return NextResponse.json({
      success: true,
      empresa: empresaFormateada
    });

  } catch (error) {
    console.error('Error en GET /api/empresas/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
