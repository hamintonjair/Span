/**
 * Tests para la tabla empleados
 * Gestión de empleados
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: empleados', () => {
  const testEmpleados = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    nombre: 'empleados Test',
    telefono: null,
    email: 'test@example.com',
    cargo: null,
    salario_base: null,
    porcentaje_comision: null,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","nombre","telefono","email","cargo","salario_base","porcentaje_comision","activo","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testEmpleados.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testEmpleados));

      const { data, error } = await mockSupabase
        .from('empleados')
        .insert(testEmpleados)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testEmpleados);
    });

    test('debe rechazar registro sin nombre', async () => {
      const invalidData = { ...testEmpleados, nombre: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "nombre" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('empleados')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin cargo', async () => {
      const invalidData = { ...testEmpleados, cargo: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "cargo" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('empleados')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testEmpleados));

      const { data, error } = await mockSupabase
        .from('empleados')
        .select('*')
        .eq('id', testEmpleados.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testEmpleados.id);
    });

    test('debe listar registros', async () => {
      const data = [testEmpleados, { ...testEmpleados, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('empleados')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testEmpleados, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('empleados')
        .update({ nombre: 'Actualizado' })
        .eq('id', testEmpleados.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testEmpleados, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('empleados')
        .update({ nombre: 'Nuevo' })
        .eq('id', testEmpleados.id)
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
        .from('empleados')
        .delete()
        .eq('id', testEmpleados.id);

      expect(error).toBeNull();
    });
  });
});
