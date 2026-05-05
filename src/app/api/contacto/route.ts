import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface ContactFormData {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  asunto: string;
  mensaje: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validar datos de entrada
    const { nombre, email, telefono, empresa, asunto, mensaje } = body;
    
    if (!nombre?.trim() || !email?.trim() || !asunto?.trim() || !mensaje?.trim()) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben estar completos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    // Obtener configuración de email desde la base de datos
    const supabase = createAdminClient();
    const { data: config, error: configError } = await supabase
      .from('configuracion_global')
      .select('email_soporte, titular, nombre_titular')
      .single();

    if (configError) {
      console.error('Error obteniendo configuración de email:', configError);
      return NextResponse.json(
        { error: 'Error de configuración del sistema' },
        { status: 500 }
      );
    }

    const emailDestino = config?.email_soporte || 'contacto@span.com';
    const nombreEmpresa = config?.titular || 'Span';
    const nombreTitular = config?.nombre_titular || config?.titular || 'Span';

    // Construir contenido del email
    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
            .value { background: white; padding: 10px; border-radius: 4px; border: 1px solid #d1d5db; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nuevo Mensaje de Contacto</h1>
              <p>${nombreEmpresa} - Formulario de Contacto</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nombre Completo:</div>
                <div class="value">${nombre.trim()}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${email.trim()}</div>
              </div>
              ${telefono ? `
              <div class="field">
                <div class="label">Teléfono:</div>
                <div class="value">${telefono.trim()}</div>
              </div>
              ` : ''}
              ${empresa ? `
              <div class="field">
                <div class="label">Empresa:</div>
                <div class="value">${empresa.trim()}</div>
              </div>
              ` : ''}
              <div class="field">
                <div class="label">Asunto:</div>
                <div class="value">${asunto.trim()}</div>
              </div>
              <div class="field">
                <div class="label">Mensaje:</div>
                <div class="value">${mensaje.trim().replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <div class="footer">
              <p>Este mensaje fue enviado desde el formulario de contacto de ${nombreEmpresa}</p>
              <p>Fecha y hora: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Guardar contacto en base de datos (sin envío de correo)
    try {
      const { error: logError } = await supabase
        .from('contactos_pendientes')
        .insert({
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono?.trim() || null,
          empresa: empresa?.trim() || null,
          asunto: asunto.trim(),
          mensaje: mensaje.trim(),
          email_destino: emailDestino,
          contenido_html: emailContent,
          estado: 'pendiente',
          metodo_envio: 'base_datos',
          creado_en: new Date().toISOString()
        });

      if (logError) {
        console.error('Error registrando contacto:', logError);
        throw new Error('Error al registrar el contacto');
      }

      // Registrar log de actividad
      try {
        await supabase
          .from('logs_actividad')
          .insert({
            accion: 'CONTACTO_FORMULARIO',
            modulo: 'Contacto Público',
            detalles: {
              nombre: nombre.trim(),
              email: email.trim(),
              asunto: asunto.trim(),
              empresa: empresa?.trim() || null,
              metodo_envio: process.env.RESEND_API_KEY ? 'resend' : 'pendiente'
            },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            creado_en: new Date().toISOString()
          });
      } catch (logError) {
        console.error('Error registrando log de actividad:', logError);
        // No fallar el proceso si el log falla
      }

      return NextResponse.json({
        success: true,
        message: `¡Gracias! Hemos recibido tu mensaje y te contactaremos a ${emailDestino} en breve.` 
      });

    } catch (error) {
      console.error('Error guardando contacto:', error);
      return NextResponse.json(
        { error: 'Error al procesar el mensaje. Por favor, inténtalo más tarde.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en el bloque try principal:', error);
    return NextResponse.json(
      { error: 'Error al procesar el mensaje. Por favor, inténtalo más tarde.' },
      { status: 500 }
    );
  }
}
