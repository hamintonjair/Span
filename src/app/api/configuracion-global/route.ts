import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { registrarLogAdmin } from '@/lib/auditAdmin';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
    
    const { data, error } = await supabaseAdmin
      .from('configuracion_global')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 es "not found"
      console.error('Error obteniendo configuración global:', error);
      return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      config: data || null 
    });
  } catch (error) {
    console.error('Error en API de configuración global:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/configuracion-global - Iniciando');

    const body = await request.json();
    console.log('Body recibido:', body);

    const { id, banco, tipo_cuenta, numero_cuenta, titular, documento_titular, porcentaje_iva, whatsapp_soporte, mensaje_global, direccion, ciudad, logo_url, adminId } = body;

    // Validar campos requeridos
    if (!banco || !numero_cuenta || !titular) {
      console.log('Validación fallida: campos requeridos faltantes');
      return NextResponse.json({ 
        error: 'Los campos banco, numero_cuenta y titular son requeridos' 
      }, { status: 400 });
    }

    console.log('Creando admin client...');
    const supabaseAdmin = createAdminClient();
    console.log('Admin client creado exitosamente');

    const updateData = {
      banco,
      tipo_cuenta: tipo_cuenta || '',
      numero_cuenta,
      titular,
      documento_titular: documento_titular || '',
      porcentaje_iva: porcentaje_iva || '',
      whatsapp_soporte: whatsapp_soporte || '',
      mensaje_global: mensaje_global || '',
      direccion: direccion || '',
      ciudad: ciudad || '',
      logo_url: logo_url || '',
      actualizado_en: new Date().toISOString()
    };
    
    console.log('Datos para actualizar:', updateData);
    
    // Si existe un id, actualizar el registro existente
    if (id) {
      console.log('Actualizando registro existente con id:', id);
      const { data, error } = await supabaseAdmin
        .from('configuracion_global')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      console.log('Resultado update - data:', data);
      console.log('Resultado update - error:', error);

      if (error) {
        console.error('Error actualizando configuración global:', error);
        return NextResponse.json({ error: 'Error al actualizar configuración', details: error.message }, { status: 500 });
      }

      // Registrar log de auditoría global
      if (adminId) {
        try {
          await registrarLogAdmin({
            usuario_id: adminId,
            accion: 'ACTUALIZAR_DATOS_PLATAFORMA',
            modulo: 'Configuración',
            detalles: {
              banco_actualizado: banco,
              cuenta_finaliza_en: numero_cuenta.slice(-4),
              iva_configurado: porcentaje_iva,
              mensaje_global_editado: !!mensaje_global
            }
          });
        } catch (e) {
          console.error('Error silencioso en auditoría de configuración:', e);
        }
      }

      return NextResponse.json({
        success: true,
        config: data
      });
    } else {
      // Si no existe id, hacer upsert (insertar nuevo)
      console.log('Insertando nuevo registro');
      const { data, error } = await supabaseAdmin
        .from('configuracion_global')
        .upsert(updateData)
        .select()
        .single();

      console.log('Resultado upsert - data:', data);
      console.log('Resultado upsert - error:', error);

      if (error) {
        console.error('Error guardando configuración global:', error);
        return NextResponse.json({ error: 'Error al guardar configuración', details: error.message }, { status: 500 });
      }

      // Registrar log de auditoría global
      if (adminId) {
        try {
          await registrarLogAdmin({
            usuario_id: adminId,
            accion: 'CREAR_CONFIGURACION_PLATAFORMA',
            modulo: 'Configuración',
            detalles: {
              banco_creado: banco,
              cuenta_finaliza_en: numero_cuenta.slice(-4),
              iva_configurado: porcentaje_iva,
              mensaje_global_creado: !!mensaje_global
            }
          });
        } catch (e) {
          console.error('Error silencioso en auditoría de configuración:', e);
        }
      }

      return NextResponse.json({
        success: true,
        config: data
      });
    }
  } catch (error) {
    console.error('Error en API de configuración global:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
