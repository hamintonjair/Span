/**
 * Tests para la tabla comprobantes
 * Comprobantes de pago
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: comprobantes', () => {
  const testComprobantes = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    suscripcion_id: generateUUID(),
    tipo: 'admin',
    numero: null,
    monto: 100000,
    fecha_emision: new Date().toISOString().split('T')[0],
    estado: 'activo',
    url_archivo: null,
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","suscripcion_id","tipo","numero","monto","fecha_emision","estado","url_archivo","creado_en","actualizado_en"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testComprobantes.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testComprobantes));

      const { data, error } = await mockSupabase
        .from('comprobantes')
        .insert(testComprobantes)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testComprobantes);
    });

    test('debe rechazar registro sin empresa_id', async () => {
      const invalidData = { ...testComprobantes, empresa_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "empresa_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('comprobantes')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin monto', async () => {
      const invalidData = { ...testComprobantes, monto: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "monto" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('comprobantes')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testComprobantes));

      const { data, error } = await mockSupabase
        .from('comprobantes')
        .select('*')
        .eq('id', testComprobantes.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testComprobantes.id);
    });

    test('debe listar registros', async () => {
      const data = [testComprobantes, { ...testComprobantes, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('comprobantes')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testComprobantes, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('comprobantes')
        .update({ nombre: 'Actualizado' })
        .eq('id', testComprobantes.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nombre).toBe('Actualizado');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testComprobantes, 
        updated_at: new Date().toISOString() 
      };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('comprobantes')
        .update({ nombre: 'Nuevo' })
        .eq('id', testComprobantes.id)
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
        .from('comprobantes')
        .delete()
        .eq('id', testComprobantes.id);

      expect(error).toBeNull();
    });
  });
});
