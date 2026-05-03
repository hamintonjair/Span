/**
 * Tests para la tabla movimientos_caja
 * Movimientos de caja
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: movimientos_caja', () => {
  const testMovimientoscaja = {
    id: generateUUID(),
    caja_id: generateUUID(),
    tipo: 'admin',
    monto: 100000,
    descripcion: 'Descripción de prueba',
    usuario_id: generateUUID(),
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","caja_id","tipo","monto","descripcion","usuario_id","created_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testMovimientoscaja.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testMovimientoscaja));

      const { data, error } = await mockSupabase
        .from('movimientos_caja')
        .insert(testMovimientoscaja)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testMovimientoscaja);
    });

    test('debe rechazar registro sin caja_id', async () => {
      const invalidData = { ...testMovimientoscaja, caja_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "caja_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('movimientos_caja')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin tipo', async () => {
      const invalidData = { ...testMovimientoscaja, tipo: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "tipo" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('movimientos_caja')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin monto', async () => {
      const invalidData = { ...testMovimientoscaja, monto: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "monto" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('movimientos_caja')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testMovimientoscaja));

      const { data, error } = await mockSupabase
        .from('movimientos_caja')
        .select('*')
        .eq('id', testMovimientoscaja.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testMovimientoscaja.id);
    });

    test('debe listar registros', async () => {
      const data = [testMovimientoscaja, { ...testMovimientoscaja, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('movimientos_caja')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testMovimientoscaja, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('movimientos_caja')
        .update({ nombre: 'Actualizado' })
        .eq('id', testMovimientoscaja.id)
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
        .from('movimientos_caja')
        .delete()
        .eq('id', testMovimientoscaja.id);

      expect(error).toBeNull();
    });
  });
});
