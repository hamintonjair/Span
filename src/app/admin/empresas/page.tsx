'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CreditCardIcon,
  EyeIcon,
  PencilSquareIcon,
  PlayIcon,
  StopIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { obtenerTodasLasEmpresasAction, registrarEmpresaDesdeAdmin } from '@/app/actions/empresa';
import { toggleEstadoEmpresaAction } from '@/app/actions/admin';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

// Componente Badge temporal hasta que tengamos el UI component
const Badge = ({ children, variant = 'outline', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'outline' | 'default' | 'destructive'; 
  className?: string; 
}) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  const variantClasses = {
    outline: 'border border-gray-300 text-gray-700 bg-white',
    default: 'bg-blue-100 text-blue-800 border border-blue-200',
    destructive: 'bg-red-100 text-red-800 border border-red-200'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface Empresa {
  id: string;
  nombre: string;
  nit?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  estado_suscripcion?: string;
  fecha_vencimiento?: string;
  estado: 'activo' | 'suspendido';
  plan_nombre?: string;
  plan_precio?: number;
  max_empleados?: number;
  cantidad_empleados?: number;
  dueño?: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  } | null;
  creado_en: string;
  suscripciones?: Array<{
    id: string;
    estado_pago: string;
    periodo_mes: number;
    periodo_anio: number;
    proximo_vencimiento?: string;
    comprobante_id?: string;
    creado_en: string;
  }>;
}

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  max_usuarios: number;
  max_empleados: number;
}

export default function EmpresasPage() {
  const { user, loading } = useJWTAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  // Función para actualizar empresa en el estado local (actualización optimista)
  const handleEmpresaActualizada = (empresaEditada: Empresa) => {
    setEmpresas(prev => prev.map(emp => emp.id === empresaEditada.id ? empresaEditada : emp));
  };
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    plan_id: ''
  });
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    plan_id: ''
  });
  const [updating, setUpdating] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEmpresa, setViewingEmpresa] = useState<Empresa | null>(null);
  
  // Estados unificados para modal de empresa (crear/editar)
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [empresaModalData, setEmpresaModalData] = useState({
    nombreDueño: '',
    email: '',
    password: '',
    nombreNegocio: '',
    telefono: '',
    ciudad: ''
  });
  const [editingEmpresaInModal, setEditingEmpresaInModal] = useState<Empresa | null>(null);
  const [procesandoEmpresa, setProcesandoEmpresa] = useState(false);
  const [empresaModalError, setEmpresaModalError] = useState('');
  
  // Paginación
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calcular página actual basado en offset
  useEffect(() => {
    setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1);
  }, [itemOffset, itemsPerPage]);

  // Datos para mostrar - Paginación del lado del cliente temporalmente
