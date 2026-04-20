'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  DocumentArrowDownIcon
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
  exportarLogsCSV,
  descargarCSV
} from '@/lib/audit';

// Componente para DatePicker simple
const DatePicker = ({ label, value, onChange }: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void 
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-300">{label}</label>
    <input
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default function AuditoriaPage() {
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
  const [limite] = useState(50);
  const [offset, setOffset] = useState(0);
  
  // Estados de modal
  const [modalDetalles, setModalDetalles] = useState<{
    isOpen: boolean;
    log: LogAuditoria | null;
  }>({ isOpen: false, log: null });

  // Opciones de módulos
  const modulos: { value: ModuloSistema; label: string }[] = [
    { value: 'AUTH', label: 'Autenticación' },
    { value: 'VENTAS', label: 'Ventas' },
    { value: 'INVENTARIO', label: 'Inventario' },
    { value: 'USUARIOS', label: 'Usuarios' },
    { value: 'CITAS', label: 'Citas' },
    { value: 'FINANZAS', label: 'Finanzas' },
    { value: 'NOMINAS', label: 'Nóminas' },
    { value: 'CONFIGURACION', label: 'Configuración' },
    { value: 'SOPORTE', label: 'Soporte' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'ANALYTICS', label: 'Analytics' }
  ];

  // Cargar logs
  const cargarLogs = async () => {
    if (!user?.empresa_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await obtenerLogs(supabase, {
        busqueda: busqueda.trim() || undefined,
        modulo: moduloSeleccionado || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        limite,
        offset
      });

      if (error) {
        console.error('Error cargando logs:', error);
        return;
      }

      setLogs(data);
      
      // Obtener total para paginación
      const { data: totalCount } = await obtenerLogs(supabase, {
        busqueda: busqueda.trim() || undefined,
        modulo: moduloSeleccionado || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined
      });
      setTotalLogs(totalCount?.length || 0);
      
    } catch (error) {
      console.error('Error en cargarLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setPagina(1);
    setOffset(0);
    cargarLogs();
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setModuloSeleccionado('');
    setFechaInicio('');
    setFechaFin('');
    setPagina(1);
    setOffset(0);
  };

  // Cambiar página
  const cambiarPagina = (nuevaPagina: number) => {
    const nuevoOffset = (nuevaPagina - 1) * limite;
    setPagina(nuevaPagina);
    setOffset(nuevoOffset);
  };

  // Abrir modal de detalles
  const abrirDetalles = (log: LogAuditoria) => {
    setModalDetalles({ isOpen: true, log });
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalDetalles({ isOpen: false, log: null });
  };

  // Exportar CSV
  const exportarCSV = () => {
    if (logs.length === 0) return;
    
    try {
      const csvContent = exportarLogsCSV(logs);
      descargarCSV(csvContent, 'logs_auditoria');
    } catch (error) {
      console.error('Error exportando CSV:', error);
    }
  };

  // Efectos
  useEffect(() => {
    if (user?.empresa_id) {
      cargarLogs();
    }
  }, [user?.empresa_id]);

  useEffect(() => {
    cargarLogs();
  }, [pagina, limite]);

  // Calcular páginas totales
  const totalPaginas = Math.ceil(totalLogs / limite);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardDocumentListIcon className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Auditoría Global</h1>
            </div>
            <p className="text-gray-400">
              Sistema de registro de actividades para monitoreo y seguridad del sistema
            </p>
          </div>

          {/* Filtros Avanzados */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FunnelIcon className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Filtros Avanzados</h2>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* Buscador */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Buscar por texto
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="ID usuario, tipo de acción..."
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Filtro por Módulo */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Módulo
                  </label>
                  <select
                    value={moduloSeleccionado}
                    onChange={(e) => setModuloSeleccionado(e.target.value as ModuloSistema)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los módulos</option>
                    {modulos.map((mod) => (
                      <option key={mod.value} value={mod.value}>
                        {mod.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Rango de Fechas */}
                <DatePicker
                  label="Fecha Inicio"
                  value={fechaInicio}
                  onChange={setFechaInicio}
                />

                <DatePicker
                  label="Fecha Fin"
                  value={fechaFin}
                  onChange={setFechaFin}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <Button
                  onClick={aplicarFiltros}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                  Aplicar Filtros
                </Button>
                <Button
                  onClick={limpiarFiltros}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Limpiar Filtros
                </Button>
                <Button
                  onClick={exportarCSV}
                  disabled={logs.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Resultados */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Resultados</h2>
                  <p className="text-gray-400 text-sm">
                    {totalLogs} registros encontrados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">
                    Página {pagina} de {totalPaginas || 1}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No se encontraron registros</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900 border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Fecha/Hora
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Acción
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Módulo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          ID Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Detalles
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {logs.map((log, index) => (
                        <tr key={log.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {new Date(log.created_at || '').toLocaleString('es-CO')}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge className={`${getAccionColor(log.accion)} border`}>
                              <span className="mr-2">{getAccionIcon(log.accion)}</span>
                              {log.accion}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {log.modulo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {log.empresa_id || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Button
                              onClick={() => abrirDetalles(log)}
                              variant="outline"
                              size="sm"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <EyeIcon className="w-3 h-3 mr-1" />
                              Ver Detalles
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                onClick={() => cambiarPagina(pagina - 1)}
                disabled={pagina === 1}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Anterior
              </Button>
              
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => i + 1).map((num) => (
                <Button
                  key={num}
                  onClick={() => cambiarPagina(num)}
                  variant={pagina === num ? "default" : "outline"}
                  className={
                    pagina === num 
                      ? "bg-blue-600 text-white" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }
                >
                  {num}
                </Button>
              ))}
              
              <Button
                onClick={() => cambiarPagina(pagina + 1)}
                disabled={pagina === totalPaginas}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>

        {/* Modal de Detalles */}
        {modalDetalles.isOpen && modalDetalles.log && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Detalles del Log</h3>
                <Button
                  onClick={cerrarModal}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">ID</label>
                  <p className="text-gray-200">{modalDetalles.log.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Fecha/Hora</label>
                  <p className="text-gray-200">
                    {new Date(modalDetalles.log.created_at || '').toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Acción</label>
                  <Badge className={`${getAccionColor(modalDetalles.log.accion)} border`}>
                    <span className="mr-2">{getAccionIcon(modalDetalles.log.accion)}</span>
                    {modalDetalles.log.accion}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Módulo</label>
                  <p className="text-gray-200">{modalDetalles.log.modulo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">ID Empresa</label>
                  <p className="text-gray-200">{modalDetalles.log.empresa_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">ID Usuario</label>
                  <p className="text-gray-200">{modalDetalles.log.usuario_id || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Detalles (JSON)</label>
                <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(modalDetalles.log.detalles || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
