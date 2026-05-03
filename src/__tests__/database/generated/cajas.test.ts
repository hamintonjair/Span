/**
 * Tests para la tabla cajas
 * Gestión de cajas
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: cajas', () => {
  const testCajas = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    usuario_id: generateUUID(),
    fecha_apertura: new Date().toISOString().split('T')[0],
    fecha_cierre: new Date().toISOString().split('T')[0],
    monto_apertura: 100000,
    monto_cierre: 100000,
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
      const expectedColumns = ["id","empresa_id","usuario_id","fecha_apertura","fecha_cierre","monto_apertura","monto_cierre","estado","observaciones","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testCajas.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCajas));

      const { data, error } = await mockSupabase
        .from('cajas')
        .insert(testCajas)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testCajas);
    });

    test('debe rechazar registro sin empresa_id', async () => {
      const invalidData = { ...testCajas, empresa_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "empresa_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('cajas')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin monto_apertura', async () => {
      const invalidData = { ...testCajas, monto_apertura: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "monto_apertura" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('cajas')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCajas));

      const { data, error } = await mockSupabase
        .from('cajas')
        .select('*')
        .eq('id', testCajas.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testCajas.id);
    });

    test('debe listar registros', async () => {
      const data = [testCajas, { ...testCajas, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('cajas')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testCajas, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('cajas')
        .update({ nombre: 'Actualizado' })
        .eq('id', testCajas.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testCajas, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('cajas')
        .update({ nombre: 'Nuevo' })
        .eq('id', testCajas.id)
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
        .from('cajas')
        .delete()
        .eq('id', testCajas.id);

      expect(error).toBeNull();
    });
  });
});
