import { createClient } from './supabase/client';

// Tipos de acciones para la auditoría
export type TipoAccion = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'ANULAR_VENTA' 
  | 'RESTAURAR_VENTA'
  | 'CREAR_EMPLEADO'
  | 'ACTUALIZAR_EMPLEADO'
  | 'ELIMINAR_EMPLEADO'
  | 'CREAR_CLIENTE'
  | 'ACTUALIZAR_CLIENTE'
  | 'ELIMINAR_CLIENTE'
  | 'CREAR_PRODUCTO'
  | 'ACTUALIZAR_PRODUCTO'
  | 'ELIMINAR_PRODUCTO'
  | 'CREAR_SERVICIO'
  | 'ACTUALIZAR_SERVICIO'
  | 'ELIMINAR_SERVICIO'
  | 'CREAR_CITA'
  | 'ACTUALIZAR_CITA'
  | 'CANCELAR_CITA'
  | 'ABRIR_CAJA'
  | 'CERRAR_CAJA'
  | 'GENERAR_NOMINA'
  | 'PAGAR_NOMINA'
  | 'CREAR_RESPALDO'
  | 'RESTAURAR_RESPALDO'
  | 'ELIMINAR_RESPALDO';

// Tipos de módulos
export type ModuloSistema = 
  | 'AUTH'
  | 'VENTAS'
  | 'INVENTARIO'
  | 'USUARIOS'
  | 'CITAS'
  | 'FINANZAS'
  | 'NOMINAS'
  | 'CONFIGURACION'
  | 'SOPORTE'
  | 'MARKETING'
  | 'ANALYTICS';

// Interfaz para los datos del log
export interface LogAuditoria {
  id?: string;
  empresa_id?: string;
  usuario_id?: string;
  accion: TipoAccion;
  modulo: ModuloSistema;
  detalles?: Record<string, any>;
  created_at?: string;
}

