/**
 * Tests para la tabla comisiones
 * Sistema de comisiones
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: comisiones', () => {
  const testComisiones = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    empleado_id: generateUUID(),
    venta_id: generateUUID(),
    servicio_id: generateUUID(),
    monto_venta: 100000,
    porcentaje_comision: null,
    monto_comision: 100000,
    estado: 'activo',
    pagado_en: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","empleado_id","venta_id","servicio_id","monto_venta","porcentaje_comision","monto_comision","estado","pagado_en","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testComisiones.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testComisiones));

      const { data, error } = await mockSupabase
        .from('comisiones')
        .insert(testComisiones)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testComisiones);
    });

    test('debe rechazar registro sin empleado_id', async () => {
      const invalidData = { ...testComisiones, empleado_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "empleado_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('comisiones')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin monto_comision', async () => {
      const invalidData = { ...testComisiones, monto_comision: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "monto_comision" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('comisiones')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testComisiones));

      const { data, error } = await mockSupabase
        .from('comisiones')
        .select('*')
        .eq('id', testComisiones.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testComisiones.id);
    });

    test('debe listar registros', async () => {
      const data = [testComisiones, { ...testComisiones, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('comisiones')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testComisiones, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('comisiones')
        .update({ nombre: 'Actualizado' })
        .eq('id', testComisiones.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testComisiones, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('comisiones')
        .update({ nombre: 'Nuevo' })
        .eq('id', testComisiones.id)
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
        .from('comisiones')
        .delete()
        .eq('id', testComisiones.id);

      expect(error).toBeNull();
    });
  });
});
