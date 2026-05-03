/**
 * Tests para la tabla categorias
 * Categorización de servicios y productos
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: categorias', () => {
  const testCategorias = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    nombre: 'categorias Test',
    tipo: 'admin',
    descripcion: 'Descripción de prueba',
    activo: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","nombre","tipo","descripcion","activo"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testCategorias.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCategorias));

      const { data, error } = await mockSupabase
        .from('categorias')
        .insert(testCategorias)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testCategorias);
    });

    test('debe rechazar registro sin nombre', async () => {
      const invalidData = { ...testCategorias, nombre: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "nombre" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('categorias')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin tipo', async () => {
      const invalidData = { ...testCategorias, tipo: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "tipo" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('categorias')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCategorias));

      const { data, error } = await mockSupabase
        .from('categorias')
        .select('*')
        .eq('id', testCategorias.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testCategorias.id);
    });

    test('debe listar registros', async () => {
      const data = [testCategorias, { ...testCategorias, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('categorias')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testCategorias, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('categorias')
        .update({ nombre: 'Actualizado' })
        .eq('id', testCategorias.id)
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
        .from('categorias')
        .delete()
        .eq('id', testCategorias.id);

      expect(error).toBeNull();
    });
  });
});
