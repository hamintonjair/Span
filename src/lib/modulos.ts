import { createClient } from '@/lib/supabase/client';

export interface PlanModulos {
  tiene_inventario: boolean;
  tiene_comisiones: boolean;
  tiene_marketing: boolean;
  soporte_prioritario: boolean;
}

export interface EmpresaModulos extends PlanModulos {
  empresa_id: string;
  empresa_nombre: string;
  plan_nombre: string;
  plan_precio: number;
}

/**
 * Obtiene los módulos activos para una empresa según su plan
 */
export async function getModulosEmpresa(empresaId: string): Promise<EmpresaModulos | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('empresas')
      .select(`
        id,
        nombre,
        plan_id,
        planes!inner (
          nombre,
          precio,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          soporte_prioritario
        )
      `)
      .eq('id', empresaId)
      .single();

    if (error) {
      console.error('Error obteniendo módulos de empresa:', error);
      return null;
    }

    if (!data) {
      console.error('Empresa no encontrada:', empresaId);
      return null;
    }

    const empresa = data as any;
    const plan = empresa.planes;

    return {
      empresa_id: empresa.id,
      empresa_nombre: empresa.nombre,
      plan_nombre: plan.nombre,
      plan_precio: plan.precio,
      tiene_inventario: plan.tiene_inventario || false,
      tiene_comisiones: plan.tiene_comisiones || false,
      tiene_marketing: plan.tiene_marketing || false,
      soporte_prioritario: plan.soporte_prioritario || false,
    };
  } catch (error) {
    console.error('Error en getModulosEmpresa:', error);
    return null;
  }
}

/**
 * Verifica si una empresa tiene acceso a un módulo específico
 */
export async function tieneAccesoModulo(empresaId: string, modulo: keyof PlanModulos): Promise<boolean> {
  try {
    const modulos = await getModulosEmpresa(empresaId);
    return modulos?.[modulo] || false;
  } catch (error) {
    console.error('Error verificando acceso a módulo:', error);
    return false;
  }
}

/**
 * Obtiene la configuración de módulos para mostrar en la interfaz
 */
export function getModulosConfig() {
  return [
    {
      key: 'tiene_inventario' as keyof PlanModulos,
      nombre: 'Inventario',
      icon: '📦',
      descripcion: 'Control de stock y productos'
    },
    {
      key: 'tiene_comisiones' as keyof PlanModulos,
      nombre: 'Comisiones',
      icon: '💰',
      descripcion: 'Cálculo de pagos a empleados'
    },
    {
      key: 'tiene_marketing' as keyof PlanModulos,
      nombre: 'Marketing',
      icon: '📢',
      descripcion: 'Envío de promociones'
    },
    {
      key: 'soporte_prioritario' as keyof PlanModulos,
      nombre: 'Soporte Prioritario',
      icon: '⭐',
      descripcion: 'Atención prioritaria 24/7'
    }
  ];
}
