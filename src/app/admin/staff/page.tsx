'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { obtenerStaffAction, crearMiembroStaffAction, actualizarMiembroStaffAction, cambiarEstadoStaffAction } from '@/app/actions/admin';
import { PlusIcon, UserGroupIcon, EyeIcon, PencilSquareIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ReactPaginate from 'react-paginate';
import { useAuth } from '@/context/AuthContext';

interface StaffMember {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  empresa_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function StaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [viewingMember, setViewingMember] = useState<StaffMember | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const itemsPerPage = 10;

  // Cargar staff inicial
  useEffect(() => {
    cargarStaff();
  }, []);

  // Ocultar toast automáticamente después de 3 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const cargarStaff = async () => {
    try {
      setLoading(true);
      const result = await obtenerStaffAction();
      if (result.success && result.data) {
        setStaff(result.data);
      } else {
        console.error('Error cargando staff:', result.error);
      }
    } catch (error) {
      console.error('Error en cargarStaff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar staff
  const filteredStaff = staff.filter(member => 
    member.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const pageCount = Math.ceil(filteredStaff.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentPageItems = filteredStaff.slice(offset, offset + itemsPerPage);

  const handlePageClick = ({ selected }: any) => {
    setCurrentPage(selected);
  };

  const handleCreateMember = async (formData: FormData) => {
    try {
      if (!user?.id) {
        setToast({ message: 'Error: No se pudo identificar al administrador', type: 'error' });
        return;
      }

      if (editingMember) {
        // Modo edición
        const datos = {
          id: editingMember.id,
          nombre: formData.get('nombre') as string,
          email: formData.get('email') as string,
          rol: formData.get('rol') as 'admin_global' | 'soporte' | 'ventas',
          password: formData.get('password') as string || undefined // Opcional
        };

        const result = await actualizarMiembroStaffAction(datos, user.id);
        if (result.success) {
          setShowModal(false);
          setEditingMember(null);
          await cargarStaff(); // Recargar lista
          setToast({ message: '👤 Datos actualizados', type: 'success' });
        } else {
          setToast({ message: 'Error: ' + result.error, type: 'error' });
        }
      } else {
        // Modo creación
        const datos = {
          nombre: formData.get('nombre') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          rol: formData.get('rol') as 'admin_global' | 'soporte' | 'ventas'
        };

        const result = await crearMiembroStaffAction(datos, user.id);
        if (result.success) {
          setShowModal(false);
          setEditingMember(null);
          await cargarStaff(); // Recargar lista
          setToast({ message: '✅ Miembro del staff creado correctamente', type: 'success' });
        } else {
          setToast({ message: 'Error: ' + result.error, type: 'error' });
        }
      }
    } catch (error) {
      console.error('Error en operación:', error);
      setToast({ message: 'Error en la operación del staff', type: 'error' });
    }
  };

  const handleEditMember = (member: StaffMember) => {
    setEditingMember(member);
    setShowModal(true);
  };

  const handleViewMember = (member: StaffMember) => {
    setViewingMember(member);
    setShowViewModal(true);
  };

  const handleToggleStatus = async (id: string, nuevoEstadoActivo: boolean) => {
    try {
      if (!user?.id) {
        setToast({ message: 'Error: No se pudo identificar al administrador', type: 'error' });
        return;
      }

      const result = await cambiarEstadoStaffAction(id, nuevoEstadoActivo, user.id);
      if (result.success) {
        await cargarStaff(); // Recargar lista
        setToast({ message: nuevoEstadoActivo ? '✅ Miembro activado' : '🚫 Miembro suspendido', type: 'success' });
      } else {
        setToast({ message: 'Error: ' + result.error, type: 'error' });
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      setToast({ message: 'Error cambiando estado del miembro', type: 'error' });
    }
  };

  const getRoleBadge = (rol: string) => {
    const roleStyles = {

      soporte: 'bg-blue-100 text-blue-800',
      ventas: 'bg-green-100 text-green-800',
      admin_global: 'bg-purple-100 text-purple-800'
    };
    return roleStyles[rol as keyof typeof roleStyles] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (rol: string) => {
    const roleLabels = {
      soporte: 'Soporte Técnico',
      ventas: 'Ventas',
      admin_global: 'Administrador'
    };
    return roleLabels[rol as keyof typeof roleLabels] || rol;
  };

  return (
    <MainLayout>
      <div className="p-6 bg-[#fdfaf6] min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-amber-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Staff Técnico</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Añadir Miembro
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Tabla de Staff */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Equipo ({filteredStaff.length} miembros)</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando equipo...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPageItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No se encontraron miembros del staff
                      </td>
                    </tr>
                  ) : (
                    currentPageItems.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserGroupIcon className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{member.nombre}</div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(member.rol)}`}>
                            {getRoleLabel(member.rol)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            !member.activo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {!member.activo ? 'Suspendido' : 'Activo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewMember(member)}
                              className="flex items-center gap-1 px-3 py-1.5 border border-amber-600 text-amber-600 rounded-md hover:bg-amber-50 transition-colors text-sm font-medium"
                            >
                              <EyeIcon className="w-4 h-4" /> 
                              Ver 
                            </button>
                            <button 
                              onClick={() => handleEditMember(member)}
                              className="flex items-center gap-1 px-3 py-1.5 border border-amber-600 text-amber-600 rounded-md hover:bg-amber-50 transition-colors text-sm font-medium"
                            >
                              <PencilSquareIcon className="w-4 h-4" /> 
                              Editar 
                            </button>
                            {member.rol !== 'admin_global' && (
                              <>
                                {member.activo ? (
                                  <button 
                                    onClick={() => handleToggleStatus(member.id, false)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                                  >
                                    <NoSymbolIcon className="w-4 h-4" /> 
                                    Suspender 
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleToggleStatus(member.id, true)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" /> 
                                    Activar 
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación ReactPaginate */}
          {pageCount > 1 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex justify-center">
                <ReactPaginate
                  previousLabel={"← Anterior"}
                  nextLabel={"Siguiente →"}
                  breakLabel={"..."}
                  pageCount={pageCount}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={handlePageClick}
                  containerClassName={"flex items-center gap-2"}
                  pageClassName={"px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"}
                  pageLinkClassName={"text-gray-700 hover:text-gray-900"}
                  previousClassName={"px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"}
                  previousLinkClassName={"text-gray-700 hover:text-gray-900"}
                  nextClassName={"px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"}
                  nextLinkClassName={"text-gray-700 hover:text-gray-900"}
                  breakClassName={"px-3 py-2"}
                  breakLinkClassName={"text-gray-500"}
                  activeClassName={"bg-blue-600 border-blue-600"}
                  activeLinkClassName={"text-white"}
                  disabledClassName={"opacity-50 cursor-not-allowed"}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Nuevo/Editar Miembro */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingMember ? 'Editar Miembro' : 'Nuevo Miembro del Staff'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingMember(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form action={handleCreateMember} className="space-y-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    defaultValue={editingMember?.nombre || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    defaultValue={editingMember?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña {editingMember ? '(dejar en blanco para mantener actual)' : ''}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required={!editingMember}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder={editingMember ? '' : 'Mínimo 8 caracteres'}
                  />
                </div>

                <div>
                  <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    id="rol"
                    name="rol"
                    required
                    defaultValue={editingMember?.rol || 'soporte'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="soporte">Soporte Técnico</option>
                    <option value="ventas">Ventas</option>
                    <option value="admin_global">Administrador</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingMember(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    {editingMember ? 'Actualizar' : 'Crear'} Miembro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ver Detalles del Miembro */}
        {showViewModal && viewingMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalles del Miembro</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <p className="text-gray-900 font-medium">{viewingMember.nombre}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{viewingMember.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(viewingMember.rol)}`}>
                    {getRoleLabel(viewingMember.rol)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    !viewingMember.activo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {!viewingMember.activo ? 'Suspendido' : 'Activo'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                  <p className="text-gray-900">
                    {new Date(viewingMember.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
                  <p className="text-gray-900">
                    {new Date(viewingMember.updated_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}
    </MainLayout>
  );
}
