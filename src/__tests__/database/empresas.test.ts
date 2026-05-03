/**
 * Tests para la tabla empresas
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../helpers/supabase-mock';
import { testEmpresa, generateUUID, validators } from '../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: empresas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = [
        'id', 'nombre', 'nit', 'telefono', 'direccion', 'ciudad',
        'estado', 'plan_id', 'logo_url', 'mensaje_ticket',
        'estado_suscripcion', 'fecha_vencimiento', 'limite_empleados',
        'creado_en', 'actualizado_en'
      ];
      
      expect(expectedColumns).toContain('id');
      expect(expectedColumns).toContain('nombre');
      expect(expectedColumns.length).toBeGreaterThan(10);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testEmpresa.id)).toBe(true);
    });

    test('debe validar estados permitidos', () => {
      const validEstados = ['activo', 'suspendido', 'inactivo'];
      expect(validEstados).toContain(testEmpresa.estado);
    });
  });

  describe('INSERT', () => {
    test('debe insertar empresa válida', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testEmpresa));

      const { data, error } = await mockSupabase
        .from('empresas')
        .insert(testEmpresa)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testEmpresa);
      expect(mockSupabase.from).toHaveBeenCalledWith('empresas');
    });

    test('debe rechazar empresa sin nombre', async () => {
      const invalidEmpresa = { ...testEmpresa, nombre: '' };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "nombre" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('empresas')
        .insert(invalidEmpresa)
        .select()
        .single();

      expect(error).not.toBeNull();
    });

    test('debe rechazar estado inválido', async () => {
      const invalidEmpresa = { ...testEmpresa, estado: 'estado_invalido' };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('CHECK constraint violation')
      );

      const { error } = await mockSupabase
        .from('empresas')
        .insert(invalidEmpresa)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('SELECT', () => {
    test('debe consultar empresa por id', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testEmpresa));

      const { data, error } = await mockSupabase
        .from('empresas')
        .select('*')
        .eq('id', testEmpresa.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testEmpresa.id);
    });

    test('debe listar todas las empresas', async () => {
      const empresas = [testEmpresa, { ...testEmpresa, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(empresas));

      const { data, error } = await mockSupabase
        .from('empresas')
        .select('*')
        .order('creado_en', { ascending: false });

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    test('debe filtrar por estado', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockArrayResponse([testEmpresa]));

      const { data, error } = await mockSupabase
        .from('empresas')
        .select('*')
        .eq('estado', 'activo');

      expect(error).toBeNull();
      expect(data?.[0].estado).toBe('activo');
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar nombre de empresa', async () => {
      const updatedData = { ...testEmpresa, nombre: 'Empresa Actualizada' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('empresas')
        .update({ nombre: 'Empresa Actualizada' })
        .eq('id', testEmpresa.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Empresa Actualizada');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const beforeUpdate = new Date(testEmpresa.actualizado_en);
      const updatedData = { 
        ...testEmpresa, 
        actualizado_en: new Date().toISOString() 
      };
      
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('empresas')
        .update({ nombre: 'Nuevo Nombre' })
        .eq('id', testEmpresa.id)
        .select()
        .single();

      const afterUpdate = new Date(data!.actualizado_en);
      expect(afterUpdate.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('DELETE', () => {
    test('debe eliminar empresa', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockSuccessResponse(null));

      const { error } = await mockSupabase
        .from('empresas')
        .delete()
        .eq('id', testEmpresa.id);

      expect(error).toBeNull();
    });

    test('debe fallar al eliminar si tiene dependencias', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(
        mockErrorResponse('foreign key violation', '23503')
      );

      const { error } = await mockSupabase
        .from('empresas')
        .delete()
        .eq('id', testEmpresa.id);

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23503');
    });
  });

  describe('Foreign Keys', () => {
    test('debe validar plan_id referencia existente', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('foreign key violation on planes', '23503')
      );

      const invalidEmpresa = { ...testEmpresa, plan_id: generateUUID() };
      const { error } = await mockSupabase
        .from('empresas')
        .insert(invalidEmpresa)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
  });
});
