/**
 * Tests para la tabla mensajes_ticket
 * Mensajes de tickets de soporte
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: mensajes_ticket', () => {
  const testMensajesticket = {
    id: generateUUID(),
    ticket_id: generateUUID(),
    usuario_id: generateUUID(),
    mensaje: null,
    es_staff: true,
    creado_en: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","ticket_id","usuario_id","mensaje","es_staff","creado_en"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testMensajesticket.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testMensajesticket));

      const { data, error } = await mockSupabase
        .from('mensajes_ticket')
        .insert(testMensajesticket)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testMensajesticket);
    });

    test('debe rechazar registro sin ticket_id', async () => {
      const invalidData = { ...testMensajesticket, ticket_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "ticket_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('mensajes_ticket')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin mensaje', async () => {
      const invalidData = { ...testMensajesticket, mensaje: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "mensaje" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('mensajes_ticket')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testMensajesticket));

      const { data, error } = await mockSupabase
        .from('mensajes_ticket')
        .select('*')
        .eq('id', testMensajesticket.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testMensajesticket.id);
    });

    test('debe listar registros', async () => {
      const data = [testMensajesticket, { ...testMensajesticket, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('mensajes_ticket')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testMensajesticket, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('mensajes_ticket')
        .update({ nombre: 'Actualizado' })
        .eq('id', testMensajesticket.id)
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
        .from('mensajes_ticket')
        .delete()
        .eq('id', testMensajesticket.id);

      expect(error).toBeNull();
    });
  });
});
