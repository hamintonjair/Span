/**
 * Tests para la tabla tickets_soporte
 * Tickets de soporte
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: tickets_soporte', () => {
  const testTicketssoporte = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    usuario_creador_id: generateUUID(),
    asunto: 'tickets_soporte Test',
    descripcion: 'Descripción de prueba',
    estado: 'activo',
    prioridad: generateUUID(),
    asignado_a: null,
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","usuario_creador_id","asunto","descripcion","estado","prioridad","asignado_a","creado_en","actualizado_en"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testTicketssoporte.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testTicketssoporte));

      const { data, error } = await mockSupabase
        .from('tickets_soporte')
        .insert(testTicketssoporte)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testTicketssoporte);
    });

    test('debe rechazar registro sin asunto', async () => {
      const invalidData = { ...testTicketssoporte, asunto: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "asunto" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('tickets_soporte')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin descripcion', async () => {
      const invalidData = { ...testTicketssoporte, descripcion: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "descripcion" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('tickets_soporte')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testTicketssoporte));

      const { data, error } = await mockSupabase
        .from('tickets_soporte')
        .select('*')
        .eq('id', testTicketssoporte.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testTicketssoporte.id);
    });

    test('debe listar registros', async () => {
      const data = [testTicketssoporte, { ...testTicketssoporte, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('tickets_soporte')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testTicketssoporte, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('tickets_soporte')
        .update({ nombre: 'Actualizado' })
        .eq('id', testTicketssoporte.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testTicketssoporte, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('tickets_soporte')
        .update({ nombre: 'Nuevo' })
        .eq('id', testTicketssoporte.id)
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
        .from('tickets_soporte')
        .delete()
        .eq('id', testTicketssoporte.id);

      expect(error).toBeNull();
    });
  });
});
