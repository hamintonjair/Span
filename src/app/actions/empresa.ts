'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache'; // <-- Importante agregar esto al inicio del archivo
import { registrarLogAdmin } from '@/lib/auditAdmin';
// Configuración del cliente de Supabase con service_role_key
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

// Tipos para los datos de actualización
interface UpdateEmpresaData {
  nombre?: string;
  nit?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  mensaje_ticket?: string;
  logo_url?: string | null;
}

// Server Action para actualizar empresa con privilegios de administrador
// Server Action para actualizar empresa con privilegios de administrador
export async function actualizarEmpresaAction(
  empresaId: string,
  data: UpdateEmpresaData,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar datos de entrada
    if (!empresaId) {
      return { success: false, error: 'ID de empresa es requerido' };
    }

    if (!adminId || !adminId.trim()) {
      return { success: false, error: 'ID de administrador es requerido' };
    }

    if (!data || Object.keys(data).length === 0) {
      return { success: false, error: 'No hay datos para actualizar' };
    }

    // Preparar datos de actualización con timestamp
    const updateData = {
      ...data,
      actualizado_en: new Date().toISOString()
    };


    // Ejecutar actualización y OBLIGAR a que devuelva la fila modificada usando .select()
    const { data: updatedRow, error } = await supabaseAdmin
      .from('empresas')
      .update(updateData)
      .eq('id', empresaId)
      .select(); // <-- CRUCIAL: Esto nos dirá si realmente se afectó alguna fila

    if (error) {
      console.error('Server Action - Error en actualización:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la empresa'
      };
    }

    // Comprobar si realmente se encontró y actualizó el registro
    if (!updatedRow || updatedRow.length === 0) {
      console.warn('Server Action - No se encontró la empresa con ID:', empresaId);
      return {
        success: false,
        error: 'No se encontró la empresa en la base de datos. Verifica el ID.'
      };
    }


    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'EDITAR_EMPRESA',
        modulo: 'Empresas',
        detalles: { empresa_id: empresaId, cambios: data }
      });
    } catch (e) {
      console.error('Error en auditoría global:', e);
    }

    // Limpiar la caché de la página de configuración para que muestre los datos nuevos
    revalidatePath('/configuracion');
    revalidatePath('/admin/empresas');

    return { success: true };

  } catch (error) {
    console.error('Server Action - Error inesperado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado al actualizar la empresa'
    };
  }
}

// Server Action para obtener datos de empresa (si se necesita para validación)
export async function obtenerEmpresaAction(
  empresaId: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    if (!empresaId) {
      return { success: false, error: 'ID de empresa es requerido' };
    }

    const { error, data } = await supabaseAdmin
      .from('empresas')
      .select(`
        id, 
        nombre, 
        nit, 
        telefono, 
        direccion, 
        ciudad, 
        mensaje_ticket, 
        logo_url,
        fecha_vencimiento,
        creado_en,
        actualizado_en,
        planes (
          id,
          nombre,
          descripcion,
          precio,
          tiene_analytics,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          tiene_nominas,
          max_usuarios,
          max_empleados,
          soporte_prioritario
        )
      `)
      .eq('id', empresaId)
      .single();

    if (error) {
      console.error('Server Action - Error obteniendo empresa:', error);
      return { 
        success: false, 
        error: error.message || 'Error al obtener la empresa' 
      };
    }

    // Retornar solo Plain JSON simple - extraer solo los campos necesarios
    const simpleData = {
      id: data?.id,
      nombre: data?.nombre,
      nit: data?.nit,
      telefono: data?.telefono,
      direccion: data?.direccion,
      ciudad: data?.ciudad,
      mensaje_ticket: data?.mensaje_ticket,
      logo_url: data?.logo_url,
      fecha_vencimiento: data?.fecha_vencimiento,
      creado_en: data?.creado_en,
      actualizado_en: data?.actualizado_en
    };

    return { 
      success: true, 
      data: simpleData
    };

  } catch (error) {
    console.error('Server Action - Error inesperado obteniendo empresa:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener la empresa' 
    };
  }
}

// Server Action para obtener todas las empresas (para admin global)
export async function obtenerTodasLasEmpresasAction(): Promise<{ 
  success: boolean; 
  error?: string; 
  data?: any[] 
}> {
  try {

    const { error, data } = await supabaseAdmin
      .from('empresas')
      .select(`
        id, nombre, nit, telefono, direccion, ciudad, 
        estado_suscripcion, fecha_vencimiento, estado, creado_en,
        planes(nombre, precio, max_empleados),
        usuarios_sistema(id, nombre, email, rol)
      `)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Server Action - Error obteniendo todas las empresas:', error);
      return { 
        success: false, 
        error: error.message || 'Error al obtener las empresas' 
      };
    }

    // Procesar datos para cada empresa
    const empresasProcesadas = (data || []).map((empresa: any) => {
      // Calcular cantidad de empleados basados en usuarios_sistema
      const cantidad_empleados = empresa.usuarios_sistema ? empresa.usuarios_sistema.length : 0;
      
      // Encontrar al dueño (usuario con rol admin_empresa)
      const usuarioAdmin = empresa.usuarios_sistema?.find((usuario: any) => usuario.rol === 'admin_empresa');
      const dueño = usuarioAdmin || null;

      return {
        ...empresa,
        cantidad_empleados,
        dueño
      };
    });


    // Revalidar cache para asegurar datos frescos
    revalidatePath('/admin/empresas');

    return { 
      success: true, 
      data: empresasProcesadas 
    };

  } catch (error) {
    console.error('Server Action - Error inesperado obteniendo empresas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener las empresas' 
    };
  }
}

