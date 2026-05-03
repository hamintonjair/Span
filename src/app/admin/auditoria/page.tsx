'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { obtenerEmpresasAction, obtenerAuditoriaEmpresasAction, obtenerAuditoriaInternaAction, obtenerAuditoriaEmpresasExportAction } from '@/app/actions/admin';
import { 
  ShieldCheckIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  FunnelIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { 
  LogAuditoria, 
  ModuloSistema, 
  TipoAccion,
  getAccionColor,
  getAccionIcon
} from '@/lib/audit';

// Función para obtener colores por tipo de evento interno
const getTipoEventoColor = (tipoEvento: string): string => {
  const colores: Record<string, string> = {
    'SEGURIDAD': 'bg-red-100 text-red-800 border-red-200',
    'ESTADO': 'bg-blue-100 text-blue-800 border-blue-200',
    'PERFIL': 'bg-green-100 text-green-800 border-green-200',
    'ACCESO': 'bg-purple-100 text-purple-800 border-purple-200',
    'SISTEMA': 'bg-gray-100 text-gray-800 border-gray-200',
    'CONFIGURACION': 'bg-amber-100 text-amber-800 border-amber-200'
  };
  return colores[tipoEvento] || 'bg-gray-100 text-gray-800 border-gray-200';
};

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

function AuditoriaPageContent() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'empresas' | 'interna'>('empresas');
  const [auditoriaEmpresas, setAuditoriaEmpresas] = useState<LogAuditoria[]>([]);
  const [auditoriaInterna, setAuditoriaInterna] = useState<LogAuditoria[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingInterna, setLoadingInterna] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogAuditoria | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const itemsPerPage = 30;

  // Estados para empresas y módulos
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loadingEmpresasList, setLoadingEmpresasList] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>('');
  const [modulosDisponibles, setModulosDisponibles] = useState<ModuloSistema[]>([]);
  const [moduloSeleccionado, setModuloSeleccionado] = useState<ModuloSistema | ''>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Estados para filtros de auditoría interna
  const [busquedaInterna, setBusquedaInterna] = useState('');
  const [fechaInicioInterna, setFechaInicioInterna] = useState('');
  const [fechaFinInterna, setFechaFinInterna] = useState('');
  const [currentPageInterna, setCurrentPageInterna] = useState(1);
  const [totalPagesInterna, setTotalPagesInterna] = useState(1);

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

  // Cargar lista de empresas
  const cargarEmpresas = async () => {
    setLoadingEmpresasList(true);
    try {
      const result = await obtenerEmpresasAction();
      
      if (result.success) {
        const empresasData = result.data || [];
        setEmpresas(empresasData);
      } else {
        
      }
    } catch (error) {
      
    } finally {
      setLoadingEmpresasList(false);
    }
  };

  // Cargar datos según la pestaña activa
  useEffect(() => {
    if (activeTab === 'empresas') {
      cargarAuditoriaEmpresas();
    } else {
      cargarAuditoriaInterna();
    }
  }, [activeTab]);

  // Cargar empresas al montar el componente
  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarAuditoriaEmpresas = async () => {
    setLoadingEmpresas(true);
    try {
      
      const result = await obtenerAuditoriaEmpresasAction({
        busqueda: busqueda.trim() || undefined,
        empresaId: empresaSeleccionada || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        page: currentPage,
        pageSize: itemsPerPage
      });
      
      
      if (result.success) {
        const data = result.data || [];
        const total = result.totalCount || data.length;
        setAuditoriaEmpresas(data);
        setTotalRegistros(total);
        setTotalPages(Math.ceil(total / itemsPerPage));
        
        // Extraer módulos únicos de los logs
        const modulosUnicos = Array.from(new Set(
          data
            .map((log: any) => log.modulo)
            .filter((modulo): modulo is string => modulo != null && typeof modulo === 'string' && modulo.trim() !== '')
        )) as ModuloSistema[];
        setModulosDisponibles(modulosUnicos);
      } else {
        
      }
    } catch (error) {
      
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const cargarAuditoriaInterna = async () => {
    setLoadingInterna(true);
    try {
      
      const result = await obtenerAuditoriaInternaAction({
        busqueda: busquedaInterna,
        fechaInicio: fechaInicioInterna,
        fechaFin: fechaFinInterna
      });
      
      if (result.success) {
        const data = result.data || [];
        setAuditoriaInterna(data);
        setTotalPagesInterna(Math.ceil(data.length / itemsPerPage));
      } else {
        
      }
    } catch (error) {
      
    } finally {
      setLoadingInterna(false);
    }
  };

  const formatearFecha = (fechaString: string) => {
    return new Date(fechaString).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Server-side pagination - los datos ya vienen filtrados y paginados del servidor
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = auditoriaEmpresas;

  // Paginar datos para auditoría interna
  const startIndexInterna = (currentPageInterna - 1) * itemsPerPage;
  const endIndexInterna = startIndexInterna + itemsPerPage;
  const paginatedDataInterna = auditoriaInterna.slice(startIndexInterna, endIndexInterna);

  // Abrir modal de detalles
  const openDetailsModal = (log: LogAuditoria) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setSelectedLog(null);
    setIsModalOpen(false);
  };

  // Exportar auditoría completa
  const exportarAuditoriaCompleta = async () => {
    try {
      
      const result = await obtenerAuditoriaEmpresasExportAction({
        busqueda: busqueda.trim() || undefined,
        empresaId: empresaSeleccionada || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined
      });
      
      if (result.success && result.data) {
        // Preparar datos para Excel con mejor estructura
        const datosParaExportar = result.data.map((log: any) => {
          // Formatear fecha y hora de manera legible
          const fechaFormateada = log.creado_en 
            ? new Date(log.creado_en).toLocaleString('es-CO', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'N/A';
          
          // Procesar detalles para hacerlos más legibles
          let detallesFormateados = 'Sin detalles';
          if (log.detalles && typeof log.detalles === 'object') {
            try {
              detallesFormateados = JSON.stringify(log.detalles, null, 2);
            } catch {
              detallesFormateados = 'Error en formato de detalles';
            }
          } else if (log.detalles && typeof log.detalles === 'string') {
            detallesFormateados = log.detalles;
          }
          
          return {
            'FECHA REGISTRO': fechaFormateada,
            'EMPRESA': log.empresa_nombre || 'Empresa no especificada',
            'ACCIÓN REALIZADA': log.accion || 'Sin acción registrada',
            'MÓDULO SISTEMA': log.modulo || 'Módulo desconocido',
            'USUARIO': log.usuario_nombre || 'Usuario no identificado',
            'EMAIL USUARIO': log.usuario_email || 'Email no disponible',
            'DIRECCIÓN IP': log.ip_address || 'IP no registrada',
            'DETALLES ADICIONALES': detallesFormateados
          };
        });
        
        // Crear Excel con mejor formato
        const ws = XLSX.utils.json_to_sheet(datosParaExportar);
        
        // Ajustar anchos de columnas para mejor visualización
        const columnWidths = [
          { wch: 20 }, // FECHA REGISTRO
          { wch: 25 }, // EMPRESA
          { wch: 25 }, // ACCIÓN REALIZADA
          { wch: 20 }, // MÓDULO SISTEMA
          { wch: 25 }, // USUARIO
          { wch: 30 }, // EMAIL USUARIO
          { wch: 18 }, // DIRECCIÓN IP
          { wch: 50 }  // DETALLES ADICIONALES
        ];
        ws['!cols'] = columnWidths;
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Auditoría de Empresas');
        
        // Generar nombre de archivo más descriptivo
        const fechaActual = new Date().toLocaleString('es-CO').replace(/[\/\s:]/g, '-').replace(/,/g, '');
        const fileName = `Auditoria_Empresas_${fechaActual}.xlsx`;
        
        // Descargar archivo
        XLSX.writeFile(wb, fileName);
                
        // Mostrar confirmación al usuario
        const totalRegistros = result.data.length;
        showToast(`Exportación completada exitosamente\n\n📊 Total de registros exportados: ${totalRegistros}\n📁 Nombre del archivo: ${fileName}`, 'success', 8000);
        
      } else {
        
        showToast('Error al exportar los datos: ' + (result.error || 'Error desconocido'), 'error');
      }
    } catch (error) {
      console.error('Error inesperado en exportación:', error);
      showToast('Error inesperado al exportar los datos. Por favor, intente nuevamente.', 'error');
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setEmpresaSeleccionada('');
    setModuloSeleccionado('');
    setFechaInicio('');
    setFechaFin('');
    setBusqueda('');
    setCurrentPage(1);
    cargarAuditoriaEmpresas();
  };

  // Limpiar filtros de auditoría interna
  const limpiarFiltrosInterna = () => {
    setBusquedaInterna('');
    setFechaInicioInterna('');
    setFechaFinInterna('');
    setCurrentPageInterna(1);
    cargarAuditoriaInterna();
  };

  // Resetear página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [empresaSeleccionada, moduloSeleccionado, fechaInicio, fechaFin, busqueda]);

  // Resetear página de auditoría interna cuando cambian filtros
  useEffect(() => {
    setCurrentPageInterna(1);
  }, [busquedaInterna, fechaInicioInterna, fechaFinInterna]);

  // Recargar auditoría de empresas cuando cambian filtros o página
  useEffect(() => {
    if (activeTab === 'empresas') {
      cargarAuditoriaEmpresas();
    }
  }, [currentPage, busqueda, empresaSeleccionada, moduloSeleccionado, fechaInicio, fechaFin, activeTab]);

  // Recargar auditoría interna cuando cambian filtros
  useEffect(() => {
    if (activeTab === 'interna') {
      cargarAuditoriaInterna();
    }
  }, [busquedaInterna, fechaInicioInterna, fechaFinInterna, activeTab]);

  // Actualizar módulos disponibles cuando cambia la empresa o se cargan nuevos datos
  useEffect(() => {
    if (empresaSeleccionada) {
      const logsEmpresa = auditoriaEmpresas.filter((log: any) => log.empresas?.id === empresaSeleccionada || log.empresa_id === empresaSeleccionada);
      const modulosEmpresa = Array.from(new Set(
        logsEmpresa
          .map((log: any) => log.modulo)
          .filter((modulo): modulo is string => modulo != null && typeof modulo === 'string' && modulo.trim() !== '')
      )) as ModuloSistema[];
      
      setModulosDisponibles(modulosEmpresa);
    } else {
      const modulosUnicos = Array.from(new Set(
        auditoriaEmpresas
          .map((log: any) => log.modulo)
          .filter((modulo): modulo is string => modulo != null && typeof modulo === 'string' && modulo.trim() !== '')
      )) as ModuloSistema[];
      
      setModulosDisponibles(modulosUnicos);
    }
  }, [empresaSeleccionada, auditoriaEmpresas]);

  return (
    <MainLayout>
      <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheckIcon className="w-8 h-8 text-amber-600" />
              Centro de Auditoría Global
            </h1>
            <p className="text-gray-600 mt-2">
              Monitoreo de actividades de todas las empresas del sistema
            </p>
          </div>

        {/* Tabs de Navegación */}
        <Card>
          <CardHeader>
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('empresas')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'empresas'
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                    Auditoría de Empresas
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('interna')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'interna'
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Auditoría Interna
                  </div>
                </button>
              </nav>
            </div>
          </CardHeader>
        </Card>

        {/* Contenido de la Pestaña Activa */}
        {activeTab === 'empresas' ? (
          /* Auditoría de Empresas */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FunnelIcon className="w-5 h-5" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <select
                    value={empresaSeleccionada}
                    onChange={(e) => {
                      setEmpresaSeleccionada(e.target.value);
                      setModuloSeleccionado(''); // Resetear módulo cuando cambia empresa
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Todas las empresas</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </option>
                    ))}
                  </select>
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
                    {(empresaSeleccionada ? modulosDisponibles : modulos.map(m => m.value)).map((modulo) => (
                      <option key={modulo} value={modulo}>
                        {modulos.find(m => m.value === modulo)?.label || modulo}
                      </option>
                    ))}
                  </select>
                  {empresaSeleccionada && (
                    <p className="text-xs text-gray-500 mt-1">
                      {modulosDisponibles.length} módulos encontrados para esta empresa
                    </p>
                  )}
                </div>

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
                    onClick={exportarAuditoriaCompleta}
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar Excel
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 flex items-center">
                  Total: {totalRegistros} registros
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Auditoría Interna */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FunnelIcon className="w-5 h-5" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Búsqueda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Búsqueda
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por descripción o usuario..."
                      value={busquedaInterna}
                      onChange={(e) => setBusquedaInterna(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Fecha Inicio */}
                <DatePicker
                  label="Fecha Inicio"
                  value={fechaInicioInterna}
                  onChange={setFechaInicioInterna}
                />

                {/* Fecha Fin */}
                <DatePicker
                  label="Fecha Fin"
                  value={fechaFinInterna}
                  onChange={setFechaFinInterna}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    onClick={limpiarFiltrosInterna}
                    variant="outline"
                    size="sm"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 flex items-center">
                  Total: {auditoriaInterna.length} registros
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              {activeTab === 'empresas' 
                ? `Registros de Actividad (${startIndex + 1}-${Math.min(endIndex, totalRegistros)} de ${totalRegistros})`
                : `Registros de Actividad Interna (${startIndexInterna + 1}-${Math.min(endIndexInterna, auditoriaInterna.length)} de ${auditoriaInterna.length})`
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'empresas' ? (
              loadingEmpresas ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Cargando registros...</div>
                </div>
              ) : auditoriaEmpresas.length === 0 ? (
                <div className="text-center py-8">
                  <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron registros de actividad</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left p-3 font-medium text-gray-900">Fecha/Hora</th>
                          <th className="text-left p-3 font-medium text-gray-900">Empresa</th>
                          <th className="text-left p-3 font-medium text-gray-900">Acción</th>
                          <th className="text-left p-3 font-medium text-gray-900">Módulo</th>
                          <th className="text-left p-3 font-medium text-gray-900">Usuario</th>
                          <th className="text-left p-3 font-medium text-gray-900">IP Address</th>
                          <th className="text-left p-3 font-medium text-gray-900">Detalles</th>
                          <th className="text-left p-3 font-medium text-gray-900">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((log) => (
                          <tr key={log.id} className="border-b border-gray-100 hover:bg-amber-50">
                            <td className="p-3 text-gray-900">
                              <div className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                                {log.creado_en ? formatearFecha(log.creado_en) : 'N/A'}
                              </div>
                            </td>
                            <td className="p-3 text-gray-900">
                              <div className="flex items-center">
                                <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-500" />
                                {(log as any).empresas?.nombre || (log as any).empresa_nombre || 'Empresa desconocida'}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className={`${getAccionColor(log.accion as TipoAccion)} flex items-center gap-1 w-fit`}>
                                <span>{getAccionIcon(log.accion as TipoAccion)}</span>
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
                                    {(log as any).usuarios_sistema?.nombre || (log as any).usuario_nombre || 'Usuario desconocido'}
                                  </span>
                                </div>
                                {((log as any).usuarios_sistema?.email || (log as any).usuario_email) && (
                                  <span className="text-xs text-gray-500">
                                    {(log as any).usuarios_sistema?.email || (log as any).usuario_email}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-gray-900">
                              <span className="text-xs font-mono">
                                {log.ip_address || 'N/A'}
                              </span>
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
                                onClick={() => openDetailsModal(log)}
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
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="text-sm text-gray-700">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, totalRegistros)} de {totalRegistros} registros
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )
            ) : (
              /* Auditoría Interna */
              loadingInterna ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Cargando registros...</div>
                </div>
              ) : auditoriaInterna.length === 0 ? (
                <div className="text-center py-8">
                  <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay actividad interna registrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-medium text-gray-900">Fecha/Hora</th>
                        <th className="text-left p-3 font-medium text-gray-900">Admin/Usuario Afectado</th>
                        <th className="text-left p-3 font-medium text-gray-900">Tipo de Evento</th>
                        <th className="text-left p-3 font-medium text-gray-900">Detalles</th>
                        <th className="text-left p-3 font-medium text-gray-900">Dirección IP</th>
                        <th className="text-left p-3 font-medium text-gray-900">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDataInterna.map((log: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-amber-50">
                          <td className="p-3 text-gray-900">
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                              {log.creado_en ? formatearFecha(log.creado_en) : 'N/A'}
                            </div>
                          </td>
                          <td className="p-3 text-gray-900 max-w-xs">
                            <div className="flex flex-col space-y-1">
                              <span className="truncate">{log.usuario_nombre || log.usuarios_sistema?.nombre || 'Usuario desconocido'}</span>
                              <span className="text-xs text-gray-500 truncate">({log.usuario_email || log.usuarios_sistema?.email || 'N/A'})</span>
                            </div>
                          </td>
                          <td className="p-3 max-w-xs">
                            <Badge variant="outline" className={getTipoEventoColor(log.tipo_evento || 'SISTEMA')}>
                              {log.tipo_evento || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-900 max-w-xs">
                            <div className="max-w-xs truncate text-xs break-words">
                              {log.metadata && Object.keys(log.metadata).length > 0
                                ? JSON.stringify(log.metadata).substring(0, 50) + '...'
                                : 'Sin detalles'
                              }
                            </div>
                          </td>
                          <td className="p-3 text-gray-900 max-w-xs">
                            <span className="text-xs font-mono truncate">
                              {log.ip_address || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDetailsModal(log)}
                              className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Paginación para Auditoría Interna */}
                  {totalPagesInterna > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="text-sm text-gray-700">
                        Mostrando {startIndexInterna + 1} a {Math.min(endIndexInterna, auditoriaInterna.length)} de {auditoriaInterna.length} registros
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPageInterna(prev => Math.max(prev - 1, 1))}
                          disabled={currentPageInterna === 1}
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600">
                          Página {currentPageInterna} de {totalPagesInterna}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPageInterna(prev => Math.min(prev + 1, totalPagesInterna))}
                          disabled={currentPageInterna === totalPagesInterna}
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalles */}
        {isModalOpen && selectedLog && (
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
                  onClick={closeModal}
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Fecha/Hora:</span>
                    <p className="text-gray-900">
                      {selectedLog.creado_en ? formatearFecha(selectedLog.creado_en) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Acción:</span>
                    <div className="mt-1">
                      <Badge className={getAccionColor(selectedLog.accion as TipoAccion)}>
                        <span className="mr-1">{getAccionIcon(selectedLog.accion as TipoAccion)}</span>
                        {selectedLog.accion}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Módulo:</span>
                    <p className="text-gray-900">{selectedLog.modulo}</p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Usuario:</span>
                    <div className="mt-1">
                      <p className="text-gray-900">
                        {selectedLog.usuario_nombre || selectedLog.usuarios_sistema?.nombre || 'Usuario desconocido'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedLog.usuario_email || selectedLog.usuarios_sistema?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">IP Address:</span>
                    <p className="text-gray-900">
                      {selectedLog.ip_address || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Detalles:</span>
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedLog.detalles || selectedLog.metadata
                        ? JSON.stringify(selectedLog.detalles || selectedLog.metadata, null, 2)
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

export default function AuditoriaPage() {
  return (
    <ToastProvider>
      <AuditoriaPageContent />
    </ToastProvider>
  );
}
