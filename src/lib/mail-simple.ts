// Función genérica para enviar correos
export async function sendEmail(data: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Enviando correo:', {
      to: data.to,
      subject: data.subject,
      htmlLength: data.html.length
    });

    // Simulación de envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Correo enviado exitosamente');
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
    
    <div style="background: #FEF3C7; border-radius: 8px; padding: 20px; margin: 20px 0;">
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
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="background: #D97706; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Ir al Salón
      </a>
    </div>
    
    <p>
      <strong>🌟 ¿Qué puedes hacer con BeautyPro?</strong>
    </p>
    
    <ul>
      <li>📅 Gestión de Citas: Organiza el agenda de tus estilistas y clientes.</li>
      <li>💰 Control de Caja: Lleva un registro detallado de ingresos y egresos.</li>
      <li>🛒 Punto de Venta: Vende productos y servicios con upselling inteligente.</li>
      <li>👥 Gestión de Empleados: Controla nóminas, comisiones y préstamos.</li>
      <li>📊 Reportes: Toma decisiones basadas en datos reales.</li>
    </ul>
    
    <div style="margin-top: 30px 0;">
      <p style="text-align: center;">
        <em>¡Gracias por confiar en BeautyPro para hacer crecer tu negocio!</em>
      </p>
    </div>
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
    
    <div style="background: #FEF3C7; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3>🔒 Información de Seguridad</h3>
      <p>
        Este enlace expirará en <strong>24 horas</strong> por tu seguridad. 
        Después de ese tiempo, deberás solicitar un nuevo restablecimiento.
      </p>
    </div>
    
    <p>
      Para restablecer tu contraseña, haz clic en el siguiente botón:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #D97706; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Restablecer Contraseña
      </a>
    </div>
    
    <div style="margin-top: 30px 0;">
      <p style="text-align: center;">
        <strong>¿No solicitaste este cambio?</strong><br>
        Si no solicitaste restablecer tu contraseña, tu cuenta sigue segura. 
        Te recomendamos usar una contraseña fuerte y única.
      </p>
    </div>
  `;
}

// Plantilla de recibo digital
export function generateReceiptTemplate(
  clienteNombre: string,
  empresaNombre: string,
  venta: {
    id: string;
    fecha: string;
    total: number;
    metodo_pago: string;
  }
): string {
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
        <tr>
          <td style="padding: 12px; font-weight: 600; color: #1F2937; border-bottom: 2px solid #D97706;">Total de compra</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #D97706; font-size: 18px;">$${venta.total.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #FEF3C7; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3>💳 Información de Pago</h3>
      <p>
        <strong>Método de pago:</strong> ${venta.metodo_pago}<br>
        <strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleDateString('es-MX')}<br>
        <strong>Folio:</strong> #${venta.id}
      </p>
    </div>
    
    <p>
      Esperamos verte pronto en <strong>${empresaNombre}</strong>. 
      No olvides que puedes agendar tu próxima cita a través de nuestra web o llamando directamente.
    </p>
    
    <div style="margin-top: 30px 0;">
      <em>¡Gracias por tu preferencia!</em><br>
      <small style="color: #6b7280;">Este es un recibo digital generado automáticamente</small>
    </p>
  `;
}