// Server Action para registrar empresa desde admin global
export async function registrarEmpresaDesdeAdmin(
  datos: {
    nombreDueño: string;
    email: string;
    password: string;
    nombreNegocio: string;
    telefono: string;
    ciudad: string;
  },
  adminId: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Validación de adminId
    if (!adminId || !adminId.trim()) {
      return { success: false, error: 'ID de administrador es requerido' };
    }



    // Validaciones básicas
    if (!datos.nombreDueño?.trim()) {
      return { success: false, error: 'El nombre del dueño es requerido' };
    }
    if (!datos.email?.trim()) {
      return { success: false, error: 'El email es requerido' };
    }
    if (!datos.password?.trim()) {
      return { success: false, error: 'La contraseña es requerida' };
    }
    if (!datos.nombreNegocio?.trim()) {
      return { success: false, error: 'El nombre del negocio es requerido' };
    }

    // Validar formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(datos.email)) {
      return { success: false, error: 'El email no es válido' };
    }

    // Validar longitud de contraseña
    if (datos.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    // Verificar que el email no exista
    const { data: emailExistente, error: emailError } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('email')
      .eq('email', datos.email.toLowerCase().trim())
      .maybeSingle();

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Error verificando email:', emailError);
      return { success: false, error: 'Error al verificar el email' };
    }

    if (emailExistente) {
      return { success: false, error: 'Este email ya está registrado' };
    }

    // Encriptar contraseña con bcrypt
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(datos.password, 10);

    // Obtener plan básico
    const { data: planBasico, error: planError } = await supabaseAdmin
      .from('planes')
      .select('id')
      .eq('nombre', 'Básico')
      .single();

    if (planError || !planBasico) {
      return { success: false, error: 'No se encontró el plan básico' };
    }

    // Calcular fecha de vencimiento (15 días desde hoy)
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);

    // Crear empresa
    const { data: empresaData, error: empresaError } = await supabaseAdmin
      .from('empresas')
      .insert({
        nombre: datos.nombreNegocio,
        telefono: datos.telefono || null,
        ciudad: datos.ciudad || null,
        plan_id: planBasico.id,
        estado_suscripcion: 'activa',
        fecha_vencimiento: fechaVencimiento.toISOString(),
        estado: 'activo'
      } as any)
      .select()
      .single();

    if (empresaError) {
      console.error('Error creando empresa:', empresaError);
      return { success: false, error: `Error al crear empresa: ${empresaError.message}` };
    }

    const empresaId = empresaData?.id;
    if (!empresaId) {
      return { success: false, error: 'No se pudo obtener el ID de la empresa creada' };
    }

    // Crear usuario del sistema
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios_sistema')
      .insert({
        id: crypto.randomUUID(),
        nombre: datos.nombreDueño,
        email: datos.email.toLowerCase().trim(),
        password_hash: hashedPassword,
        rol: 'admin_empresa',
        empresa_id: empresaId,
        activo: true
      } as any);

    if (usuarioError) {
      // Limpiar empresa si falla el usuario
      await supabaseAdmin.from('empresas').delete().eq('id', empresaId);
      console.error('Error creando usuario:', usuarioError);
      return { success: false, error: `Error al crear usuario: ${usuarioError.message}` };
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'CREAR_EMPRESA_MANUAL',
        modulo: 'Empresas',
        detalles: {
          nombre_salon: datos.nombreNegocio,
          nombre_dueño: datos.nombreDueño,
          email_dueño: datos.email
        }
      });
    } catch (e) {
      console.error('Error silencioso en auditoría global (Crear Empresa):', e);
    }

    // Enviar correo de bienvenida (no bloqueante)
    try {
      const { enviarCorreoBienvenidaAction } = await import('./email');
      await enviarCorreoBienvenidaAction(
        datos.email,
        datos.nombreDueño,
        datos.password,
        datos.nombreNegocio
      );
    } catch (emailError) {
      console.warn('No se pudo enviar el correo de bienvenida:', emailError);
      // No bloquear el proceso si falla el email
    }


    // Revalidar la página de admin para mostrar la nueva empresa
    revalidatePath('/admin/empresas');

    return { 
      success: true, 
      data: { empresaId, empresaNombre: datos.nombreNegocio }
    };

  } catch (error) {
    console.error('Server Action - Error inesperado registrando empresa:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al registrar la empresa' 
    };
  }
}

/**
 * Actualiza la contraseña de un empleado usando el sistema JWT personalizado
 */
export async function actualizarClaveEmpleadoAction(
  empleadoId: string,
  nuevaClave: string
): Promise<{ success: boolean; error?: string }> {
  try {

    // Validaciones básicas
    if (!empleadoId || !empleadoId.trim()) {
      return { 
        success: false, 
        error: 'El ID del empleado es requerido' 
      };
    }

    if (!nuevaClave || !nuevaClave.trim()) {
      return { 
        success: false, 
        error: 'La nueva contraseña es requerida' 
      };
    }

    if (nuevaClave.length < 6) {
      return { 
        success: false, 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      };
    }

    // Hashear la nueva contraseña con bcrypt
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(nuevaClave, 10);

    // Actualizar contraseña en la tabla usuarios_sistema usando supabaseAdmin
    const { error } = await supabaseAdmin
      .from('usuarios_sistema')
      .update({ 
        password_hash: hashedPassword,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', empleadoId);

    if (error) {
      console.error('Server Action - Error actualizando contraseña empleado:', error);
      return { 
        success: false, 
        error: error.message || 'Error al actualizar la contraseña del empleado' 
      };
    }


    // Revalidar cache para asegurar datos frescos
    revalidatePath('/admin/usuarios');

    return { success: true };

  } catch (error) {
    console.error('Server Action - Error inesperado actualizando clave empleado:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al actualizar la contraseña' 
    };
  }
}
