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
  estado: 'activo' | 'suspendido';
  plan_id?: string;
  limite_empleados: number;
  plan_nombre?: string;
  plan_precio?: number;
  total_empleados?: number;
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
  limite_usuarios: number;
  limite_sucursales: number;
}

export default function EmpresasPage() {
  const { user, loading } = useJWTAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    plan_id: '',
    limite_empleados: ''
  });
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    plan_id: '',
    limite_empleados: ''
  });
  const [updating, setUpdating] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEmpresa, setViewingEmpresa] = useState<Empresa | null>(null);
  
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
  }, [user, itemOffset, searchTerm]); // Agregar dependencias de paginación y búsqueda

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
      
      // Cargar todas las empresas sin paginación por ahora
      const response = await fetch('/api/empresas');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error cargando empresas');
      }
      
      setEmpresas(data.empresas || []);
      setTotalCount(data.empresas?.length || 0); // Usar el length real como total
    } catch (error) {
      console.error('Error cargando empresas:', error);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const createEmpresa = async () => {
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
          limite_empleados: parseInt(formData.limite_empleados)
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error creando empresa');
      }
      
      // Agregar la nueva empresa a la lista
      setEmpresas(prev => [data.empresa, ...prev]);
      
      // Resetear formulario y cerrar modal
      setFormData({ nombre: '', plan_id: '', limite_empleados: '' });
      setShowModal(false);
      
      console.log('Empresa creada:', data.message);
      
    } catch (error) {
      console.error('Error creando empresa:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleEstado = async (empresaId: string, nuevoEstado: 'activo' | 'suspendido') => {
    try {
      setUpdatingId(empresaId);
      
      const response = await fetch(`/api/empresas/${empresaId}/toggle-estado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nuevoEstado }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando estado');
      }
      
      // Actualizar estado local
      setEmpresas(prev => prev.map(empresa => 
        empresa.id === empresaId 
          ? { ...empresa, estado: nuevoEstado }
          : empresa
      ));
      
      console.log('Estado actualizado:', data.message);
      
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
      plan_id: empresa.plan_id || '',
      limite_empleados: empresa.limite_empleados.toString()
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEmpresa(null);
    setEditFormData({
      nombre: '',
      plan_id: '',
      limite_empleados: ''
    });
  };

  const updateEmpresa = async () => {
    if (!editingEmpresa) return;

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
          limite_empleados: parseInt(editFormData.limite_empleados)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando empresa');
      }

      // Actualizar estado local
      setEmpresas(prev => prev.map(empresa => 
        empresa.id === editingEmpresa.id 
          ? { 
              ...empresa, 
              nombre: editFormData.nombre,
              plan_id: editFormData.plan_id,
              limite_empleados: parseInt(editFormData.limite_empleados),
              // Si cambió el plan, actualizar nombre y precio
              ...(editFormData.plan_id !== empresa.plan_id ? {
                plan_nombre: planes.find(p => p.id === editFormData.plan_id)?.nombre,
                plan_precio: planes.find(p => p.id === editFormData.plan_id)?.precio
              } : {})
            }
          : empresa
      ));

      console.log('Empresa actualizada:', data.message);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Empresas</h1>
            <p className="text-gray-600 mt-2">Administra el estado y planes de todas las empresas</p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Campo de búsqueda */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setItemOffset(0); // Resetear a primera página al buscar
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-64"
              />
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2"
            >
              <BuildingOfficeIcon className="w-4 h-4" />
              Nueva Empresa
            </Button>
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

        {/* Lista de Empresas */}
        <div className="grid gap-6">
          {currentEmpresas.map((empresa) => (
            <Card key={empresa.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <BuildingOfficeIcon className="w-6 h-6 text-amber-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{empresa.nombre}</h3>
                      <Badge 
                        variant={empresa.estado === 'activo' ? 'default' : 'destructive'}
                        className="px-2 py-1"
                      >
                        {empresa.estado === 'activo' ? 'Activo' : 'Suspendido'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {/* Plan */}
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Plan: <span className="font-medium">{empresa.plan_nombre || 'Sin plan'}</span>
                        </span>
                        {empresa.plan_precio && (
                          <span className="text-sm font-semibold text-green-600">
                            ${empresa.plan_precio}/mes
                          </span>
                        )}
                      </div>
                      
                      {/* Límite de empleados */}
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Empleados: <span className="font-medium">{empresa.total_empleados || 0}/{empresa.limite_empleados}</span>
                        </span>
                        {(empresa.total_empleados || 0) >= empresa.limite_empleados && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Límite alcanzado
                          </Badge>
                        )}
                      </div>
                      
                      {/* Fecha de creación */}
                      <div className="text-sm text-gray-600">
                        Creado: {new Date(empresa.creado_en).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => openViewModal(empresa)}
                    >
                      <EyeIcon className="w-4 h-4" />
                      
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => openEditModal(empresa)}
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      
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
              <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 mx-auto">
                <BuildingOfficeIcon className="w-4 h-4" />
                Crear Primera Empresa
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paginación - Mostrar siempre para debug */}
        {pageCount > 0 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
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
                          {plan.nombre} - ${plan.precio}/mes ({plan.limite_usuarios} usuarios)
                        </option>
                      ))}
                    </select>
                    {loadingPlanes && (
                      <p className="text-sm text-gray-500 mt-1">Cargando planes...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Límite de Empleados
                    </label>
                    <input
                      type="number"
                      value={formData.limite_empleados}
                      onChange={(e) => setFormData({ ...formData, limite_empleados: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ej: 10"
                      min="1"
                      max="100"
                    />
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
                    disabled={!formData.nombre || !formData.plan_id || !formData.limite_empleados || creating}
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

        {/* Modal de Edición */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Editar Empresa</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeEditModal}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      value={editFormData.nombre}
                      onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ej: BeautyPro Central"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan
                    </label>
                    <select
                      value={editFormData.plan_id}
                      onChange={(e) => setEditFormData({ ...editFormData, plan_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      disabled={loadingPlanes}
                    >
                      <option value="">Seleccionar plan...</option>
                      {planes.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.nombre} - ${plan.precio}/mes ({plan.limite_usuarios} usuarios)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Límite de Empleados
                    </label>
                    <input
                      type="number"
                      value={editFormData.limite_empleados}
                      onChange={(e) => setEditFormData({ ...editFormData, limite_empleados: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ej: 10"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={closeEditModal}
                    disabled={updating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={updateEmpresa}
                    disabled={updating || !editFormData.nombre.trim() || !editFormData.plan_id || !editFormData.limite_empleados}
                  >
                    {updating ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Empresa'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Vista */}
        {showViewModal && viewingEmpresa && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <p className="text-lg font-semibold text-gray-900">{viewingEmpresa.nombre}</p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                      <p className="text-lg font-medium text-gray-900">
                        {viewingEmpresa.plan_nombre || 'Sin plan'}
                      </p>
                      {viewingEmpresa.plan_precio && (
                        <p className="text-sm text-green-600 font-semibold">
                          ${viewingEmpresa.plan_precio}/mes
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Empleados</label>
                      <p className="text-lg font-medium text-gray-900">{viewingEmpresa.limite_empleados}</p>
                      <p className="text-sm text-gray-600">
                        Actual: {viewingEmpresa.total_empleados || 0} empleados
                      </p>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Empleados</p>
                        <p className="text-2xl font-bold text-blue-900">{viewingEmpresa.total_empleados || 0}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Disponibles</p>
                        <p className="text-2xl font-bold text-green-900">
                          {Math.max(0, viewingEmpresa.limite_empleados - (viewingEmpresa.total_empleados || 0))}
                        </p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <p className="text-sm text-amber-600 font-medium">Ocupación</p>
                        <p className="text-2xl font-bold text-amber-900">
                          {viewingEmpresa.limite_empleados > 0 
                            ? Math.round(((viewingEmpresa.total_empleados || 0) / viewingEmpresa.limite_empleados) * 100)
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

                  {/* Suscripciones */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Suscripciones</h3>
                    <div className="space-y-3">
                      {viewingEmpresa.suscripciones && viewingEmpresa.suscripciones.length > 0 ? (
                        viewingEmpresa.suscripciones.map((suscripcion) => (
                          <div key={suscripcion.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {suscripcion.periodo_mes && suscripcion.periodo_anio 
                                    ? `Período: ${suscripcion.periodo_mes}/${suscripcion.periodo_anio}`
                                    : `Creado: ${new Date(suscripcion.creado_en).toLocaleDateString('es-ES')}`}
                                </span>
                                <Badge 
                                  variant={suscripcion.estado_pago === 'pagado' ? 'default' : 
                                          suscripcion.estado_pago === 'vencido' ? 'destructive' : 
                                          suscripcion.estado_pago === 'procesado' ? 'outline' : 'outline'}
                                  className="px-2 py-1"
                                >
                                  {suscripcion.estado_pago === 'pagado' ? 'Pagado' : 
                                   suscripcion.estado_pago === 'vencido' ? 'Vencido' : 
                                   suscripcion.estado_pago === 'procesado' ? 'Procesado' : 'Pendiente'}
                                </Badge>
                              </div>
                              {suscripcion.proximo_vencimiento && (
                                <span className="text-sm text-gray-600">
                                  Vence: {new Date(suscripcion.proximo_vencimiento).toLocaleDateString('es-ES')}
                                </span>
                              )}
                            </div>
                            {suscripcion.comprobante_id && (
                              <p className="text-sm text-blue-600">
                                Comprobante: #{suscripcion.comprobante_id}
                              </p>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                              ID: {suscripcion.id}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No hay suscripciones registradas</p>
                      )}
                    </div>
                  </div>

                  {/* Alertas */}
                  {(viewingEmpresa.total_empleados || 0) >= viewingEmpresa.limite_empleados && (
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

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeViewModal();
                      openEditModal(viewingEmpresa);
                    }}
                  >
                    <PencilSquareIcon className="w-4 h-4 mr-2" />
                    Editar Empresa
                  </Button>
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
