import { createClient } from '@/lib/supabase/client';

export interface LimiteVerificacion {
  alcanzado: boolean;
  limite: number;
  actual: number;
  plan_nombre?: string;
}

/**
 * Verifica si una empresa ha alcanzado el límite de usuarios o empleados según su plan
 * @param empresa_id ID de la empresa a verificar
 * @param tipo Tipo de límite a verificar: 'usuarios' | 'empleados'
 * @returns Objeto con información del límite y estado actual
 */
export const verificarLimite = async (
  empresa_id: string,
  tipo: 'usuarios' | 'empleados'
): Promise<LimiteVerificacion> => {
  const supabase = createClient();
  
  try {
    // 1. Obtener el plan de la empresa
    const { data: empresa, error: errorEmpresa } = await supabase
      .from('empresas')
      .select(`
        plan_id,
        planes (
          nombre,
          max_usuarios,
          max_empleados
        )
      `)
      .eq('id', empresa_id)
      .single();

    if (errorEmpresa) {
      console.error('Error obteniendo empresa:', errorEmpresa);
      return { alcanzado: true, limite: 0, actual: 0 };
    }

    // Tipado seguro para empresa y plan
    const empresaData = empresa as any;
    if (!empresaData || !empresaData.planes) {
      console.error('Empresa sin plan asignado');
      return { alcanzado: true, limite: 0, actual: 0 };
    }

    const plan = empresaData.planes;
    const limite = tipo === 'usuarios' ? (plan.max_usuarios || 0) : (plan.max_empleados || 0);
    
    // Si el límite es 0, significa ilimitado
    if (limite === 0) {
      return { 
        alcanzado: false, 
        limite: 0, 
        actual: 0,
        plan_nombre: plan.nombre
      };
    }

    // 2. Contar registros actuales según el tipo
    let actual = 0;
    
    if (tipo === 'usuarios') {
      // Contar usuarios activos en la empresa (todos los roles excepto 'empleado')
      const { count, error: errorCount } = await supabase
        .from('usuarios_sistema')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresa_id)
        .neq('rol', 'empleado') // Excluir empleados
        .eq('activo', true);

      if (!errorCount) {
        actual = count || 0;
      }
    } else if (tipo === 'empleados') {
      // Contar empleados activos en la empresa
      const { count, error: errorCount } = await supabase
        .from('empleados')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresa_id)
        .eq('estado', 'activo');

      if (!errorCount) {
        actual = count || 0;
      }
    }

    const alcanzado = actual >= limite;

    return {
      alcanzado,
      limite,
      actual,
      plan_nombre: plan.nombre
    };

  } catch (error) {
    console.error('Error verificando límite:', error);
    return { alcanzado: true, limite: 0, actual: 0 };
  }
};

/**
 * Obtiene información del plan de una empresa
 * @param empresa_id ID de la empresa
 * @returns Información del plan con límites
 */
export const obtenerPlanEmpresa = async (empresa_id: string) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select(`
        plan_id,
        planes (
          id,
          nombre,
          precio,
          max_usuarios,
          max_empleados,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          tiene_nominas,
          tiene_analytics,
          soporte_prioritario
        )
      `)
      .eq('id', empresa_id)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error obteniendo plan de empresa:', error);
    return null;
  }
};
