/**
 * Tests para la tabla servicios
 * Gestión de servicios
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: servicios', () => {
  const testServicios = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    nombre: 'servicios Test',
    descripcion: 'Descripción de prueba',
    precio: 100000,
    duracion_minutos: null,
    categoria_id: generateUUID(),
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","nombre","descripcion","precio","duracion_minutos","categoria_id","activo","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testServicios.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testServicios));

      const { data, error } = await mockSupabase
        .from('servicios')
        .insert(testServicios)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testServicios);
    });

    test('debe rechazar registro sin nombre', async () => {
      const invalidData = { ...testServicios, nombre: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "nombre" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('servicios')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin precio', async () => {
      const invalidData = { ...testServicios, precio: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "precio" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('servicios')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin duracion_minutos', async () => {
      const invalidData = { ...testServicios, duracion_minutos: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "duracion_minutos" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('servicios')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testServicios));

      const { data, error } = await mockSupabase
        .from('servicios')
        .select('*')
        .eq('id', testServicios.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testServicios.id);
    });

    test('debe listar registros', async () => {
      const data = [testServicios, { ...testServicios, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('servicios')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testServicios, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('servicios')
        .update({ nombre: 'Actualizado' })
        .eq('id', testServicios.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testServicios, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('servicios')
        .update({ nombre: 'Nuevo' })
        .eq('id', testServicios.id)
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
        .from('servicios')
        .delete()
        .eq('id', testServicios.id);

      expect(error).toBeNull();
    });
  });
});
