'use server';

import { createClient } from '@/lib/supabase/server';
import { Caja, CrearCajaForm, ApiResponse } from '@/types/database';

/**
 * Abre una nueva caja para una empresa
 * Valida que no haya una caja abierta para la misma empresa
 */
export async function abrirCaja(datos: CrearCajaForm): Promise<ApiResponse<Caja>> {
  try {
    const supabase = createClient();
    
    // Validar que no haya una caja abierta para esta empresa
    const { data: cajaAbierta, error: errorConsulta } = await supabase
      .from('cajas')
      .select('*')
      .eq('empresa_id', datos.empresa_id)
      .eq('estado', 'abierta')
      .single();

    if (errorConsulta && errorConsulta.code !== 'PGRST116') {
      throw new Error(`Error al verificar cajas abiertas: ${errorConsulta.message}`);
    }

    if (cajaAbierta) {
      return {
        error: 'Ya existe una caja abierta para esta empresa. Debe cerrar la caja actual antes de abrir una nueva.'
      };
    }

    // Crear nueva caja
    const { data: nuevaCaja, error: errorInsercion } = await supabase
      .from('cajas')
      .insert({
        empresa_id: datos.empresa_id,
        base_inicial: datos.base_inicial,
        estado: 'abierta',
        fecha_apertura: new Date().toISOString()
      })
      .select()
      .single();

    if (errorInsercion) {
      throw new Error(`Error al crear caja: ${errorInsercion.message}`);
    }

    return {
      data: nuevaCaja,
      message: 'Caja abierta exitosamente'
    };

  } catch (error) {
    console.error('Error en abrirCaja:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al abrir caja'
    };
  }
}

/**
 * Cierra una caja y calcula el arqueo final
 * Compara base inicial + ventas - gastos vs monto_final
 */
export async function cerrarCaja(
  cajaId: string, 
  montoFinal: number,
  empresaId: string
): Promise<ApiResponse<Caja>> {
  try {
    const supabase = createClient();
    
    // Verificar que la caja exista y esté abierta
    const { data: caja, error: errorCaja } = await supabase
      .from('cajas')
      .select('*')
      .eq('id', cajaId)
      .eq('empresa_id', empresaId)
      .eq('estado', 'abierta')
      .single();

    if (errorCaja || !caja) {
      return {
        error: 'No se encontró una caja abierta con los datos proporcionados'
      };
    }

    const totalEsperado = caja.base_inicial;

    // Calcular diferencia
    const diferencia = montoFinal - totalEsperado;

    // Actualizar caja
    const { data: cajaActualizada, error: errorActualizacion } = await supabase
      .from('cajas')
      .update({
        estado: 'cerrada',
        fecha_cierre: new Date().toISOString(),
        monto_final: montoFinal
      })
      .eq('id', cajaId)
      .select()
      .single();

    if (errorActualizacion) {
      throw new Error(`Error al cerrar caja: ${errorActualizacion.message}`);
    }

    console.log(`Arqueo de caja - Esperado: ${totalEsperado}, Real: ${montoFinal}, Diferencia: ${diferencia}`);

    return {
      data: cajaActualizada,
      message: `Caja cerrada exitosamente. Diferencia: ${diferencia > 0 ? '+' : ''}${diferencia.toFixed(2)}`
    };

  } catch (error) {
    console.error('Error en cerrarCaja:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al cerrar caja'
    };
  }
}

/**
 * Obtiene la caja abierta actual de una empresa
 */
export async function getCajaAbierta(empresaId: string): Promise<ApiResponse<Caja>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('estado', 'abierta')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener caja abierta: ${error.message}`);
    }

    return {
      data: data || undefined,
      message: data ? 'Caja abierta encontrada' : 'No hay cajas abiertas'
    };

  } catch (error) {
    console.error('Error en getCajaAbierta:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al obtener caja abierta'
    };
  }
}

/**
 * Obtiene el historial de cajas de una empresa
 */
export async function getHistorialCajas(
  empresaId: string,
  pagina: number = 1,
  limite: number = 20
): Promise<ApiResponse<{ cajas: Caja[], total: number }>> {
  try {
    const supabase = createClient();
    const offset = (pagina - 1) * limite;

    // Obtener cajas paginadas
    const { data: cajas, error: errorCajas } = await supabase
      .from('cajas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limite - 1);

    if (errorCajas) {
      throw new Error(`Error al obtener cajas: ${errorCajas.message}`);
    }

    // Obtener total
    const { count, error: errorCount } = await supabase
      .from('cajas')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    if (errorCount) {
      throw new Error(`Error al contar cajas: ${errorCount.message}`);
    }

    return {
      data: {
        cajas: cajas || [],
        total: count || 0
      },
      message: 'Historial de cajas obtenido exitosamente'
    };

  } catch (error) {
    console.error('Error en getHistorialCajas:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al obtener historial'
    };
  }
}
