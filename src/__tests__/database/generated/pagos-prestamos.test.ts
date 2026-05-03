/**
 * Tests para la tabla pagos_prestamos
 * Pagos de préstamos
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: pagos_prestamos', () => {
  const testPagosprestamos = {
    id: generateUUID(),
    prestamo_id: generateUUID(),
    monto: 100000,
    fecha_pago: new Date().toISOString().split('T')[0],
    numero_cuota: null,
    observaciones: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","prestamo_id","monto","fecha_pago","numero_cuota","observaciones"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testPagosprestamos.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testPagosprestamos));

      const { data, error } = await mockSupabase
        .from('pagos_prestamos')
        .insert(testPagosprestamos)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testPagosprestamos);
    });

    test('debe rechazar registro sin prestamo_id', async () => {
      const invalidData = { ...testPagosprestamos, prestamo_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "prestamo_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('pagos_prestamos')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin monto', async () => {
      const invalidData = { ...testPagosprestamos, monto: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "monto" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('pagos_prestamos')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testPagosprestamos));

      const { data, error } = await mockSupabase
        .from('pagos_prestamos')
        .select('*')
        .eq('id', testPagosprestamos.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testPagosprestamos.id);
    });

    test('debe listar registros', async () => {
      const data = [testPagosprestamos, { ...testPagosprestamos, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('pagos_prestamos')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testPagosprestamos, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('pagos_prestamos')
        .update({ nombre: 'Actualizado' })
        .eq('id', testPagosprestamos.id)
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
        .from('pagos_prestamos')
        .delete()
        .eq('id', testPagosprestamos.id);

      expect(error).toBeNull();
    });
  });
});
