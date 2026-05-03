'use server';

import { createClient } from '@/lib/supabase/server';

export interface ConfiguracionGlobal {
  id: string;
  banco: string;
  tipo_cuenta: string;
  numero_cuenta: string;
  titular: string;
  documento_titular: string;
  porcentaje_iva: string;
  whatsapp_soporte: string;
  creado_en: string;
  actualizado_en: string;
  mensaje_global: string;
  direccion: string;
  ciudad: string;
  logo_url: string;
}

export async function obtenerConfiguracionGlobalAction(): Promise<ConfiguracionGlobal | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('configuracion_global')
      .select('*')
      .single();

    if (error) {
      console.error('Error obteniendo configuración global:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en servidor:', error);
    return null;
  }
}
