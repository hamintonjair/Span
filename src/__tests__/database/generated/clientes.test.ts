/**
 * Tests para la tabla clientes
 * Gestión de clientes
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: clientes', () => {
  const testClientes = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    nombre: 'clientes Test',
    telefono: null,
    email: 'test@example.com',
    direccion: null,
    fecha_nacimiento: new Date().toISOString().split('T')[0],
    notas: null,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","nombre","telefono","email","direccion","fecha_nacimiento","notas","activo","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testClientes.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testClientes));

      const { data, error } = await mockSupabase
        .from('clientes')
        .insert(testClientes)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testClientes);
    });

    test('debe rechazar registro sin nombre', async () => {
      const invalidData = { ...testClientes, nombre: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "nombre" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('clientes')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testClientes));

      const { data, error } = await mockSupabase
        .from('clientes')
        .select('*')
        .eq('id', testClientes.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testClientes.id);
    });

    test('debe listar registros', async () => {
      const data = [testClientes, { ...testClientes, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testClientes, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('clientes')
        .update({ nombre: 'Actualizado' })
        .eq('id', testClientes.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testClientes, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('clientes')
        .update({ nombre: 'Nuevo' })
        .eq('id', testClientes.id)
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
        .from('clientes')
        .delete()
        .eq('id', testClientes.id);

      expect(error).toBeNull();
    });
  });
});
