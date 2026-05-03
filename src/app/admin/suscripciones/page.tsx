'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { obtenerGestionSuscripcionesAction, aprobarPagoAction, rechazarPagoAction } from '@/app/actions/admin';
import ReactPaginate from 'react-paginate';
import { 
  BuildingOfficeIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CheckIcon,
  InboxIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

// Componentes premium
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

// Componentes temporales para Dialog
const Dialog = ({ open, onOpenChange, children }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  children: React.ReactNode; 
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DialogFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-6 flex justify-end space-x-3">{children}</div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
);

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600">{children}</p>
);

const Badge = ({ children, variant }: { children: React.ReactNode; variant: 'success' | 'destructive' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      variant === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}
  >
    {children}
  </span>
);

interface Comprobante {
  id: string;
  empresa_id: string;
  nombre_archivo: string;
  url_archivo: string;
  tipo_archivo: string;
  tamano_bytes: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  verificado: boolean;
  notas?: string;
  fecha_envio: string;
  creado_en: string;
  actualizado_en: string;
  monto: number;
  plan_id?: string;
  empresas?: {
    id: string;
    nombre: string;
  } | null;
}

interface Empresa {
  id: string;
  nombre: string;
  estado: 'activo' | 'suspendido' | 'inactivo';
  fecha_vencimiento: string;
  plan_id: string;
  planes?: {
    id: string;
    nombre: string;
    precio: number;
    descripcion: string;
    max_usuarios: number;
    max_empleados: number;
    tiene_inventario: boolean;
    tiene_comisiones: boolean;
    tiene_marketing: boolean;
    soporte_prioritario: boolean;
    tiene_analytics: boolean;
    tiene_nominas: boolean;
  } | null;
}

interface GestionSuscripcionesResult {
  success: boolean;
  data?: {
    empresas: Empresa[];
    comprobantesPendientes: Comprobante[];
    historialComprobantes: Comprobante[];
    analisis?: any;
  };
  error?: string;
}

