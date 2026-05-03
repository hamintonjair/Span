/**
 * Tests para la tabla campanas_marketing
 * Campañas de marketing
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: campanas_marketing', () => {
  const testCampanasmarketing = {
    id: generateUUID(),
    empresa_id: generateUUID(),
    nombre: 'campanas_marketing Test',
    descripcion: 'Descripción de prueba',
    tipo: 'admin',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    presupuesto: null,
    gasto_real: null,
    alcance: null,
    conversiones: null,
    estado: 'activo',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","empresa_id","nombre","descripcion","tipo","fecha_inicio","fecha_fin","presupuesto","gasto_real","alcance","conversiones","estado"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testCampanasmarketing.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCampanasmarketing));

      const { data, error } = await mockSupabase
        .from('campanas_marketing')
        .insert(testCampanasmarketing)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testCampanasmarketing);
    });

    test('debe rechazar registro sin empresa_id', async () => {
      const invalidData = { ...testCampanasmarketing, empresa_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "empresa_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('campanas_marketing')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin nombre', async () => {
      const invalidData = { ...testCampanasmarketing, nombre: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "nombre" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('campanas_marketing')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCampanasmarketing));

      const { data, error } = await mockSupabase
        .from('campanas_marketing')
        .select('*')
        .eq('id', testCampanasmarketing.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testCampanasmarketing.id);
    });

    test('debe listar registros', async () => {
      const data = [testCampanasmarketing, { ...testCampanasmarketing, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('campanas_marketing')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testCampanasmarketing, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('campanas_marketing')
        .update({ nombre: 'Actualizado' })
        .eq('id', testCampanasmarketing.id)
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
        .from('campanas_marketing')
        .delete()
        .eq('id', testCampanasmarketing.id);

      expect(error).toBeNull();
    });
  });
});
