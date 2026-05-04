'use server';

import { sendEmail, generateWelcomeTemplate, generatePasswordResetTemplate, generateReceiptTemplate } from '@/lib/mail-simple';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// Inicializar cliente de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía correo de recuperación de contraseña usando Resend
 */
export async function enviarCorreoRecuperacion(
  email: string,
  nombre: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    // Obtener nombre del titular desde configuracion_global
    let titular = 'Span'; // valor por defecto
    try {
      const supabase = createClient();
      const { data } = await supabase
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
    
    // HTML profesional para el correo de recuperación
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña - ${titular}</title>
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
          .reset-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 25px 0;
            border-radius: 5px;
          }
          .reset-box h3 {
            color: #856404;
            margin-top: 0;
          }
          .reset-button {
            display: inline-block;
            background: #F59E0B;
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: 600;
            text-align: center;
            margin: 30px 0;
          }
          .reset-button:hover {
            transform: translateY(-2px);
          }
          .security-info {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-size: 14px;
            color: #6c757d;
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
          <h1>Recuperación de Contraseña</h1>
          <p>Recupera el acceso a tu cuenta</p>
        </div>
        
        <div class="content">
          <p>Estimado(a) <strong>${nombre}</strong>,</p>
          
          <p>
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en 
            <strong>${titular}</strong>. Si no realizaste esta solicitud, puedes ignorar este correo 
            de forma segura.
          </p>
          
          <div class="reset-box">
            <h3>Información Importante</h3>
            <p>
              Este enlace de recuperación <strong>expirará en 1 hora</strong> por tu seguridad. 
              Después de ese tiempo, deberás solicitar un nuevo enlace de recuperación.
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">
              Restablecer mi Contraseña
            </a>
          </div>
          
          <div class="security-info">
            <h4>Consejos de Seguridad:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Usa una contraseña única y difícil de adivinar</li>
              <li>No compartas tu contraseña con nadie</li>
              <li>Evita usar la misma contraseña en otros sitios</li>
              <li>Cambia tu contraseña periódicamente</li>
            </ul>
          </div>
          
          <p>
            Si tienes problemas para hacer clic en el botón, copia y pega el siguiente 
            enlace en tu navegador:
          </p>
          
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px;">
            ${resetUrl}
          </p>
          
          <div class="footer">
            <p>Si no solicitaste esta recuperación, tu cuenta sigue segura.</p>
            <p>El equipo de ${titular}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Lógica condicional para email de desarrollo vs producción
    const isDevelopment = process.env.NODE_ENV === 'development';
    const emailFrom = process.env.RESEND_FROM || `${titular} <onboarding@resend.dev>`;
    
    // En desarrollo con email de testing, solo permitir enviar al email del desarrollador
    if (isDevelopment && emailFrom.includes('onboarding@resend.dev') && email !== 'hamintonjair@gmail.com') {
      console.log('⚠️ En desarrollo, solo se puede enviar a hamintonjair@gmail.com con email de testing');
      return {
        success: false,
        error: 'En desarrollo, solo se permite enviar al email del desarrollador (hamintonjair@gmail.com)'
      };
    }

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [email],
      subject: `Recuperación de Contraseña - ${titular}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('Correo de recuperación enviado exitosamente:', data);
    return { success: true };

  } catch (error) {
    console.error('Error en enviarCorreoRecuperacion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar correo de recuperación'
    };
  }
}

/**
 * Envía correo de bienvenida con credenciales usando Resend
 */
export async function enviarCorreoBienvenida(
  email: string,
  nombre: string,
  passwordPlano: string,
  nombreEmpresa: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
    
    // Obtener nombre del titular desde configuracion_global
    let titular = 'Span'; // valor por defecto
    try {
      const supabase = createClient();
      const { data } = await supabase
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
    
    // HTML profesional para el correo de bienvenida
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a ${titular}</title>
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
          .credentials-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 5px;
          }
          .credentials-box h3 {
            color: #667eea;
            margin-top: 0;
          }
          .credential-item {
            margin: 10px 0;
            padding: 10px;
            background: white;
            border-radius: 5px;
            border: 1px solid #e9ecef;
          }
          .credential-label {
            font-weight: 600;
            color: #495057;
            font-size: 14px;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background: #f1f3f4;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 5px;
            display: inline-block;
          }
          .login-button {
            display: inline-block;
            background: #5B21B6;
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: 600;
            text-align: center;
            margin: 30px 0;
          }
          .login-button:hover {
            transform: translateY(-2px);
          }
          .features {
            margin: 30px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            margin: 15px 0;
          }
          .feature-icon {
            font-size: 20px;
            margin-right: 15px;
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
          <h1>¡Bienvenido al Sistema!</h1>
          <p>Tu salón de belleza ha sido registrado exitosamente</p>
        </div>
        
        <div class="content">
          <p>Estimado(a) <strong>${nombre}</strong>,</p>
          
          <p>
            Nos complace darte la bienvenida a <strong>${titular}</strong>. Tu salón 
            <strong>${nombreEmpresa}</strong> ha sido registrado exitosamente en nuestra plataforma.
          </p>
          
          <div class="credentials-box">
            <h3> credenciales de Acceso</h3>
            <p>Guarda esta información de forma segura. Te permitirá acceder al sistema:</p>
            
            <div class="credential-item">
              <div class="credential-label">Correo Electrónico</div>
              <div class="credential-value">${email}</div>
            </div>
            
            <div class="credential-item">
              <div class="credential-label">Contraseña Temporal</div>
              <div class="credential-value">${passwordPlano}</div>
            </div>
            
            <p style="margin-top: 15px; font-size: 14px; color: #6c757d;">
              <strong>Importante:</strong> Te recomendamos cambiar esta contraseña en tu primer inicio de sesión.
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="login-button">
              Ir al Sistema ${titular}
            </a>
          </div>
          
          <div class="features">
            <h3>¿Qué puedes hacer con ${titular}?</h3>
            <div class="feature-item">
              <span class="feature-icon"> calendar</span>
              <div>
                <strong>Gestión de Citas</strong><br>
                <small>Organiza el agenda de tus estilistas y clientes</small>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon"> payments</span>
              <div>
                <strong>Control de Caja</strong><br>
                <small>Lleva un registro detallado de ingresos y egresos</small>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon"> shopping_cart</span>
              <div>
                <strong>Punto de Venta</strong><br>
                <small>Vende productos y servicios con upselling inteligente</small>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon"> people</span>
              <div>
                <strong>Gestión de Empleados</strong><br>
                <small>Controla nóminas, comisiones y préstamos</small>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon"> analytics</span>
              <div>
                <strong>Reportes</strong><br>
                <small>Toma decisiones basadas en datos reales</small>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>¡Gracias por confiar en ${titular} para hacer crecer tu negocio!</p>
            <p>Si tienes alguna pregunta, nuestro equipo de soporte está disponible para ayudarte.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Lógica condicional para email de desarrollo vs producción
    const isDevelopment = process.env.NODE_ENV === 'development';
    const emailFrom = process.env.RESEND_FROM || `${titular} <onboarding@resend.dev>`;
    
    // En desarrollo con email de testing, solo permitir enviar al email del desarrollador
    if (isDevelopment && emailFrom.includes('onboarding@resend.dev') && email !== 'hamintonjair@gmail.com') {
      console.log('⚠️ En desarrollo, solo se puede enviar a hamintonjair@gmail.com con email de testing');
      return {
        success: false,
        error: 'En desarrollo, solo se permite enviar al email del desarrollador (hamintonjair@gmail.com)'
      };
    }

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [email],
      subject: `¡Bienvenido a ${titular} - Credenciales de Acceso para ${nombreEmpresa}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('Correo enviado exitosamente:', data);
    return { success: true };

  } catch (error) {
    console.error('Error en enviarCorreoBienvenida:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar correo de bienvenida'
    };
  }
}

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
 * Envía contraseña temporal a usuario
 */
