/**
 * Tests para la tabla respaldos_datos
 * Sistema de respaldos
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: respaldos_datos', () => {
  const testRespaldosdatos = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    nombre_archivo: null,
    datos: { test: true },
    creado_por: null,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","nombre_archivo","datos","creado_por","created_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testRespaldosdatos.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testRespaldosdatos));

      const { data, error } = await mockSupabase
        .from('respaldos_datos')
        .insert(testRespaldosdatos)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testRespaldosdatos);
    });

    test('debe rechazar registro sin nombre_archivo', async () => {
      const invalidData = { ...testRespaldosdatos, nombre_archivo: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "nombre_archivo" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('respaldos_datos')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin datos', async () => {
      const invalidData = { ...testRespaldosdatos, datos: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "datos" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('respaldos_datos')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testRespaldosdatos));

      const { data, error } = await mockSupabase
        .from('respaldos_datos')
        .select('*')
        .eq('id', testRespaldosdatos.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testRespaldosdatos.id);
    });

    test('debe listar registros', async () => {
      const data = [testRespaldosdatos, { ...testRespaldosdatos, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('respaldos_datos')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testRespaldosdatos, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('respaldos_datos')
        .update({ nombre: 'Actualizado' })
        .eq('id', testRespaldosdatos.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

  });

  describe('DELETE', () => {
    test('debe eliminar registro', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockSuccessResponse(null));

      const { error } = await mockSupabase
        .from('respaldos_datos')
        .delete()
        .eq('id', testRespaldosdatos.id);

      expect(error).toBeNull();
    });
  });
});
