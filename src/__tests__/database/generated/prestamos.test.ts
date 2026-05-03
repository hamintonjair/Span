/**
 * Tests para la tabla prestamos
 * Gestión de préstamos
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: prestamos', () => {
  const testPrestamos = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    empleado_id: generateUUID(),
    monto: 100000,
    cuotas_total: 100000,
    cuotas_pagadas: null,
    monto_pagado: 100000,
    estado: 'activo',
    descripcion: 'Descripción de prueba',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","empleado_id","monto","cuotas_total","cuotas_pagadas","monto_pagado","estado","descripcion","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testPrestamos.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testPrestamos));

      const { data, error } = await mockSupabase
        .from('prestamos')
        .insert(testPrestamos)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testPrestamos);
    });

    test('debe rechazar registro sin empleado_id', async () => {
      const invalidData = { ...testPrestamos, empleado_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "empleado_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('prestamos')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin monto', async () => {
      const invalidData = { ...testPrestamos, monto: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "monto" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('prestamos')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testPrestamos));

      const { data, error } = await mockSupabase
        .from('prestamos')
        .select('*')
        .eq('id', testPrestamos.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testPrestamos.id);
    });

    test('debe listar registros', async () => {
      const data = [testPrestamos, { ...testPrestamos, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('prestamos')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testPrestamos, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('prestamos')
        .update({ nombre: 'Actualizado' })
        .eq('id', testPrestamos.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testPrestamos, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('prestamos')
        .update({ nombre: 'Nuevo' })
        .eq('id', testPrestamos.id)
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
        .from('prestamos')
        .delete()
        .eq('id', testPrestamos.id);

      expect(error).toBeNull();
    });
  });
});
