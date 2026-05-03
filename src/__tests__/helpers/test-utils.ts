/**
 * Utilidades para testing de base de datos
 */

/**
 * Genera un UUID v4 válido para tests
 * Implementación nativa sin dependencias externas
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Fechas comunes para testing
 */
export const testDates = {
  now: new Date().toISOString(),
  yesterday: new Date(Date.now() - 86400000).toISOString(),
  tomorrow: new Date(Date.now() + 86400000).toISOString(),
  lastWeek: new Date(Date.now() - 604800000).toISOString(),
  nextWeek: new Date(Date.now() + 604800000).toISOString(),
};

/**
 * Datos de prueba para usuarios
 */
export const testUser = {
  id: generateUUID(),
  nombre: 'Usuario Test',
  email: 'test@example.com',
  password_hash: '$2b$10$testhash1234567890',
  rol: 'admin_empresa',
  empresa_id: generateUUID(),
  activo: true,
  created_at: testDates.now,
  updated_at: testDates.now,
  actualizado_en: testDates.now,
  reset_token: null,
  reset_token_expires: null,
};

/**
 * Datos de prueba para empresas
 */
export const testEmpresa = {
  id: generateUUID(),
  nombre: 'Empresa Test',
  nit: '9001234567',
  telefono: '3001234567',
  direccion: 'Calle Test 123',
  ciudad: 'Bogotá',
  estado: 'activo',
  plan_id: generateUUID(),
  logo_url: null,
  mensaje_ticket: 'Gracias por su compra',
  estado_suscripcion: 'activa',
  fecha_vencimiento: testDates.nextWeek,
  limite_empleados: 10,
  creado_en: testDates.now,
  actualizado_en: testDates.now,
};

/**
 * Datos de prueba para citas
 */
export const testCita = {
  id: generateUUID(),
  cliente_id: generateUUID(),
  empresa_id: generateUUID(),
  empleado_id: generateUUID(),
  fecha: testDates.tomorrow,
  hora_inicio: '10:00',
  hora_fin: '11:00',
  estado: 'pendiente',
  servicios_ids: [generateUUID()],
  notas: 'Notas de prueba',
  total_estimado: 50000,
  created_at: testDates.now,
  updated_at: testDates.now,
};

/**
 * Datos de prueba para ventas
 */
export const testVenta = {
  id: generateUUID(),
  caja_id: generateUUID(),
  cita_id: null,
  cliente_id: generateUUID(),
  empresa_id: generateUUID(),
  vendedor_id: generateUUID(),
  subtotal: 100000,
  descuento: 0,
  impuestos: 19000,
  total: 119000,
  metodo_pago: 'efectivo',
  estado: 'completada',
  observaciones: 'Venta de prueba',
  created_at: testDates.now,
  updated_at: testDates.now,
};

/**
 * Datos de prueba para productos
 */
export const testProducto = {
  id: generateUUID(),
  nombre: 'Producto Test',
  descripcion: 'Descripción del producto',
  precio: 25000,
  costo: 15000,
  stock: 50,
  stock_minimo: 10,
  categoria_id: generateUUID(),
  empresa_id: generateUUID(),
  activo: true,
  created_at: testDates.now,
  updated_at: testDates.now,
};

/**
 * Validadores comunes
 */
export const validators = {
  isValidUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  isValidEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  isValidTimestamp: (value: string): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  
  isValidRol: (value: string, validRoles: string[]): boolean => {
    return validRoles.includes(value);
  },
};
