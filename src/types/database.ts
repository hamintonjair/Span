// =============================================
// TIPOS DE BASE DE DATOS - SUPABASE
// =============================================

export interface Empresa {
  id: string;
  nombre: string;
  logo?: string;
  plan_id: string;
  estado_suscripcion: 'activa' | 'suspendida' | 'cancelada';
  fecha_vencimiento?: string;
  created_at: string;
  updated_at: string;
}

export interface Perfil {
  id: string;
  empresa_id: string;
  nombre: string;
  email: string;
  rol: 'admin_global' | 'admin_empresa' | 'estilista' | 'recepcionista';
  telefono?: string;
  created_at: string;
  updated_at: string;
}

export interface Caja {
  id: string;
  empresa_id: string;
  base_inicial: number;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_final?: number;
  estado: 'abierta' | 'cerrada';
  creado_por?: string;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Servicio {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  comision_empleado: number;
  duracion_minutos: number;
  estado: 'activo' | 'inactivo';
  categoria_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Empleado {
  id: string;
  perfil_id: string;
  empresa_id: string;
  sueldo_base: number;
  porcentaje_comision: number;
  fecha_contratacion: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface Prestamo {
  id: string;
  empleado_id: string;
  empresa_id: string;
  monto_total: number;
  saldo_pendiente: number;
  cuota_mensual: number;
  fecha_prestamo: string;
  fecha_limite?: string;
  estado: 'activo' | 'pagado' | 'vencido';
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// TIPOS CON RELACIONES (JOINS)
// =============================================

export interface EmpleadoConPerfil extends Empleado {
  perfil: Perfil;
}

export interface PrestamoConEmpleado extends Prestamo {
  empleado: EmpleadoConPerfil;
}

export interface CajaConCreador extends Caja {
  creador?: Perfil;
}

export interface PerfilConEmpresa extends Perfil {
  empresa: Empresa;
}

// =============================================
// TIPOS PARA FORMULARIOS
// =============================================

export interface CrearEmpresaForm {
  nombre: string;
  logo?: File;
  plan_id: string;
  estado_suscripcion: 'activa' | 'suspendida' | 'cancelada';
  fecha_vencimiento?: string;
}

export interface CrearPerfilForm {
  empresa_id: string;
  nombre: string;
  email: string;
  rol: 'admin_global' | 'admin_empresa' | 'estilista' | 'recepcionista';
  telefono?: string;
  password?: string; // Para creación inicial
}

export interface CrearCajaForm {
  empresa_id: string;
  base_inicial: number;
}

export interface CrearEmpleadoForm {
  perfil_id: string;
  empresa_id: string;
  sueldo_base: number;
  porcentaje_comision: number;
  fecha_contratacion: string;
}

export interface CrearPrestamoForm {
  empleado_id: string;
  empresa_id: string;
  monto_total: number;
  cuota_mensual: number;
  fecha_limite?: string;
  descripcion?: string;
}

// =============================================
// TIPOS PARA ESTADOS Y FILTROS
// =============================================

export type EstadoCaja = 'abierta' | 'cerrada';
export type EstadoEmpleado = 'activo' | 'inactivo';
export type EstadoPrestamo = 'activo' | 'pagado' | 'vencido';
export type EstadoSuscripcion = 'activa' | 'suspendida' | 'cancelada';
export type RolUsuario = 'admin_global' | 'admin_empresa' | 'estilista' | 'recepcionista';

export interface FiltrosCaja {
  estado?: EstadoCaja;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface FiltrosPrestamo {
  estado?: EstadoPrestamo;
  empleado_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

// =============================================
// TIPOS PARA RESPUESTAS DE API
// =============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================
// TIPOS PARA ESTADÍSTICAS
// =============================================

export interface EstadisticasCaja {
  total_ingresos: number;
  total_egresos: number;
  saldo_actual: number;
  cajas_abiertas: number;
  cajas_cerradas: number;
}

export interface EstadisticasPrestamos {
  total_prestados: number;
  total_recuperado: number;
  saldo_pendiente_total: number;
  prestamos_activos: number;
  prestamos_vencidos: number;
}

export interface DashboardData {
  estadisticas_caja: EstadisticasCaja;
  estadisticas_prestamos: EstadisticasPrestamos;
  empleados_activos: number;
  proximos_vencimientos: PrestamoConEmpleado[];
}
