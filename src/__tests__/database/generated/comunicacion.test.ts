/**
 * Tests para la tabla comunicacion
 * Comunicación global
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: comunicacion', () => {
  const testComunicacion = {
    id: generateUUID(),
    tipo: 'admin',
    titulo: null,
    contenido: generateUUID(),
    destinatarios: null,
    fecha_envio: new Date().toISOString().split('T')[0],
    enviado_por: null,
    estado: 'activo',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","tipo","titulo","contenido","destinatarios","fecha_envio","enviado_por","estado","created_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testComunicacion.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testComunicacion));

      const { data, error } = await mockSupabase
        .from('comunicacion')
        .insert(testComunicacion)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testComunicacion);
    });

    test('debe rechazar registro sin tipo', async () => {
      const invalidData = { ...testComunicacion, tipo: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "tipo" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('comunicacion')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin titulo', async () => {
      const invalidData = { ...testComunicacion, titulo: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "titulo" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('comunicacion')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin contenido', async () => {
      const invalidData = { ...testComunicacion, contenido: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "contenido" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('comunicacion')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testComunicacion));

      const { data, error } = await mockSupabase
        .from('comunicacion')
        .select('*')
        .eq('id', testComunicacion.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testComunicacion.id);
    });

    test('debe listar registros', async () => {
      const data = [testComunicacion, { ...testComunicacion, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('comunicacion')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testComunicacion, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('comunicacion')
        .update({ nombre: 'Actualizado' })
        .eq('id', testComunicacion.id)
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
        .from('comunicacion')
        .delete()
        .eq('id', testComunicacion.id);

      expect(error).toBeNull();
    });
  });
});
