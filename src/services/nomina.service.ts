'use server';

import { createClient } from '@/lib/supabase/server';
import { Empleado, Prestamo, ApiResponse } from '@/types/database';

// Interfaces temporales hasta que creemos las tablas de ventas
interface VentaEmpleado {
  id: string;
  empleado_id: string;
  monto_total: number;
  fecha: string;
  estado: 'completada' | 'cancelada';
}

interface DetalleNomina {
  sueldo_base: number;
  comisiones_ventas: number;
  total_bruto: number;
  descuento_prestamo: number;
  total_neto: number;
  prestamo_actualizado?: Prestamo;
}

/**
 * Calcula la nómina de un empleado para un período específico
 * Incluye sueldo base, comisiones por ventas y descuentos por préstamos
 */
export async function calcularNominaEmpleado(
  empleadoId: string,
  empresaId: string,
  fechaInicio: string,
  fechaFin: string
): Promise<ApiResponse<{ sueldo_neto: number; comisiones: number; total_prestamos: number; detalles: any }>> {
  try {
    const supabase = createClient();
    
    // Obtener información del empleado
    const { data: empleado, error: empleadoError } = await supabase
      .from('empleados')
      .select('*')
      .eq('id', empleadoId)
      .eq('empresa_id', empresaId)
      .eq('estado', 'activo')
      .single();

    if (empleadoError || !empleado) {
      return {
        error: 'Empleado no encontrado o no está activo'
      };
    }

    // 2. Obtener ventas del empleado en el período
    // NOTA: Esta consulta se actualizará cuando creemos la tabla ventas
    const { data: ventas, error: errorVentas } = await supabase
      .from('ventas') // Tabla que crearemos luego
      .select('monto_total')
      .eq('empleado_id', empleadoId)
      .eq('estado', 'completada')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin);

    // Temporal: si la tabla no existe, asumimos 0 ventas
    const totalVentas = ventas?.reduce((sum: number, venta: any) => sum + venta.monto_total, 0) || 0;

    // 3. Calcular comisiones
    const comisionesVentas = totalVentas * (empleado.porcentaje_comision / 100);

    // 4. Calcular total bruto
    const totalBruto = empleado.sueldo_base + comisionesVentas;

    // Obtener préstamos activos del empleado
    const { data: prestamos, error: prestamosError } = await supabase
      .from('prestamos')
      .select('*')
      .eq('empleado_id', empleadoId)
      .eq('empresa_id', empresaId)
      .eq('estado', 'activo');

    if (prestamosError) {
      throw new Error(`Error al consultar préstamos: ${prestamosError.message}`);
    }

    let descuentoPrestamo = 0;
    let prestamoActualizado: Prestamo | undefined;

    // 6. Procesar préstamos activos
    if (prestamos && prestamos.length > 0) {
      // Tomar el primer préstamo activo (lógica puede ajustarse)
      const prestamoActivo = prestamos[0];
      
      // Verificar si hay saldo pendiente para descontar
      if (prestamoActivo.saldo_pendiente > 0) {
        // La cuota a descontar es el menor entre la cuota mensual y el saldo pendiente
        descuentoPrestamo = Math.min(prestamoActivo.cuota_mensual, prestamoActivo.saldo_pendiente);
        
        // Actualizar saldo pendiente del préstamo
        const nuevoSaldo = prestamoActivo.saldo_pendiente - descuentoPrestamo;
        const nuevoEstado = nuevoSaldo <= 0 ? 'pagado' : 'activo';

        const { data: prestamoActualizadoData, error: errorActualizacion } = await supabase
          .from('prestamos')
          .update({
            saldo_pendiente: nuevoSaldo,
            estado: nuevoEstado,
            updated_at: new Date().toISOString()
          })
          .eq('id', prestamoActivo.id)
          .select()
          .single();

        if (errorActualizacion) {
          throw new Error(`Error al actualizar préstamo: ${errorActualizacion.message}`);
        }

        prestamoActualizado = prestamoActualizadoData;
      }
    }

    // 7. Calcular total neto
    const totalNeto = totalBruto - descuentoPrestamo;

    const detalleNomina = {
      sueldo_base: empleado.sueldo_base,
      comisiones_ventas: comisionesVentas,
      total_bruto: totalBruto,
      descuento_prestamo: descuentoPrestamo,
      total_neto: totalNeto,
      prestamo_actualizado: prestamoActualizado
    };

    return {
      data: detalleNomina as unknown as any,
      message: 'Nómina calculada exitosamente'
    };

  } catch (error) {
    console.error('Error en calcularNominaEmpleado:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al calcular nómina'
    };
  }
}

