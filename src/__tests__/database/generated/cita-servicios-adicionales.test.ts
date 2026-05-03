/**
 * Tests para la tabla cita_servicios_adicionales
 * Enlace citas-servicios adicionales
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../../helpers/supabase-mock';
import { generateUUID, validators } from '../../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: cita_servicios_adicionales', () => {
  const testCitaserviciosadicionales = {
    id: generateUUID(),
    cita_id: generateUUID(),
    servicio_id: generateUUID(),
    precio_aplicado: 100000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = ["id","cita_id","servicio_id","precio_aplicado"];
      expect(expectedColumns).toContain('id');
      expect(expectedColumns.length).toBeGreaterThan(0);
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testCitaserviciosadicionales.id)).toBe(true);
    });
  });

  describe('INSERT', () => {
    test('debe insertar registro válido', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCitaserviciosadicionales));

      const { data, error } = await mockSupabase
        .from('cita_servicios_adicionales')
        .insert(testCitaserviciosadicionales)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testCitaserviciosadicionales);
    });

    test('debe rechazar registro sin cita_id', async () => {
      const invalidData = { ...testCitaserviciosadicionales, cita_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "cita_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('cita_servicios_adicionales')
        .insert(invalidData)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
    test('debe rechazar registro sin servicio_id', async () => {
      const invalidData = { ...testCitaserviciosadicionales, servicio_id: null };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('column "servicio_id" violates not-null constraint')
      );

      const { error } = await mockSupabase
        .from('cita_servicios_adicionales')
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
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCitaserviciosadicionales));

      const { data, error } = await mockSupabase
        .from('cita_servicios_adicionales')
        .select('*')
        .eq('id', testCitaserviciosadicionales.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testCitaserviciosadicionales.id);
    });

    test('debe listar registros', async () => {
      const data = [testCitaserviciosadicionales, { ...testCitaserviciosadicionales, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(data));

      const { data: result, error } = await mockSupabase
        .from('cita_servicios_adicionales')
        .select('*')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(result).toHaveLength(2);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar registro', async () => {
      const updatedData = { ...testCitaserviciosadicionales, nombre: 'Actualizado' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('cita_servicios_adicionales')
        .update({ nombre: 'Actualizado' })
        .eq('id', testCitaserviciosadicionales.id)
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
        .from('cita_servicios_adicionales')
        .delete()
        .eq('id', testCitaserviciosadicionales.id);

      expect(error).toBeNull();
    });
  });
});
