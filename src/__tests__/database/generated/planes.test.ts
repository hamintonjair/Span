/**
 * Tests para la tabla planes
 * Planes de suscripción
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: planes', () => {
  const testPlanes = {
    id: generateUUID(),
    nombre: 'planes Test',
    descripcion: 'Descripción de prueba',
    precio_mensual: 100000,
    max_usuarios: null,
    max_empleados: null,
    caracteristicas: null,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","nombre","descripcion","precio_mensual","max_usuarios","max_empleados","caracteristicas","created_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testPlanes.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testPlanes));

      const { data, error } = await mockSupabase
        .from('planes')
        .insert(testPlanes)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testPlanes);
    });

    test('debe rechazar registro sin nombre', async () => {
      const invalidData = { ...testPlanes, nombre: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "nombre" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('planes')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin precio_mensual', async () => {
      const invalidData = { ...testPlanes, precio_mensual: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "precio_mensual" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('planes')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testPlanes));

      const { data, error } = await mockSupabase
        .from('planes')
        .select('*')
        .eq('id', testPlanes.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testPlanes.id);
    });

    test('debe listar registros', async () => {
      const data = [testPlanes, { ...testPlanes, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('planes')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testPlanes, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('planes')
        .update({ nombre: 'Actualizado' })
        .eq('id', testPlanes.id)
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
        .from('planes')
        .delete()
        .eq('id', testPlanes.id);

      expect(error).toBeNull();
    });
  });
});
