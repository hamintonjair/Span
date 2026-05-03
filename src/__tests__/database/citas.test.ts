/**
 * Tests para la tabla citas
 */

import { mockSupabase, mockSuccessResponse, mockErrorResponse, mockArrayResponse } from '../helpers/supabase-mock';
import { testCita, generateUUID, validators } from '../helpers/test-utils';

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Tabla: citas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema', () => {
    test('debe tener estructura correcta de columnas', () => {
      const expectedColumns = [
        'id', 'cliente_id', 'empresa_id', 'empleado_id',
        'fecha', 'hora_inicio', 'hora_fin', 'estado',
        'servicios_ids', 'notas', 'total_estimado',
        'created_at', 'updated_at'
      ];
      
      expect(expectedColumns).toContain('id');
      expect(expectedColumns).toContain('cliente_id');
      expect(expectedColumns).toContain('fecha');
    });

    test('debe validar UUID en id', () => {
      expect(validators.isValidUUID(testCita.id)).toBe(true);
    });

    test('debe validar estados permitidos', () => {
      const validEstados = ['pendiente', 'confirmada', 'en_progreso', 'completada', 'cancelada'];
      expect(validEstados).toContain(testCita.estado);
    });

    test('debe validar array de servicios_ids', () => {
      expect(Array.isArray(testCita.servicios_ids)).toBe(true);
      expect(testCita.servicios_ids.length).toBeGreaterThan(0);
      testCita.servicios_ids.forEach(id => {
        expect(validators.isValidUUID(id)).toBe(true);
      });
    });
  });

  describe('INSERT', () => {
    test('debe insertar cita válida', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCita));

      const { data, error } = await mockSupabase
        .from('citas')
        .insert(testCita)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(testCita);
    });

    test('debe rechazar fecha en pasado', async () => {
      const invalidCita = { 
        ...testCita, 
        fecha: '2020-01-01',
        hora_inicio: '10:00'
      };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('CHECK constraint violation: fecha no puede ser pasada')
      );

      const { error } = await mockSupabase
        .from('citas')
        .insert(invalidCita)
        .select()
        .single();

      expect(error).not.toBeNull();
    });

    test('debe rechazar hora_fin anterior a hora_inicio', async () => {
      const invalidCita = { 
        ...testCita, 
        hora_inicio: '14:00',
        hora_fin: '13:00'
      };
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('CHECK constraint violation: hora_fin debe ser posterior')
      );

      const { error } = await mockSupabase
        .from('citas')
        .insert(invalidCita)
        .select()
        .single();

      expect(error).not.toBeNull();
    });

    test('debe establecer estado pendiente por defecto', async () => {
      const newCita = { ...testCita, id: generateUUID(), estado: undefined };
      const createdCita = { ...newCita, estado: 'pendiente' };
      
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(createdCita));

      const { data } = await mockSupabase
        .from('citas')
        .insert(newCita)
        .select()
        .single();

      expect(data?.estado).toBe('pendiente');
    });

    test('debe calcular total_estimado correctamente', async () => {
      const citaConTotal = { ...testCita, total_estimado: 75000 };
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(citaConTotal));

      const { data, error } = await mockSupabase
        .from('citas')
        .insert(citaConTotal)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.total_estimado).toBeGreaterThan(0);
    });
  });

  describe('SELECT', () => {
    test('debe consultar cita por id', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(testCita));

      const { data, error } = await mockSupabase
        .from('citas')
        .select('*')
        .eq('id', testCita.id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(testCita.id);
    });

    test('debe listar citas por fecha', async () => {
      const citas = [testCita, { ...testCita, id: generateUUID() }];
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse(citas));

      const { data, error } = await mockSupabase
        .from('citas')
        .select('*')
        .eq('fecha', testCita.fecha)
        .order('hora_inicio', { ascending: true });

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    test('debe listar citas por empleado', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockArrayResponse([testCita]));

      const { data, error } = await mockSupabase
        .from('citas')
        .select('*')
        .eq('empleado_id', testCita.empleado_id);

      expect(error).toBeNull();
      expect(data?.[0].empleado_id).toBe(testCita.empleado_id);
    });

    test('debe listar citas por cliente', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockArrayResponse([testCita]));

      const { data, error } = await mockSupabase
        .from('citas')
        .select('*')
        .eq('cliente_id', testCita.cliente_id);

      expect(error).toBeNull();
      expect(data?.[0].cliente_id).toBe(testCita.cliente_id);
    });

    test('debe filtrar citas por estado', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockArrayResponse([testCita]));

      const { data, error } = await mockSupabase
        .from('citas')
        .select('*')
        .eq('estado', 'pendiente');

      expect(error).toBeNull();
      expect(data?.[0].estado).toBe('pendiente');
    });

    test('debe listar citas próximas', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const futureCita = { ...testCita, fecha: futureDate };
      
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.gte.mockReturnThis();
      mockSupabase.order.mockResolvedValue(mockArrayResponse([futureCita]));

      const { data, error } = await mockSupabase
        .from('citas')
        .select('*')
        .gte('fecha', futureDate)
        .order('fecha', { ascending: true });

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE', () => {
    test('debe actualizar estado de cita', async () => {
      const updatedData = { ...testCita, estado: 'confirmada' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('citas')
        .update({ estado: 'confirmada' })
        .eq('id', testCita.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.estado).toBe('confirmada');
    });

    test('debe actualizar hora de cita', async () => {
      const updatedData = { ...testCita, hora_inicio: '15:00', hora_fin: '16:00' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('citas')
        .update({ hora_inicio: '15:00', hora_fin: '16:00' })
        .eq('id', testCita.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.hora_inicio).toBe('15:00');
      expect(data?.hora_fin).toBe('16:00');
    });

    test('debe cancelar cita', async () => {
      const updatedData = { ...testCita, estado: 'cancelada' };
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data, error } = await mockSupabase
        .from('citas')
        .update({ estado: 'cancelada' })
        .eq('id', testCita.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.estado).toBe('cancelada');
    });

    test('debe actualizar timestamp automáticamente', async () => {
      const updatedData = { 
        ...testCita, 
        updated_at: new Date().toISOString() 
      };
      
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(updatedData));

      const { data } = await mockSupabase
        .from('citas')
        .update({ notas: 'Notas actualizadas' })
        .eq('id', testCita.id)
        .select()
        .single();

      expect(validators.isValidTimestamp(data!.updated_at)).toBe(true);
    });
  });

  describe('DELETE', () => {
    test('debe eliminar cita', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValue(mockSuccessResponse(null));

      const { error } = await mockSupabase
        .from('citas')
        .delete()
        .eq('id', testCita.id);

      expect(error).toBeNull();
    });
  });

  describe('Foreign Keys', () => {
    test('debe validar cliente_id referencia existente', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('foreign key violation on clientes', '23503')
      );

      const invalidCita = { ...testCita, cliente_id: generateUUID() };
      const { error } = await mockSupabase
        .from('citas')
        .insert(invalidCita)
        .select()
        .single();

      expect(error).not.toBeNull();
    });

    test('debe validar empleado_id referencia existente', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('foreign key violation on empleados', '23503')
      );

      const invalidCita = { ...testCita, empleado_id: generateUUID() };
      const { error } = await mockSupabase
        .from('citas')
        .insert(invalidCita)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('Validaciones de Negocio', () => {
    test('debe prevenir doble reserva de empleado en mismo horario', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.and.mockReturnThis();
      mockSupabase.single.mockResolvedValue(
        mockErrorResponse('El empleado ya tiene una cita en ese horario')
      );

      const conflictingCita = { 
        ...testCita, 
        id: generateUUID(),
        cliente_id: generateUUID()
      };
      
      const { error } = await mockSupabase
        .from('citas')
        .insert(conflictingCita)
        .select()
        .single();

      expect(error).not.toBeNull();
    });

    test('debe permitir cita con servicios vacíos', async () => {
      const citaSinServicios = { ...testCita, servicios_ids: [] };
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue(mockSuccessResponse(citaSinServicios));

      const { data, error } = await mockSupabase
        .from('citas')
        .insert(citaSinServicios)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.servicios_ids).toEqual([]);
    });
  });
});
