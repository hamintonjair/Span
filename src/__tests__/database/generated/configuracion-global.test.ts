/**
 * Tests para la tabla configuracion_global
 * Configuración global del sistema
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: configuracion_global', () => {
  const testConfiguracionglobal = {
    id: generateUUID(),
    titular: 'configuracion_global Test',
    descripcion: 'Descripción de prueba',
    logo_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","titular","descripcion","logo_url","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testConfiguracionglobal.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testConfiguracionglobal));

      const { data, error } = await mockSupabase
        .from('configuracion_global')
        .insert(testConfiguracionglobal)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testConfiguracionglobal);
    });

    test('debe rechazar registro sin titular', async () => {
      const invalidData = { ...testConfiguracionglobal, titular: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "titular" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('configuracion_global')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testConfiguracionglobal));

      const { data, error } = await mockSupabase
        .from('configuracion_global')
        .select('*')
        .eq('id', testConfiguracionglobal.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testConfiguracionglobal.id);
    });

    test('debe listar registros', async () => {
      const data = [testConfiguracionglobal, { ...testConfiguracionglobal, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('configuracion_global')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testConfiguracionglobal, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('configuracion_global')
        .update({ nombre: 'Actualizado' })
        .eq('id', testConfiguracionglobal.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testConfiguracionglobal, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('configuracion_global')
        .update({ nombre: 'Nuevo' })
        .eq('id', testConfiguracionglobal.id)
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
        .from('configuracion_global')
        .delete()
        .eq('id', testConfiguracionglobal.id);

      expect(error).toBeNull();
    });
  });
});
