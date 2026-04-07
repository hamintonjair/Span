import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const formData = await request.formData();

    const empresa_id = formData.get('empresa_id') as string;
    const archivo = formData.get('archivo') as File;
    const notas = formData.get('notas') as string;

    if (!empresa_id || !archivo) {
      return NextResponse.json(
        { error: 'empresa_id y archivo son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nombre, plan_id')
      .eq('id', empresa_id)
      .single();

    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Validar tipo de archivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!tiposPermitidos.includes(archivo.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG) y PDF' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (archivo.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Generar nombre corto y limpio para el archivo
    const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const extension = archivo.name.split('.').pop();
    const nombreLimpio = `comprobante_${fecha}_${Math.floor(1000 + Math.random() * 9000)}.${extension}`;
    


    // Función de reintento con backoff exponencial y timeout
    const retryWithBackoff = async <T>(
      operation: () => Promise<T>,
      maxRetries: number = 3,
      delay: number = 1000,
      timeout: number = 30000 // 30 segundos timeout
    ): Promise<T> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Agregar timeout a la operación
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout de operación')), timeout);
          });

          const result = await Promise.race([operation(), timeoutPromise]);
          return result;
        } catch (error) {
          console.error(`Intento ${attempt} fallido:`, error);
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Esperar con backoff exponencial
          const waitTime = delay * Math.pow(2, attempt - 1);
          console.log(`Reintentando en ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      throw new Error('Máximo de reintentos alcanzado');
    };

    // Validar que el archivo no sea demasiado grande para Supabase Storage (50MB límite)
    const maxSizeSupabase = 50 * 1024 * 1024; // 50MB
    if (archivo.size > maxSizeSupabase) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande para Supabase Storage. Máximo 50MB' },
        { status: 400 }
      );
    }

    // Subir archivo a Supabase Storage con reintento
    const { data: urlData, error: uploadError } = await retryWithBackoff(async () => {
      const result = await supabase.storage
        .from('comprobantes')
        .upload(`${empresa_id}/${nombreLimpio}`, archivo, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    }, 3, 1000);

    if (uploadError) {
      console.error('Error subiendo archivo después de reintentos:', uploadError);
      return NextResponse.json(
        { error: 'Error subiendo el archivo. Por favor, intenta de nuevo en unos minutos.' },
        { status: 500 }
      );
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(`${empresa_id}/${nombreLimpio}`);

    // Crear registro del comprobante en la base de datos
    console.log('🔍 DEBUG: Insertando comprobante con nombre:', nombreLimpio);
    
    const { data: comprobante, error: comprobanteError } = await retryWithBackoff(async () => {
      const result = await supabase
        .from('comprobantes')
        .insert({
          empresa_id,
          nombre_archivo: nombreLimpio,
          url_archivo: publicUrl,
          tipo_archivo: archivo.type,
          tamano_bytes: archivo.size,
          estado: 'pendiente',
          verificado: false,
          notas: notas || null,
          fecha_envio: new Date().toISOString(),
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        })
        .select()
        .single();
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    }, 3, 1000);

    if (comprobanteError) {
      console.error('Error creando comprobante después de reintentos:', comprobanteError);
      return NextResponse.json(
        { error: 'Error guardando el comprobante. Por favor, intenta de nuevo en unos minutos.' },
        { status: 500 }
      );
    }

    // Registrar en logs de actividad
    const logData: any = {
      // usuario_id: empresa_id, // Comentado hasta tener JWT real
      empresa_id: empresa_id,
      accion: 'ENVIAR_COMPROBANTE',
      modulo: 'COMPROBANTES',
      descripcion: `Comprobante enviado por ${empresa.nombre}`
    };

    // Intentar agregar datos adicionales si existen
    try {
      logData.datos_nuevos = { 
        nombre_archivo: archivo.name,
        tipo_archivo: archivo.type,
        tamano_bytes: archivo.size
      };
    } catch (e) {
      console.log('Columnas adicionales no disponibles en logs_actividad');
    }

    try {
      logData.ip_address = request.ip || 'unknown';
      logData.user_agent = request.headers.get('user-agent') || 'unknown';
    } catch (e) {
      console.log('Columnas ip_address/user_agent no disponibles en logs_actividad');
    }

    const { error: logError } = await supabase
      .from('logs_actividad')
      .insert(logData);

    if (logError) {
      console.error('Error registrando log:', logError);
      // No fallamos la petición si el log falla
    }

    return NextResponse.json({
      success: true,
      message: 'Comprobante enviado exitosamente',
      comprobante: {
        id: comprobante.id,
        nombre_archivo: comprobante.nombre_archivo,
        url_archivo: comprobante.url_archivo,
        estado: comprobante.estado,
        fecha_envio: comprobante.fecha_envio
      }
    });

  } catch (error) {
    console.error('Error en POST /api/upload/comprobante:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
