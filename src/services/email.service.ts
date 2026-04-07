'use server';

import { sendEmail, generateWelcomeTemplate, generatePasswordResetTemplate, generateReceiptTemplate } from '@/lib/mail-simple';
import { createClient } from '@/lib/supabase/server';

/**
 * Envía correo de bienvenida con credenciales temporales
 */
export async function sendWelcomeEmail(
  empresaNombre: string,
  userEmail: string,
  tempPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
    
    const htmlContent = generateWelcomeTemplate(
      empresaNombre,
      userEmail,
      tempPassword,
      loginUrl
    );

    const result = await sendEmail({
      to: userEmail,
      subject: `🎉 Bienvenido a BeautyPro - ${empresaNombre}`,
      html: htmlContent,
      text: `Bienvenido a BeautyPro. Tu contraseña temporal es: ${tempPassword}. Accede en: ${loginUrl}`
    });

    return result;

  } catch (error) {
    console.error('Error en sendWelcomeEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar correo de bienvenida'
    };
  }
}

/**
 * Envía correo de recuperación de contraseña
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    // Obtener información del usuario y empresa
    const { data: user, error: userError } = await supabase
      .from('perfiles')
      .select('nombre')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      };
    }

    const htmlContent = generatePasswordResetTemplate(
      user.nombre,
      resetUrl
    );

    const result = await sendEmail({
      to: userEmail,
      subject: '🔑 Restablecimiento de Contraseña - BeautyPro',
      html: htmlContent,
      text: `Restablece tu contraseña en: ${resetUrl}`
    });

    return result;

  } catch (error) {
    console.error('Error en sendPasswordResetEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar correo de recuperación'
    };
  }
}

/**
 * Envía recibo digital al cliente
 */
export async function sendReceiptEmail(
  clienteEmail: string,
  clienteNombre: string,
  empresaNombre: string,
  ventaData: {
    id: string;
    fecha: string;
    items: Array<{
      nombre: string;
      cantidad: number;
      precio_unitario: number;
      total: number;
    }>;
    subtotal: number;
    impuestos: number;
    total: number;
    metodo_pago: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = generateReceiptTemplate(
      clienteNombre,
      empresaNombre,
      ventaData
    );

    const result = await sendEmail({
      to: clienteEmail,
      subject: `🧾 Recibo Digital - ${empresaNombre} #${ventaData.id}`,
      html: htmlContent,
      text: `Recibo de tu compra en ${empresaNombre} por $${ventaData.total.toFixed(2)}`
    });

    return result;

  } catch (error) {
    console.error('Error en sendReceiptEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar recibo'
    };
  }
}

/**
 * Solicita restablecimiento de contraseña (Server Action)
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Obtener información del empleado
    const { data: empleado, error: empleadoError } = await supabase
      .from('perfiles')
      .select('id, nombre, empresa_id')
      .eq('email', email)
      .single();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Correo electrónico inválido'
      };
    }

    // Verificar si el usuario existe
    const { data: user, error: userError } = await supabase
      .from('perfiles')
      .select('id, nombre, empresa_id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return {
        success: true,
        error: 'Si el correo está registrado, recibirás un enlace de restablecimiento'
      };
    }

    // Generar token de restablecimiento con Supabase
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (resetError) {
      throw new Error(`Error al generar token: ${resetError.message}`);
    }

    // Enviar correo con el enlace
    const result = await sendPasswordResetEmail(email, 'token-generado-por-supabase');

    return result;

  } catch (error) {
    console.error('Error en requestPasswordReset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al solicitar restablecimiento'
    };
  }
}

/**
 * Envía notificación de suscripción vencida
 */
export async function sendSubscriptionExpiredEmail(
  empresaNombre: string,
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = `
      <h2>⚠️ Suscripción Vencida</h2>
      
      <p>
        Estimado administrador de <strong>${empresaNombre}</strong>,
      </p>
      
      <div class="info-box">
        <h3>📅 Estado de tu Suscripción</h3>
        <p>
          Tu suscripción a BeautyPro ha vencido. Para continuar usando el sistema, 
          es necesario renovar tu plan.
        </p>
      </div>
      
      <p>
        Mientras no renueves, tu acceso estará limitado únicamente a:
      </p>
      
      <ul style="color: #4B5563; margin: 20px 0; padding-left: 20px;">
        <li>Ver historial de facturas</li>
        <li>Contactar a soporte técnico</li>
        <li>Exportar tus datos</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/facturacion" class="button">
          Renovar Suscripción
        </a>
      </div>
      
      <p>
        Si tienes alguna pregunta sobre tu factura o método de pago, 
        nuestro equipo de soporte está disponible para ayudarte.
      </p>
      
      <p style="text-align: center; margin-top: 30px;">
        <em>Gracias por usar BeautyPro</em>
      </p>
    `;

    const result = await sendEmail({
      to: adminEmail,
      subject: '⚠️ Tu Suscripción a BeautyPro ha Vencido',
      html: htmlContent
    });

    return result;

  } catch (error) {
    console.error('Error en sendSubscriptionExpiredEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar notificación de vencimiento'
    };
  }
}

/**
 * Envía notificación de préstamo próximo a vencer
 */
export async function sendLoanDueReminderEmail(
  empleadoNombre: string,
  empleadoEmail: string,
  empresaNombre: string,
  montoPendiente: number,
  fechaVencimiento: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = `
      <h2>💰 Recordatorio de Préstamo</h2>
      
      <p>
        Estimado(a) <strong>${empleadoNombre}</strong>,
      </p>
      
      <div class="info-box">
        <h3>📅 Tu Préstamo Próximo a Vencer</h3>
        <p>
          Tienes un préstamo con <strong>${empresaNombre}</strong> que vence pronto:<br>
          <strong>Saldo pendiente:</strong> $${montoPendiente.toFixed(2)}<br>
          <strong>Fecha de vencimiento:</strong> ${new Date(fechaVencimiento).toLocaleDateString('es-MX')}
        </p>
      </div>
      
      <p>
        Te recomendamos realizar el pago a tiempo para evitar recargos 
        y mantener un buen historial crediticio.
      </p>
      
      <p>
        Si tienes alguna pregunta sobre tu préstamo o necesitas 
        acordar un plan de pago, por favor contacta al administrador del salón.
      </p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/mis-prestamos" class="button">
          Ver Mis Préstamos
        </a>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <em>El equipo de ${empresaNombre}</em>
      </p>
    `;

    const result = await sendEmail({
      to: empleadoEmail,
      subject: '💰 Recordatorio: Tu Préstamo Próximo a Vencer',
      html: htmlContent
    });

    return result;

  } catch (error) {
    console.error('Error en sendLoanDueReminderEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar recordatorio de préstamo'
    };
  }
}
