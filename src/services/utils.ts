/**
 * Utilidades comunes para los servicios
 */

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'SERVICE_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Maneja errores de Supabase de manera estandarizada
 */
export function handleSupabaseError(error: any): ServiceError {
  if (error?.code === 'PGRST116') {
    return new ServiceError('Registro no encontrado', 'NOT_FOUND', error);
  }
  
  if (error?.code === '23505') {
    return new ServiceError('Registro duplicado', 'DUPLICATE_ENTRY', error);
  }
  
  if (error?.code === '23503') {
    return new ServiceError('Violación de clave foránea', 'FOREIGN_KEY_VIOLATION', error);
  }
  
  if (error?.code === '23514') {
    return new ServiceError('Violación de restricción', 'CONSTRAINT_VIOLATION', error);
  }
  
  if (error?.code === '42501') {
    return new ServiceError('Permiso denegado', 'PERMISSION_DENIED', error);
  }
  
  return new ServiceError(
    error?.message || 'Error desconocido',
    error?.code || 'UNKNOWN_ERROR',
    error
  );
}

/**
 * Valida que un string sea un UUID válido
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Formatea números a moneda
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Calcula el IVA (16% por defecto en México)
 */
export function calcularIVA(subtotal: number, tasa: number = 0.16): number {
  return subtotal * tasa;
}

/**
 * Valida que una fecha esté en el formato correcto
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Genera un código de referencia único
 */
export function generarReferencia(prefix: string = 'REF'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida teléfono (formato mexicano)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+52|52)?[\s-]?(\d{10}|\d{3}[\s-]?\d{3}[\s-]?\d{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Pagina resultados de manera segura
 */
export function paginateResults<T>(
  results: T[],
  page: number,
  limit: number
): {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
} {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = results.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total: results.length,
    page,
    pageSize: limit,
    hasMore: endIndex < results.length
  };
}

/**
 * Formatea fecha para mostrar
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const shortOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  };
  
  const longOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };

  const options = {
    short: shortOptions,
    long: longOptions,
    time: timeOptions
  };

  return new Intl.DateTimeFormat('es-ES', options[format]).format(dateObj);
}

/**
 * Calcula diferencia en días entre dos fechas
 */
export function diasEntreFechas(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diffTime = Math.abs(fin.getTime() - inicio.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Valida que un monto sea positivo
 */
export function isValidAmount(amount: number): boolean {
  return !isNaN(amount) && amount >= 0;
}

/**
 * Redondea a 2 decimales
 */
export function roundToTwo(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