const filteredEmpresas = empresas.filter(empresa =>
  !searchTerm || empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase())
);
const endOffset = itemOffset + itemsPerPage - 1;
const currentEmpresas = filteredEmpresas.slice(itemOffset, endOffset + 1);
const pageCount = Math.ceil(filteredEmpresas.length / itemsPerPage);
  


  useEffect(() => {
    if (user?.rol === 'admin_global') {
      loadEmpresas();
      loadPlanes();
    }
  }, [user, itemOffset]); // Solo dependencias de paginación, sin searchTerm

  const loadPlanes = async () => {
    try {
      setLoadingPlanes(true);
      
      const response = await fetch('/api/planes');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error cargando planes');
      }
      
      setPlanes(data.planes || []);
    } catch (error) {
      console.error('Error cargando planes:', error);
    } finally {
      setLoadingPlanes(false);
    }
  };

  const loadEmpresas = async () => {
    try {
      setLoadingEmpresas(true);
      
      // Usar Server Action en lugar de fetch a API
      const result = await obtenerTodasLasEmpresasAction();
      
      if (!result.success) {
        throw new Error(result.error || 'Error cargando empresas');
      }
      
      // Transformar los datos para que coincidan con la interfaz Empresa
      const empresasTransformadas = (result.data || []).map((empresa: any) => ({
        id: empresa.id,
        nombre: empresa.nombre,
        nit: empresa.nit,
        telefono: empresa.telefono,
        direccion: empresa.direccion,
        ciudad: empresa.ciudad,
        estado_suscripcion: empresa.estado_suscripcion,
        fecha_vencimiento: empresa.fecha_vencimiento,
        estado: empresa.estado,
        plan_nombre: empresa.planes?.nombre,
        plan_precio: empresa.planes?.precio,
        max_empleados: empresa.planes?.max_empleados,
        cantidad_empleados: empresa.cantidad_empleados || 0,
        dueño: empresa.dueño,
        creado_en: empresa.creado_en,
        suscripciones: empresa.suscripciones
      }));
      
      setEmpresas(empresasTransformadas);
      setTotalCount(empresasTransformadas.length);
    } catch (error) {
      console.error('Error cargando empresas:', error);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const createEmpresa = async () => {
    if (!user?.id) {
      console.error('Error: No se pudo identificar al administrador');
      return;
    }

    try {
      setCreating(true);
      
      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          plan_id: formData.plan_id,
          adminId: user.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error creando empresa');
      }
      
      // Agregar la nueva empresa a la lista
      setEmpresas(prev => [data.empresa, ...prev]);
      
      // Resetear formulario y cerrar modal
      setFormData({ nombre: '', plan_id: '' });
      setShowModal(false);
      
      showToast('Empresa creada correctamente', 'success');
      
    } catch (error) {
      console.error('Error creando empresa:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleEstado = async (empresaId: string, nuevoEstado: 'activo' | 'suspendido') => {
    if (!user?.id) {
      console.error('Error: No se pudo identificar al administrador');
      return;
    }

    try {
      setUpdatingId(empresaId);

      const result = await toggleEstadoEmpresaAction(empresaId, nuevoEstado, user.id);

      if (!result.success) {
        throw new Error(result.error || 'Error actualizando estado');
      }

      // Actualizar estado local instantáneamente sin recargar
      setEmpresas(prev => prev.map(empresa =>
        empresa.id === empresaId
          ? { ...empresa, estado: nuevoEstado }
          : empresa
      ));

      console.log('Estado actualizado exitosamente');

    } catch (error) {
      console.error('Error actualizando estado:', error);
      // Opcional: mostrar toast de error
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setEditFormData({
      nombre: empresa.nombre,
      plan_id: '' // No tenemos plan_id en la nueva estructura
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEmpresa(null);
    setEditFormData({
      nombre: '',
      plan_id: ''
    });
  };

  const updateEmpresa = async () => {
    if (!editingEmpresa) return;

    if (!user?.id) {
      console.error('Error: No se pudo identificar al administrador');
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(`/api/empresas/${editingEmpresa.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: editFormData.nombre,
          plan_id: editFormData.plan_id,
          adminId: user.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando empresa');
      }

      // Actualización optimista con los datos del servidor
      const empresaActualizada = {
        ...editingEmpresa,
        nombre: editFormData.nombre,
        // Si cambió el plan, actualizar nombre y precio
        ...(editFormData.plan_id ? {
          plan_nombre: planes.find(p => p.id === editFormData.plan_id)?.nombre,
          plan_precio: planes.find(p => p.id === editFormData.plan_id)?.precio
        } : {})
      };

      handleEmpresaActualizada(empresaActualizada);
      showToast('Empresa actualizada correctamente', 'success');
      closeEditModal();

    } catch (error) {
      console.error('Error actualizando empresa:', error);
    } finally {
      setUpdating(false);
    }
  };

  const openViewModal = (empresa: Empresa) => {
    setViewingEmpresa(empresa);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingEmpresa(null);
  };

  const openEmpresaModal = (empresa?: Empresa) => {
    if (empresa) {
      // Modo edición
      setEditingEmpresaInModal(empresa);
      setEmpresaModalData({
        nombreDueño: empresa.dueño?.nombre || '',
        email: empresa.dueño?.email || '',
        password: '',
        nombreNegocio: empresa.nombre,
        telefono: empresa.telefono || '',
        ciudad: empresa.ciudad || ''
      });
    } else {
      // Modo creación
      setEditingEmpresaInModal(null);
      setEmpresaModalData({
        nombreDueño: '',
        email: '',
        password: '',
        nombreNegocio: '',
        telefono: '',
        ciudad: ''
      });
    }
    setEmpresaModalError('');
    setShowEmpresaModal(true);
  };

  const closeEmpresaModal = () => {
    setShowEmpresaModal(false);
    setEditingEmpresaInModal(null);
    setEmpresaModalData({
      nombreDueño: '',
      email: '',
      password: '',
      nombreNegocio: '',
      telefono: '',
      ciudad: ''
    });
    setEmpresaModalError('');
  };

  if (loading || loadingEmpresas) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando empresas...</div>
        </div>
      </MainLayout>
    );
  }

  if (!user || user.rol !== 'admin_global') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">No tienes permisos para acceder a esta página</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-[100vw] px-4 overflow-x-hidden space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 whitespace-normal">Gestión de Empresas</h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base whitespace-normal">Administra el estado y planes de todas las empresas</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Campo de búsqueda */}
            <div className="relative w-full md:w-auto">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setItemOffset(0); // Resetear a primera página al buscar
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-64"
              />
            </div>
            <Button
              onClick={() => openEmpresaModal()}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <BuildingOfficeIcon className="w-4 h-4" />
              Nueva Empresa
            </Button>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-3 py-2">
                {filteredEmpresas.length} empresas totales
              </Badge>
              <Badge variant="outline" className="px-3 py-2 bg-green-50 text-green-700">
                {filteredEmpresas.filter(e => e.estado === 'activo').length} activas
              </Badge>
              <Badge variant="outline" className="px-3 py-2 bg-red-50 text-red-700">
                {filteredEmpresas.filter(e => e.estado === 'suspendido').length} suspendidas
              </Badge>
            </div>
          </div>
        </div>

        {/* Lista de Empresas */}
        <div className="space-y-4">
          {currentEmpresas.map((empresa) => (
            <Card key={empresa.id} className="hover:shadow-lg transition-shadow w-full">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Columna 1: Empresa & Ubicación */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-3">
                      <BuildingOfficeIcon className="w-5 h-5 text-amber-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{empresa.nombre}</h3>
                      <Badge 
                        variant={empresa.estado === 'activo' ? 'default' : 'destructive'}
                        className="px-2 py-1 text-xs"
                      >
                        {empresa.estado === 'activo' ? 'Activo' : 'Suspendido'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        NIT: <span className="font-medium">{empresa.nit || 'Sin NIT'}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        📍 {empresa.direccion || 'Sin dirección'}, {empresa.ciudad || 'Sin ciudad'}
                      </p>
                    </div>
                  </div>

                  {/* Columna 2: Contacto / Dueño */}
                  <div className="lg:col-span-1">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Contacto / Dueño</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Nombre:</span> {empresa.dueño?.nombre || 'Sin dueño asignado'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {empresa.dueño?.email || 'Sin email'}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        📞 {empresa.telefono || 'Sin teléfono'}
                      </p>
                    </div>
                  </div>

                  {/* Columna 3: Suscripción & Plan */}
                  <div className="lg:col-span-1">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Suscripción & Plan</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Plan:</span> {empresa.plan_nombre || 'Sin plan'}
                        </p>
                        {empresa.plan_precio && (
                          <p className="text-sm font-semibold text-green-600">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(empresa.plan_precio)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={empresa.estado_suscripcion === 'activa' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {empresa.estado_suscripcion || 'Sin estado'}
                        </Badge>
                        {empresa.fecha_vencimiento && (
                          <span className="text-xs text-gray-500">
                            Vence: {new Date(empresa.fecha_vencimiento).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Columna 4: Uso */}
                  <div className="lg:col-span-1">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Uso</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Empleados: <span className="font-medium">{empresa.cantidad_empleados || 0}/{empresa.max_empleados || 0}</span>
                        </span>
                      </div>
                      {(empresa.cantidad_empleados || 0) >= (empresa.max_empleados || 0) && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                          Límite alcanzado
                        </Badge>
                      )}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${empresa.max_empleados && empresa.max_empleados > 0 
                              ? Math.min(((empresa.cantidad_empleados || 0) / empresa.max_empleados) * 100, 100) 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2 w-full justify-start mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => openViewModal(empresa)}
                  >
                    <EyeIcon className="w-4 h-4" />
                    Ver
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => openEmpresaModal(empresa)}
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Editar
                  </Button>
                  
                  <Button
                    variant={empresa.estado === 'activo' ? 'danger' : 'primary'}
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => toggleEstado(empresa.id, empresa.estado === 'activo' ? 'suspendido' : 'activo')}
                    disabled={updatingId === empresa.id}
                  >
                    {updatingId === empresa.id ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : empresa.estado === 'activo' ? (
                      <>
                        <StopIcon className="w-4 h-4" />
                        Suspender
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        Activar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {currentEmpresas.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay empresas registradas</h3>
              <p className="text-gray-600 mb-4">Las empresas aparecerán aquí cuando se registren en el sistema.</p>
              <Button onClick={() => openEmpresaModal()} className="flex items-center gap-2 mx-auto">
                <BuildingOfficeIcon className="w-4 h-4" />
                Crear Primera Empresa
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paginación - Mostrar siempre para debug */}
        {pageCount > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200 gap-4">
            <div className="text-sm text-gray-700">
              Mostrando {itemOffset + 1} a {Math.min(endOffset + 1, filteredEmpresas.length)} de {filteredEmpresas.length} resultados
              <br />
              {/* <small className="text-gray-500">
                Debug: pageCount={pageCount}, currentPage={currentPage}, currentEmpresasLength={currentEmpresas.length}
              </small> */}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemOffset(Math.max(0, itemOffset - itemsPerPage))}
                disabled={itemOffset === 0}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemOffset(Math.min(itemOffset + itemsPerPage, filteredEmpresas.length - itemsPerPage))}
                disabled={itemOffset + itemsPerPage >= filteredEmpresas.length}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Modal Nueva Empresa */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Nueva Empresa</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ej: BeautyPro Central"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan
                    </label>
                    <select
                      value={formData.plan_id}
                      onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      disabled={loadingPlanes}
                    >
                      <option value="">Seleccionar plan...</option>
                      {planes.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.nombre} - ${plan.precio}/mes ({plan.max_usuarios} usuarios)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={createEmpresa}
                    disabled={!formData.nombre || !formData.plan_id || creating}
                    className="flex-1"
                  >
                    {creating ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      'Crear Empresa'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Unificado de Empresa (Crear/Editar) */}
        {showEmpresaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {editingEmpresaInModal ? 'Editar Empresa' : 'Crear Nueva Empresa'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeEmpresaModal}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Campos del Dueño (ambos modos) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Dueño</label>
                    <input
                      type="text"
                      value={empresaModalData.nombreDueño}
                      onChange={(e) => setEmpresaModalData({ ...empresaModalData, nombreDueño: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={empresaModalData.email}
                      onChange={(e) => setEmpresaModalData({ ...empresaModalData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="juan@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <input
                        type="text"
                        value={empresaModalData.password}
                        onChange={(e) => setEmpresaModalData({ ...empresaModalData, password: e.target.value })}
                        className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder={editingEmpresaInModal ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                          let password = '';
                          for (let i = 0; i < 12; i++) {
                            password += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          setEmpresaModalData({ ...empresaModalData, password });
                        }}
                      >
                        Generar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {editingEmpresaInModal ? "Dejar vacío para mantener la contraseña actual" : "La contraseña debe tener al menos 6 caracteres"}
                    </p>
                  </div>

                  {/* Campos del Negocio (ambos modos) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Salón de Belleza</label>
                    <input
                      type="text"
                      value={empresaModalData.nombreNegocio}
                      onChange={(e) => setEmpresaModalData({ ...empresaModalData, nombreNegocio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="BeautyPro Salon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={empresaModalData.telefono}
                      onChange={(e) => setEmpresaModalData({ ...empresaModalData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={empresaModalData.ciudad}
                      onChange={(e) => setEmpresaModalData({ ...empresaModalData, ciudad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ciudad de Colombia"
                    />
                  </div>

                  {/* Error */}
                  {empresaModalError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{empresaModalError}</p>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={closeEmpresaModal}
                      disabled={procesandoEmpresa}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          setProcesandoEmpresa(true);
                          setEmpresaModalError('');

                          if (editingEmpresaInModal) {
                            // Modo edición - actualizar empresa y opcionalmente usuario
                            if (!user?.id) {
                              setEmpresaModalError('Error: No se pudo identificar al administrador');
                              setProcesandoEmpresa(false);
                              return;
                            }

                            const response = await fetch(`/api/empresas/${editingEmpresaInModal.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                nombre: empresaModalData.nombreNegocio,
                                telefono: empresaModalData.telefono,
                                ciudad: empresaModalData.ciudad,
                                adminId: user.id,
                                // Si se proporcionan datos del dueño, actualizar también
                                ...(empresaModalData.nombreDueño.trim() && {
                                  nombre_dueño: empresaModalData.nombreDueño
                                }),
                                ...(empresaModalData.email.trim() && {
                                  email_dueño: empresaModalData.email
                                }),
                                ...(empresaModalData.password.trim() && {
                                  password: empresaModalData.password
                                })
                              })
                            });

                            const data = await response.json();

                            if (!response.ok) {
                              throw new Error(data.error || 'Error actualizando empresa');
                            }

                            // Actualización optimista con los datos del servidor
                            const empresaActualizada = {
                              ...editingEmpresaInModal,
                              nombre: empresaModalData.nombreNegocio,
                              telefono: empresaModalData.telefono,
                              ciudad: empresaModalData.ciudad,
                              ...(editingEmpresaInModal.dueño && {
                                dueño: {
                                  ...editingEmpresaInModal.dueño,
                                  ...(empresaModalData.nombreDueño.trim() && { nombre: empresaModalData.nombreDueño }),
                                  ...(empresaModalData.email.trim() && { email: empresaModalData.email })
                                }
                              })
                            };

                            handleEmpresaActualizada(empresaActualizada);
                            showToast('Empresa actualizada correctamente', 'success');
                          } else {
                            // Modo creación - usar Server Action
                            if (!user?.id) {
                              setEmpresaModalError('Error: No se pudo identificar al administrador');
                              return;
                            }

                            const result = await registrarEmpresaDesdeAdmin({
                              nombreDueño: empresaModalData.nombreDueño,
                              email: empresaModalData.email,
                              password: empresaModalData.password,
                              nombreNegocio: empresaModalData.nombreNegocio,
                              telefono: empresaModalData.telefono,
                              ciudad: empresaModalData.ciudad
                            }, user.id);

                            if (!result.success) {
                              setEmpresaModalError(result.error || 'Error al crear la empresa');
                              return;
                            }

                            showToast('Empresa creada correctamente', 'success');
                          }

                          closeEmpresaModal();
                        } catch (error) {
                          setEmpresaModalError(error instanceof Error ? error.message : 'Error al procesar la empresa');
                        } finally {
                          setProcesandoEmpresa(false);
                        }
                      }}
                      disabled={
                        procesandoEmpresa ||
                        !empresaModalData.nombreNegocio.trim() ||
                        (!editingEmpresaInModal && (!empresaModalData.nombreDueño.trim() || !empresaModalData.email.trim() || !empresaModalData.password.trim()))
                      }
                      className="flex-1"
                    >
                      {procesandoEmpresa ? (
                        <>
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          {editingEmpresaInModal ? 'Actualizando...' : 'Creando...'}
                        </>
                      ) : (
                        editingEmpresaInModal ? 'Actualizar Empresa' : 'Crear Empresa'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Vista */}
        {showViewModal && viewingEmpresa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Detalles de Empresa</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeViewModal}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Información Principal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                      <p className="text-lg font-semibold text-gray-900">{viewingEmpresa.nombre}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                      <p className="text-lg font-medium text-gray-900">{viewingEmpresa.nit || 'Sin NIT'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <Badge 
                        variant={viewingEmpresa.estado === 'activo' ? 'default' : 'destructive'}
                        className="px-3 py-1"
                      >
                        {viewingEmpresa.estado === 'activo' ? 'Activo' : 'Suspendido'}
                      </Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <p className="text-lg font-medium text-gray-900">{viewingEmpresa.direccion || 'Sin dirección'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                      <p className="text-lg font-medium text-gray-900">{viewingEmpresa.ciudad || 'Sin ciudad'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <p className="text-lg font-medium text-gray-900">{viewingEmpresa.telefono || 'Sin teléfono'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dueño</label>
                      <p className="text-lg font-medium text-gray-900">{viewingEmpresa.dueño?.nombre || 'Sin dueño asignado'}</p>
                      <p className="text-sm text-gray-600">{viewingEmpresa.dueño?.email || 'Sin email'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                      <p className="text-lg font-medium text-gray-900">
                        {viewingEmpresa.plan_nombre || 'Sin plan'}
                      </p>
                      {viewingEmpresa.plan_precio && (
                        <p className="text-sm text-green-600 font-semibold">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(viewingEmpresa.plan_precio)}/mes
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Suscripción</label>
                      <Badge 
                        variant={viewingEmpresa.estado_suscripcion === 'activa' ? 'default' : 'destructive'}
                        className="px-3 py-1"
                      >
                        {viewingEmpresa.estado_suscripcion || 'Sin estado'}
                      </Badge>
                      {viewingEmpresa.fecha_vencimiento && (
                        <p className="text-sm text-gray-600 mt-1">
                          Vence: {new Date(viewingEmpresa.fecha_vencimiento).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Empleados</label>
                      <p className="text-lg font-medium text-gray-900">{viewingEmpresa.max_empleados || 0}</p>
                      <p className="text-sm text-gray-600">
                        Actual: {viewingEmpresa.cantidad_empleados || 0} empleados
                      </p>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg w-full">
                        <p className="text-sm text-blue-600 font-medium">Total Empleados</p>
                        <p className="text-2xl font-bold text-blue-900">{viewingEmpresa.cantidad_empleados || 0}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg w-full">
                        <p className="text-sm text-green-600 font-medium">Disponibles</p>
                        <p className="text-2xl font-bold text-green-900">
                          {Math.max(0, (viewingEmpresa.max_empleados || 0) - (viewingEmpresa.cantidad_empleados || 0))}
                        </p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg w-full">
                        <p className="text-sm text-amber-600 font-medium">Ocupación</p>
                        <p className="text-2xl font-bold text-amber-900">
                          {viewingEmpresa.max_empleados && viewingEmpresa.max_empleados > 0 
                            ? Math.round(((viewingEmpresa.cantidad_empleados || 0) / viewingEmpresa.max_empleados) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Tiempo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                        <p className="text-gray-900">
                          {new Date(viewingEmpresa.creado_en).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
                        <p className="text-gray-900">
                          {new Date(viewingEmpresa.creado_en).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  
                  {/* Alertas */}
                  {(viewingEmpresa.cantidad_empleados || 0) >= (viewingEmpresa.max_empleados || 0) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <p className="text-orange-800 font-medium">Atención</p>
                      </div>
                      <p className="text-orange-700 mt-2">
                        Esta empresa ha alcanzado su límite de empleados. Considera actualizar el plan o el límite.
                      </p>
                    </div>
                  )}
                  </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={closeViewModal}>
                    Cerrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