export default function SuscripcionesPage() {
  const { user, loading } = useJWTAuth();
  const [activeTab, setActiveTab] = useState<'pagos' | 'salones' | 'historial'>('pagos');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [comprobantesPendientes, setComprobantesPendientes] = useState<any[]>([]);
  const [historialComprobantes, setHistorialComprobantes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [procesandoAprobacion, setProcesandoAprobacion] = useState(false);
  const [procesandoRechazo, setProcesandoRechazo] = useState(false);
  const [notasRechazo, setNotasRechazo] = useState('');
  const [mostrarCampoNotas, setMostrarCampoNotas] = useState(false);
  
  // Estados de paginación (similar a clientes)
  const [itemsPerPagePagos] = useState(8);
  const [itemOffsetPagos, setItemOffsetPagos] = useState(0);
  const [totalCountPagos, setTotalCountPagos] = useState(0);
  const [currentPagePagos, setCurrentPagePagos] = useState(1);

  const [itemsPerPageSalones] = useState(10);
  const [itemOffsetSalones, setItemOffsetSalones] = useState(0);
  const [totalCountSalones, setTotalCountSalones] = useState(0);
  const [currentPageSalones, setCurrentPageSalones] = useState(1);

  const [itemsPerPageHistorial] = useState(15);
  const [itemOffsetHistorial, setItemOffsetHistorial] = useState(0);
  const [totalCountHistorial, setTotalCountHistorial] = useState(0);
  const [currentPageHistorial, setCurrentPageHistorial] = useState(1);

  // Estados de búsqueda
  const [searchTermSalones, setSearchTermSalones] = useState('');
  const [searchTermHistorial, setSearchTermHistorial] = useState('');

  // Estados de notificaciones toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false
  });

  // Estados para modal de visualización de comprobante (historial)
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [selectedHistorialComprobante, setSelectedHistorialComprobante] = useState<any>(null);

  // Cargar datos al montar el componente o cuando cambia la pestaña activa
  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user]); // Solo se ejecuta cuando el usuario cambia

  // Recargar datos cuando cambia la pestaña activa
  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [activeTab]); // Se ejecuta cuando cambia la pestaña

  // Función para mostrar notificaciones toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Calcular páginas actuales basado en offsets
  useEffect(() => {
    setCurrentPagePagos(Math.floor(itemOffsetPagos / itemsPerPagePagos) + 1);
  }, [itemOffsetPagos, itemsPerPagePagos]);

  useEffect(() => {
    setCurrentPageSalones(Math.floor(itemOffsetSalones / itemsPerPageSalones) + 1);
  }, [itemOffsetSalones, itemsPerPageSalones]);

  useEffect(() => {
    setCurrentPageHistorial(Math.floor(itemOffsetHistorial / itemsPerPageHistorial) + 1);
  }, [itemOffsetHistorial, itemsPerPageHistorial]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      // Cargar datos principales (la suspensión automática se maneja por el hook global)
      const result = await obtenerGestionSuscripcionesAction();
      
            
      if (result.success) {
        const empresasData = result.data?.empresas || [];
        const comprobantesData = result.data?.comprobantesPendientes || [];
        const historialData = result.data?.historialComprobantes || [];
        
        // Establecer datos con validación adicional
        try {
          if (Array.isArray(empresasData)) {
            setEmpresas(empresasData);
          } else {
            console.warn('⚠️ empresasData no es array, usando array vacío');
            setEmpresas([]);
          }
        } catch (err) {
          console.error('❌ Error crítico en setEmpresas:', err);
          setEmpresas([]);
        }
        
        try {
          if (Array.isArray(comprobantesData)) {
            setComprobantesPendientes(comprobantesData);
          } else {
            console.warn('⚠️ comprobantesData no es array, usando array vacío');
            setComprobantesPendientes([]);
          }
        } catch (err) {
          console.error('❌ Error crítico en setComprobantesPendientes:', err);
          setComprobantesPendientes([]);
        }
        
        try {
          if (Array.isArray(historialData)) {
            setHistorialComprobantes(historialData);
          } else {
            console.warn('⚠️ historialData no es array, usando array vacío');
            setHistorialComprobantes([]);
          }
        } catch (err) {
          console.error('❌ Error crítico en setHistorialComprobantes:', err);
          setHistorialComprobantes([]);
        }
        
        // Establecer totales para paginación
        setTotalCountPagos(comprobantesData.length);
        setTotalCountSalones(empresasData.length);
        setTotalCountHistorial(historialData.length);
        
        // Resetear offsets
        setItemOffsetPagos(0);
        setItemOffsetSalones(0);
        setItemOffsetHistorial(0);
      } else {
        console.error('❌ Frontend - El backend devolvió error:', result.error);
      }
    } catch (error) {
      console.error('❌ Frontend - Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  };

  // Datos filtrados para mostrar
  const [filteredEmpresas, setFilteredEmpresas] = useState<any[]>([]);
  const [filteredHistorial, setFilteredHistorial] = useState<any[]>([]);

  // Filtrar empresas
  useEffect(() => {
    const filtered = empresas.filter(empresa =>
      empresa.nombre.toLowerCase().includes(searchTermSalones.toLowerCase()) ||
      (empresa.planes?.nombre || '').toLowerCase().includes(searchTermSalones.toLowerCase()) ||
      empresa.estado.toLowerCase().includes(searchTermSalones.toLowerCase())
    );
    setFilteredEmpresas(filtered);
    setItemOffsetSalones(0); // Resetear a primera página al filtrar
    setTotalCountSalones(filtered.length);
  }, [empresas, searchTermSalones]);

  // Función auxiliar para obtener nombre de empresa
  const getNombreEmpresa = (comprobante: Comprobante, empresasList: Empresa[]) => {
    // Primero intentar usar la relación directa
    if (comprobante.empresas?.nombre) {
      return comprobante.empresas.nombre;
    }
    
    // Si no, buscar en la lista de empresas usando empresa_id
    if (comprobante.empresa_id) {
      const empresa = empresasList.find(emp => emp.id === comprobante.empresa_id);
      return empresa?.nombre || 'Empresa desconocida';
    }
    
    return 'Empresa desconocida';
  };

  // Filtrar historial
  useEffect(() => {
    const filtered = historialComprobantes.filter(comprobante => {
      const nombreEmpresa = getNombreEmpresa(comprobante, empresas);
      return (
        nombreEmpresa.toLowerCase().includes(searchTermHistorial.toLowerCase()) ||
        comprobante.estado.toLowerCase().includes(searchTermHistorial.toLowerCase()) ||
        (comprobante.monto || 0).toString().includes(searchTermHistorial)
      );
    });
    setFilteredHistorial(filtered);
    setItemOffsetHistorial(0); // Resetear a primera página al filtrar
    setTotalCountHistorial(filtered.length);
  }, [historialComprobantes, searchTermHistorial, empresas]);

  // Datos para mostrar en tablas
  const endOffsetPagos = itemOffsetPagos + itemsPerPagePagos - 1;
  const endOffsetSalones = itemOffsetSalones + itemsPerPageSalones - 1;
  const endOffsetHistorial = itemOffsetHistorial + itemsPerPageHistorial - 1;

  const currentComprobantes = comprobantesPendientes.slice(itemOffsetPagos, endOffsetPagos + 1);
  const currentEmpresas = filteredEmpresas.slice(itemOffsetSalones, endOffsetSalones + 1);
  const currentHistorial = filteredHistorial.slice(itemOffsetHistorial, endOffsetHistorial + 1);

  const pageCountPagos = Math.ceil(totalCountPagos / itemsPerPagePagos);
  const pageCountSalones = Math.ceil(totalCountSalones / itemsPerPageSalones);
  const pageCountHistorial = Math.ceil(totalCountHistorial / itemsPerPageHistorial);

  // Manejadores de búsqueda
  const handleSearchSalonesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermSalones(e.target.value);
    setItemOffsetSalones(0);
  };

  const handleSearchHistorialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermHistorial(e.target.value);
    setItemOffsetHistorial(0);
  };

  const handleAprobarPago = async () => {
    if (!selectedComprobante || !user?.id || !selectedComprobante.empresa_id) return;

    try {
      setProcesandoAprobacion(true);
      
      const result = await aprobarPagoAction(
        selectedComprobante.id, 
        selectedComprobante.empresa_id, 
        user.id,
        undefined // notas opcionales (no se usan en aprobación)
      );
      
      if (result.success) {
        // Actualizar estado local
        setComprobantesPendientes(prev => prev.filter(c => c.id !== selectedComprobante.id));
        setShowModal(false);
        setSelectedComprobante(null);
        setTotalCountPagos(prev => Math.max(0, prev - 1));
        
        // Mostrar notificación de éxito
        showToast(result.message || 'Comprobante aprobado exitosamente', 'success');
      } else {
        console.error('Error aprobando pago:', result.error);
        // Mostrar notificación de error
        showToast(result.error || 'Error aprobando pago', 'error');
      }
    } catch (error) {
      console.error('Error aprobando pago:', error);
      // Mostrar notificación de error
      showToast('Error inesperado aprobando pago', 'error');
    } finally {
      setProcesandoAprobacion(false);
    }
  };

  const handleRechazarPago = async () => {
    if (!selectedComprobante || !user?.id) return;

    try {
      setProcesandoRechazo(true);
      
      const result = await rechazarPagoAction(selectedComprobante.id, notasRechazo, user.id);
      
      if (result.success) {
        // Actualizar estado local
        setComprobantesPendientes(prev => prev.filter(c => c.id !== selectedComprobante.id));
        setShowModal(false);
        setSelectedComprobante(null);
        setNotasRechazo('');
        setMostrarCampoNotas(false);
        setTotalCountPagos(prev => Math.max(0, prev - 1));
        
        // Mostrar notificación de éxito
        showToast(result.message || 'Comprobante rechazado exitosamente', 'success');
      } else {
        console.error('Error rechazando pago:', result.error);
        // Mostrar notificación de error
        showToast(result.error || 'Error rechazando pago', 'error');
      }
    } catch (error) {
      console.error('Error rechazando pago:', error);
      // Mostrar notificación de error
      showToast('Error inesperado rechazando pago', 'error');
    } finally {
      setProcesandoRechazo(false);
    }
  };

  const handleAbrirOriginal = () => {
    if (selectedComprobante?.url_archivo) {
      window.open(selectedComprobante.url_archivo, '_blank');
    }
  };

  // Funciones para modal de historial
  const handleVerComprobanteHistorial = (comprobante: any) => {
    setSelectedHistorialComprobante(comprobante);
    setShowHistorialModal(true);
  };

  const handleCerrarHistorialModal = () => {
    setShowHistorialModal(false);
    setSelectedHistorialComprobante(null);
  };

  const handleAbrirOriginalHistorial = () => {
    if (selectedHistorialComprobante?.url_archivo) {
      window.open(selectedHistorialComprobante.url_archivo, '_blank');
    }
  };

  // Funciones auxiliares para historial (reutilizar las existentes)
  const esPDFHistorial = (url: string) => {
    return url?.toLowerCase().includes('.pdf');
  };

  const esImagenHistorial = (url: string) => {
    return url?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
  };

  const esPDF = (tipoArchivo: string) => {
    return tipoArchivo?.toLowerCase().includes('pdf') || false;
  };

  const esImagen = (tipoArchivo: string) => {
    return tipoArchivo?.toLowerCase().includes('image') || false;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  if (loading || cargando) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#fdfaf6]">
          <div className="text-gray-600">Cargando...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#fdfaf6] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Suscripciones</h1>
            <p className="text-gray-600">Administra los pagos y el estado de los salones</p>
          </div>

          {/* Pestañas estilo píldoras */}
          <div className="bg-gray-100 p-1 rounded-lg mb-6 inline-flex">
            <button
              onClick={() => setActiveTab('pagos')}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === 'pagos'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Pagos Pendientes
            </button>
            <button
              onClick={() => setActiveTab('salones')}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === 'salones'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Estado de Salones
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === 'historial'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Historial de Pagos
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'pagos' && (
            <>
              {/* Tarjetas de pagos pendientes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {currentComprobantes.length === 0 ? (
                  <div className="col-span-full">
                    <Card>
                      <CardContent className="text-center py-12">
                        <InboxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No hay pagos pendientes por revisar</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  currentComprobantes.map((comprobante) => (
                    <Card key={comprobante.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {getNombreEmpresa(comprobante, empresas)}
                            </h3>
                            <p className="text-sm text-gray-500">{formatearFecha(comprobante.fecha_envio)}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            {formatearMoneda(comprobante.monto || 0)}
                          </div>
                          <p className="text-sm text-gray-500">Monto del pago</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedComprobante(comprobante);
                            setShowModal(true);
                          }}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Revisar Comprobante
                        </button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Paginación personalizada */}
              {pageCountPagos > 1 && (
                <div className="flex items-center justify-between px-6 py-3 bg-white border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-700">
                    Mostrando {itemOffsetPagos + 1} a {Math.min(endOffsetPagos + 1, totalCountPagos)} de {totalCountPagos} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setItemOffsetPagos(Math.max(0, itemOffsetPagos - itemsPerPagePagos))}
                      disabled={itemOffsetPagos === 0}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                      Página {currentPagePagos} de {pageCountPagos}
                    </span>
                    <button
                      onClick={() => setItemOffsetPagos(Math.min(itemOffsetPagos + itemsPerPagePagos, totalCountPagos - itemsPerPagePagos))}
                      disabled={itemOffsetPagos + itemsPerPagePagos >= totalCountPagos}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Siguiente
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'salones' && (
            <>
              {/* Filtro de búsqueda */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, plan o estado..."
                        value={searchTermSalones}
                        onChange={handleSearchSalonesChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <span className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-gray-50">
                      {filteredEmpresas.length} salones
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  {currentEmpresas.length === 0 ? (
                    <div className="text-center py-12">
                      <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTermSalones ? 'No se encontraron salones con esos criterios' : 'No hay salones registrados'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Empresa
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Plan
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Vencimiento
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {currentEmpresas.map((empresa) => (
                            <tr key={empresa.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3" />
                                  <div className="text-sm font-medium text-gray-900">{empresa.nombre}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700 font-medium">
                                  {empresa.planes?.nombre || 'Sin plan'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {empresa.planes?.precio ? formatearMoneda(empresa.planes.precio) : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-700">
                                  <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                                  {empresa.fecha_vencimiento ? formatearFecha(empresa.fecha_vencimiento) : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={empresa.estado === 'activo' ? 'success' : 'destructive'}>
                                  {empresa.estado === 'activo' ? 'Activo' : empresa.estado === 'suspendido' ? 'Suspendido' : empresa.estado}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Paginación personalizada */}
              {pageCountSalones > 1 && (
                <div className="flex items-center justify-between px-6 py-3 bg-white border border-gray-200 rounded-lg mt-6">
                  <div className="text-sm text-gray-700">
                    Mostrando {itemOffsetSalones + 1} a {Math.min(endOffsetSalones + 1, totalCountSalones)} de {totalCountSalones} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setItemOffsetSalones(Math.max(0, itemOffsetSalones - itemsPerPageSalones))}
                      disabled={itemOffsetSalones === 0}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                      Página {currentPageSalones} de {pageCountSalones}
                    </span>
                    <button
                      onClick={() => setItemOffsetSalones(Math.min(itemOffsetSalones + itemsPerPageSalones, totalCountSalones - itemsPerPageSalones))}
                      disabled={itemOffsetSalones + itemsPerPageSalones >= totalCountSalones}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Siguiente
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'historial' && (
            <>
              {/* Filtro de búsqueda */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar por empresa, monto o estado..."
                        value={searchTermHistorial}
                        onChange={handleSearchHistorialChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <span className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-gray-50">
                      {filteredHistorial.length} registros
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  {currentHistorial.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTermHistorial ? 'No se encontraron registros con esos criterios' : 'No hay historial de pagos'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Empresa
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Fecha de Verificación
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {currentHistorial.map((comprobante) => (
                            <tr key={comprobante.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3" />
                                  <div className="text-sm font-medium text-gray-900">
                                    {getNombreEmpresa(comprobante, empresas)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatearMoneda(comprobante.monto || 0)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-700">
                                  <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                                  {comprobante.actualizado_en ? formatearFecha(comprobante.actualizado_en) : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {comprobante.estado === 'aprobado' ? (
                                  <div className="flex items-center">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                    <Badge variant="success">Aprobado</Badge>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />
                                    <Badge variant="destructive">Rechazado</Badge>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleVerComprobanteHistorial(comprobante)}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 transition-colors"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                  Ver Comprobante
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Paginación personalizada */}
              {pageCountHistorial > 1 && (
                <div className="flex items-center justify-between px-6 py-3 bg-white border border-gray-200 rounded-lg mt-6">
                  <div className="text-sm text-gray-700">
                    Mostrando {itemOffsetHistorial + 1} a {Math.min(endOffsetHistorial + 1, totalCountHistorial)} de {totalCountHistorial} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setItemOffsetHistorial(Math.max(0, itemOffsetHistorial - itemsPerPageHistorial))}
                      disabled={itemOffsetHistorial === 0}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                      Página {currentPageHistorial} de {pageCountHistorial}
                    </span>
                    <button
                      onClick={() => setItemOffsetHistorial(Math.min(itemOffsetHistorial + itemsPerPageHistorial, totalCountHistorial - itemsPerPageHistorial))}
                      disabled={itemOffsetHistorial + itemsPerPageHistorial >= totalCountHistorial}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Siguiente
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal de Revisión de Comprobante Mejorado */}
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Revisión de Comprobante
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Empresa:</strong> {selectedComprobante ? getNombreEmpresa(selectedComprobante, empresas) : 'Empresa desconocida'}</p>
                  <p><strong>Monto:</strong> {formatearMoneda(selectedComprobante?.monto || 0)}</p>
                  <p><strong>Fecha:</strong> {selectedComprobante?.fecha_envio ? formatearFecha(selectedComprobante.fecha_envio) : 'N/A'}</p>
                  <p><strong>Tipo:</strong> {selectedComprobante?.tipo_archivo || 'N/A'}</p>
                </div>
              </div>

              {/* Botón para abrir en nueva pestaña */}
              {selectedComprobante?.url_archivo && (
                <div className="mb-4">
                  <button
                    onClick={handleAbrirOriginal}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Abrir original en nueva pestaña
                  </button>
                </div>
              )}

              {/* Vista previa del archivo - Soporte multiformato */}
              {selectedComprobante?.url_archivo && (
                <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  {esPDF(selectedComprobante.tipo_archivo || '') ? (
                    <iframe
                      src={selectedComprobante.url_archivo}
                      className="w-full h-[500px] border-0"
                      title="Vista previa del PDF"
                    />
                  ) : esImagen(selectedComprobante.tipo_archivo || '') ? (
                    <img
                      src={selectedComprobante.url_archivo}
                      alt="Comprobante de pago"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <div className="mb-4">
                        <DocumentIcon className="w-12 h-12 mx-auto text-gray-400" />
                      </div>
                      <p className="text-sm">No se puede previsualizar este tipo de archivo</p>
                      <p className="text-xs mt-2">Usa el botón "Abrir original" para verlo</p>
                    </div>
                  )}
                </div>
              )}

              {/* Campo de notas para rechazo */}
              {mostrarCampoNotas && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Notas de rechazo (opcional)
                  </label>
                  <textarea
                    value={notasRechazo}
                    onChange={(e) => setNotasRechazo(e.target.value)}
                    placeholder="Ej: Monto incorrecto, imagen borrosa, etc."
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              )}

              <DialogFooter>
                {/* Botones secundarios */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  {!mostrarCampoNotas ? (
                    <button
                      onClick={() => setMostrarCampoNotas(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Rechazar Pago
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setMostrarCampoNotas(false);
                          setNotasRechazo('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancelar Rechazo
                      </button>
                      <button
                        onClick={handleRechazarPago}
                        disabled={procesandoRechazo}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {procesandoRechazo ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Rechazando...
                          </>
                        ) : (
                          <>
                            <XMarkIcon className="w-4 h-4" />
                            Confirmar Rechazo
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Botón de aprobar (siempre visible) */}
                <button
                  onClick={handleAprobarPago}
                  disabled={procesandoAprobacion || procesandoRechazo}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesandoAprobacion ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Aprobar Pago
                    </>
                  )}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        {/* Modal para visualizar comprobante del historial */}
        <Dialog open={showHistorialModal} onOpenChange={handleCerrarHistorialModal}>
          <DialogContent>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Comprobante de Pago - Historial
                </h3>
                <button
                  onClick={handleCerrarHistorialModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedHistorialComprobante && (
                <div className="space-y-4">
                  {/* Información del comprobante */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Empresa:</span>
                      <p className="text-gray-900">{getNombreEmpresa(selectedHistorialComprobante, empresas)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Monto:</span>
                      <p className="text-gray-900">{formatearMoneda(selectedHistorialComprobante.monto || 0)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Estado:</span>
                      <p className="text-gray-900">
                        {selectedHistorialComprobante.estado === 'aprobado' ? (
                          <span className="text-green-600 font-medium">Aprobado</span>
                        ) : (
                          <span className="text-red-600 font-medium">Rechazado</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Fecha de envío:</span>
                      <p className="text-gray-900">{formatearFecha(selectedHistorialComprobante.fecha_envio)}</p>
                    </div>
                    {selectedHistorialComprobante.fecha_verificacion && (
                      <div>
                        <span className="font-medium text-gray-700">Fecha de verificación:</span>
                        <p className="text-gray-900">{formatearFecha(selectedHistorialComprobante.fecha_verificacion)}</p>
                      </div>
                    )}
                    {selectedHistorialComprobante.notas && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Notas:</span>
                        <p className="text-gray-900">{selectedHistorialComprobante.notas}</p>
                      </div>
                    )}
                  </div>

                  {/* Vista previa del archivo */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Vista previa del comprobante
                      </span>
                      <button
                        onClick={handleAbrirOriginalHistorial}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        Abrir en nueva pestaña
                      </button>
                    </div>
                    <div className="p-4 bg-gray-50">
                      {esPDFHistorial(selectedHistorialComprobante.url_archivo) ? (
                        <iframe
                          src={selectedHistorialComprobante.url_archivo}
                          className="w-full h-[500px] border-0 rounded"
                          title="Vista previa del PDF"
                        />
                      ) : esImagenHistorial(selectedHistorialComprobante.url_archivo) ? (
                        <img
                          src={selectedHistorialComprobante.url_archivo}
                          alt="Vista previa del comprobante"
                          className="w-full h-auto max-h-[500px] object-contain rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                          <DocumentIcon className="w-12 h-12 mb-2" />
                          <p>No se puede previsualizar este tipo de archivo</p>
                          <button
                            onClick={handleAbrirOriginalHistorial}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            Descargar archivo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
