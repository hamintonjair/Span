'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerAuthClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { unstable_noStore as noStore } from 'next/cache';
import { registrarLogAdmin } from '@/lib/auditAdmin';
/**
 * Función auxiliar para registrar logs de auditoría con manejo detallado de errores
 */
async function registrarLogAuditoria(
  usuarioId: string,
  tipoEvento: string,
  descripcion: string
): Promise<void> {
  try {
    // Validaciones básicas
    if (!usuarioId || !usuarioId.trim()) {
      return;
    }

    if (!tipoEvento || !tipoEvento.trim()) {
      return;
    }

    if (!descripcion || !descripcion.trim()) {
      return;
    }

    const supabaseAdmin = createAdminClient();
    
 

    const { error, data } = await supabaseAdmin
      .from('logs_auditoria')
      .insert({
        usuario_id: usuarioId.trim(),
        tipo_evento: tipoEvento.trim(),
        descripcion: descripcion.trim(),
        creado_en: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
    
      return;
    }



  } catch (error) {
    console.error('registrarLogAuditoria - Error registrando auditoría:', {
      error: error instanceof Error ? 'Error de sistema' : 'Error desconocido'
    });
  }
}

export async function toggleEstadoEmpresaAction(
  empresaId: string,
  nuevoEstado: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {

    // Validaciones básicas
    if (!empresaId || !empresaId.trim()) {
      return { success: false, error: 'ID de empresa es requerido' };
    }

    if (!adminId || !adminId.trim()) {
      return { success: false, error: 'ID de administrador es requerido' };
    }

    if (!['activo', 'suspendido'].includes(nuevoEstado)) {
      return { success: false, error: 'Estado inválido. Debe ser "activo" o "suspendido"' };
    }

    const supabaseAdmin = createAdminClient();

    // Actualizar estado de la empresa
    const { error } = await supabaseAdmin
      .from('empresas')
      .update({ estado: nuevoEstado })
      .eq('id', empresaId);

    if (error) {
      console.error('Error actualizando estado de empresa:', error);
      return {
        success: false,
        error: `Error actualizando estado: ${error.message}`
      };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'ACTUALIZAR_ESTADO_EMPRESA',
        modulo: 'Empresas',
        detalles: { empresa_id: empresaId, nuevo_estado: nuevoEstado }
      });
    } catch (e) {
      console.error('Error en auditoría global:', e);
    }

    // Revalidar cache para que se actualice la vista
    revalidatePath('/admin/empresas');

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado al actualizar estado'
    };
  }
}

export async function obtenerTodosLosUsuariosAction(): Promise<{ 
  success: boolean; 
  error?: string; 
  data?: any[] 
}> {
  try {

    const supabaseAdmin = createAdminClient();

    const { error, data } = await supabaseAdmin
      .from('usuarios_sistema')
      .select(`
        id,
        nombre,
        email,
        rol,
        activo,
        empresas(nombre)
      `)
      .order('id', { ascending: false });

    if (error) {
      console.error('Server Action - Error obteniendo usuarios:', error);
      return { 
        success: false, 
        error: error.message || 'Error al obtener los usuarios' 
      };
    }

    // Procesar datos para cada usuario
    const usuariosProcesados = (data || []).map((usuario: any) => ({
      ...usuario,
      empresa_nombre: usuario.empresas?.nombre || 'Sin empresa asignada'
    }));


    // Revalidar cache para asegurar datos frescos
    revalidatePath('/admin/usuarios');

    return { 
      success: true, 
      data: usuariosProcesados 
    };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener los usuarios' 
    };
  }
}

export async function toggleEstadoUsuarioAction(
  usuarioId: string,
  estadoActual: boolean,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {

    // Validaciones básicas
    if (!usuarioId || !usuarioId.trim()) {
      return { success: false, error: 'ID de usuario es requerido' };
    }

    const supabaseAdmin = createAdminClient();

    // Actualizar estado del usuario (invertir el estado actual)
    const nuevoEstado = !estadoActual;
    const { error } = await supabaseAdmin
      .from('usuarios_sistema')
      .update({ activo: nuevoEstado })
      .eq('id', usuarioId);

    if (error) {
      console.error('Error actualizando estado de usuario:', error);
      return {
        success: false,
        error: `Error actualizando estado: ${error.message}`
      };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'ACTUALIZAR_ESTADO',
        modulo: 'Usuarios',
        detalles: { usuario_afectado: usuarioId, nuevo_estado: nuevoEstado ? 'activo' : 'inactivo' }
      });
    } catch (e) {
      console.error('Error en auditoría global:', e);
    }

    // Registrar log de auditoría existente
    await registrarLogAuditoria(
      usuarioId,
      'ESTADO',
      `Estado cambiado a ${nuevoEstado ? 'activo' : 'inactivo'}`
    );

    // Revalidar cache para que se actualice la vista
    revalidatePath('/admin/usuarios');

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al actualizar estado' 
    };
  }
}

export async function restablecerClaveUsuarioAction(
  usuarioId: string,
  adminId: string
): Promise<{ success: boolean; error?: string; nuevaClave?: string }> {
  try {

    // Validaciones básicas
    if (!usuarioId || !usuarioId.trim()) {
      return { success: false, error: 'ID de usuario es requerido' };
    }

    // Generar contraseña temporal aleatoria de 8 caracteres
    const nuevaClave = Math.random().toString(36).slice(-8);

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaClave, 10);

    const supabaseAdmin = createAdminClient();

    // Actualizar contraseña del usuario
    const { error } = await supabaseAdmin
      .from('usuarios_sistema')
      .update({ password_hash: hashedPassword })
      .eq('id', usuarioId);

    if (error) {
      console.error('Error actualizando contraseña de usuario:', error);
      return {
        success: false,
        error: `Error actualizando contraseña: ${error.message}`
      };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'RESTABLECER_PASSWORD',
        modulo: 'Usuarios',
        detalles: { usuario_afectado: usuarioId }
      });
    } catch (e) {
      console.error('Error en auditoría global:', e);
    }

    // Registrar log de auditoría existente
    await registrarLogAuditoria(
      usuarioId,
      'SEGURIDAD',
      'Contraseña restablecida por Administrador Global'
    );

    // Revalidar cache para que se actualice la vista
    revalidatePath('/admin/usuarios');

    // Retornar éxito con la nueva clave sin hash para que el frontend la muestre
    return {
      success: true,
      nuevaClave: nuevaClave
    };

  } catch (error) {
    console.error('Server Action - Error inesperado restableciendo clave:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al restablecer la contraseña' 
    };
  }
}

/**
 * Envía notificación por correo electrónico
 */
