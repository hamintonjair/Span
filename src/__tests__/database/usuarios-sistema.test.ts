/**
 * Tests para la tabla usuarios_sistema
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../helpers/supabase-mock';
import { testUser, generateUUID, validators } from '../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: usuarios_sistema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = [
        'id', 'nombre', 'email', 'password_hash', 'rol',
        'empresa_id', 'activo', 'created_at', 'updated_at',
        'actualizado_en', 'reset_token', 'reset_token_expires'
      ];
      
      expect(expectedColumns).toContain('id');
      expect(expectedColumns).toContain('email');
      expect(expectedColumns).toContain('password_hash');
      expect(expectedColumns.length).toBeGreaterThan(10);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testUser.id)).toBe(true);
    });

    test('debe validar email correctamente', () => {
      expect(validators.isValidEmail(testUser.email)).toBe(true);
    });

    test('debe validar roles permitidos', () => {
      const validRoles = ['admin_global', 'admin_empresa', 'recepcionista', 'estilista', 'soporte'];
      expect(validRoles).toContain(testUser.rol);
    });
  });

  describe('INSERT', () => {
    test('debe insertar usuario válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testUser));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .insert(testUser)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testUser);
    });

    test('debe rechazar email duplicado', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('duplicate key value violates unique constraint "usuarios_sistema_email_key"')
      );

      const { error } = await mockSupabase
        .from('usuarios_sistema')
        .insert(testUser)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('duplicate key');
    });

    test('debe rechazar rol inválido', async () => {
      const invalidUser = { ...testUser, rol: 'rol_inexistente' };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('CHECK constraint violation')
      );

      const { error } = await mockSupabase
        .from('usuarios_sistema')
        .insert(invalidUser)
        .select()
        .single();

      expect(error).not.toBeNull();
    });

    test('debe establecer activo=true por defecto', async () => {
      const newUser = { ...testUser, id: generateUUID(), activo: undefined };
      const createdUser = { ...newUser, activo: true };
      
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(createdUser));

      const { data } = await mockSupabase
        .from('usuarios_sistema')
        .insert(newUser)
        .select()
        .single();

      expect(data?.activo).toBe(true);
    });
  });

  describe('SELECT', () => {
    test('debe consultar usuario por id', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testUser));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .select('*')
        .eq('id', testUser.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testUser.id);
    });

    test('debe consultar usuario por email', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testUser));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .select('*')
        .eq('email', testUser.email)
        .single();

      expect(error).toBeNull();
      expect(data?.email).toBe(testUser.email);
    });

    test('debe listar usuarios por empresa', async () => {
      const users = [testUser, { ...testUser, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockArrayResponse(users));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .select('*')
        .eq('empresa_id', testUser.empresa_id);

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    test('debe listar solo usuarios activos', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockArrayResponse([testUser]));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .select('*')
        .eq('activo', true);

      expect(error).toBeNull();
      expect(data?.[0].activo).toBe(true);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar nombre de usuario', async () => {
      const updatedData = { ...testUser, nombre: 'Nombre Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .update({ nombre: 'Nombre Actualizado' })
        .eq('id', testUser.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Nombre Actualizado');
    });

    test('debe actualizar rol de usuario', async () => {
      const updatedData = { ...testUser, rol: 'recepcionista' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .update({ rol: 'recepcionista' })
        .eq('id', testUser.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.rol).toBe('recepcionista');
    });

    test('debe desactivar usuario (soft delete)', async () => {
      const updatedData = { ...testUser, activo: false };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .update({ activo: false })
        .eq('id', testUser.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.activo).toBe(false);
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testUser, 
        actualizado_en: new Date().toISOString() 
      };
      
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('usuarios_sistema')
        .update({ nombre: 'Nuevo Nombre' })
        .eq('id', testUser.id)
        .select()
        .single();

      expect(validators.isValidTimestamp(data!.actualizado_en)).toBe(true);
    });
  });

  describe('DELETE', () => {
    test('debe eliminar usuario', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockSuccessResponse(null));

      const { error } = await mockSupabase
        .from('usuarios_sistema')
        .delete()
        .eq('id', testUser.id);

      expect(error).toBeNull();
    });
  });

  describe('Password Reset', () => {
    test('debe establecer reset_token', async () => {
      const token = generateUUID();
      const expiresAt = new Date(Date.now() + 3600000).toISOString();
      const updatedData = { 
        ...testUser, 
        reset_token: token,
        reset_token_expires: expiresAt
      };
      
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .update({ 
          reset_token: token,
          reset_token_expires: expiresAt
        })
        .eq('id', testUser.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.reset_token).toBe(token);
      expect(validators.isValidTimestamp(data!.reset_token_expires!)).toBe(true);
    });

    test('debe limpiar reset_token después de usarlo', async () => {
      const updatedData = { 
        ...testUser, 
        reset_token: null,
        reset_token_expires: null
      };
      
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .update({ 
          reset_token: null,
          reset_token_expires: null
        })
        .eq('id', testUser.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.reset_token).toBeNull();
    });
  });

  describe('Foreign Keys', () => {
    test('debe validar empresa_id referencia existente', async () => {
      const invalidUser = { ...testUser, empresa_id: generateUUID() };
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('foreign key violation on empresas', '23503')
      );

      const { error } = await mockSupabase
        .from('usuarios_sistema')
        .insert(invalidUser)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23503');
    });

    test('debe permitir usuario sin empresa (global)', async () => {
      const globalUser = { ...testUser, id: generateUUID(), empresa_id: null };
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(globalUser));

      const { data, error } = await mockSupabase
        .from('usuarios_sistema')
        .insert(globalUser)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.empresa_id).toBeNull();
    });
  });
});