// Colores por tipo de acción
export const getAccionColor = (accion: TipoAccion): string => {
  switch (accion) {
    case 'CREATE':
    case 'CREAR_EMPLEADO':
    case 'CREAR_CLIENTE':
    case 'CREAR_PRODUCTO':
    case 'CREAR_SERVICIO':
    case 'CREAR_CITA':
    case 'ABRIR_CAJA':
    case 'GENERAR_NOMINA':
    case 'CREAR_RESPALDO':
      return 'text-green-600 bg-green-50 border-green-200';
    
    case 'UPDATE':
    case 'ACTUALIZAR_EMPLEADO':
    case 'ACTUALIZAR_CLIENTE':
    case 'ACTUALIZAR_PRODUCTO':
    case 'ACTUALIZAR_SERVICIO':
    case 'ACTUALIZAR_CITA':
    case 'PAGAR_NOMINA':
    case 'RESTAURAR_RESPALDO':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    
    case 'DELETE':
    case 'ANULAR_VENTA':
    case 'ELIMINAR_EMPLEADO':
    case 'ELIMINAR_CLIENTE':
    case 'ELIMINAR_PRODUCTO':
    case 'ELIMINAR_SERVICIO':
    case 'CANCELAR_CITA':
    case 'CERRAR_CAJA':
    case 'ELIMINAR_RESPALDO':
      return 'text-red-600 bg-red-50 border-red-200';
    
    case 'LOGIN':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    
    case 'LOGOUT':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    
    case 'RESTAURAR_VENTA':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Iconos por tipo de acción
export const getAccionIcon = (accion: TipoAccion): string => {
  switch (accion) {
    case 'CREATE':
      return '➕';
    case 'UPDATE':
      return '✏️';
    case 'DELETE':
      return '🗑️';
    case 'LOGIN':
      return '🔑';
    case 'LOGOUT':
      return '🚪';
    case 'ANULAR_VENTA':
      return '❌';
    case 'RESTAURAR_VENTA':
      return '♻️';
    case 'CREAR_EMPLEADO':
      return '👤';
    case 'ACTUALIZAR_EMPLEADO':
      return '📝';
    case 'ELIMINAR_EMPLEADO':
      return '🚫';
    case 'CREAR_CLIENTE':
      return '👥';
    case 'ACTUALIZAR_CLIENTE':
      return '📋';
    case 'ELIMINAR_CLIENTE':
      return '🚮';
    case 'CREAR_PRODUCTO':
      return '📦';
    case 'ACTUALIZAR_PRODUCTO':
      return '🏷️';
    case 'ELIMINAR_PRODUCTO':
      return '🗑️';
    case 'CREAR_SERVICIO':
      return '💇';
    case 'ACTUALIZAR_SERVICIO':
      return '✂️';
    case 'ELIMINAR_SERVICIO':
      return '🚫';
    case 'CREAR_CITA':
      return '📅';
    case 'ACTUALIZAR_CITA':
      return '📆';
    case 'CANCELAR_CITA':
      return '❌';
    case 'ABRIR_CAJA':
      return '💰';
    case 'CERRAR_CAJA':
      return '🏦';
    case 'GENERAR_NOMINA':
      return '📊';
    case 'PAGAR_NOMINA':
      return '💳';
    case 'CREAR_RESPALDO':
      return '💾';
    case 'RESTAURAR_RESPALDO':
      return '♻️';
    case 'ELIMINAR_RESPALDO':
      return '🗑️';
    default:
      return '📋';
  }
};

// Función principal para registrar logs de auditoría
export const registrarLog = async (
  supabase: any,
  datos: LogAuditoria
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('logs_actividad')
      .insert({
        empresa_id: datos.empresa_id || null,
        usuario_id: datos.usuario_id || null,
        accion: datos.accion,
        modulo: datos.modulo,
        detalles: datos.detalles || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error registrando log de auditoría:', error);
      return { 
        success: false, 
        error: error.message || 'Error desconocido al registrar log' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en registrarLog:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};

// Función para obtener logs con filtros
export const obtenerLogs = async (
  supabase: any,
  filtros: {
    busqueda?: string;
    modulo?: ModuloSistema;
    fechaInicio?: string;
    fechaFin?: string;
    limite?: number;
    offset?: number;
  }
): Promise<{ data: LogAuditoria[]; error?: string }> => {
  try {
    let query = supabase
      .from('logs_actividad')
      .select(`
        id,
        empresa_id,
        usuario_id,
        accion,
        modulo,
        detalles,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filtros.busqueda) {
      query = query.or(
        `id.ilike.%${filtros.busqueda}%,accion.ilike.%${filtros.busqueda}%,usuario_id.ilike.%${filtros.busqueda}%`
      );
    }

    if (filtros.modulo) {
      query = query.eq('modulo', filtros.modulo);
    }

    if (filtros.fechaInicio) {
      query = query.gte('created_at', filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
      query = query.lte('created_at', filtros.fechaFin);
    }

    if (filtros.limite) {
      query = query.limit(filtros.limite);
    }

    if (filtros.offset) {
      query = query.range(filtros.offset, filtros.offset + (filtros.limite || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo logs:', error);
      return { 
        data: [], 
        error: error.message || 'Error desconocido al obtener logs' 
      };
    }

    return { data: data || [], error: undefined };
  } catch (error) {
    console.error('Error en obtenerLogs:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};

// Función para exportar logs a CSV
export const exportarLogsCSV = (logs: LogAuditoria[]): string => {
  const headers = [
    'Fecha/Hora',
    'Acción',
    'Módulo',
    'ID Empresa',
    'ID Usuario',
    'Detalles'
  ];

  const rows = logs.map(log => [
    new Date(log.created_at || '').toLocaleString('es-CO'),
    log.accion,
    log.modulo,
    log.empresa_id || 'N/A',
    log.usuario_id || 'N/A',
    JSON.stringify(log.detalles || {})
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  return csvContent;
};

// Utilidad para descargar archivo CSV
export const descargarCSV = (csvContent: string, filename: string = 'logs_auditoria') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
