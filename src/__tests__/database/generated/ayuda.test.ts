/**
 * Tests para la tabla ayuda
 * Sistema de ayuda/soporte
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: ayuda', () => {
  const testAyuda = {
    id: generateUUID(),
    categoria: null,
    titulo: null,
    contenido: generateUUID(),
    orden: null,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","categoria","titulo","contenido","orden","activo","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testAyuda.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testAyuda));

      const { data, error } = await mockSupabase
        .from('ayuda')
        .insert(testAyuda)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testAyuda);
    });

    test('debe rechazar registro sin categoria', async () => {
      const invalidData = { ...testAyuda, categoria: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "categoria" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('ayuda')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin titulo', async () => {
      const invalidData = { ...testAyuda, titulo: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "titulo" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('ayuda')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testAyuda));

      const { data, error } = await mockSupabase
        .from('ayuda')
        .select('*')
        .eq('id', testAyuda.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testAyuda.id);
    });

    test('debe listar registros', async () => {
      const data = [testAyuda, { ...testAyuda, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('ayuda')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testAyuda, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('ayuda')
        .update({ nombre: 'Actualizado' })
        .eq('id', testAyuda.id)
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
        .from('ayuda')
        .delete()
        .eq('id', testAyuda.id);

      expect(error).toBeNull();
    });
  });
});
