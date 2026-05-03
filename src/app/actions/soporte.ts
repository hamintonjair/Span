'use server';

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyJWT } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';

export async function crearTicketSoporteAction(formData: FormData, userId: string, empresaId: string) {
  try {
    const supabase = createAdminClient();

    // Extraer datos del formulario
    const asunto = formData.get('asunto') as string;
    const descripcion = formData.get('descripcion') as string;
    const prioridad = formData.get('prioridad') as 'baja' | 'media' | 'alta';

    // Validaciones básicas
    if (!asunto || !descripcion || !prioridad) {
      return {
        success: false,
        error: 'Todos los campos son requeridos'
      };
    }

    if (!['baja', 'media', 'alta'].includes(prioridad)) {
      return {
        success: false,
        error: 'Prioridad inválida'
      };
    }

    // Insertar ticket en la base de datos
    const { data, error } = await supabase
      .from('tickets_soporte')
      .insert({
        asunto: asunto.trim(),
        descripcion: descripcion.trim(),
        estado: 'abierto',
        prioridad: prioridad,
        empresa_id: empresaId,
        usuario_creador_id: userId,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creando ticket:', error);
      return {
        success: false,
        error: 'Error al crear el ticket: ' + error.message
      };
    }


    return {
      success: true,
      data: data
    };

  } catch (error) {
    console.error('Error en crearTicketSoporteAction:', error);
    return {
      success: false,
      error: 'Error inesperado al crear el ticket'
    };
  }
}

export async function obtenerTicketsEmpresaAction() {
  try {
    // 1. Extraer token de la cookie
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      console.error('❌ No se encontró token en las cookies');
      return {
        success: false,
        error: 'No autorizado - token no encontrado'
      };
    }

    // 2. Verificar y extraer payload del JWT
    const payload = await verifyJWT(token);
    
    if (!payload) {
      console.error('❌ Token inválido o expirado');
      return {
        success: false,
        error: 'No autorizado - token inválido'
      };
    }

    // 3. Validar que empresa_id exista en el payload
    if (!payload.empresa_id) {
      console.error('❌ empresa_id no encontrado en el payload del JWT');
      return {
        success: false,
        error: 'No autorizado - empresa_id no encontrado'
      };
    }

    
    // 4. Usar supabaseAdmin para bypass RLS
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('tickets_soporte')
      .select(`
        *,
        creador:usuarios_sistema!tickets_soporte_usuario_creador_id_fkey(nombre),
        asignado:usuarios_sistema!tickets_soporte_asignado_a_fkey(nombre)
      `)
      .eq('empresa_id', payload.empresa_id)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo tickets:', error);
      return {
        success: false,
        error: 'Error al obtener los tickets: ' + error.message
      };
    }


    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('❌ Error en obtenerTicketsEmpresaAction:', error);
    return {
      success: false,
      error: 'Error inesperado al obtener los tickets'
    };
  }
}

export async function obtenerMensajesTicketAction(ticketId: string) {
  try {
    // Desactivar caché para datos en tiempo real
    noStore();
    
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('mensajes_ticket')
      .select(`
        *,
        autor:usuarios_sistema!mensajes_ticket_usuario_id_fkey(nombre)
      `)
      .eq('ticket_id', ticketId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      return {
        success: false,
        error: 'Error al obtener los mensajes: ' + error.message
      };
    }


    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('❌ Error en obtenerMensajesTicketAction:', error);
    return {
      success: false,
      error: 'Error inesperado al obtener los mensajes'
    };
  }
}

export async function enviarMensajeTicketAction(ticketId: string, mensaje: string, userId: string, esStaff: boolean) {
  try {
    // Verificación de payload

    if (!ticketId || !userId || !mensaje?.trim()) {
      console.error('❌ Payload inválido:', { ticketId, userId, mensaje });
      return {
        success: false,
        error: 'Datos incompletos para enviar el mensaje'
      };
    }

    const supabase = createAdminClient();

    // Verificar el estado actual del ticket antes de permitir el envío
    const { data: ticketData } = await supabase
      .from('tickets_soporte')
      .select('estado')
      .eq('id', ticketId)
      .single();

    if (ticketData?.estado === 'resuelto') {
      return { 
        success: false, 
        error: 'Este ticket ya fue resuelto y no admite nuevos mensajes.' 
      };
    }

    const { data, error } = await supabase
      .from('mensajes_ticket')
      .insert({
        ticket_id: ticketId,
        mensaje: mensaje.trim(),
        usuario_id: userId,
        es_staff: esStaff,
        creado_en: new Date().toISOString()
      })
      .select(`
        *,
        autor:usuarios_sistema!mensajes_ticket_usuario_id_fkey(nombre)
      `)
      .single();

    if (error) {
      console.error('❌ Error real en BD al enviar mensaje:', error);
      return {
        success: false,
        error: error.message || 'Error al guardar el mensaje en la base de datos'
      };
    }

    
    // Limpiar caché de las rutas de soporte
    revalidatePath('/admin/soporte');
    revalidatePath('/dashboard/soporte');
    
    return {
      success: true,
      data: data
    };

  } catch (error: any) {
    console.error('❌ Error inesperado en enviarMensajeTicketAction:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al enviar el mensaje'
    };
  }
}

export async function actualizarEstadoTicketAction(ticketId: string, nuevoEstado: string) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('tickets_soporte')
      .update({
        estado: nuevoEstado,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando estado:', error);
      return {
        success: false,
        error: 'Error al actualizar el estado del ticket'
      };
    }


    return {
      success: true,
      data: data
    };

  } catch (error) {
    console.error('Error en actualizarEstadoTicketAction:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar el estado'
    };
  }
}

export async function obtenerStaffTecnicoAction() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('id, nombre, rol')
      .in('rol', ['soporte', 'admin_global'])
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo staff técnico:', error);
      return {
        success: false,
        error: 'Error al obtener el staff técnico: ' + error.message
      };
    }


    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    console.error('Error en obtenerStaffTecnicoAction:', error);
    return {
      success: false,
      error: 'Error inesperado al obtener el staff técnico'
    };
  }
}

export async function actualizarAsignacionTicketAction(
  ticketId: string,
  asignadoA: string | null
) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('tickets_soporte')
      .update({
        asignado_a: asignadoA,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando asignación:', error);
      return {
        success: false,
        error: 'Error al actualizar la asignación: ' + error.message
      };
    }


    return {
      success: true,
      data: data
    };

  } catch (error: any) {
    console.error('Error en actualizarAsignacionTicketAction:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar la asignación'
    };
  }
}
