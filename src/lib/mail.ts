import { createClient } from '@supabase/supabase-js';

// Configuración del servicio de correo
interface EmailConfig {
  from: string;
  replyTo?: string;
}

interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// Plantilla base de correo con estilos inline
const baseTemplate = (content: string, title: string = 'BeautyPro') => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background-color: #ffffff;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 24px;
            color: #D97706;
            margin-bottom: 20px;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 300;
            margin: 0;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .content h2 {
            color: #1F2937;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .content p {
            color: #4B5563;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
            color: #ffffff;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(217, 119, 6, 0.3);
        }
        
        .info-box {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .info-box h3 {
            color: #92400E;
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .info-box p {
            color: #78350F;
            font-size: 14px;
            margin: 0;
        }
        
        .footer {
            background-color: #1F2937;
            padding: 30px;
            text-align: center;
        }
        
        .footer p {
            color: #9CA3AF;
            font-size: 14px;
            margin: 0;
        }
        
        .footer a {
            color: #F59E0B;
            text-decoration: none;
        }
        
        .divider {
            height: 1px;
            background-color: #E5E7EB;
            margin: 30px 0;
        }
        
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .button {
                width: 100%;
                padding: 14px 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">BP</div>
            <h1>BeautyPro</h1>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <p>&copy; 2024 BeautyPro. Todos los derechos reservados.</p>
            <p>
                <a href="https://beautypro.com/soporte">Soporte Técnico</a> | 
                <a href="https://beautypro.com/privacidad">Política de Privacidad</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

// Función genérica para enviar correos
export async function sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Aquí configuraríamos Resend, Nodemailer o el servicio que prefieras
    // Por ahora, simulamos el envío
    
    console.log('📧 Enviando correo:', {
      to: data.to,
      subject: data.subject,
      htmlLength: data.html.length
    });

    // Simulación de envío exitoso
    await new Promise(resolve => setTimeout(resolve, 1000));

    // En producción, aquí iría el código real:
    /*
    // Ejemplo con Resend:
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'BeautyPro <noreply@beautypro.com>',
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
    */

    return { success: true };

  } catch (error) {
    console.error('Error al enviar correo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar correo'
    };
  }
}

// Plantilla de bienvenida
export function generateWelcomeTemplate(
  empresaNombre: string,
  userEmail: string,
  tempPassword: string,
  loginUrl: string
): string {
  return `
    <h2>¡Bienvenido a BeautyPro!</h2>
    
    <p>
      Estimado administrador de <strong>${empresaNombre}</strong>,
    </p>
    
    <p>
      Tu salón de belleza ha sido registrado exitosamente en nuestra plataforma. 
      BeautyPro es el sistema completo que transformará la gestión de tu negocio.
    </p>
    
    <div class="info-box">
      <h3>🔐 Credenciales de Acceso</h3>
      <p>
        <strong>Correo:</strong> ${userEmail}<br>
        <strong>Contraseña temporal:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code><br>
        <small style="color: #6b7280;">Te recomendamos cambiar esta contraseña en tu primer inicio de sesión.</small>
      </p>
    </div>
    
    <p>
      Para comenzar a usar el sistema, haz clic en el siguiente botón:
    </p>
    
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">
        Ir al Salón
      </a>
    </div>
    
    <div class="divider"></div>
    
    <h3>🌟 ¿Qué puedes hacer con BeautyPro?</h3>
    
    <p>
      <strong>📅 Gestión de Citas:</strong> Organiza el agenda de tus estilistas y clientes.<br>
      <strong>💰 Control de Caja:</strong> Lleva un registro detallado de ingresos y egresos.<br>
      <strong>🛒 Punto de Venta:</strong> Vende productos y servicios con upselling inteligente.<br>
      <strong>👥 Gestión de Empleados:</strong> Controla nóminas, comisiones y préstamos.<br>
      <strong>📊 Reportes:</strong> Toma decisiones basadas en datos reales.
    </p>
    
    <p>
      Si tienes alguna pregunta o necesitas ayuda, nuestro equipo de soporte está disponible 
      24/7 para asistirte.
    </p>
    
    <p style="text-align: center; margin-top: 30px;">
      <em>¡Gracias por confiar en BeautyPro para hacer crecer tu negocio!</em>
    </p>
  `;
}

// Plantilla de recuperación de contraseña
export function generatePasswordResetTemplate(
  userName: string,
  resetUrl: string
): string {
  return `
    <h2>🔑 Restablecimiento de Contraseña</h2>
    
    <p>
      Hola <strong>${userName}</strong>,
    </p>
    
    <p>
      Hemos recibido una solicitud para restablecer tu contraseña en BeautyPro. 
      Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.
    </p>
    
    <p>
      Para restablecer tu contraseña, haz clic en el siguiente botón:
    </p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">
        Restablecer Contraseña
      </a>
    </div>
    
    <div class="info-box">
      <h3>🔒 Información de Seguridad</h3>
      <p>
        Este enlace expirará en <strong>24 horas</strong> por tu seguridad. 
        Después de ese tiempo, deberás solicitar un nuevo restablecimiento.
      </p>
    </div>
    
    <div class="divider"></div>
    
    <p>
      <strong>¿No solicitaste este cambio?</strong><br>
      Si no solicitaste restablecer tu contraseña, tu cuenta sigue segura. 
      Te recomendamos usar una contraseña fuerte y única.
    </p>
    
    <p style="text-align: center; margin-top: 30px;">
      <em>El equipo de BeautyPro</em>
    </p>
  `;
}

// Plantilla de recibo digital
export function generateReceiptTemplate(
  clienteNombre: string,
  empresaNombre: string,
  venta: {
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
): string {
  const itemsHtml = venta.items.map(item => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 12px 0; color: #4B5563;">${item.nombre}</td>
      <td style="padding: 12px 0; text-align: center; color: #4B5563;">${item.cantidad}</td>
      <td style="padding: 12px 0; text-align: right; color: #4B5563;">$${item.precio_unitario.toFixed(2)}</td>
      <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1F2937;">$${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <h2>🧾 Recibo Digital</h2>
    
    <p>
      Estimado(a) <strong>${clienteNombre}</strong>,
    </p>
    
    <p>
      Gracias por tu visita a <strong>${empresaNombre}</strong>. 
      A continuación encontrarás el detalle de tu compra:
    </p>
    
    <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #D97706;">
            <th style="padding: 12px 0; text-align: left; color: #1F2937; font-weight: 600;">Servicio/Producto</th>
            <th style="padding: 12px 0; text-align: center; color: #1F2937; font-weight: 600;">Cant.</th>
            <th style="padding: 12px 0; text-align: right; color: #1F2937; font-weight: 600;">P. Unit.</th>
            <th style="padding: 12px 0; text-align: right; font-weight: 600; color: #1F2937;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 12px 0; text-align: right; color: #4B5563;">Subtotal:</td>
            <td style="padding: 12px 0; text-align: right; color: #1F2937;">$${venta.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 12px 0; text-align: right; color: #4B5563;">Impuestos (16%):</td>
            <td style="padding: 12px 0; text-align: right; color: #1F2937;">$${venta.impuestos.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 2px solid #D97706;">
            <td colspan="3" style="padding: 12px 0; text-align: right; font-weight: 600; color: #1F2937;">TOTAL:</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1F2937;">$${venta.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <div class="info-box">
      <h3>💳 Información de Pago</h3>
      <p>
        <strong>Método de pago:</strong> ${venta.metodo_pago}<br>
        <strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}<br>
        <strong>Folio:</strong> #${venta.id}
      </p>
    </div>
    
    <p>
      Esperamos verte pronto en <strong>${empresaNombre}</strong>. 
      No olvides que puedes agendar tu próxima cita a través de nuestra web o llamando directamente.
    </p>
    
    <div class="divider"></div>
    
    <p style="text-align: center;">
      <em>¡Gracias por tu preferencia!</em><br>
      <small style="color: #6b7280;">Este es un recibo digital generado automáticamente</small>
    </p>
  `;
}