export async function enviarEmailNotificacionAction(
  emailDestino: string,
  asunto: string,
  mensaje: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {

    // Validaciones básicas
    if (!emailDestino || !emailDestino.trim()) {
      return {
        success: false,
        error: 'El email de destino es requerido'
      };
    }

    if (!asunto || !asunto.trim()) {
      return {
        success: false,
        error: 'El asunto es requerido'
      };
    }

    if (!mensaje || !mensaje.trim()) {
      return {
        success: false,
        error: 'El mensaje es requerido'
      };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailDestino)) {
      return {
        success: false,
        error: 'El formato del email es inválido'
      };
    }

    // Inicializar cliente de Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Obtener nombre del titular desde configuracion_global
    let titular = 'Span'; // valor por defecto
    try {
      const supabaseAdmin = createAdminClient();
      const { data } = await supabaseAdmin
        .from('configuracion_global')
        .select('titular')
        .single() as any;
      
      if (data && data.titular) {
        titular = data.titular;
      }
    } catch (error) {
      console.error('Error al cargar titular para correo:', error);
      // Continuar con valor por defecto
    }

    // HTML template para la notificación
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${asunto} - ${titular}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background: #5B21B6;
            color: white;
            padding: 40px 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .content {
            background: white;
            padding: 40px 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .message-box {
            background: #f8f9fa;
            border-left: 4px solid #5B21B6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${titular}</div>
          <h1>Notificación del Sistema</h1>
        </div>
        
        <div class="content">
          <p>Estimado usuario,</p>
          
          <div class="message-box">
            <h3>${asunto}</h3>
            <p>${mensaje.replace(/\n/g, '<br>')}</p>
          </div>
          
          <p>
            Esta es una notificación automática del sistema ${titular}. 
            Si tienes alguna pregunta, por favor contacta al administrador.
          </p>
          
          <div class="footer">
            <p>El equipo de ${titular}</p>
            <p>Enviado el ${new Date().toLocaleDateString('es-MX')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Lógica condicional para email de desarrollo vs producción
    const isDevelopment = process.env.NODE_ENV === 'development';
    const emailFrom = process.env.RESEND_FROM || `${titular} <onboarding@resend.dev>`;
    
    // En desarrollo con email de testing, solo permitir enviar al email del desarrollador
    if (isDevelopment && emailFrom.includes('onboarding@resend.dev') && emailDestino !== 'hamintonjair@gmail.com') {
      console.log('⚠️ En desarrollo, solo se puede enviar a hamintonjair@gmail.com con email de testing');
      return {
        success: false,
        error: 'En desarrollo, solo se permite enviar al email del desarrollador (hamintonjair@gmail.com)'
      };
    }

    // Enviar correo con Resend
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [emailDestino],
      subject: `${asunto} - ${titular}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'ENVIAR_NOTIFICACION',
        modulo: 'Usuarios',
        detalles: { email_destino: emailDestino, asunto: asunto }
      });
    } catch (e) {
      console.error('Error en auditoría global:', e);
    }

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al enviar la notificación' 
    };
  }
}

/**
 * Edita el perfil de un usuario (nombre y rol)
 */
export async function actualizarMensajeGlobalAction(
  mensajeTexto: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validaciones básicas
    if (!mensajeTexto || typeof mensajeTexto !== 'string') {
      return {
        success: false,
        error: 'El mensaje es requerido'
      };
    }

    if (!adminId || !adminId.trim()) {
      return {
        success: false,
        error: 'ID de administrador es requerido'
      };
    }

    const supabaseAdmin = createAdminClient();

    // Actualizar mensaje global en configuracion_global
    const { error } = await supabaseAdmin
      .from('configuracion_global')
      .update({
        mensaje_global: mensajeTexto.trim(),
        actualizado_en: new Date().toISOString()
      })
      .eq('id', (await supabaseAdmin.from('configuracion_global').select('id').single()).data?.id);

    if (error) {
      console.error('Error actualizando mensaje global:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar el mensaje global'
      };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'ACTUALIZAR_MENSAJE_GLOBAL',
        modulo: 'Comunicación',
        detalles: { nuevo_mensaje: mensajeTexto.trim() }
      });
    } catch (e) {
      console.error('Error en auditoría global (Comunicación):', e);
    }

    // Revalidar cache
    revalidatePath('/admin/comunicacion');

    return { success: true };

  } catch (error) {
    console.error('Error en actualizarMensajeGlobalAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado al actualizar el mensaje global'
    };
  }
}

export async function editarPerfilUsuarioAction(
  usuarioId: string,
  nuevoNombre: string,
  nuevoRol: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {

    // Validaciones básicas
    if (!usuarioId || !usuarioId.trim()) {
      return {
        success: false,
        error: 'El ID del usuario es requerido'
      };
    }

    if (!nuevoNombre || !nuevoNombre.trim()) {
      return {
        success: false,
        error: 'El nombre del usuario es requerido'
      };
    }

    if (!nuevoRol || !nuevoRol.trim()) {
      return {
        success: false,
        error: 'El rol del usuario es requerido'
      };
    }

    // Validar roles permitidos
    const rolesPermitidos = [
      'superadmin',
      'admin_empresa',
      'recepcionista',
      'estilista',
      'soporte',
      'ventas'
    ];
    if (!rolesPermitidos.includes(nuevoRol)) {
      return {
        success: false,
        error: 'Rol no válido. Roles permitidos: superadmin, admin_empresa, recepcionista, estilista, soporte, ventas'
      };
    }

    const supabaseAdmin = createAdminClient();

    // Actualizar usuario en la base de datos
    const { error } = await supabaseAdmin
      .from('usuarios_sistema')
      .update({
        nombre: nuevoNombre.trim(),
        rol: nuevoRol.trim()
      })
      .eq('id', usuarioId);

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al actualizar el usuario'
      };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'EDITAR_PERFIL',
        modulo: 'Usuarios',
        detalles: { usuario_afectado: usuarioId, campos_modificados: { nombre: nuevoNombre, rol: nuevoRol } }
      });
    } catch (e) {
      console.error('Error en auditoría global:', e);
    }

    // Registrar log de auditoría existente
    await registrarLogAuditoria(
      usuarioId,
      'PERFIL',
      'Perfil actualizado (Nombre/Rol)'
    );

    // Revalidar cache para que se actualice la vista
    revalidatePath('/admin/usuarios');

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al editar el perfil' 
    };
  }
}

/**
 * Obtiene el historial de auditoría de un usuario
 */
export async function obtenerHistorialUsuarioAction(
  usuarioId: string
): Promise<{ success: boolean; error?: string; data?: any[] }> {
  try {

    // Validaciones básicas
    if (!usuarioId || !usuarioId.trim()) {
      return { 
        success: false, 
        error: 'El ID del usuario es requerido' 
      };
    }

    const supabaseAdmin = createAdminClient();

    // Obtener logs de auditoría del usuario, ordenados por fecha descendente
    const { data, error } = await supabaseAdmin
      .from('logs_auditoria')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al obtener el historial'
      };
    }


    return { 
      success: true, 
      data: data || [] 
    };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener el historial' 
    };
  }
}

/**
 * Obtiene todos los logs de auditoría interna para el Centro de Auditoría Global
 */
export async function obtenerAuditoriaInternaAction(filtros?: {
  busqueda?: string;
  fechaInicio?: string;
  fechaFin?: string;
}): Promise<{
  success: boolean;
  error?: string;
  data?: any[]
}> {
  try {
    const supabaseAdmin = createAdminClient();

    let query = supabaseAdmin
      .from('logs_auditoria')
      .select(`
        *,
        usuarios_sistema (
          nombre,
          email,
          rol
        )
      `)
      .order('creado_en', { ascending: false })
      .limit(100);

    // Aplicar filtros si se proporcionan
    if (filtros) {
      // Filtro de búsqueda (acción, módulo o nombre de usuario)
      if (filtros.busqueda && filtros.busqueda.trim()) {
        const terminoBusqueda = filtros.busqueda.trim().toLowerCase();
        // Usar ilike para búsqueda case-insensitive
        query = query.or(`accion.ilike.%${terminoBusqueda}%,modulo.ilike.%${terminoBusqueda}%`);
      }

      // Filtro de rango de fechas
      if (filtros.fechaInicio) {
        query = query.gte('creado_en', filtros.fechaInicio);
      }

      if (filtros.fechaFin) {
        query = query.lte('creado_en', filtros.fechaFin);
      }
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al obtener la auditoría interna'
      };
    }

    // Formatear datos para frontend
    const auditoriaFormateada = (data || []).map((log: any) => ({
      ...log,
      usuario_nombre: log.usuarios_sistema?.nombre || 'Usuario desconocido',
      usuario_email: log.usuarios_sistema?.email || 'Email no disponible',
      usuario_rol: log.usuarios_sistema?.rol || 'Desconocido'
    }));

    // Filtrar por nombre de usuario si hay búsqueda (ya que no se puede hacer en el query Supabase)
    if (filtros?.busqueda && filtros.busqueda.trim()) {
      const terminoBusqueda = filtros.busqueda.trim().toLowerCase();
      const filtradosPorUsuario = auditoriaFormateada.filter((log: any) =>
        log.usuario_nombre.toLowerCase().includes(terminoBusqueda)
      );
      return {
        success: true,
        data: filtradosPorUsuario
      };
    }

    return {
      success: true,
      data: auditoriaFormateada
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado al obtener la auditoría interna'
    };
  }
}

/**
 * Obtiene todos los logs de auditoría de empresas para el Centro de Auditoría Global
 */
export async function obtenerEmpresasAction(): Promise<{ success: boolean; error?: string; data?: any[] }> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre, nit, estado')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo empresas:', error);
      return { success: false, error: error.message || 'Error al obtener las empresas' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error inesperado obteniendo empresas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener las empresas' 
    };
  }
}

export async function obtenerAuditoriaEmpresasAction(filtros?: {
  busqueda?: string;
  fechaInicio?: string;
  fechaFin?: string;
  empresaId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ success: boolean; error?: string; data?: any[]; totalCount?: number }> {
  try {

    const supabaseAdmin = createAdminClient();
    
    const page = filtros?.page || 1;
    const pageSize = filtros?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from('logs_actividad')
      .select('*, empresas(nombre), usuarios_sistema(nombre, email)', { count: 'exact' })
      .order('creado_en', { ascending: false })
      .range(from, to);

    // Aplicar filtros si se proporcionan
    if (filtros) {
      // Filtro por empresa específica
      if (filtros.empresaId) {
        query = query.eq('empresa_id', filtros.empresaId);
      }

      // Filtro de búsqueda (acción, módulo o nombre de usuario)
      if (filtros.busqueda && filtros.busqueda.trim()) {
        const terminoBusqueda = filtros.busqueda.trim().toLowerCase();
        query = query.or(`accion.ilike.%${terminoBusqueda}%,modulo.ilike.%${terminoBusqueda}%`);
      }

      // Filtro de rango de fechas
      if (filtros.fechaInicio) {
        query = query.gte('creado_en', filtros.fechaInicio);
      }

      if (filtros.fechaFin) {
        query = query.lte('creado_en', filtros.fechaFin);
      }
    }

    const { data, count, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al obtener la auditoría de empresas'
      };
    }

    // Formatear datos para frontend
    const auditoriaFormateada = (data || []).map((log: any) => ({
      ...log,
      empresa_nombre: log.empresas?.nombre || 'Empresa desconocida',
      usuario_nombre: log.usuarios_sistema?.nombre || 'Usuario desconocido',
      usuario_email: log.usuarios_sistema?.email || 'Email no disponible'
    }));

    // Usar el count exacto de Supabase
    const totalCount = count || 0;

    return { 
      success: true, 
      data: auditoriaFormateada,
      totalCount
    };

  } catch (error) {
    console.error('Server Action - Error inesperado obteniendo auditoría de empresas:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener la auditoría de empresas' 
    };
  }
}

/**
 * Obtiene todos los registros de auditoría de empresas para exportación (sin paginación)
 */
export async function obtenerAuditoriaEmpresasExportAction(filtros?: {
  busqueda?: string;
  fechaInicio?: string;
  fechaFin?: string;
  empresaId?: string;
}): Promise<{ success: boolean; error?: string; data?: any[] }> {
  try {
    const supabaseAdmin = createAdminClient();

    let query = supabaseAdmin
      .from('logs_actividad')
      .select('*, empresas(nombre), usuarios_sistema(nombre, email)')
      .order('creado_en', { ascending: false });

    // Aplicar filtros si se proporcionan
    if (filtros) {
      // Filtro por empresa específica
      if (filtros.empresaId) {
        query = query.eq('empresa_id', filtros.empresaId);
      }

      // Filtro de búsqueda (acción, módulo o nombre de usuario)
      if (filtros.busqueda && filtros.busqueda.trim()) {
        const terminoBusqueda = filtros.busqueda.trim().toLowerCase();
        query = query.or(`accion.ilike.%${terminoBusqueda}%,modulo.ilike.%${terminoBusqueda}%`);
      }

      // Filtro de rango de fechas
      if (filtros.fechaInicio) {
        query = query.gte('creado_en', filtros.fechaInicio);
      }

      if (filtros.fechaFin) {
        query = query.lte('creado_en', filtros.fechaFin);
      }
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al obtener los datos para exportación'
      };
    }

    // Formatear datos para exportación
    const auditoriaFormateada = (data || []).map((log: any) => ({
      ...log,
      empresa_nombre: log.empresas?.nombre || 'Empresa desconocida',
      usuario_nombre: log.usuarios_sistema?.nombre || 'Usuario desconocido',
      usuario_email: log.usuarios_sistema?.email || 'Email no disponible'
    }));

    return { 
      success: true, 
      data: auditoriaFormateada
    };

  } catch (error) {
    console.error('Server Action - Error inesperado obteniendo datos para exportación:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener los datos para exportación' 
    };
  }
}

/**
 * Motor de métricas dinámicas para el Dashboard Global
 * Obtiene estadísticas clave del sistema basadas en datos reales de suscripciones, empresas y usuarios_sistema
 */
export async function obtenerMetricasDashboardAction() {
  try {
    const supabaseAdmin = createAdminClient();

    // Calcular fechas para análisis (últimos 30 días vs 30 días anteriores)
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - (30 * 24 * 60 * 60 * 1000));
    const hace60Dias = new Date(hoy.getTime() - (60 * 24 * 60 * 60 * 1000));

 

    // 1. Ingresos Mensuales (MRR) - Desde tabla suscripciones
    const { data: suscripcionesActivas, error: errorSuscripciones } = await supabaseAdmin
      .from('suscripciones')
      .select('monto')
      .eq('estado', 'activo')
      .eq('estado_pago', 'pagado');

    let mrr = 0;
    if (errorSuscripciones) {
      console.error('Error obteniendo suscripciones activas:', errorSuscripciones);
    } else {
      mrr = (suscripcionesActivas || []).reduce((total: number, suscripcion: any) => {
        const monto = suscripcion.monto;
        if (typeof monto === 'number' && !isNaN(monto) && monto > 0) {
          return total + monto;
        }
        return total;
      }, 0);
    
    }

    // 2. Métricas de Empresas - Total y por estado
    
    // Total de empresas
    const { count: totalEmpresas, error: errorTotalEmpresas } = await supabaseAdmin
      .from('empresas')
      .select('*', { count: 'exact', head: true });

    // Empresas activas
    const { count: activas, error: errorActivas } = await supabaseAdmin
      .from('empresas')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo');

    // Empresas suspendidas
    const { count: suspendidas, error: errorSuspendidas } = await supabaseAdmin
      .from('empresas')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'suspendido');

    if (errorTotalEmpresas || errorActivas || errorSuspendidas) {
      console.error('Error obteniendo métricas de empresas:', { 
        errorTotalEmpresas, 
        errorActivas, 
        errorSuspendidas 
      });
    }


    // 3. Crecimiento - Comparación de últimos 30 días vs 30 días anteriores
    
    // Empresas creadas en últimos 30 días
    const { count: empresasUltimos30Dias, error: errorUltimos30Dias } = await supabaseAdmin
      .from('empresas')
      .select('*', { count: 'exact', head: true })
      .gte('creado_en', hace30Dias.toISOString())
      .lte('creado_en', hoy.toISOString());

    // Empresas creadas en los 30 días anteriores
    const { count: empresas30DiasAnteriores, error: error30DiasAnteriores } = await supabaseAdmin
      .from('empresas')
      .select('*', { count: 'exact', head: true })
      .gte('creado_en', hace60Dias.toISOString())
      .lt('creado_en', hace30Dias.toISOString());

    let porcentajeCrecimiento = 0;
    const empresasRecientesCount = empresasUltimos30Dias || 0;
    const empresasAnteriores = empresas30DiasAnteriores || 0;

    // Corregir bug matemático - evitar división por cero y NaN
    if (empresasAnteriores > 0) {
      porcentajeCrecimiento = ((empresasRecientesCount - empresasAnteriores) / empresasAnteriores) * 100;
    } else if (empresasRecientesCount > 0) {
      porcentajeCrecimiento = 100; // Primeras empresas, crecimiento del 100%
    } else {
      porcentajeCrecimiento = 0; // Ambas son 0, sin crecimiento
    }

    // Asegurar que el resultado no sea NaN
    if (isNaN(porcentajeCrecimiento)) {
      porcentajeCrecimiento = 0;
    }

 

    // 4. Total Usuarios
    const { count: totalUsuarios, error: errorTotalUsuarios } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('*', { count: 'exact', head: true });

    if (errorTotalUsuarios) {
      console.error('Error obteniendo total de usuarios:', errorTotalUsuarios);
    }

    // 5. Actividad Reciente - Últimos 5 eventos combinados
    
    // Últimas empresas creadas
    const { data: empresasRecientes, error: errorEmpresasRecientes } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre, creado_en')
      .order('creado_en', { ascending: false })
      .limit(3);

    // Últimos pagos aprobados
    const { data: pagosRecientes, error: errorPagosRecientes } = await supabaseAdmin
      .from('comprobantes')
      .select('id, monto, fecha_verificacion, empresa_id')
      .eq('estado', 'aprobado')
      .order('fecha_verificacion', { ascending: false })
      .limit(2);

    const actividadReciente = [
      ...(empresasRecientes || []).map((empresa: any) => ({
        tipo: 'empresa_creada',
        id: empresa.id,
        nombre: empresa.nombre,
        fecha: empresa.creado_en
      })),
      ...(pagosRecientes || []).map((pago: any) => ({
        tipo: 'pago_aprobado',
        id: pago.id,
        monto: pago.monto,
        empresa_id: pago.empresa_id,
        fecha: pago.fecha_verificacion
      }))
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5);



    // 6. Distribución de Planes - JOIN con tabla planes
    const { data: distribucionPlanes, error: errorDistribucionPlanes } = await supabaseAdmin
      .from('empresas')
      .select(`
        plan_id,
        planes!inner (
          id,
          nombre
        )
      `)
      .eq('estado', 'activo')
      .not('plan_id', 'is', null);

    let distribucionPlanesAgrupada: Array<{ nombre: string; cantidad: number }> = [];
    if (!errorDistribucionPlanes && distribucionPlanes) {
      // Agrupar por nombre de plan
      const agrupado = distribucionPlanes.reduce((acc: any, empresa: any) => {
        const nombrePlan = empresa.planes.nombre;
        acc[nombrePlan] = (acc[nombrePlan] || 0) + 1;
        return acc;
      }, {});

      distribucionPlanesAgrupada = Object.entries(agrupado).map(([nombre, cantidad]) => ({
        nombre,
        cantidad: cantidad as number
      }));
    }


    // 7. Próximos Vencimientos - Empresas activas con vencimiento en próximos 5 días
    const en5Dias = new Date(hoy.getTime() + (5 * 24 * 60 * 60 * 1000));
    
    const { data: proximosVencimientos, error: errorVencimientos } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre, fecha_vencimiento')
      .eq('estado', 'activo')
      .gte('fecha_vencimiento', hoy.toISOString())
      .lte('fecha_vencimiento', en5Dias.toISOString())
      .order('fecha_vencimiento', { ascending: true });

    

    // Construir objeto de métricas
    const metricas = {
      mrr: Number(mrr.toFixed(2)),
      totalEmpresas: totalEmpresas || 0,
      activas: activas || 0,
      suspendidas: suspendidas || 0,
      totalUsuarios: totalUsuarios || 0,
      porcentajeCrecimiento: Number(porcentajeCrecimiento.toFixed(2)),
      actividadReciente: actividadReciente,
      distribucionPlanes: distribucionPlanesAgrupada,
      proximosVencimientos: proximosVencimientos || []
    };


    return {
      success: true,
      data: metricas
    };

  } catch (error) {
    console.error('Server Action - Error obteniendo métricas dinámicas del dashboard:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado al obtener métricas del dashboard'
    };
  }
}

/**
 * Función de Lectura para Gestión de Suscripciones del Admin Global
 * Obtiene el estado actual de todas las empresas con sus planes y los comprobantes pendientes
 */
export async function obtenerGestionSuscripcionesAction() {
  noStore();
  try {
    const supabaseAdmin = createAdminClient();


    // Query 1: Obtener empresas con LEFT JOIN a planes, ordenado por fecha_vencimiento ascendente
    const { data: empresas, error: empresasError } = await supabaseAdmin
      .from('empresas')
      .select(`
        id,
        nombre,
        estado,
        fecha_vencimiento,
        plan_id,
        creado_en,
        actualizado_en,
        planes (
          id,
          nombre,
          precio,
          descripcion,
          max_usuarios,
          max_empleados,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          soporte_prioritario,
          tiene_analytics,
          tiene_nominas
        )
      `)
      .order('fecha_vencimiento', { ascending: true });

    if (empresasError) {
      return {
        success: false,
        error: 'Error obteniendo datos de empresas',
        details: empresasError.message
      };
    }

 


    // Query 2: Obtener comprobantes pendientes con LEFT JOIN a empresas
    const { data: comprobantesPendientes, error: comprobantesError } = await supabaseAdmin
      .from('comprobantes')
      .select(`
        id,
        empresa_id,
        nombre_archivo,
        url_archivo,
        tipo_archivo,
        tamano_bytes,
        estado,
        verificado,
        notas,
        fecha_envio,
        creado_en,
        actualizado_en,
        monto,
        plan_id,
        empresas (
          id,
          nombre
        )
      `)
      .eq('estado', 'pendiente')
      .order('fecha_envio', { ascending: false });

    if (comprobantesError) {
      return {
        success: false,
        error: 'Error obteniendo comprobantes pendientes',
        details: comprobantesError.message
      };
    }

    

    // Query 3: Obtener historial de comprobantes (aprobados y rechazados)
    const { data: historialComprobantes, error: historialError } = await supabaseAdmin
      .from('comprobantes')
      .select(`
        id,
        empresa_id,
        nombre_archivo,
        url_archivo,
        tipo_archivo,
        tamano_bytes,
        estado,
        verificado,
        notas,
        fecha_envio,
        creado_en,
        actualizado_en,
        monto,
        plan_id,
        empresas (
          id,
          nombre
        )
      `)
      .in('estado', ['aprobado', 'rechazado'])
      .order('actualizado_en', { ascending: false });

    if (historialError) {
      return {
        success: false,
        error: 'Error obteniendo historial de comprobantes',
        details: historialError.message
      };
    }

    

    // Análisis adicional para debugging
    const analisisEmpresas = {
      total: empresas?.length || 0,
      activas: empresas?.filter(e => e.estado === 'activo').length || 0,
      suspendidas: empresas?.filter(e => e.estado === 'suspendido').length || 0,
      proximasAVencer: empresas?.filter(e => {
        if (!e.fecha_vencimiento) return false;
        const vencimiento = new Date(e.fecha_vencimiento);
        const en7Dias = new Date();
        en7Dias.setDate(en7Dias.getDate() + 7);
        const hoy = new Date();
        return vencimiento >= hoy && vencimiento <= en7Dias;
      }).length || 0
    };

    return {
      success: true,
      data: {
        empresas: empresas || [],
        comprobantesPendientes: comprobantesPendientes || [],
        historialComprobantes: historialComprobantes || [],
        analisis: analisisEmpresas
      }
    };

  } catch (error) {
    console.error('❌ Server Action - Error en obtenerGestionSuscripcionesAction:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado obteniendo datos de gestión de suscripciones'
    };
  }
}

/**
 * Función de Suspensión Automática de Empresas Vencidas
 * Busca empresas vencidas y las suspende automáticamente
 */
export async function ejecutarSuspensionAutomaticaAction() {
  try {
    const supabaseAdmin = createAdminClient();


    // Obtener fecha actual para comparación
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0); // Establecer hora 00:00:00 para comparación precisa


    // Query 1: Buscar empresas vencidas (fecha_vencimiento < fecha_actual y estado = 'activo')
    const { data: empresasVencidas, error: empresasError } = await supabaseAdmin
      .from('empresas')
      .select(`
        id,
        nombre,
        estado,
        fecha_vencimiento,
        plan_id
      `)
      .lt('fecha_vencimiento', fechaActual.toISOString())
      .eq('estado', 'activo');

    if (empresasError) {
      return {
        success: false,
        error: 'Error buscando empresas vencidas',
        details: empresasError.message
      };
    }

    const empresasASuspender = empresasVencidas || [];

    if (empresasASuspender.length === 0) {
      return {
        success: true,
        data: {
          empresasSuspendidas: 0,
          empresasProcesadas: [],
          mensaje: 'No hay empresas vencidas que requieran suspensión'
        }
      };
    }



    // Query 2: Suspender empresas
    const { error: suspensionError } = await supabaseAdmin
      .from('empresas')
      .update({
        estado: 'suspendido',
        actualizado_en: new Date().toISOString()
      })
      .in('id', empresasASuspender.map(e => e.id));

    if (suspensionError) {
      return {
        success: false,
        error: 'Error suspendiendo empresas',
        details: suspensionError.message
      };
    }


    // Query 3: Actualizar suscripciones asociadas a 'vencido'
    const { error: suscripcionesError } = await supabaseAdmin
      .from('suscripciones')
      .update({
        estado: 'vencido',
        actualizado_en: new Date().toISOString()
      })
      .in('empresa_id', empresasASuspender.map(e => e.id));

    if (suscripcionesError) {
      console.error('⚠️ Server Action - Error actualizando suscripciones:', suscripcionesError);
      // No fallar la operación completa, pero registrar el error
    } else {
    }

    // Registro de auditoría para cada suspensión
    for (const empresa of empresasASuspender) {
      try {
        await registrarLogAuditoria(
          'system',
          'suspension_automatica',
          `Empresa ${empresa.nombre} (${empresa.id}) suspendida automáticamente por vencimiento. Fecha vencimiento: ${empresa.fecha_vencimiento}`
        );
      } catch (logError) {
        console.error('❌ Server Action - Error registrando auditoría para empresa:', empresa.id, logError);
      }
    }


    return {
      success: true,
      data: {
        empresasSuspendidas: empresasASuspender.length,
        empresasProcesadas: empresasASuspender.map(e => ({
          id: e.id,
          nombre: e.nombre,
          fecha_vencimiento: e.fecha_vencimiento,
          plan_id: e.plan_id
        })),
        fechaEjecucion: fechaActual.toISOString(),
        mensaje: `${empresasASuspender.length} empresas suspendidas automáticamente`
      }
    };

  } catch (error) {
    console.error('❌ Server Action - Error en ejecutarSuspensionAutomaticaAction:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado en suspensión automática'
    };
  }
}

/**
 * Aprobar un comprobante de pago - Flujo completo de negocio
 */
export async function aprobarPagoAction(comprobanteId: string, empresaId: string, adminId: string, notas?: string) {
  try {
    const supabase = createAdminClient();

    
    // Validar parámetros requeridos
    if (!comprobanteId || !empresaId || !adminId) {
      return {
        success: false,
        error: 'Parámetros requeridos faltantes: comprobanteId, empresaId, adminId'
      };
    }

    // Paso 0: Preparación de Datos
    
    // Obtener detalles del comprobante
    const { data: comprobante, error: comprobanteError } = await supabase
      .from('comprobantes')
      .select('url_archivo, monto')
      .eq('id', comprobanteId)
      .single();

    if (comprobanteError || !comprobante) {
      return {
        success: false,
        error: 'Error obteniendo detalles del comprobante',
        details: comprobanteError?.message
      };
    }

    // Obtener detalles de la empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('plan_id')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      return {
        success: false,
        error: 'Error obteniendo detalles de la empresa',
        details: empresaError?.message
      };
    }

    // Calcular fecha de vencimiento (30 días desde hoy)
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    const isoVencimiento = fechaVencimiento.toISOString();


    // Paso 1: Actualizar comprobantes
    const { error: updateComprobanteError } = await supabase
      .from('comprobantes')
      .update({
        estado: 'aprobado',
        verificado: true,
        fecha_verificacion: new Date().toISOString(),
        verificado_por: adminId,
        notas: notas || null,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', comprobanteId);

    if (updateComprobanteError) {
      return {
        success: false,
        error: 'Error actualizando comprobante',
        details: updateComprobanteError.message
      };
    }

    // Paso 2: Actualizar empresas
    const { error: updateEmpresaError } = await supabase
      .from('empresas')
      .update({
        estado: 'activo',
        fecha_vencimiento: isoVencimiento,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', empresaId);

    if (updateEmpresaError) {
      return {
        success: false,
        error: 'Error actualizando empresa',
        details: updateEmpresaError.message
      };
    }

    // Paso 3: Gestionar suscripciones
    
    // Eliminar suscripción anterior
    const { error: deleteSuscripcionError } = await supabase
      .from('suscripciones')
      .delete()
      .eq('empresa_id', empresaId);

    if (deleteSuscripcionError) {
      return {
        success: false,
        error: 'Error eliminando suscripción anterior',
        details: deleteSuscripcionError.message
      };
    }

    // Insertar nueva suscripción
    const { error: insertSuscripcionError } = await supabase
      .from('suscripciones')
      .insert({
        empresa_id: empresaId,
        plan_id: empresa.plan_id,
        monto: comprobante.monto,
        estado: 'activo',
        metodo_pago: 'transferencia',
        estado_pago: 'pagado',
        verificado: true,
        comprobante_url: comprobante.url_archivo,
        comprobante_id: comprobanteId,
        proximo_vencimiento: isoVencimiento,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      });

    if (insertSuscripcionError) {
      return {
        success: false,
        error: 'Error creando nueva suscripción',
        details: insertSuscripcionError.message
      };
    }

    
    // Paso 4: Revalidar la página para mostrar los cambios
    revalidatePath('/admin/suscripciones');
    revalidatePath('/admin/finanzas-empresa');
    
    return {
      success: true,
      message: 'Comprobante aprobado y suscripción actualizada exitosamente'
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado en aprobación de pago'
    };
  }
}

/**
 * Rechazar un comprobante de pago
 */
export async function rechazarPagoAction(comprobanteId: string, notas: string, adminId: string) {
  try {
    const supabase = createAdminClient();
    
    
    // Validar que adminId no sea nulo o vacío
    if (!adminId) {
      return {
        success: false,
        error: 'ID de administrador es requerido'
      };
    }
    
    // Actualizar el comprobante como rechazado
    const { error: updateError } = await supabase
      .from('comprobantes')
      .update({
        estado: 'rechazado',
        verificado: true,
        notas: notas || null,
        fecha_verificacion: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      })
      .eq('id', comprobanteId);

    if (updateError) {
      return {
        success: false,
        error: 'Error rechazando comprobante',
        details: updateError.message
      };
    }

    // Revalidar la página para mostrar los cambios
    revalidatePath('/admin/suscripciones');
    
    return {
      success: true,
      message: 'Comprobante rechazado exitosamente'
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado rechazando pago'
    };
  }
}

/**
 * Obtener todos los comprobantes de una empresa específica
 */
export async function obtenerComprobantesPorEmpresaAction(empresaId: string) {
  try {
    const supabase = createAdminClient();
    
    
    // Obtener todos los comprobantes de la empresa con LEFT JOIN a empresas
    const { data: comprobantes, error } = await supabase
      .from('comprobantes')
      .select(`
        *,
        empresas (
          id,
          nombre
        )
      `)
      .eq('empresa_id', empresaId)
      .order('fecha_envio', { ascending: false });

    if (error) {
      return {
        success: false,
        error: 'Error obteniendo comprobantes de la empresa',
        details: error.message
      };
    }

    
    return {
      success: true,
      data: comprobantes || []
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado obteniendo comprobantes'
    };
  }
}

/**
 * Obtener Staff Técnico
 * Lista todos los usuarios internos de Span (roles administrativos)
 */
export async function obtenerStaffAction() {
  noStore();
  try {
    const supabaseAdmin = createAdminClient();

    const { data: staff, error } = await supabaseAdmin
      .from('usuarios_sistema')
      .select(`
        id,
        nombre,
        email,
        rol,
        activo,
        empresa_id,
        created_at,
        updated_at
      `)
      .in('rol', ['superadmin', 'soporte', 'ventas', 'admin_global'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Server Action - Error obteniendo staff:', error);
      throw new Error('Error obteniendo staff técnico');
    }

    return {
      success: true,
      data: staff || []
    };

  } catch (error) {
    console.error('❌ Server Action - Error en obtenerStaffAction:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado obteniendo staff'
    };
  }
}

/**
 * Crear Miembro del Staff Técnico
 * Crea un nuevo usuario interno con rol administrativo
 */
export async function crearMiembroStaffAction(datos: {
  nombre: string;
  email: string;
  password: string;
  rol: 'superadmin' | 'soporte' | 'ventas' | 'admin_global';
}, adminId: string) {
  noStore();
  try {
    const supabaseAdmin = createAdminClient();

    // Verificar si el email ya existe
    const { data: usuarioExistente } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('id')
      .eq('email', datos.email)
      .single();

    if (usuarioExistente) {
      return {
        success: false,
        error: 'El email ya está registrado'
      };
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(datos.password, salt);

    // Insertar directamente en usuarios_sistema
    const { data: staffUser, error: staffError } = await supabaseAdmin
      .from('usuarios_sistema')
      .insert({
        nombre: datos.nombre,
        email: datos.email,
        rol: datos.rol,
        password_hash: hashedPassword,
        empresa_id: null, // Staff de Span no tiene empresa asociada
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (staffError) {
      console.error('❌ Error insertando en usuarios_sistema:', staffError);

      // Manejar error específico de email duplicado (Postgres error code 23505)
      if (staffError.code === '23505' && staffError.message?.includes('usuarios_sistema_email_key')) {
        return {
          success: false,
          error: 'Este correo electrónico ya está registrado en el equipo técnico.'
        };
      }

      throw new Error(`Error creando registro de staff: ${staffError.message}`);
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'CREAR_MIEMBRO_STAFF',
        modulo: 'Staff',
        detalles: {
          nombre: datos.nombre,
          email: datos.email,
          rol: datos.rol
        }
      });
    } catch (e) {
      console.error('Error silencioso en auditoría de crear miembro staff:', e);
    }

    return {
      success: true,
      data: staffUser
    };

  } catch (error) {
    console.error('❌ Server Action - Error en crearMiembroStaffAction:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado creando miembro del staff'
    };
  }
}

/**
 * Actualizar Miembro del Staff Técnico
 * Actualiza un usuario interno existente
 */
export async function actualizarMiembroStaffAction(datos: {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  password?: string; // Opcional - solo si se quiere cambiar
}, adminId: string) {
  noStore();
  try {
    const supabaseAdmin = createAdminClient();

    // Validaciones básicas
    if (!datos.id || !datos.id.trim()) {
      return {
        success: false,
        error: 'El ID del miembro es requerido'
      };
    }

    if (!datos.nombre || !datos.nombre.trim()) {
      return {
        success: false,
        error: 'El nombre del miembro es requerido'
      };
    }

    if (!datos.email || !datos.email.trim()) {
      return {
        success: false,
        error: 'El correo electrónico es requerido'
      };
    }

    if (!datos.rol || !datos.rol.trim()) {
      return {
        success: false,
        error: 'El rol es requerido'
      };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datos.email.trim())) {
      return {
        success: false,
        error: 'El correo electrónico no tiene un formato válido'
      };
    }

    // Mapeo de roles permitidos para staff técnico
    const rolesPermitidos = ['admin_global', 'soporte', 'ventas'];
    const rolValido = rolesPermitidos.find(rol => rol === datos.rol);
    if (!rolValido) {
      return {
        success: false,
        error: `Rol no válido. Roles permitidos: ${rolesPermitidos.join(', ')}`
      };
    }

    // Proteger al Administrador Global - Verificar rol antes de modificar
    const { data: usuarioActual, error: errorConsulta } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('rol')
      .eq('id', datos.id)
      .single();

    if (errorConsulta) {
      console.error('❌ Error consultando usuario:', errorConsulta);
      return {
        success: false,
        error: 'Error consultando información del usuario'
      };
    }

    if (usuarioActual.rol === 'admin_global' && datos.rol !== 'admin_global') {
      return {
        success: false,
        error: 'Acción denegada: No se puede cambiar el rol del Administrador Global de la plataforma.'
      };
    }

    // Verificar si el correo ya existe, excluyendo al usuario actual
    const { data: existente, error: errorEmail } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('id')
      .eq('email', datos.email.trim())
      .neq('id', datos.id) // IMPORTANTE: No contar al usuario actual
      .single();

    if (errorEmail && errorEmail.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Error verificando email:', errorEmail);
      return {
        success: false,
        error: 'Error verificando disponibilidad del correo'
      };
    }

    if (existente) {
      return {
        success: false,
        error: 'Este correo ya pertenece a otro miembro del equipo'
      };
    }

    // Preparar datos de actualización
    const datosActualizacion: any = {
      nombre: datos.nombre.trim(),
      email: datos.email.trim(),
      rol: rolValido,
      updated_at: new Date().toISOString()
    };

    // Solo actualizar contraseña si se proporcionó una nueva
    if (datos.password && datos.password.trim()) {
      // Validar longitud mínima de contraseña
      if (datos.password.length < 6) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres'
        };
      }

      // Encriptar nueva contraseña (usando el mismo método que crearMiembroStaffAction)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(datos.password, salt);
      datosActualizacion.password_hash = hashedPassword;
    }

    // Actualizar miembro del staff
    const { data: staffActualizado, error } = await supabaseAdmin
      .from('usuarios_sistema')
      .update(datosActualizacion)
      .eq('id', datos.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Server Action - Error actualizando miembro del staff:', error);
      throw new Error('Error actualizando miembro del staff');
    }


    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'EDITAR_MIEMBRO_STAFF',
        modulo: 'Staff',
        detalles: {
          miembro_id: datos.id,
          nuevos_datos: {
            nombre: datos.nombre,
            rol: datos.rol
          }
        }
      });
    } catch (e) {
      console.error('Error silencioso en auditoría de editar miembro staff:', e);
    }

    return {
      success: true,
      data: staffActualizado
    };

  } catch (error) {
    console.error('❌ Server Action - Error en actualizarMiembroStaffAction:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado actualizando miembro del staff'
    };
  }
}

/**
 * Cambiar Estado de Staff Técnico
 * Activa o suspende un miembro del staff
 */
export async function cambiarEstadoStaffAction(
  id: string,
  nuevoEstadoActivo: boolean,
  adminId: string
) {
  noStore();
  try {
    const supabaseAdmin = createAdminClient();

    // Proteger al Administrador Global - Verificar rol antes de modificar
    const { data: usuarioActual, error: errorConsulta } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('rol')
      .eq('id', id)
      .single();

    if (errorConsulta) {
      console.error('❌ Error consultando usuario:', errorConsulta);
      return {
        success: false,
        error: 'Error consultando información del usuario'
      };
    }

    if (usuarioActual.rol === 'admin_global') {
      return {
        success: false,
        error: 'Acción denegada: No se puede eliminar ni suspender al Administrador Global de la plataforma.'
      };
    }

    const { data: staffActualizado, error } = await supabaseAdmin
      .from('usuarios_sistema')
      .update({
        activo: nuevoEstadoActivo,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Server Action - Error actualizando estado del staff:', error);
      throw new Error('Error actualizando estado del staff');
    }


    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: nuevoEstadoActivo ? 'ACTIVAR_STAFF' : 'SUSPENDER_STAFF',
        modulo: 'Staff',
        detalles: {
          miembro_id: id
        }
      });
    } catch (e) {
      console.error('Error silencioso en auditoría de cambiar estado staff:', e);
    }

    return {
      success: true,
      data: staffActualizado
    };

  } catch (error) {
    console.error('❌ Server Action - Error en cambiarEstadoStaffAction:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado actualizando estado del miembro del staff'
    };
  }
}

/**
 * Obtener Reporte Financiero Dinámico
 * Genera un reporte financiero con filtros por rango de fechas y empresa, incluyendo cálculos comparativos
 */
export async function obtenerReporteFinancieroAction(
  fechaInicio?: string, // Formato: 'YYYY-MM-DD'
  fechaFin?: string, // Formato: 'YYYY-MM-DD'
  empresaId?: string // 'todas' o UUID específico
) {
  noStore();
  try {
    const supabaseAdmin = createAdminClient();

    // 0. Obtener configuración global para el nombre de la empresa
    const { data: configGlobal, error: configError } = await supabaseAdmin
      .from('configuracion_global')
      .select('titular')
      .single();

    const nombreEmpresa = configGlobal?.titular || 'Span';

    // 1. Construir query base con filtros dinámicos
    let query = supabaseAdmin
      .from('comprobantes')
      .select(`
        id,
        monto,
        fecha_envio,
        fecha_verificacion,
        estado,
        notas,
        empresa_id,
        verificado_por,
        empresas!empresa_id (
          id,
          nombre,
          nit,
          telefono,
          direccion
        ),
        usuarios_sistema!verificado_por (
          id,
          nombre
        )
      `)
      .eq('estado', 'aprobado');

    // Aplicar filtro de empresa si no es 'todas'
    if (empresaId && empresaId !== 'todas') {
      query = query.eq('empresa_id', empresaId);
    }

    // Aplicar filtro de rango de fechas si se proporciona
    if (fechaInicio) {
      query = query.gte('fecha_verificacion', new Date(fechaInicio).toISOString());
    }

    if (fechaFin) {
      query = query.lte('fecha_verificacion', new Date(fechaFin).toISOString());
    }

    // Ejecutar query ordenado por fecha
    const { data: transacciones, error: errorTransacciones } = await query
      .order('fecha_verificacion', { ascending: false });



    // Si el JOIN no funciona, obtener nombres de usuarios por separado
    if (transacciones && transacciones.length > 0) {
      const usuariosIds = Array.from(new Set(transacciones
        .map((t: any) => t.verificado_por)
        .filter((id: any) => id && id !== 'null' && id !== null)
      ));

      if (usuariosIds.length > 0) {
        
        const { data: usuarios } = await supabaseAdmin
          .from('usuarios_sistema')
          .select('id, nombre')
          .in('id', usuariosIds);


        // Crear mapa de ID -> nombre
        const usuariosMap: { [key: string]: string } = (usuarios || []).reduce((map: any, user: any) => {
          map[user.id] = user.nombre;
          return map;
        }, {});

        // Agregar nombres a las transacciones
        transacciones.forEach((transaccion: any) => {
          if (transaccion.verificado_por && usuariosMap[transaccion.verificado_por]) {
            (transaccion as any).usuario_nombre = usuariosMap[transaccion.verificado_por];
          }
        });
      }
    }

    if (errorTransacciones) {
      return {
        success: false,
        error: 'Error obteniendo transacciones filtradas',
        details: errorTransacciones.message
      };
    }

    // 3. Obtener nombres de planes desde tabla empresas (que tiene plan_id)
    const empresasUnicas = Array.from(new Set(transacciones.map((t: any) => t.empresa_id)));
    const planesMap: { [key: string]: any } = {};

    if (empresasUnicas.length > 0) {
      try {
        // Obtener planes directamente desde las empresas usando plan_id
        const { data: empresasConPlanes } = await supabaseAdmin
          .from('empresas')
          .select(`
            id,
            planes!plan_id (
              id,
              nombre
            )
          `)
          .in('id', empresasUnicas);

        if (empresasConPlanes) {
          // Crear mapa de empresa_id -> plan
          empresasConPlanes.forEach((empresa: any) => {
            if (empresa.planes) {
              planesMap[empresa.id] = empresa.planes;
            }
          });
        }
      } catch (planesError) {
        console.error('Error obteniendo planes desde empresas:', planesError);
      }
    }

    // Asignar planes a las transacciones usando el mapa
    transacciones.forEach((transaccion: any) => {
      if (planesMap[transaccion.empresa_id]) {
        transaccion.planes = planesMap[transaccion.empresa_id];
      }
    });



    // 2. Obtener lista de empresas para filtros (activas y suspendidas)
    const { data: empresas, error: errorEmpresas } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre, estado, fecha_vencimiento, plan_id, planes(precio)')
      .in('estado', ['activo', 'suspendido'])
      .order('nombre', { ascending: true });

    if (errorEmpresas) {
      console.error('Error obteniendo empresas:', errorEmpresas);
    }

    // 3. Obtener empresas suspendidas por no pago con precios de planes
    const empresasSuspendidas = empresas?.filter((e: any) => e.estado === 'suspendido') || [];

    // Calcular monto total de empresas suspendidas por no pago
    const montoEmpresasSuspendidas = empresasSuspendidas.reduce((sum: number, e: any) => {
      const precio = e.planes?.precio || 0;
      return sum + precio;
    }, 0);

    // 3. Cálculo de métricas del período
    
    const ingresoPeriodo = transacciones?.reduce((total: number, transaccion: any) => {
      const monto = transaccion.monto;
      if (typeof monto === 'number' && !isNaN(monto) && monto > 0) {
        return total + monto;
      }
      return total;
    }, 0) || 0;

    const ticketPromedio = transacciones && transacciones.length > 0 
      ? ingresoPeriodo / transacciones.length 
      : 0;

    // 3.5 Cálculo de ingresos por mes (para el gráfico)
    const ingresosPorMes: Array<{ mes: string; total: number }> = [];
    
    // Obtener todos los comprobantes aprobados (sin filtros de fecha) para el gráfico histórico
    const { data: todosComprobantes } = await supabaseAdmin
      .from('comprobantes')
      .select('monto, fecha_verificacion')
      .eq('estado', 'aprobado');

    if (todosComprobantes && todosComprobantes.length > 0) {
      // Agrupar por mes basado en fecha_verificacion
      const agrupadoPorMes = todosComprobantes.reduce((acc: any, comprobante: any) => {
        if (comprobante.fecha_verificacion) {
          const fecha = new Date(comprobante.fecha_verificacion);
          const nombreMes = fecha.toLocaleDateString('es-CO', { 
            year: 'numeric', 
            month: 'long' 
          }); // Ejemplo: "Enero 2026"
          
          if (!acc[nombreMes]) {
            acc[nombreMes] = 0;
          }
          
          const monto = comprobante.monto;
          if (typeof monto === 'number' && !isNaN(monto) && monto > 0) {
            acc[nombreMes] += monto;
          }
        }
        return acc;
      }, {});

      // Convertir a array y ordenar cronológicamente
      ingresosPorMes.push(...Object.entries(agrupadoPorMes)
        .map(([mes, total]) => ({ mes, total: total as number }))
        .sort((a, b) => {
          // Ordenar por fecha (mes más antiguo primero)
          const fechaA = new Date(a.mes);
          const fechaB = new Date(b.mes);
          return fechaA.getTime() - fechaB.getTime();
        }));
    }


    // 4. Cálculo de crecimiento financiero (comparativo con período anterior)
    let variacion = 0;
    if (fechaInicio && fechaFin) {
      // Calcular período anterior del mismo tamaño
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const duracionDias = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      
      const inicioAnterior = new Date(inicio.getTime() - (duracionDias + 1) * 24 * 60 * 60 * 1000);
      const finAnterior = new Date(inicio.getTime() - 1 * 24 * 60 * 60 * 1000);
      
      // Obtener datos del período anterior
      let queryAnterior = supabaseAdmin
        .from('comprobantes')
        .select('monto')
        .eq('estado', 'aprobado');

      if (empresaId && empresaId !== 'todas') {
        queryAnterior = queryAnterior.eq('empresa_id', empresaId);
      }

      const { data: transaccionesAnteriores } = await queryAnterior
        .gte('fecha_verificacion', inicioAnterior.toISOString())
        .lte('fecha_verificacion', finAnterior.toISOString());

      const ingresoAnterior = transaccionesAnteriores?.reduce((total: number, trans: any) => {
        const monto = trans.monto;
        if (typeof monto === 'number' && !isNaN(monto) && monto > 0) {
          return total + monto;
        }
        return total;
      }, 0) || 0;

      // Calcular variación porcentual
      if (ingresoAnterior > 0) {
        variacion = ((ingresoPeriodo - ingresoAnterior) / ingresoAnterior) * 100;
      } else if (ingresoPeriodo > 0) {
        variacion = 100; // Primer período con ingresos
      }
    }

    // 5. Construir resumen
    const resumen = {
      total: Number(ingresoPeriodo.toFixed(2)),
      promedio: Number(ticketPromedio.toFixed(2)),
      variacion: Number(variacion.toFixed(2)),
      cantidadTransacciones: transacciones?.length || 0
    };


    // 6. Calcular métricas avanzadas

    // 6.1 Recaudación por Plan
    const recaudacionPorPlan: { [key: string]: number } = {};
    if (transacciones && transacciones.length > 0) {
      transacciones.forEach((transaccion: any) => {
        const nombrePlan = transaccion.planes?.nombre || 'Sin Plan';
        const monto = typeof transaccion.monto === 'number' ? transaccion.monto : 0;
        
        if (!recaudacionPorPlan[nombrePlan]) {
          recaudacionPorPlan[nombrePlan] = 0;
        }
        recaudacionPorPlan[nombrePlan] += monto;
      });
    }

    // 6.2 Estado de Cobro (aprobados vs rechazados del mes actual)
    let estadoCobro = { aprobados: 0, rechazados: 0 };
    try {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const finMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0);
      finMes.setHours(23, 59, 59, 999);

      // Comprobantes aprobados del mes actual
      const { data: aprobados } = await supabaseAdmin
        .from('comprobantes')
        .select('monto')
        .eq('estado', 'aprobado')
        .gte('fecha_verificacion', inicioMes.toISOString())
        .lte('fecha_verificacion', finMes.toISOString());

      // Comprobantes rechazados del mes actual
      const { data: rechazados } = await supabaseAdmin
        .from('comprobantes')
        .select('monto')
        .eq('estado', 'rechazado')
        .gte('fecha_verificacion', inicioMes.toISOString())
        .lte('fecha_verificacion', finMes.toISOString());

      estadoCobro.aprobados = aprobados?.reduce((total: number, comp: any) => {
        const monto = typeof comp.monto === 'number' ? comp.monto : 0;
        return total + monto;
      }, 0) || 0;

      estadoCobro.rechazados = rechazados?.reduce((total: number, comp: any) => {
        const monto = typeof comp.monto === 'number' ? comp.monto : 0;
        return total + monto;
      }, 0) || 0;
    } catch (error) {
      console.error('Error calculando estado de cobro:', error);
    }

    // 6.3 Día de Mayor Flujo
    let diaMayorFlujo = 'Sin datos';
    if (transacciones && transacciones.length > 0) {
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const conteoDias: { [key: string]: number } = {};
      
      diasSemana.forEach(dia => conteoDias[dia] = 0);

      transacciones.forEach((transaccion: any) => {
        if (transaccion.fecha_verificacion) {
          const fecha = new Date(transaccion.fecha_verificacion);
          const diaSemana = diasSemana[fecha.getDay()];
          conteoDias[diaSemana]++;
        }
      });

      // Encontrar el día con mayor conteo
      let maxConteo = 0;
      Object.entries(conteoDias).forEach(([dia, conteo]) => {
        if (conteo > maxConteo) {
          maxConteo = conteo;
          diaMayorFlujo = dia;
        }
      });
    }



    // Retornar resultado con nueva estructura
    return {
      success: true,
      data: {
        transacciones: transacciones || [],
        resumen,
        empresas: empresas || [],
        empresasSuspendidas,
        montoEmpresasSuspendidas,
        ingresosPorMes,
        nombreEmpresa, // Agregar nombre de empresa desde configuración global
        metricasAvanzadas: {
          recaudacionPorPlan,
          estadoCobro,
          diaMayorFlujo
        }
      }
    };

  } catch (error) {
    console.error('❌ Server Action - Error generando reporte financiero dinámico:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado generando reporte financiero'
    };
  }
}

/**
 * Crear un nuevo plan de suscripción
 */
export async function crearPlanAction(
  datos: {
    nombre: string;
    precio: number;
    descripcion?: string;
    max_usuarios?: number;
    max_empleados?: number;
    tiene_inventario: boolean;
    tiene_comisiones: boolean;
    tiene_marketing: boolean;
    tiene_nominas: boolean;
    tiene_analytics: boolean;
    soporte_prioritario: boolean;
    tiene_trial_gratis?: boolean;
  },
  adminId: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('planes')
      .insert({
        nombre: datos.nombre,
        precio: datos.precio,
        descripcion: datos.descripcion,
        max_usuarios: datos.max_usuarios,
        max_empleados: datos.max_empleados,
        tiene_inventario: datos.tiene_inventario,
        tiene_comisiones: datos.tiene_comisiones,
        tiene_marketing: datos.tiene_marketing,
        tiene_nominas: datos.tiene_nominas,
        tiene_analytics: datos.tiene_analytics,
        soporte_prioritario: datos.soporte_prioritario,
        tiene_trial_gratis: datos.tiene_trial_gratis,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando plan:', error);
      return { success: false, error: error.message };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'CREAR_PLAN',
        modulo: 'Planes',
        detalles: { nombre_plan: datos.nombre, precio: datos.precio }
      });
    } catch (e) {
      console.error('Error en auditoría global (Crear Plan):', e);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en crearPlanAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error inesperado' };
  }
}

/**
 * Editar un plan de suscripción existente
 */
export async function editarPlanAction(
  id: string,
  datos: {
    nombre: string;
    precio: number;
    descripcion?: string;
    max_usuarios?: number;
    max_empleados?: number;
    tiene_inventario: boolean;
    tiene_comisiones: boolean;
    tiene_marketing: boolean;
    tiene_nominas: boolean;
    tiene_analytics: boolean;
    soporte_prioritario: boolean;
    tiene_trial_gratis?: boolean;
  },
  adminId: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const supabase = createAdminClient();

    const datosActualizados = {
      nombre: datos.nombre,
      precio: datos.precio,
      descripcion: datos.descripcion,
      max_usuarios: datos.max_usuarios,
      max_empleados: datos.max_empleados,
      tiene_inventario: datos.tiene_inventario,
      tiene_comisiones: datos.tiene_comisiones,
      tiene_marketing: datos.tiene_marketing,
      tiene_nominas: datos.tiene_nominas,
      tiene_analytics: datos.tiene_analytics,
      soporte_prioritario: datos.soporte_prioritario,
      tiene_trial_gratis: datos.tiene_trial_gratis,
      actualizado_en: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('planes')
      .update(datosActualizados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error editando plan:', error);
      return { success: false, error: error.message };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'EDITAR_PLAN',
        modulo: 'Planes',
        detalles: { plan_id: id, cambios_solicitados: datosActualizados }
      });
    } catch (e) {
      console.error('Error en auditoría global (Editar Plan):', e);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en editarPlanAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error inesperado' };
  }
}

/**
 * Eliminar un plan de suscripción
 */
export async function eliminarPlanAction(
  id: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Primero verificar si hay empresas asociadas
    const { data: empresasAsociadas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nombre')
      .eq('plan_id', id)
      .limit(1);

    if (empresasError) {
      console.error('Error verificando empresas asociadas:', empresasError);
      return { success: false, error: 'Error verificando empresas asociadas' };
    }

    if (empresasAsociadas && empresasAsociadas.length > 0) {
      return { success: false, error: 'No se puede eliminar este plan porque hay empresas suscritas a él. Cámbialas de plan primero.' };
    }

    const { error } = await supabase
      .from('planes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando plan:', error);
      return { success: false, error: error.message };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'ELIMINAR_PLAN',
        modulo: 'Planes',
        detalles: { plan_id: id }
      });
    } catch (e) {
      console.error('Error en auditoría global (Eliminar Plan):', e);
    }

    return { success: true };
  } catch (error) {
    console.error('Error en eliminarPlanAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error inesperado' };
  }
}

// Server Action para exportar sistema maestro y guardar en respaldos_datos
export async function exportarSistemaMaestroAction(adminId: string): Promise<{
  success: boolean;
  error?: string;
  data?: any;
  respaldo?: any;
}> {
  try {
    const supabase = createAdminClient();

    // Extraer datos del sistema maestro
    const [
      usuariosSistema,
      planes,
      ayuda,
      configuracion,
      tickets,
      marketing,
      comunicacion
    ] = await Promise.all([
      supabase.from('usuarios_sistema').select('*'),
      supabase.from('planes').select('*'),
      supabase.from('articulos_ayuda').select('*'),
      supabase.from('configuracion_global').select('*'),
      supabase.from('tickets_soporte').select('*'),
      supabase.from('campanas_marketing').select('*'),
      supabase.from('comunicacion').select('*')
    ]);

    // Generar nombre de archivo con fecha y hora dinámica y caracteres seguros
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const nombreArchivo = `Respaldo_Maestro_Global_${day}_${month}_${year}_${hours}${minutes}${seconds}`;

    // Objeto JSON con todos los datos
    const datosRespaldo = {
      fecha_respaldo: now.toISOString(),
      version: '1.0',
      datos: {
        usuarios_sistema: usuariosSistema.data || [],
        planes: planes.data || [],
        articulos_ayuda: ayuda.data || [],
        configuracion_global: configuracion.data || [],
        tickets_soporte: tickets.data || [],
        campanas_marketing: marketing.data || [],
        comunicacion: comunicacion.data || []
      }
    };

    // Guardar en tabla respaldos_datos con empresa_id NULL
    // Para respaldos globales (empresa_id NULL), creado_por es NULL para evitar conflicto FK
    // La auditoría global ya registra quién realizó la acción
    
    console.log('🔍 Intentando guardar respaldo en tabla respaldos_datos...');
    console.log('📋 Datos a insertar:', {
      empresa_id: null,
      nombre_archivo: nombreArchivo,
      datos_size: JSON.stringify(datosRespaldo).length,
      creado_por: null,
      created_at: now.toISOString()
    });
    
    const { data: insertData, error: insertError } = await supabase
      .from('respaldos_datos')
      .insert({
        empresa_id: null,
        nombre_archivo: nombreArchivo,
        datos: datosRespaldo,
        tipo_respaldo: 'Sistema Maestro Admin',
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error guardando respaldo en BD:', insertError);
      console.error('❌ Código de error:', insertError.code);
      console.error('❌ Detalles:', insertError.details);
      console.error('❌ Hint:', insertError.hint);
      return {
        success: false,
        error: `Error al guardar el respaldo: ${insertError.message}`
      };
    }


    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'CREAR_RESPALDO_SISTEMA_MAESTRO',
        modulo: 'Sistema Maestro',
        detalles: { nombre_archivo: nombreArchivo }
      });
    } catch (e) {
      console.error('Error en auditoría (Crear Respaldo Sistema Maestro):', e);
    }

    // Revalidar ruta para actualizar caché
    revalidatePath('/admin/configuracion');

    return {
      success: true,
      data: datosRespaldo,
      respaldo: insertData // Devuelve el respaldo completo con el UUID real
    };

  } catch (error) {
    console.error('Error en exportarSistemaMaestroAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado al generar respaldo'
    };
  }
}

// Server Action para obtener respaldos del sistema maestro
export async function obtenerRespaldosSistemaMaestroAction(): Promise<{
  success: boolean;
  error?: string;
  data?: any[];
}> {
  try {
    const supabase = createAdminClient();

    // Obtener todos los respaldos sin filtro (el filtro .is() no funciona correctamente)
    const { data, error } = await supabase
      .from('respaldos_datos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo respaldos del sistema maestro:', error);
      return {
        success: false,
        error: 'Error al obtener los respaldos'
      };
    }

    // Filtrar en el servidor donde empresa_id es null
    const respaldosGlobales = (data || []).filter((r: any) => r.empresa_id === null);


    return {
      success: true,
      data: respaldosGlobales
    };

  } catch (error) {
    console.error('Error en obtenerRespaldosSistemaMaestroAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado'
    };
  }
}

// Server Action para eliminar respaldo del sistema maestro
export async function eliminarRespaldoSistemaMaestroAction(
  respaldoId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('respaldos_datos')
      .delete()
      .eq('id', respaldoId)
      .is('empresa_id', null);

    if (error) {
      console.error('Error eliminando respaldo del sistema maestro:', error);
      return {
        success: false,
        error: 'Error al eliminar el respaldo'
      };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'ELIMINAR_RESPALDO_SISTEMA_MAESTRO',
        modulo: 'Sistema Maestro',
        detalles: { respaldo_id: respaldoId }
      });
    } catch (e) {
      console.error('Error en auditoría (Eliminar Respaldo Sistema Maestro):', e);
    }

    // Revalidar ruta para actualizar caché
    revalidatePath('/admin/configuracion');

    return { success: true };

  } catch (error) {
    console.error('Error en eliminarRespaldoSistemaMaestroAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado'
    };
  }
}

// Server Action para crear respaldo completo de la base de datos
// Server Action para obtener datos de una tabla específica
export async function obtenerDatosTablaAction(nombreTabla: string): Promise<{
  success: boolean;
  error?: string;
  data?: any[];
}> {
  try {
    // Cliente Admin con Service Role para bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Faltan las variables de entorno de Supabase Admin.");
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`🟢 Extrayendo datos de tabla: ${nombreTabla}`);
    const { data, error } = await supabaseAdmin
      .from(nombreTabla)
      .select('*');

    if (error) {
      console.warn(`⚠️ Error extrayendo ${nombreTabla}:`, error);
      return {
        success: false,
        error: `Error en tabla ${nombreTabla}: ${error.message}`
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error(`❌ Error crítico en tabla ${nombreTabla}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Server Action para guardar respaldo final
export async function guardarRespaldoFinalAction(backupData: any, nombreArchivo: string): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    // Cliente Admin con Service Role para bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Faltan las variables de entorno de Supabase Admin.");
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Convertir a JSON string
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Subir a Supabase Storage
    console.log('🟢 Subiendo archivo a Storage:', nombreArchivo);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('respaldos')
      .upload(nombreArchivo, blob, {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Error al subir archivo a Storage: ${uploadError.message}`);
    }

    // Guardar registro en tabla respaldos_datos
    console.log('🟢 Guardando registro en base de datos');
    const now = new Date();
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('respaldos_datos')
      .insert({
        empresa_id: null, // Identifica como respaldo maestro del admin
        nombre_archivo: nombreArchivo,
        datos: backupData,
        tipo_respaldo: 'Sistema Maestro TOTAL',
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error al guardar registro de respaldo: ${insertError.message}`);
    }

    // Revalidar ruta para actualizar caché
    revalidatePath('/admin/configuracion');

    return {
      success: true,
      data: insertData
    };

  } catch (error) {
    console.error('Error en guardarRespaldoFinalAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export async function crearRespaldoCompletoAction(adminId: string): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    // Cliente Admin con Service Role para bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Faltan las variables de entorno de Supabase Admin.");
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Lista maestra completa de tablas del sistema
    const tablasMaestras = ['configuracion_global', 'planes', 'empresas', 'suscripciones', 'comprobantes', 'logs_actividad', 'cajas', 'citas', 'ventas', 'nominas', 'clientes', 'empleados', 'prestamos', 'productos', 'servicios', 'categorias', 'comisiones', 'proveedores', 'cita_productos', 'detalles_ventas', 'pagos_prestamos', 'movimientos_caja', 'usuarios_sistema', 'campanas_marketing', 'movimientos_inventario', 'cita_servicios_adicionales', 'comunicacion', 'articulos_ayuda', 'tickets_soporte', 'logs_auditoria', 'mensajes_ticket', 'respaldos_datos'];

    console.log('🟢 Iniciando respaldo completo de', tablasMaestras.length, 'tablas');

    // Objeto maestro para almacenar todos los datos
    const backupData: any = {
      metadata: {
        fecha_respaldo: new Date().toISOString(),
        version: '1.0',
        tipo: 'Base de Datos Completa',
        total_tablas: tablasMaestras.length,
        creado_por: adminId
      },
      datos: {}
    };

    // Iterar sobre cada tabla y extraer todos los datos
    for (const nombreTabla of tablasMaestras) {
      try {
        console.log(`🟢 Extrayendo datos de tabla: ${nombreTabla}`);
        const result = await obtenerDatosTablaAction(nombreTabla);
        
        // Obtener columnas usando la función RPC que sí funciona
        let columnas: any[] = [];
        try {
          // Usar la función RPC que ya verificamos que funciona
          const { data: columnasData, error: rpcError } = await supabaseAdmin.rpc('get_table_columns', { t_name: nombreTabla });
          
          if (!rpcError && columnasData) {
            columnas = columnasData;
            console.log(`📋 ${nombreTabla}: ${columnasData.length} columnas encontradas`);
          } else {
            console.warn(`⚠️ Error RPC obteniendo columnas de ${nombreTabla}:`, rpcError);
          }
        } catch (rpcError) {
          console.warn(`⚠️ Error crítico en RPC para ${nombreTabla}:`, rpcError);
        }
        
        // Construir objeto con formato {columnas: [], registros: []} siempre
        const tablaData = {
          columnas: columnas.map((c: any) => c.column_name),
          registros: result.success ? (result.data || []) : []
        };
        
        backupData.datos[nombreTabla] = tablaData;
        
        const registroCount = result.success ? (result.data?.length || 0) : 0;
        const columnaCount = columnas.length;
        
        if (!result.success) {
          console.warn(`⚠️ Error en ${nombreTabla}:`, result.error);
          console.log(`📋 ${nombreTabla}: 0 registros (con estructura de ${columnaCount} columnas)`);
        } else {
          if (registroCount === 0) {
            console.log(`✅ ${nombreTabla}: 0 registros (con estructura de ${columnaCount} columnas)`);
          } else {
            console.log(`✅ ${nombreTabla}: ${registroCount} registros (${columnaCount} columnas)`);
          }
        }
      } catch (err) {
        console.error(`❌ Error crítico en tabla ${nombreTabla}:`, err);
        backupData.datos[nombreTabla] = [];
      }
    }

    // Generar nombre de archivo descriptivo para respaldo total
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const nombreArchivo = `BACKUP_TOTAL_SISTEMA_MAESTRO_${day}${month}${year}_${hours}${minutes}.json`;

    // Convertir a JSON string
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Subir a Supabase Storage
    console.log('🟢 Subiendo archivo a Storage:', nombreArchivo);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('respaldos')
      .upload(nombreArchivo, blob, {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Error al subir archivo a Storage: ${uploadError.message}`);
    }

    // Log de depuración para confirmar inicio del proceso
    console.log("🟢 Iniciando creación de respaldo completo de la base de datos");

    // Guardar registro en tabla respaldos_datos
    console.log('🟢 Guardando registro en base de datos');
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('respaldos_datos')
      .insert({
        empresa_id: null, // Identifica como respaldo maestro del admin
        nombre_archivo: nombreArchivo,
        datos: backupData,
        tipo_respaldo: 'Sistema Maestro TOTAL',
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error al guardar registro de respaldo: ${insertError.message}`);
    }

    // Registrar log de auditoría
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'CREAR_RESPALDO_COMPLETO_DB',
        modulo: 'Sistema Maestro',
        detalles: { 
          nombre_archivo: nombreArchivo,
          tipo: 'Base de Datos Completa',
          total_tablas: tablasMaestras.length
        }
      });
    } catch (e) {
      console.error('Error en auditoría (Respaldo Completo):', e);
    }

    // Revalidar ruta para actualizar caché
    revalidatePath('/admin/configuracion');

    console.log('✅ Respaldo completo creado exitosamente');
    return {
      success: true,
      data: backupData
    };

  } catch (error) {
    console.error('Error en crearRespaldoCompletoAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al crear respaldo completo'
    };
  }
}

