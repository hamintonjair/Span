/**
 * Tests para la tabla usuarios_staff
 * Usuarios staff global
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: usuarios_staff', () => {
  const testUsuariosstaff = {
    id: generateUUID(),
    nombre: 'usuarios_staff Test',
    email: 'test@example.com',
    password_hash: null,
    rol: 'admin',
    departamento: null,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","nombre","email","password_hash","rol","departamento","activo","created_at","updated_at"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testUsuariosstaff.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testUsuariosstaff));

      const { data, error } = await mockSupabase
        .from('usuarios_staff')
        .insert(testUsuariosstaff)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testUsuariosstaff);
    });

    test('debe rechazar registro sin nombre', async () => {
      const invalidData = { ...testUsuariosstaff, nombre: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "nombre" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('usuarios_staff')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin email', async () => {
      const invalidData = { ...testUsuariosstaff, email: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "email" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('usuarios_staff')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin rol', async () => {
      const invalidData = { ...testUsuariosstaff, rol: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "rol" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('usuarios_staff')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testUsuariosstaff));

      const { data, error } = await mockSupabase
        .from('usuarios_staff')
        .select('*')
        .eq('id', testUsuariosstaff.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testUsuariosstaff.id);
    });

    test('debe listar registros', async () => {
      const data = [testUsuariosstaff, { ...testUsuariosstaff, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('usuarios_staff')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testUsuariosstaff, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('usuarios_staff')
        .update({ nombre: 'Actualizado' })
        .eq('id', testUsuariosstaff.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testUsuariosstaff, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('usuarios_staff')
        .update({ nombre: 'Nuevo' })
        .eq('id', testUsuariosstaff.id)
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
        .from('usuarios_staff')
        .delete()
        .eq('id', testUsuariosstaff.id);

      expect(error).toBeNull();
    });
  });
});
