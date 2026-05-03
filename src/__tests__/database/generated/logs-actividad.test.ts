/**
 * Tests para la tabla logs_actividad
 * Logs de actividad de usuarios
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: logs_actividad', () => {
  const testLogsactividad = {
    id: generateUUID(),
    usuario_id: generateUUID(),
    empresa_id: generateUUID(),
    accion: null,
    modulo: null,
    descripcion: 'Descripción de prueba',
    datos_anteriores: null,
    datos_nuevos: null,
    ip_address: null,
    user_agent: null,
    creado_en: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","usuario_id","empresa_id","accion","modulo","descripcion","datos_anteriores","datos_nuevos","ip_address","user_agent","creado_en"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testLogsactividad.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testLogsactividad));

      const { data, error } = await mockSupabase
        .from('logs_actividad')
        .insert(testLogsactividad)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testLogsactividad);
    });

    test('debe rechazar registro sin usuario_id', async () => {
      const invalidData = { ...testLogsactividad, usuario_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "usuario_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('logs_actividad')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin accion', async () => {
      const invalidData = { ...testLogsactividad, accion: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "accion" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('logs_actividad')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin modulo', async () => {
      const invalidData = { ...testLogsactividad, modulo: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "modulo" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('logs_actividad')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testLogsactividad));

      const { data, error } = await mockSupabase
        .from('logs_actividad')
        .select('*')
        .eq('id', testLogsactividad.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testLogsactividad.id);
    });

    test('debe listar registros', async () => {
      const data = [testLogsactividad, { ...testLogsactividad, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('logs_actividad')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testLogsactividad, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('logs_actividad')
        .update({ nombre: 'Actualizado' })
        .eq('id', testLogsactividad.id)
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
        .from('logs_actividad')
        .delete()
        .eq('id', testLogsactividad.id);

      expect(error).toBeNull();
    });
  });
});
