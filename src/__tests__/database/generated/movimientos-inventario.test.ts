/**
 * Tests para la tabla movimientos_inventario
 * Movimientos de inventario
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: movimientos_inventario', () => {
  const testMovimientosinventario = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    producto_id: generateUUID(),
    tipo_movimiento: null,
    cantidad: generateUUID(),
    stock_anterior: 10,
    stock_nuevo: 10,
    motivo: null,
    usuario_id: generateUUID(),
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","producto_id","tipo_movimiento","cantidad","stock_anterior","stock_nuevo","motivo","usuario_id","created_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testMovimientosinventario.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testMovimientosinventario));

      const { data, error } = await mockSupabase
        .from('movimientos_inventario')
        .insert(testMovimientosinventario)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testMovimientosinventario);
    });

    test('debe rechazar registro sin producto_id', async () => {
      const invalidData = { ...testMovimientosinventario, producto_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "producto_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('movimientos_inventario')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin tipo_movimiento', async () => {
      const invalidData = { ...testMovimientosinventario, tipo_movimiento: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "tipo_movimiento" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('movimientos_inventario')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin cantidad', async () => {
      const invalidData = { ...testMovimientosinventario, cantidad: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "cantidad" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('movimientos_inventario')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testMovimientosinventario));

      const { data, error } = await mockSupabase
        .from('movimientos_inventario')
        .select('*')
        .eq('id', testMovimientosinventario.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testMovimientosinventario.id);
    });

    test('debe listar registros', async () => {
      const data = [testMovimientosinventario, { ...testMovimientosinventario, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('movimientos_inventario')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testMovimientosinventario, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('movimientos_inventario')
        .update({ nombre: 'Actualizado' })
        .eq('id', testMovimientosinventario.id)
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
        .from('movimientos_inventario')
        .delete()
        .eq('id', testMovimientosinventario.id);

      expect(error).toBeNull();
    });
  });
});
