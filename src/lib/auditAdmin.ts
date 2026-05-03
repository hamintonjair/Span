import { createAdminClient } from '@/lib/supabase/admin';

// Interfaz para los datos del log de auditoría global
export interface LogAuditoriaAdmin {
  usuario_id?: string;
  accion: string;
  modulo: string;
  detalles?: Record<string, any>;
}

// Función principal para registrar logs de auditoría global (Administración del sistema)
export const registrarLogAdmin = async (
  datos: LogAuditoriaAdmin,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabaseAdmin = createAdminClient();

    // Mapear parámetros a los nombres de columna reales de la tabla logs_auditoria
    const payload = {
      usuario_id: datos.usuario_id || null,
      tipo_evento: datos.accion,
      descripcion: `Acción realizada en el módulo: ${datos.modulo}`,
      metadata: datos.detalles || {},
      ip_address: ipAddress || 'Desconocida',
    };

    const { error } = await supabaseAdmin
      .from('logs_auditoria')
      .insert(payload);

    if (error) {
      console.error('Error registrando log de auditoría global:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido al registrar log de auditoría global'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en registrarLogAdmin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};
