'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { obtenerComprobantesPorEmpresaAction } from '@/app/actions/admin';
import ReactPaginate from 'react-paginate';
import { 
  BuildingOfficeIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Interfaces
interface Comprobante {
  id: string;
  empresa_id: string;
  monto: number;
  fecha_envio: string;
  url_archivo: string;
  tipo_archivo: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  verificado: boolean;
  notas?: string;
  creado_en: string;
  actualizado_en?: string;
  empresas?: {
    id: string;
    nombre: string;
  };
}

// Componentes premium
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
    {children}
  </div>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6">
    {children}
  </div>
);

// Componente Dialog simple
const Dialog = ({ open, onOpenChange, children }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  children: React.ReactNode;
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function FinanzasEmpresaPage() {
  const { user, loading } = useJWTAuth();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoComprobantes, setCargandoComprobantes] = useState(false);
  const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Estados de paginación
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar empresas al montar
  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        // Aquí deberías cargar las empresas disponibles
        // Por ahora, usaremos datos de ejemplo
        setEmpresas([
          { id: '1', nombre: 'Empresa Ejemplo 1' },
          { id: '2', nombre: 'Empresa Ejemplo 2' },
        ]);
      } catch (error) {
        console.error('Error cargando empresas:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarEmpresas();
  }, []);

  // Cargar comprobantes cuando se selecciona una empresa
  useEffect(() => {
    if (!selectedEmpresa) {
      setComprobantes([]);
      return;
    }

    const cargarComprobantes = async () => {
      try {
        setCargandoComprobantes(true);
        const result = await obtenerComprobantesPorEmpresaAction(selectedEmpresa);
        
        if (result.success) {
          setComprobantes(result.data || []);
        } else {
          console.error('Error cargando comprobantes:', result.error);
        }
      } catch (error) {
        console.error('Error cargando comprobantes:', error);
      } finally {
        setCargandoComprobantes(false);
      }
    };

    cargarComprobantes();
  }, [selectedEmpresa]);

  // Paginación
  const endOffset = itemOffset + itemsPerPage;
  const currentItems = comprobantes.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(comprobantes.length / itemsPerPage);

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * itemsPerPage) % comprobantes.length;
    setItemOffset(newOffset);
    setCurrentPage(event.selected + 1);
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
      currency: 'COP'
    }).format(monto);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      case 'pendiente':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rechazado':
        return <XCircleIcon className="w-4 h-4" />;
      case 'pendiente':
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Finanzas por Empresa</h1>
          <p className="text-gray-600">Visualiza todos los comprobantes de pago de una empresa específica</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Seleccionar Empresa</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <select
                value={selectedEmpresa}
                onChange={(e) => {
                  setSelectedEmpresa(e.target.value);
                  setItemOffset(0);
                  setCurrentPage(1);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Selecciona una empresa...</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {selectedEmpresa && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Comprobantes de {empresas.find(e => e.id === selectedEmpresa)?.nombre}
                  </h2>
                </div>
                <div className="text-sm text-gray-600">
                  Total: {comprobantes.length} comprobantes
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cargandoComprobantes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                </div>
              ) : currentItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <CurrencyDollarIcon className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-500">No se encontraron comprobantes para esta empresa</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((comprobante) => (
                        <tr key={comprobante.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              {formatearFecha(comprobante.fecha_envio)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                              {formatearMoneda(comprobante.monto)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadge(comprobante.estado)}`}>
                              {getEstadoIcon(comprobante.estado)}
                              {comprobante.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {comprobante.tipo_archivo || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => {
                                setSelectedComprobante(comprobante);
                                setShowModal(true);
                              }}
                              className="text-amber-600 hover:text-amber-900 font-medium"
                            >
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginación */}
              {pageCount > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {itemOffset + 1} a {Math.min(endOffset, comprobantes.length)} de {comprobantes.length} resultados
                  </div>
                  <ReactPaginate
                    breakLabel="..."
                    nextLabel={
                      <button className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">
                        Siguiente
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    }
                    previousLabel={
                      <button className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">
                        <ChevronLeftIcon className="w-4 h-4" />
                        Anterior
                      </button>
                    }
                    onPageChange={handlePageClick}
                    pageRangeDisplayed={5}
                    pageCount={pageCount}
                    forcePage={currentPage - 1}
                                        containerClassName="flex items-center gap-2"
                    pageClassName="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                    activeClassName="bg-amber-600 text-white border-amber-600"
                    disabledClassName="opacity-50 cursor-not-allowed"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de detalles */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detalles del Comprobante
              </h3>
              {selectedComprobante && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Empresa</p>
                    <p className="text-sm text-gray-900">
                      {selectedComprobante.empresas?.nombre || 'Empresa no especificada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Monto</p>
                    <p className="text-sm text-gray-900">
                      {formatearMoneda(selectedComprobante.monto)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Fecha de envío</p>
                    <p className="text-sm text-gray-900">
                      {formatearFecha(selectedComprobante.fecha_envio)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Estado</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadge(selectedComprobante.estado)}`}>
                      {getEstadoIcon(selectedComprobante.estado)}
                      {selectedComprobante.estado}
                    </span>
                  </div>
                  {selectedComprobante.notas && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Notas</p>
                      <p className="text-sm text-gray-900">{selectedComprobante.notas}</p>
                    </div>
                  )}
                  {selectedComprobante.url_archivo && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Comprobante</p>
                      <a
                        href={selectedComprobante.url_archivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Ver comprobante original
                      </a>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
