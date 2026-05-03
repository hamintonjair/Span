'use server';

import { createClient } from '@/lib/supabase/server';
import { enviarCorreoRecuperacion } from '@/services/email.service';
import bcrypt from 'bcryptjs';

/**
 * Server Action para solicitar recuperación de contraseña
 */
export async function solicitarRecuperacion(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Verificar si el email existe en usuarios_sistema
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios_sistema')
      .select('id, nombre, email')
      .eq('email', email)
      .single();

    if (usuarioError || !usuario) {
      console.log('Usuario no encontrado para email:', email);
      return {
        success: false,
        error: 'No se encontró ninguna cuenta asociada a este correo electrónico.'
      };
    }

    // Generar token aleatorio
    const resetToken = crypto.randomUUID();
    
    // Calcular expiración (1 hora desde ahora)
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + 1);

    // Guardar token y expiración en la tabla usuarios_sistema
    const { error: updateError } = await supabase
      .from('usuarios_sistema')
      .update({
        reset_token: resetToken,
        reset_token_expires: expiracion.toISOString()
      })
      .eq('id', usuario.id);

    if (updateError) {
      throw new Error(`Error al guardar token de recuperación: ${updateError.message}`);
    }

    // Enviar correo con el enlace de recuperación
    const emailResult = await enviarCorreoRecuperacion(
      usuario.email,
      usuario.nombre,
      resetToken
    );

    if (!emailResult.success) {
      console.warn('No se pudo enviar el correo de recuperación:', emailResult.error);
      // No bloqueamos el proceso por un error de correo
    }

    return {
      success: true,
      error: 'Si el correo está registrado, recibirás un enlace de recuperación'
    };

  } catch (error) {
    console.error('Error en solicitarRecuperacion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al solicitar recuperación'
    };
  }
}

/**
 * Server Action para cambiar contraseña con token
 */
export async function cambiarPasswordConToken(
  token: string, 
  nuevaPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Buscar usuario con ese token y que no haya expirado
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios_sistema')
      .select('id, nombre, email, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: 'Token de recuperación inválido'
      };
    }

    // Verificar que el token no haya expirado
    if (usuario.reset_token_expires && new Date(usuario.reset_token_expires) < new Date()) {
      return {
        success: false,
        error: 'El token de recuperación ha expirado. Por favor, solicita uno nuevo.'
      };
    }

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar password_hash y limpiar los campos reset_token
    const { error: updateError } = await supabase
      .from('usuarios_sistema')
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null
      })
      .eq('id', usuario.id);

    if (updateError) {
      throw new Error(`Error al actualizar contraseña: ${updateError.message}`);
    }

    console.log('Contraseña actualizada exitosamente para usuario:', usuario.email);

    return {
      success: true
    };

  } catch (error) {
    console.error('Error en cambiarPasswordConToken:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al cambiar contraseña'
    };
  }
}

/**
 * Server Action para verificar si un token es válido
 */
export async function verificarTokenRecuperacion(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Buscar usuario con ese token y que no haya expirado
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios_sistema')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: 'Token de recuperación inválido'
      };
    }

    // Verificar que el token no haya expirado
    if (usuario.reset_token_expires && new Date(usuario.reset_token_expires) < new Date()) {
      return {
        success: false,
        error: 'El token de recuperación ha expirado'
      };
    }

    return {
      success: true
    };

  } catch (error) {
    console.error('Error en verificarTokenRecuperacion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al verificar token'
    };
  }
}
