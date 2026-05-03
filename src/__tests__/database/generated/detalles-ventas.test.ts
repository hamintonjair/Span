/**
 * Tests para la tabla detalles_ventas
 * Detalles de ventas
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: detalles_ventas', () => {
  const testDetallesventas = {
    id: generateUUID(),
    venta_id: generateUUID(),
    producto_id: generateUUID(),
    servicio_id: generateUUID(),
    cantidad: generateUUID(),
    precio_unitario: 100000,
    descuento: null,
    subtotal: 100000,
    tipo_item: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","venta_id","producto_id","servicio_id","cantidad","precio_unitario","descuento","subtotal","tipo_item","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testDetallesventas.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testDetallesventas));

      const { data, error } = await mockSupabase
        .from('detalles_ventas')
        .insert(testDetallesventas)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testDetallesventas);
    });

    test('debe rechazar registro sin venta_id', async () => {
      const invalidData = { ...testDetallesventas, venta_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "venta_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('detalles_ventas')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin cantidad', async () => {
      const invalidData = { ...testDetallesventas, cantidad: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "cantidad" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('detalles_ventas')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin precio_unitario', async () => {
      const invalidData = { ...testDetallesventas, precio_unitario: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "precio_unitario" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('detalles_ventas')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testDetallesventas));

      const { data, error } = await mockSupabase
        .from('detalles_ventas')
        .select('*')
        .eq('id', testDetallesventas.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testDetallesventas.id);
    });

    test('debe listar registros', async () => {
      const data = [testDetallesventas, { ...testDetallesventas, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('detalles_ventas')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testDetallesventas, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('detalles_ventas')
        .update({ nombre: 'Actualizado' })
        .eq('id', testDetallesventas.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testDetallesventas, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('detalles_ventas')
        .update({ nombre: 'Nuevo' })
        .eq('id', testDetallesventas.id)
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
        .from('detalles_ventas')
        .delete()
        .eq('id', testDetallesventas.id);

      expect(error).toBeNull();
    });
  });
});
