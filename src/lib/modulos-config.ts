/**
 * Configuración centralizada de módulos del sistema
 * 
 * Para agregar un nuevo módulo:
 * 1. Agregar entrada a MODULES_CONFIG
 * 2. Agregar campo booleano a tabla planes: tiene_nuevo_modulo
 * 3. Actualizar interfaz PlanPermissions
 * 4. El sistema lo detectará automáticamente
 */

export interface ModuloConfig {
  key: string;
  nombre: string;
  icon: string;
  descripcion: string;
  campoBD: string; // Nombre del campo en la tabla planes
  permissionKey: string; // Nombre en PlanPermissions interface
  requiredPlan?: string; // Plan mínimo requerido (opcional)
  categoria: 'core' | 'premium' | 'enterprise'; // Categoría del módulo
}

export const MODULES_CONFIG: ModuloConfig[] = [
  {
    key: 'inventory',
    nombre: 'Inventario',
    icon: '📦',
    descripcion: 'Control de stock y productos',
    campoBD: 'tiene_inventario',
    permissionKey: 'canUseInventory',
    categoria: 'premium'
  },
  {
    key: 'commissions',
    nombre: 'Comisiones',
    icon: '💰',
    descripcion: 'Cálculo de pagos a empleados',
    campoBD: 'tiene_comisiones',
    permissionKey: 'canUseCommissions',
    categoria: 'premium'
  },
  {
    key: 'marketing',
    nombre: 'Marketing',
    icon: '📢',
    descripcion: 'Envío de promociones',
    campoBD: 'tiene_marketing',
    permissionKey: 'canUseMarketing',
    categoria: 'enterprise'
  },
  {
    key: 'priority_support',
    nombre: 'Soporte Prioritario',
    icon: '⭐',
    descripcion: 'Atención prioritaria 24/7',
    campoBD: 'soporte_prioritario',
    permissionKey: 'hasPrioritySupport',
    categoria: 'enterprise'
  },
  {
    key: 'nominas',
    nombre: 'Nóminas',
    icon: '💳',
    descripcion: 'Gestión de pagos y comisiones de empleados',
    campoBD: 'tiene_nominas',
    permissionKey: 'canUseNominas',
    categoria: 'enterprise'
  },
  {
    key: 'analytics',
    nombre: 'Analytics',
    icon: '📊',
    descripcion: 'Análisis avanzado de datos',
    campoBD: 'tiene_analytics',
    permissionKey: 'canUseAnalytics',
    categoria: 'enterprise'
  }
  // ✅ EJEMPLO: Para agregar un nuevo módulo, simplemente añadir aquí:
  // {
  //   key: 'analytics',
  //   nombre: 'Analytics',
  //   icon: '📊',
  //   descripcion: 'Análisis avanzado de datos',
  //   campoBD: 'tiene_analytics',
  //   permissionKey: 'canUseAnalytics',
  //   categoria: 'enterprise'
  // }
];

/**
 * Genera la interfaz PlanPermissions dinámicamente
 */
export function generatePlanPermissionsInterface(): string {
  const properties = MODULES_CONFIG.map(modulo => 
    `  ${modulo.permissionKey}: boolean;`
  ).join('\n');

  return `export interface PlanPermissions {
${properties}
  planName: string;
  planPrice: number;
  loading: boolean;
}`;
}

/**
 * Genera el estado inicial para PlanPermissions
 */
export function generateInitialPermissionsState(): any {
  const initialState: any = {
    planName: 'Básico',
    planPrice: 29.99,
    loading: true
  };

  MODULES_CONFIG.forEach(modulo => {
    initialState[modulo.permissionKey] = false;
  });

  return initialState;
}

/**
 * Genera permisos desde datos del plan (dinámico)
 */
export function generatePermissionsFromPlan(planData: any): any {
  const permissions: any = {};

  MODULES_CONFIG.forEach(modulo => {
    permissions[modulo.permissionKey] = planData?.[modulo.campoBD] || false;
  });

  return permissions;
}

/**
 * Obtiene configuración de un módulo por su key
 */
export function getModuloConfig(key: string): ModuloConfig | undefined {
  return MODULES_CONFIG.find(modulo => modulo.key === key);
}

/**
 * Obtiene módulos por categoría
 */
export function getModulosByCategory(categoria: ModuloConfig['categoria']): ModuloConfig[] {
  return MODULES_CONFIG.filter(modulo => modulo.categoria === categoria);
}

/**
 * Genera consulta SQL para agregar nuevo campo a tabla planes
 */
export function generateSQLForNewModule(modulo: ModuloConfig): string {
  return `-- Agregar módulo: ${modulo.nombre}
ALTER TABLE planes 
ADD COLUMN ${modulo.campoBD} BOOLEAN DEFAULT FALSE;

-- Actualizar planes existentes según corresponda
-- Plan Básico: FALSE por defecto
-- Plan Profesional: TRUE si es premium
-- Plan Empresarial: TRUE si es enterprise`;
}

/**
 * Para desarrolladores: Instrucciones para agregar nuevo módulo
 */
export const INSTRUCCIONES_NUEVO_MODULO = `
📋 PASOS PARA AGREGAR NUEVO MÓDULO:

1. 📄 BASE DE DATOS:
   ALTER TABLE planes ADD COLUMN tiene_nuevo_modulo BOOLEAN DEFAULT FALSE;

   -- Agregamos las columnas si no existen para controlar el acceso
-- Primero, identifiquemos las columnas bool que no tienen nombre claro o agreguemos las nuevas
    
      ALTER TABLE planes ADD COLUMN IF NOT EXISTS tiene_analytics BOOLEAN DEFAULT FALSE;
     

      -- Si tienes una columna de texto para la lista visual de beneficios, úsala así:
      -- (Asumiendo que la columna de texto se llama 'descripcion' o similar)
      UPDATE planes 
      SET descripcion = 'Gestión de citas, Inventario, Nóminas, Analytics, Marketing'
      WHERE nombre = 'Empresarial';

2. 🔧 CONFIGURACIÓN:
   Agregar entrada a MODULES_CONFIG en src/lib/modulos-config.ts

3. 🎯 TIPOSCRIPT:
   - La interfaz se genera automáticamente
   - Los permisos se asignan dinámicamente
   - No requiere modificar ProtectedRoute

4. ✅ LISTO:
   - El sistema detectará automáticamente el nuevo módulo
   - aparecerá en la UI de planes
   - se podrá proteger rutas con él

EJEMPLO:
{
  key: 'analytics',
  nombre: 'Analytics',
  icon: '📊',
  descripcion: 'Análisis avanzado',
  campoBD: 'tiene_analytics',
  permissionKey: 'canUseAnalytics',
  categoria: 'enterprise'
}
`;
