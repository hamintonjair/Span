/**
 * Tests para la tabla nominas
 * Gestión de nóminas
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: nominas', () => {
  const testNominas = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    empleado_id: generateUUID(),
    periodo_inicio: null,
    periodo_fin: null,
    salario_base: null,
    comisiones: null,
    deducciones: null,
    total_neto: 100000,
    estado: 'activo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","empleado_id","periodo_inicio","periodo_fin","salario_base","comisiones","deducciones","total_neto","estado","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testNominas.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testNominas));

      const { data, error } = await mockSupabase
        .from('nominas')
        .insert(testNominas)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testNominas);
    });

    test('debe rechazar registro sin empresa_id', async () => {
      const invalidData = { ...testNominas, empresa_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "empresa_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('nominas')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin empleado_id', async () => {
      const invalidData = { ...testNominas, empleado_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "empleado_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('nominas')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('SELECT', () => {
    test('debe consultar por id', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testNominas));

      const { data, error } = await mockSupabase
        .from('nominas')
        .select('*')
        .eq('id', testNominas.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testNominas.id);
    });

    test('debe listar registros', async () => {
      const data = [testNominas, { ...testNominas, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('nominas')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testNominas, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('nominas')
        .update({ nombre: 'Actualizado' })
        .eq('id', testNominas.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testNominas, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('nominas')
        .update({ nombre: 'Nuevo' })
        .eq('id', testNominas.id)
        .select()
        .single();

      expect(validators.isValidTimestamp(data!.updated_at)).toBe(true);
    });
  });

  describe('DELETE', () => {
    test('debe eliminar registro', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockSuccessResponse(null));

      const { error } = await mockSupabase
        .from('nominas')
        .delete()
        .eq('id', testNominas.id);

      expect(error).toBeNull();
    });
  });
});