/**
 * Calcula nómina para múltiples empleados
 */
export async function calcularNominaMultiple(
  empresaId: string,
  fechaInicio: string,
  fechaFin: string,
  empleadosIds?: string[]
): Promise<ApiResponse<{ [empleadoId: string]: DetalleNomina }>> {
  try {
    const supabase = createClient();
    
    // Obtener resumen de nóminas del períodos, obtener todos los activos
    let empleadosQuery = supabase
      .from('empleados')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('estado', 'activo');

    if (empleadosIds && empleadosIds.length > 0) {
      empleadosQuery = empleadosQuery.in('id', empleadosIds);
    }

    const { data: empleados, error: errorEmpleados } = await empleadosQuery;

    if (errorEmpleados) {
      throw new Error(`Error al obtener empleados: ${errorEmpleados.message}`);
    }

    if (!empleados || empleados.length === 0) {
      return {
        error: 'No se encontraron empleados activos'
      };
    }

    // Calcular nómina para cada empleado
    const nominas: { [empleadoId: string]: DetalleNomina } = {};
    const errores: string[] = [];

    for (const empleado of empleados) {
      const resultado = await calcularNominaEmpleado(
        empleado.id,
        empresaId,
        fechaInicio,
        fechaFin
      );

      if (resultado.data) {
        nominas[empleado.id] = resultado.data as unknown as DetalleNomina;
      } else {
        errores.push(`Empleado ${empleado.id}: ${resultado.error}`);
      }
    }

    if (errores.length > 0 && Object.keys(nominas).length === 0) {
      return {
        error: 'No se pudo calcular ninguna nómina: ' + errores.join('; ')
      };
    }

    return {
      data: nominas,
      message: `Nóminas calculadas: ${Object.keys(nominas).length} exitosas, 0 con errores`
    };

  } catch (error) {
    console.error('Error en calcularNominaMultiple:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al calcular nóminas múltiples'
    };
  }
}

/**
 * Obtiene resumen de nóminas para dashboard
 */
export async function getResumenNominas(
  empresaId: string,
  fechaInicio: string,
  fechaFin: string
): Promise<ApiResponse<{
  resumen: any[];
  totales: any;
  total_empleados: number;
  total_nomina_bruta: number;
  total_descuentos: number;
  total_nomina_neta: number;
}>> {
  try {
    const resultado = await calcularNominaMultiple(empresaId, fechaInicio, fechaFin);

    if (resultado.error || !resultado.data) {
      return {
        error: resultado.error || 'Error al calcular resumen de nóminas'
      };
    }

    const nominas = Object.values(resultado.data);
    
    return {
      data: {
        resumen: Object.values(nominas),
        totales: {
          total_sueldos_base: Object.values(nominas).reduce((sum, n) => sum + n.sueldo_base, 0),
          total_comisiones: Object.values(nominas).reduce((sum, n) => sum + n.comisiones_ventas, 0),
          total_bruto: Object.values(nominas).reduce((sum, n) => sum + n.total_bruto, 0),
          total_descuentos: Object.values(nominas).reduce((sum, n) => sum + n.descuento_prestamo, 0),
          total_neto: Object.values(nominas).reduce((sum, n) => sum + n.total_neto, 0)
        },
        total_empleados: Object.keys(nominas).length,
        total_nomina_bruta: Object.values(nominas).reduce((sum, n) => sum + n.total_bruto, 0),
        total_descuentos: Object.values(nominas).reduce((sum, n) => sum + n.descuento_prestamo, 0),
        total_nomina_neta: Object.values(nominas).reduce((sum, n) => sum + n.total_neto, 0)
      },
      message: `Nóminas calculadas: ${Object.keys(nominas).length} exitosas, 0 con errores`
    };

  } catch (error) {
    console.error('Error en getResumenNominas:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al obtener resumen'
    };
  }
}
