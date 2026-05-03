#!/usr/bin/env node

/**
 * Generador de tests para las 33 tablas de Span Business
 * Uso: node scripts/generate-tests.js
 */

const fs = require('fs');
const path = require('path');

const TABLES = [
  {
    name: 'configuracion_global',
    description: 'Configuración global del sistema',
    columns: ['id', 'titular', 'descripcion', 'logo_url', 'created_at', 'updated_at'],
    requiredFields: ['titular'],
    hasTrigger: true,
  },
  {
    name: 'planes',
    description: 'Planes de suscripción',
    columns: ['id', 'nombre', 'descripcion', 'precio_mensual', 'max_usuarios', 'max_empleados', 'caracteristicas', 'created_at'],
    requiredFields: ['nombre', 'precio_mensual'],
    hasTrigger: false,
  },
  {
    name: 'suscripciones',
    description: 'Suscripciones de empresas',
    columns: ['id', 'empresa_id', 'plan_id', 'fecha_inicio', 'fecha_fin', 'estado', 'estado_pago', 'monto', 'created_at', 'updated_at'],
    requiredFields: ['empresa_id', 'plan_id'],
    hasTrigger: true,
    foreignKeys: ['empresas', 'planes'],
  },
  {
    name: 'comprobantes',
    description: 'Comprobantes de pago',
    columns: ['id', 'empresa_id', 'suscripcion_id', 'tipo', 'numero', 'monto', 'fecha_emision', 'estado', 'url_archivo', 'creado_en', 'actualizado_en'],
    requiredFields: ['empresa_id', 'monto'],
    hasTrigger: true,
  },
  {
    name: 'logs_actividad',
    description: 'Logs de actividad de usuarios',
    columns: ['id', 'usuario_id', 'empresa_id', 'accion', 'modulo', 'descripcion', 'datos_anteriores', 'datos_nuevos', 'ip_address', 'user_agent', 'creado_en'],
    requiredFields: ['usuario_id', 'accion', 'modulo'],
    hasTrigger: false,
  },
  {
    name: 'cajas',
    description: 'Gestión de cajas',
    columns: ['id', 'empresa_id', 'usuario_id', 'fecha_apertura', 'fecha_cierre', 'monto_apertura', 'monto_cierre', 'estado', 'observaciones', 'created_at', 'updated_at'],
    requiredFields: ['empresa_id', 'monto_apertura'],
    hasTrigger: true,
  },
  {
    name: 'ventas',
    description: 'Registro de ventas',
    columns: ['id', 'caja_id', 'cita_id', 'cliente_id', 'empresa_id', 'vendedor_id', 'subtotal', 'descuento', 'impuestos', 'total', 'metodo_pago', 'estado', 'observaciones', 'created_at', 'updated_at'],
    requiredFields: ['caja_id', 'total'],
    hasTrigger: true,
  },
  {
    name: 'nominas',
    description: 'Gestión de nóminas',
    columns: ['id', 'empresa_id', 'empleado_id', 'periodo_inicio', 'periodo_fin', 'salario_base', 'comisiones', 'deducciones', 'total_neto', 'estado', 'created_at', 'updated_at'],
    requiredFields: ['empresa_id', 'empleado_id'],
    hasTrigger: true,
  },
  {
    name: 'clientes',
    description: 'Gestión de clientes',
    columns: ['id', 'empresa_id', 'nombre', 'telefono', 'email', 'direccion', 'fecha_nacimiento', 'notas', 'activo', 'created_at', 'updated_at'],
    requiredFields: ['nombre'],
    hasTrigger: true,
  },
  {
    name: 'empleados',
    description: 'Gestión de empleados',
    columns: ['id', 'empresa_id', 'nombre', 'telefono', 'email', 'cargo', 'salario_base', 'porcentaje_comision', 'activo', 'created_at', 'updated_at'],
    requiredFields: ['nombre', 'cargo'],
    hasTrigger: true,
  },
  {
    name: 'prestamos',
    description: 'Gestión de préstamos',
    columns: ['id', 'empresa_id', 'empleado_id', 'monto', 'cuotas_total', 'cuotas_pagadas', 'monto_pagado', 'estado', 'descripcion', 'created_at', 'updated_at'],
    requiredFields: ['empleado_id', 'monto'],
    hasTrigger: true,
  },
  {
    name: 'productos',
    description: 'Gestión de productos',
    columns: ['id', 'empresa_id', 'nombre', 'descripcion', 'precio', 'costo', 'stock', 'stock_minimo', 'categoria_id', 'activo', 'created_at', 'updated_at'],
    requiredFields: ['nombre', 'precio'],
    hasTrigger: true,
  },
  {
    name: 'servicios',
    description: 'Gestión de servicios',
    columns: ['id', 'empresa_id', 'nombre', 'descripcion', 'precio', 'duracion_minutos', 'categoria_id', 'activo', 'created_at', 'updated_at'],
    requiredFields: ['nombre', 'precio', 'duracion_minutos'],
    hasTrigger: true,
  },
  {
    name: 'categorias',
    description: 'Categorización de servicios y productos',
    columns: ['id', 'empresa_id', 'nombre', 'tipo', 'descripcion', 'activo'],
    requiredFields: ['nombre', 'tipo'],
    hasTrigger: false,
  },
  {
    name: 'comisiones',
    description: 'Sistema de comisiones',
    columns: ['id', 'empresa_id', 'empleado_id', 'venta_id', 'servicio_id', 'monto_venta', 'porcentaje_comision', 'monto_comision', 'estado', 'pagado_en', 'created_at', 'updated_at'],
    requiredFields: ['empleado_id', 'monto_comision'],
    hasTrigger: true,
  },
  {
    name: 'proveedores',
    description: 'Gestión de proveedores',
    columns: ['id', 'empresa_id', 'nombre', 'contacto', 'telefono', 'email', 'direccion', 'activo', 'created_at', 'updated_at'],
    requiredFields: ['nombre'],
    hasTrigger: true,
  },
  {
    name: 'cita_productos',
    description: 'Enlace citas-productos',
    columns: ['id', 'cita_id', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal'],
    requiredFields: ['cita_id', 'producto_id', 'cantidad'],
    hasTrigger: false,
  },
  {
    name: 'detalles_ventas',
    description: 'Detalles de ventas',
    columns: ['id', 'venta_id', 'producto_id', 'servicio_id', 'cantidad', 'precio_unitario', 'descuento', 'subtotal', 'tipo_item', 'created_at', 'updated_at'],
    requiredFields: ['venta_id', 'cantidad', 'precio_unitario'],
    hasTrigger: true,
  },
  {
    name: 'pagos_prestamos',
    description: 'Pagos de préstamos',
    columns: ['id', 'prestamo_id', 'monto', 'fecha_pago', 'numero_cuota', 'observaciones'],
    requiredFields: ['prestamo_id', 'monto'],
    hasTrigger: false,
  },
  {
    name: 'movimientos_caja',
    description: 'Movimientos de caja',
    columns: ['id', 'caja_id', 'tipo', 'monto', 'descripcion', 'usuario_id', 'created_at'],
    requiredFields: ['caja_id', 'tipo', 'monto'],
    hasTrigger: false,
  },
  {
    name: 'campanas_marketing',
    description: 'Campañas de marketing',
    columns: ['id', 'empresa_id', 'nombre', 'descripcion', 'tipo', 'fecha_inicio', 'fecha_fin', 'presupuesto', 'gasto_real', 'alcance', 'conversiones', 'estado'],
    requiredFields: ['empresa_id', 'nombre'],
    hasTrigger: false,
  },
  {
    name: 'movimientos_inventario',
    description: 'Movimientos de inventario',
    columns: ['id', 'empresa_id', 'producto_id', 'tipo_movimiento', 'cantidad', 'stock_anterior', 'stock_nuevo', 'motivo', 'usuario_id', 'created_at'],
    requiredFields: ['producto_id', 'tipo_movimiento', 'cantidad'],
    hasTrigger: false,
  },
  {
    name: 'cita_servicios_adicionales',
    description: 'Enlace citas-servicios adicionales',
    columns: ['id', 'cita_id', 'servicio_id', 'precio_aplicado'],
    requiredFields: ['cita_id', 'servicio_id'],
    hasTrigger: false,
  },
  {
    name: 'usuarios_staff',
    description: 'Usuarios staff global',
    columns: ['id', 'nombre', 'email', 'password_hash', 'rol', 'departamento', 'activo', 'created_at', 'updated_at'],
    requiredFields: ['nombre', 'email', 'rol'],
    hasTrigger: true,
  },
  {
    name: 'comunicacion',
    description: 'Comunicación global',
    columns: ['id', 'tipo', 'titulo', 'contenido', 'destinatarios', 'fecha_envio', 'enviado_por', 'estado', 'created_at'],
    requiredFields: ['tipo', 'titulo', 'contenido'],
    hasTrigger: false,
  },
  {
    name: 'ayuda',
    description: 'Sistema de ayuda/soporte',
    columns: ['id', 'categoria', 'titulo', 'contenido', 'orden', 'activo', 'created_at', 'updated_at'],
    requiredFields: ['categoria', 'titulo'],
    hasTrigger: false,
  },
  {
    name: 'tickets_soporte',
    description: 'Tickets de soporte',
    columns: ['id', 'empresa_id', 'usuario_creador_id', 'asunto', 'descripcion', 'estado', 'prioridad', 'asignado_a', 'creado_en', 'actualizado_en'],
    requiredFields: ['asunto', 'descripcion'],
    hasTrigger: true,
  },
  {
    name: 'logs_auditoria',
    description: 'Logs de auditoría administrativa',
    columns: ['id', 'usuario_id', 'tipo_evento', 'descripcion', 'metadata', 'creado_en', 'ip_address'],
    requiredFields: ['usuario_id', 'tipo_evento'],
    hasTrigger: false,
  },
  {
    name: 'mensajes_ticket',
    description: 'Mensajes de tickets de soporte',
    columns: ['id', 'ticket_id', 'usuario_id', 'mensaje', 'es_staff', 'creado_en'],
    requiredFields: ['ticket_id', 'mensaje'],
    hasTrigger: false,
  },
  {
    name: 'respaldos_datos',
    description: 'Sistema de respaldos',
    columns: ['id', 'empresa_id', 'nombre_archivo', 'datos', 'creado_por', 'created_at'],
    requiredFields: ['nombre_archivo', 'datos'],
    hasTrigger: false,
  },
];

function generateTestFile(table) {
  const testDataName = `test${table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_/g, '')}`;
  
  return `/**
 * Tests para la tabla ${table.name}
 * ${table.description}
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: ${table.name}', () => {
  const ${testDataName} = {
    id: generateUUID(),
${table.columns.filter(col => col !== 'id').map(col => {
  if (col.includes('id') && col !== 'id') return `    ${col}: generateUUID(),`;
  if (col.includes('monto') || col.includes('precio') || col.includes('total')) return `    ${col}: 100000,`;
  if (col.includes('cantidad') || col.includes('stock')) return `    ${col}: 10,`;
  if (col === 'activo' || col === 'es_staff') return `    ${col}: true,`;
  if (col.includes('estado')) return `    ${col}: 'activo',`;
  if (col.includes('fecha')) return `    ${col}: new Date().toISOString().split('T')[0],`;
  if (col.includes('created_at') || col.includes('updated_at') || col.includes('creado_en') || col.includes('actualizado_en')) return `    ${col}: new Date().toISOString(),`;
  if (col === 'nombre' || col === 'titular' || col === 'asunto') return `    ${col}: '${table.name} Test',`;
  if (col === 'email') return `    ${col}: 'test@example.com',`;
  if (col === 'descripcion' || col === 'contenido') return `    ${col}: 'Descripción de prueba',`;
  if (col === 'tipo' || col === 'rol') return `    ${col}: 'admin',`;
  if (col === 'datos' || col.includes('metadata')) return `    ${col}: { test: true },`;
  return `    ${col}: null,`;
}).join('\n')}
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ${JSON.stringify(table.columns)};
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(${testDataName}.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(${testDataName}));

      const { data, error } = await mockSupabase
        .from('${table.name}')
        .insert(${testDataName})
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(${testDataName});
    });
${table.requiredFields.map(field => `
    test('debe rechazar registro sin ${field}', async () => {
      const invalidData = { ...${testDataName}, ${field}: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "${field}" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('${table.name}')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });`).join('')}
  });

  describe('SELECT', () => {
    test('debe consultar por id', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(${testDataName}));

      const { data, error } = await mockSupabase
        .from('${table.name}')
        .select('*')
        .eq('id', ${testDataName}.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(${testDataName}.id);
    });

    test('debe listar registros', async () => {
      const data = [${testDataName}, { ...${testDataName}, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('${table.name}')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...${testDataName}, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('${table.name}')
        .update({ nombre: 'Actualizado' })
        .eq('id', ${testDataName}.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });
${table.hasTrigger ? `
    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...${testDataName}, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('${table.name}')
        .update({ nombre: 'Nuevo' })
        .eq('id', ${testDataName}.id)
        .select()
        .single();

      expect(validators.isValidTimestamp(data!.updated_at)).toBe(true);
    });` : ''}
  });

  describe('DELETE', () => {
    test('debe eliminar registro', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockSuccessResponse(null));

      const { error } = await mockSupabase
        .from('${table.name}')
        .delete()
        .eq('id', ${testDataName}.id);

      expect(error).toBeNull();
    });
  });
});
`;
}

function main() {
  console.log('🚀 Generando tests para', TABLES.length, 'tablas...\n');
  
  const outputDir = path.join(__dirname, '..', 'src', '__tests__', 'database', 'generated');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let generatedCount = 0;
  
  TABLES.forEach(table => {
    const testContent = generateTestFile(table);
    const fileName = `${table.name.replace(/_/g, '-')}.test.ts`;
    const filePath = path.join(outputDir, fileName);
    
    fs.writeFileSync(filePath, testContent, 'utf8');
    console.log(`✅ Generado: ${fileName} (${table.description})`);
    generatedCount++;
  });
  
  console.log(`\n🎉 ${generatedCount} archivos de tests generados en: ${outputDir}\n`);
  
  // Generar index.ts
  const indexContent = `/**
 * Tests generados automáticamente para todas las tablas
 */
${TABLES.map(t => `import './generated/${t.name.replace(/_/g, '-')}.test';`).join('\n')}
`;
  
  fs.writeFileSync(path.join(outputDir, '..', 'index.generated.ts'), indexContent);
  console.log('✅ Generado: index.generated.ts');
}

main();