// Server Action para restaurar desde base de datos
export async function restaurarDesdeBDAction(
  respaldoId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🚀 Iniciando restaurarDesdeBDAction con respaldoId:', respaldoId);
    const supabase = createAdminClient();

    // Obtener el respaldo (sin filtro .is() que puede no funcionar correctamente)
    const { data: respaldo, error: fetchError } = await supabase
      .from('respaldos_datos')
      .select('*')
      .eq('id', respaldoId)
      .single();

    if (fetchError || !respaldo) {
      console.error('Error obteniendo respaldo:', fetchError);
      return {
        success: false,
        error: 'No se encontró el respaldo especificado'
      };
    }

    // Validar que sea un respaldo del sistema maestro (empresa_id null)
    if (respaldo.empresa_id !== null) {
      console.error('❌ El respaldo no es del sistema maestro:', respaldo.empresa_id);
      return {
        success: false,
        error: 'Solo se pueden restaurar respaldos del sistema maestro'
      };
    }

    console.log('🔍 Respaldo obtenido:', respaldo);
    console.log('🔍 Tipo de respaldo.datos:', typeof respaldo.datos);
    console.log('🔍 ¿Es string?', typeof respaldo.datos === 'string');

    // Parsear datos si vienen como string
    let datos: any;
    if (typeof respaldo.datos === 'string') {
      try {
        datos = JSON.parse(respaldo.datos);
        console.log('🔍 Datos parseados:', datos);
      } catch (parseError) {
        console.error('Error parseando datos del respaldo:', parseError);
        return {
          success: false,
          error: 'Error al leer los datos del respaldo'
        };
      }
    } else {
      datos = respaldo.datos;
      console.log('🔍 Datos directos:', datos);
    }

    // Acceder a datos.datos o datos directamente según la estructura
    const backupData = datos.datos || datos;
    console.log('🔍 backupData final:', backupData);

    // Función para transformar el formato {columnas: [], registros: []} a solo registros
    const transformBackupData = (data: any): any => {
      const transformed: { [key: string]: any } = {};
      
      for (const [tableName, tableData] of Object.entries(data)) {
        if (tableData && typeof tableData === 'object' && 'registros' in tableData) {
          // Formato nuevo: {columnas: [], registros: []} -> solo registros
          transformed[tableName] = tableData.registros;
        } else {
          // Formato antiguo: array directo o objeto individual
          transformed[tableName] = tableData;
        }
      }
      
      return transformed;
    };

    // Transformar los datos para eliminar columnas
    console.log('🔍 backupData original:', backupData);
    const transformedBackupData = transformBackupData(backupData);
    console.log('🔍 transformedBackupData:', transformedBackupData);
    console.log('🔍 ¿transformedBackupData.configuracion_global existe?', !!transformedBackupData.configuracion_global);
    console.log('🔍 Tipo de configuracion_global:', typeof transformedBackupData.configuracion_global);
    console.log('🔍 ¿Es array?', Array.isArray(transformedBackupData.configuracion_global));
    console.log('🔍 Keys de configuracion_global:', transformedBackupData.configuracion_global ? Object.keys(transformedBackupData.configuracion_global) : 'No existe');

    const errors: string[] = [];

    // Función helper para obtener datos del nuevo formato {columnas: [], registros: []}
    const getDataFromTable = (tableData: any, tableName: string): any[] => {
      // Si es el nuevo formato {columnas: [], registros: []}
      if (tableData && typeof tableData === 'object' && 'registros' in tableData) {
        return Array.isArray(tableData.registros) ? tableData.registros : [];
      }
      
      // Si es el formato antiguo (array directo)
      if (Array.isArray(tableData)) {
        return tableData;
      }
      
      // Si es un objeto individual
      if (tableData && typeof tableData === 'object') {
        return [tableData];
      }
      
      return [];
    };

    // Función helper para validar y limpiar datos antes de upsert
    const cleanAndValidateData = (data: any[], tableName: string): any[] => {
      if (!Array.isArray(data)) {
        return [];
      }

      // Filtrar datos nulos o vacíos
      const cleanedData = data.filter(item => item && typeof item === 'object');

      if (cleanedData.length === 0) {
        return [];
      }

      return cleanedData;
    };

    // Orden de restauración para evitar errores de llaves foráneas
    // 1. Configuración Global (no tiene dependencias)
    try {
      if (transformedBackupData.configuracion_global) {
        const configData = cleanAndValidateData(transformedBackupData.configuracion_global, 'configuracion_global');
        console.log(`🔍 Configuración Global: ${configData.length} registros para restaurar`);
        
        if (configData.length > 0) {
          const { error } = await supabase.from('configuracion_global').upsert(configData, { onConflict: 'id' });
          if (error) {
            console.error(`❌ Error en Configuración Global:`, error);
            errors.push(`Configuración: ${error.message}`);
          } else {
            console.log(`✅ Configuración Global: ${configData.length} registros restaurados`);
          }
        }
      }
    } catch (e: any) {
      console.error(`❌ Error crítico en Configuración Global:`, e);
      errors.push(`Configuración: ${e.message}`);
    }

    // 2. Planes (no tiene dependencias críticas)
    try {
      if (transformedBackupData.planes) {
        const plansData = cleanAndValidateData(transformedBackupData.planes, 'planes');
        console.log(`🔍 Planes: ${plansData.length} registros para restaurar`);
        if (plansData.length > 0) {
          // Validar que cada plan tenga las columnas requeridas
          const validatedPlans = plansData.map((plan: any) => {
            const cleaned: any = {};
            // Solo incluir columnas que existan en el objeto
            if (plan.id) cleaned.id = plan.id;
            if (plan.nombre) cleaned.nombre = plan.nombre;
            if (plan.descripcion) cleaned.descripcion = plan.descripcion;
            if (plan.precio !== undefined) cleaned.precio = plan.precio;
            if (plan.tiene_analytics !== undefined) cleaned.tiene_analytics = plan.tiene_analytics;
            if (plan.tiene_inventario !== undefined) cleaned.tiene_inventario = plan.tiene_inventario;
            if (plan.tiene_comisiones !== undefined) cleaned.tiene_comisiones = plan.tiene_comisiones;
            if (plan.tiene_marketing !== undefined) cleaned.tiene_marketing = plan.tiene_marketing;
            if (plan.tiene_nominas !== undefined) cleaned.tiene_nominas = plan.tiene_nominas;
            if (plan.max_usuarios !== undefined) cleaned.max_usuarios = plan.max_usuarios;
            if (plan.max_empleados !== undefined) cleaned.max_empleados = plan.max_empleados;
            if (plan.soporte_prioritario !== undefined) cleaned.soporte_prioritario = plan.soporte_prioritario;
            if (plan.created_at) cleaned.created_at = plan.created_at;
            if (plan.actualizado_en) cleaned.actualizado_en = plan.actualizado_en;
            return cleaned;
          });

          const { error } = await supabase.from('planes').upsert(validatedPlans, { onConflict: 'id' });
          if (error) {
            errors.push(`Planes: ${error.message}`);
          }
        }
      }
    } catch (e: any) {
      errors.push(`Planes: ${e.message}`);
    }

    // 3. Artículos de Ayuda (no tiene dependencias)
    try {
      if (transformedBackupData.articulos_ayuda) {
        const helpData = cleanAndValidateData(transformedBackupData.articulos_ayuda, 'articulos_ayuda');
        if (helpData.length > 0) {
          const { error } = await supabase.from('articulos_ayuda').upsert(helpData, { onConflict: 'id' });
          if (error) {
            errors.push(`Ayuda: ${error.message}`);
          }
        }
      }
    } catch (e: any) {
      errors.push(`Ayuda: ${e.message}`);
    }

    // 4. Usuarios Sistema (empresa_id = null)
    try {
      if (transformedBackupData.usuarios_sistema) {
        const usersData = cleanAndValidateData(transformedBackupData.usuarios_sistema, 'usuarios_sistema');
        // Filtrar solo usuarios globales (empresa_id null)
        const globalUsers = usersData.filter((u: any) => u.empresa_id === null || !u.empresa_id);
        if (globalUsers.length > 0) {
          const { error } = await supabase.from('usuarios_sistema').upsert(globalUsers, { onConflict: 'id' });
          if (error) {
            errors.push(`Usuarios Sistema: ${error.message}`);
          }
        }
      }
    } catch (e: any) {
      errors.push(`Usuarios Sistema: ${e.message}`);
    }

    // 5. Tickets (depende de usuarios)
    try {
      if (transformedBackupData.tickets_soporte) {
        const ticketsData = cleanAndValidateData(transformedBackupData.tickets_soporte, 'tickets_soporte');
        if (ticketsData.length > 0) {
          const { error } = await supabase.from('tickets_soporte').upsert(ticketsData, { onConflict: 'id' });
          if (error) {
            errors.push(`Tickets: ${error.message}`);
          }
        }
      }
    } catch (e: any) {
      errors.push(`Tickets: ${e.message}`);
    }

    // 6. Marketing (no tiene dependencias críticas)
    try {
      if (transformedBackupData.campanas_marketing) {
        const marketingData = cleanAndValidateData(transformedBackupData.campanas_marketing, 'campanas_marketing');
        if (marketingData.length > 0) {
          const { error } = await supabase.from('campanas_marketing').upsert(marketingData, { onConflict: 'id' });
          if (error) {
            errors.push(`Marketing: ${error.message}`);
          }
        }
      }
    } catch (e: any) {
      errors.push(`Marketing: ${e.message}`);
    }

    // Si hubo errores, retornarlos
    if (errors.length > 0) {
      console.error('Errores en restauración:', errors);
      return {
        success: false,
        error: `Errores al restaurar: ${errors.join(', ')}`
      };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'RESTAURAR_SISTEMA_MAESTRO',
        modulo: 'Sistema Maestro',
        detalles: { respaldo_id: respaldoId, nombre_archivo: respaldo.nombre_archivo }
      });
    } catch (e) {
      console.error('Error en auditoría (Restaurar Sistema Maestro):', e);
    }

    return { success: true };

  } catch (error) {
    console.error('Error en restaurarDesdeBDAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado al restaurar'
    };
  }
}