export async function enviarContraseñaTemporal(
  email: string,
  nombre: string,
  contraseñaTemporal: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
    
    // Obtener nombre del titular desde configuracion_global
    let titular = 'Span'; // valor por defecto
    try {
      const supabase = createClient();
      const { data } = await supabase
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
    
    // HTML profesional para el correo de contraseña temporal
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Temporal - ${titular}</title>
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
          .password-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 25px 0;
            border-radius: 5px;
          }
          .password-box h3 {
            color: #856404;
            margin-top: 0;
          }
          .password-display {
            background: white;
            border: 2px solid #F59E0B;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
            text-align: center;
          }
          .password-value {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            color: #F59E0B;
            letter-spacing: 2px;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            display: inline-block;
          }
          .login-button {
            display: inline-block;
            background: #5B21B6;
            color: white !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: 600;
            text-align: center;
            margin: 30px 0;
          }
          .login-button:hover {
            transform: translateY(-2px);
          }
          .security-info {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-size: 14px;
            color: #6c757d;
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
          <h1>Contraseña Temporal Generada</h1>
          <p>Acceso a tu cuenta</p>
        </div>
        
        <div class="content">
          <p>Estimado(a) <strong>${nombre}</strong>,</p>
          
          <p>
            El administrador del sistema ha generado una nueva contraseña temporal para tu cuenta en 
            <strong>${titular}</strong>. Puedes usar esta contraseña para acceder al sistema.
          </p>
          
          <div class="password-box">
            <h3>🔑 Tu Contraseña Temporal</h3>
            <p>
              Esta contraseña te permitirá acceder al sistema de inmediato. 
              Te recomendamos cambiarla por una contraseña personal en tu primer inicio de sesión.
            </p>
            
            <div class="password-display">
              <div class="password-value">${contraseñaTemporal}</div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="login-button">
              Ir al Sistema ${titular}
            </a>
          </div>
          
          <div class="security-info">
            <h4>🔐 Información de Seguridad:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Esta contraseña es temporal y debe ser cambiada</li>
              <li>No compartas esta contraseña con nadie</li>
              <li>Usa una contraseña única y difícil de adivinar</li>
              <li>Si no solicitaste este cambio, contacta al administrador</li>
            </ul>
          </div>
          
          <p>
            Si tienes problemas para hacer clic en el botón, copia y pega el siguiente 
            enlace en tu navegador:
          </p>
          
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px;">
            ${loginUrl}
          </p>
          
          <div class="footer">
            <p>El equipo de soporte de ${titular}</p>
            <p>Si tienes alguna pregunta, estamos disponibles para ayudarte.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Lógica condicional para email de desarrollo vs producción
    const isDevelopment = process.env.NODE_ENV === 'development';
    const emailFrom = process.env.RESEND_FROM || `${titular} <onboarding@resend.dev>`;
    
    // En desarrollo con email de testing, solo permitir enviar al email del desarrollador
    if (isDevelopment && emailFrom.includes('onboarding@resend.dev') && email !== 'hamintonjair@gmail.com') {
      console.log('⚠️ En desarrollo, solo se puede enviar a hamintonjair@gmail.com con email de testing');
      return {
        success: false,
        error: 'En desarrollo, solo se permite enviar al email del desarrollador (hamintonjair@gmail.com)'
      };
    }

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [email],
      subject: `Contraseña Temporal - ${titular}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('Correo de contraseña temporal enviado exitosamente:', data);
    return { success: true };

  } catch (error) {
    console.error('Error en enviarContraseñaTemporal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar contraseña temporal'
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
