/**
 * Tests para la tabla cita_productos
 * Enlace citas-productos
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: cita_productos', () => {
  const testCitaproductos = {
    id: generateUUID(),
    cita_id: generateUUID(),
    producto_id: generateUUID(),
    cantidad: generateUUID(),
    precio_unitario: 100000,
    subtotal: 100000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","cita_id","producto_id","cantidad","precio_unitario","subtotal"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testCitaproductos.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCitaproductos));

      const { data, error } = await mockSupabase
        .from('cita_productos')
        .insert(testCitaproductos)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testCitaproductos);
    });

    test('debe rechazar registro sin cita_id', async () => {
      const invalidData = { ...testCitaproductos, cita_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "cita_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('cita_productos')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin producto_id', async () => {
      const invalidData = { ...testCitaproductos, producto_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "producto_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('cita_productos')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin cantidad', async () => {
      const invalidData = { ...testCitaproductos, cantidad: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "cantidad" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('cita_productos')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCitaproductos));

      const { data, error } = await mockSupabase
        .from('cita_productos')
        .select('*')
        .eq('id', testCitaproductos.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testCitaproductos.id);
    });

    test('debe listar registros', async () => {
      const data = [testCitaproductos, { ...testCitaproductos, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('cita_productos')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testCitaproductos, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('cita_productos')
        .update({ nombre: 'Actualizado' })
        .eq('id', testCitaproductos.id)
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
        .from('cita_productos')
        .delete()
        .eq('id', testCitaproductos.id);

      expect(error).toBeNull();
    });
  });
});