// Server Action para eliminar respaldo (Storage y Base de Datos)
export async function eliminarRespaldoAction(respaldoId: string, nombreArchivo: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 🟢 BACKEND: Rastreo de depuración
    console.log('🟢 BACKEND: Acción recibida para el ID:', respaldoId);
    
    // IMPORTANTE: Usar cliente Admin con Service Role para bypass RLS
    // Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local y producción
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Eliminar archivo del Storage si existe
    try {
      const { error: storageError } = await supabaseAdmin.storage
        .from('respaldos')
        .remove([nombreArchivo]);
      
      // 🟢 BACKEND: Resultado Storage
      console.log('🟢 BACKEND: Resultado Storage:', storageError || 'Éxito');
      
      if (storageError) {
        console.warn('No se pudo eliminar archivo del Storage:', storageError);
        // Continuamos con la eliminación de la BD aunque falle el Storage
      }
    } catch (storageErr) {
      console.warn('Error al intentar eliminar del Storage:', storageErr);
      // Continuamos con la eliminación de la BD
    }

    // 2. Eliminar registro de la base de datos
    const { error: dbError } = await supabaseAdmin
      .from('respaldos_datos')
      .delete()
      .eq('id', respaldoId);

    // 🟢 BACKEND: Resultado BD
    console.log('🟢 BACKEND: Resultado BD:', dbError || 'Éxito');

    if (dbError) {
      throw new Error(`Error al eliminar respaldo de la base de datos: ${dbError.message}`);
    }

    return {
      success: true
    };

  } catch (error) {
    console.error('Error en eliminarRespaldoAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar respaldo'
    };
  }
}
