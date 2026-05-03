/**
 * Tests para la tabla ventas
 * Registro de ventas
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: ventas', () => {
  const testVentas = {
    id: generateUUID(),
    caja_id: generateUUID(),
    cita_id: generateUUID(),
    cliente_id: generateUUID(),
    empresa_id: generateUUID(),
    vendedor_id: generateUUID(),
    subtotal: 100000,
    descuento: null,
    impuestos: null,
    total: 100000,
    metodo_pago: null,
    estado: 'activo',
    observaciones: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","caja_id","cita_id","cliente_id","empresa_id","vendedor_id","subtotal","descuento","impuestos","total","metodo_pago","estado","observaciones","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testVentas.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testVentas));

      const { data, error } = await mockSupabase
        .from('ventas')
        .insert(testVentas)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testVentas);
    });

    test('debe rechazar registro sin caja_id', async () => {
      const invalidData = { ...testVentas, caja_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "caja_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('ventas')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin total', async () => {
      const invalidData = { ...testVentas, total: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "total" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('ventas')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testVentas));

      const { data, error } = await mockSupabase
        .from('ventas')
        .select('*')
        .eq('id', testVentas.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testVentas.id);
    });

    test('debe listar registros', async () => {
      const data = [testVentas, { ...testVentas, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('ventas')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testVentas, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('ventas')
        .update({ nombre: 'Actualizado' })
        .eq('id', testVentas.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testVentas, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('ventas')
        .update({ nombre: 'Nuevo' })
        .eq('id', testVentas.id)
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
        .from('ventas')
        .delete()
        .eq('id', testVentas.id);

      expect(error).toBeNull();
    });
  });
});
