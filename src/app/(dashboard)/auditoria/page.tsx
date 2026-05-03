'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { 
  LogAuditoria, 
  ModuloSistema, 
  TipoAccion,
  getAccionColor,
  getAccionIcon,
  obtenerLogs,
  exportarLogsExcel,
  descargarCSV
} from '@/lib/audit';

// Componente para DatePicker simple
const DatePicker = ({ label, value, onChange }: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void 
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
    />
  </div>
);

export default function AuditoriaEmpresaPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  
  // Estados
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Estados de filtros
  const [busqueda, setBusqueda] = useState('');
  const [moduloSeleccionado, setModuloSeleccionado] = useState<ModuloSistema | ''>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Estados de paginación
  const [pagina, setPagina] = useState(1);
  const [limite] = useState(30);
  const [offset, setOffset] = useState(0);
  
  // Estados de modal
  const [modalDetalles, setModalDetalles] = useState<{
    isOpen: boolean;
    log: LogAuditoria | null;
  }>({ isOpen: false, log: null });

  // Opciones de módulos (todos los módulos disponibles en ModuloSistema) - Orden alfabético
  const modulos: { value: ModuloSistema; label: string }[] = [
    { value: 'ANALYTICS', label: 'Analytics' },
    { value: 'AUTH', label: 'Autenticación' },
    { value: 'CAJA', label: 'Caja' },
    { value: 'CATEGORIAS', label: 'Categorías' },
    { value: 'CITAS', label: 'Citas' },
    { value: 'CLIENTES', label: 'Clientes' },
    { value: 'COMISIONES', label: 'Comisiones' },
    { value: 'CONFIGURACION', label: 'Configuración' },
    { value: 'EMPLEADOS', label: 'Empleados' },
    { value: 'FINANZAS', label: 'Finanzas' },
    { value: 'INVENTARIO', label: 'Inventario' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'NOMINAS', label: 'Nóminas' },
    { value: 'PRESTAMOS', label: 'Préstamos' },
    { value: 'PRODUCTOS', label: 'Productos' },
    { value: 'PROVEEDORES', label: 'Proveedores' },
    { value: 'SERVICIOS', label: 'Servicios' },
    { value: 'SOPORTE', label: 'Soporte' },
    { value: 'SUSCRIPCIONES', label: 'Suscripciones' },
    { value: 'USUARIOS', label: 'Usuarios' },
    { value: 'VENTAS', label: 'Ventas' }
  ];

  // Cargar logs
  const cargarLogs = async () => {
    if (!user?.empresa_id) return;
    
    setLoading(true);
    try {
      // Obtener logs de esta empresa con paginación
      const { data, error } = await obtenerLogs(supabase, {
        busqueda: busqueda.trim() || undefined,
        modulo: moduloSeleccionado || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        empresa_id: user.empresa_id,
        limite,
        offset
      });

      if (error) {
        console.error('Error cargando logs:', error);
        return;
      }

      // Obtener total de logs para paginación
      const { data: allData, error: allError } = await obtenerLogs(supabase, {
        busqueda: busqueda.trim() || undefined,
        modulo: moduloSeleccionado || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        empresa_id: user.empresa_id,
        limite: 10000, // Un número grande para obtener todos
        offset: 0
      });

      if (allError) {
        console.error('Error obteniendo total logs:', allError);
        return;
      }

      const totalCount = (allData || []).length;

      setLogs(data || []);
      setTotalLogs(totalCount);
      
      console.log('Logs página actual:', (data || []).length, 'Total general:', totalCount);
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    if (user?.empresa_id) {
      cargarLogs();
    }
  }, [user?.empresa_id, busqueda, moduloSeleccionado, fechaInicio, fechaFin, offset]);

  // Resetear paginación cuando cambian filtros
  useEffect(() => {
    setOffset(0);
    setPagina(1);
  }, [busqueda, moduloSeleccionado, fechaInicio, fechaFin]);

  // Exportar logs
  const exportarLogs = () => {
    exportarLogsExcel(logs);
  };

  // Ver detalles del log
  const verDetalles = (log: LogAuditoria) => {
    setModalDetalles({ isOpen: true, log });
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setModuloSeleccionado('');
    setFechaInicio('');
    setFechaFin('');
    setOffset(0);
    setPagina(1);
  };

  // Paginación
  const totalPaginas = Math.ceil(totalLogs / limite);
  const inicio = offset + 1;
  const fin = Math.min(offset + limite, totalLogs);

  if (!user?.empresa_id) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No se encontró información de la empresa</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-8 h-8 text-amber-600" />
            Auditoría del Sistema
          </h1>
          <p className="text-gray-600 mt-2">
            Registro de actividades y eventos del sistema de tu salón
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FunnelIcon className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Búsqueda
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por acción, usuario..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Módulo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Módulo
                </label>
                <select
                  value={moduloSeleccionado}
                  onChange={(e) => setModuloSeleccionado(e.target.value as ModuloSistema)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Todos los módulos</option>
                  {modulos.map((modulo) => (
                    <option key={modulo.value} value={modulo.value}>
                      {modulo.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha Inicio */}
              <DatePicker
                label="Fecha Inicio"
                value={fechaInicio}
                onChange={setFechaInicio}
              />

              {/* Fecha Fin */}
              <DatePicker
                label="Fecha Fin"
                value={fechaFin}
                onChange={setFechaFin}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  onClick={limpiarFiltros}
                  variant="outline"
                  size="sm"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </Button>
                <Button
                  onClick={cargarLogs}
                  variant="outline"
                  size="sm"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={exportarLogs}
                  variant="outline"
                  size="sm"
                  disabled={logs.length === 0}
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <div className="text-sm text-gray-600 flex items-center">
                  Total: {totalLogs} registros
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              Registros de Actividad ({inicio}-{fin} de {totalLogs})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Cargando registros...</div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron registros de actividad</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-medium text-gray-900">Fecha/Hora</th>
                        <th className="text-left p-3 font-medium text-gray-900">Acción</th>
                        <th className="text-left p-3 font-medium text-gray-900">Módulo</th>
                        <th className="text-left p-3 font-medium text-gray-900">Usuario</th>
                        <th className="text-left p-3 font-medium text-gray-900">IP Address</th>
                        <th className="text-left p-3 font-medium text-gray-900">Detalles</th>
                        <th className="text-left p-3 font-medium text-gray-900">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-amber-50">
                          <td className="p-3 text-gray-900">
                            {log.creado_en ? formatearFecha(log.creado_en) : 'N/A'}
                          </td>
                          <td className="p-3">
                            <Badge className={`${getAccionColor(log.accion)} flex items-center gap-1 w-fit`}>
                              <span>{getAccionIcon(log.accion)}</span>
                              <span className="text-xs">{log.accion}</span>
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                              {log.modulo}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-900">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs">
                                  {log.usuarios_sistema?.nombre || log.usuario_nombre || 'Usuario desconocido'}
                                </span>
                              </div>
                              {log.usuarios_sistema?.email && (
                                <span className="text-xs text-gray-500">
                                  {log.usuarios_sistema.email}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-gray-900">
                            <div className="flex items-center gap-1">
                              <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-xs">
                                {log.ip_address || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="max-w-xs truncate text-gray-600 text-xs">
                              {log.detalles && Object.keys(log.detalles).length > 0 
                                ? JSON.stringify(log.detalles).substring(0, 50) + '...'
                                : 'Sin detalles'
                              }
                            </div>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => verDetalles(log)}
                              className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Mostrando {inicio} a {fin} de {totalLogs} registros
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOffset(Math.max(0, offset - limite));
                          setPagina(Math.max(1, pagina - 1));
                        }}
                        disabled={pagina === 1}
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        Página {pagina} de {totalPaginas}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOffset(Math.min(offset + limite, totalLogs - limite));
                          setPagina(Math.min(totalPaginas, pagina + 1));
                        }}
                        disabled={pagina === totalPaginas}
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalles */}
        {modalDetalles.isOpen && modalDetalles.log && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-amber-600" />
                  Detalles del Registro
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalDetalles({ isOpen: false, log: null })}
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Fecha/Hora:</span>
                    <p className="text-gray-900">
                      {modalDetalles.log.creado_en ? formatearFecha(modalDetalles.log.creado_en) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Acción:</span>
                    <div className="mt-1">
                      <Badge className={getAccionColor(modalDetalles.log.accion)}>
                        <span className="mr-1">{getAccionIcon(modalDetalles.log.accion)}</span>
                        {modalDetalles.log.accion}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Módulo:</span>
                    <p className="text-gray-900">{modalDetalles.log.modulo}</p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Usuario:</span>
                    <div className="mt-1">
                      <p className="text-gray-900">
                        {modalDetalles.log.usuarios_sistema?.nombre || modalDetalles.log.usuario_nombre || 'Usuario desconocido'}
                      </p>
                      {modalDetalles.log.usuarios_sistema?.email && (
                        <p className="text-xs text-gray-500">
                          {modalDetalles.log.usuarios_sistema.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">IP Address:</span>
                    <p className="text-gray-900">
                      {modalDetalles.log.ip_address || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Detalles:</span>
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {modalDetalles.log.detalles 
                        ? JSON.stringify(modalDetalles.log.detalles, null, 2)
                        : 'Sin detalles adicionales'
                      }
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
