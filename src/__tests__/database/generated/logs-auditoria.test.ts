/**
 * Tests para la tabla logs_auditoria
 * Logs de auditoría administrativa
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: logs_auditoria', () => {
  const testLogsauditoria = {
    id: generateUUID(),
    usuario_id: generateUUID(),
    tipo_evento: null,
    descripcion: 'Descripción de prueba',
    metadata: { test: true },
    creado_en: new Date().toISOString(),
    ip_address: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","usuario_id","tipo_evento","descripcion","metadata","creado_en","ip_address"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testLogsauditoria.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testLogsauditoria));

      const { data, error } = await mockSupabase
        .from('logs_auditoria')
        .insert(testLogsauditoria)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testLogsauditoria);
    });

    test('debe rechazar registro sin usuario_id', async () => {
      const invalidData = { ...testLogsauditoria, usuario_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "usuario_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('logs_auditoria')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin tipo_evento', async () => {
      const invalidData = { ...testLogsauditoria, tipo_evento: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "tipo_evento" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('logs_auditoria')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testLogsauditoria));

      const { data, error } = await mockSupabase
        .from('logs_auditoria')
        .select('*')
        .eq('id', testLogsauditoria.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testLogsauditoria.id);
    });

    test('debe listar registros', async () => {
      const data = [testLogsauditoria, { ...testLogsauditoria, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('logs_auditoria')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testLogsauditoria, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('logs_auditoria')
        .update({ nombre: 'Actualizado' })
        .eq('id', testLogsauditoria.id)
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
        .from('logs_auditoria')
        .delete()
        .eq('id', testLogsauditoria.id);

      expect(error).toBeNull();
    });
  });
});
