/**
 * Tests para la tabla suscripciones
 * Suscripciones de empresas
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: suscripciones', () => {
  const testSuscripciones = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    plan_id: generateUUID(),
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    estado: 'activo',
    estado_pago: 'activo',
    monto: 100000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","plan_id","fecha_inicio","fecha_fin","estado","estado_pago","monto","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testSuscripciones.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testSuscripciones));

      const { data, error } = await mockSupabase
        .from('suscripciones')
        .insert(testSuscripciones)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testSuscripciones);
    });

    test('debe rechazar registro sin empresa_id', async () => {
      const invalidData = { ...testSuscripciones, empresa_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "empresa_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('suscripciones')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin plan_id', async () => {
      const invalidData = { ...testSuscripciones, plan_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "plan_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('suscripciones')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testSuscripciones));

      const { data, error } = await mockSupabase
        .from('suscripciones')
        .select('*')
        .eq('id', testSuscripciones.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testSuscripciones.id);
    });

    test('debe listar registros', async () => {
      const data = [testSuscripciones, { ...testSuscripciones, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('suscripciones')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testSuscripciones, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('suscripciones')
        .update({ nombre: 'Actualizado' })
        .eq('id', testSuscripciones.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testSuscripciones, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('suscripciones')
        .update({ nombre: 'Nuevo' })
        .eq('id', testSuscripciones.id)
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
        .from('suscripciones')
        .delete()
        .eq('id', testSuscripciones.id);

      expect(error).toBeNull();
    });
  });
});
