'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/components/ui/toast';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PencilSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface Empleado {
  id: string;
  empresa_id: string;
  nombre_completo: string;
  email_empleado: string;
  telefono: string;
  cedula: string;
  direccion: string;
  sueldo_base: number;
  porcentaje_comision: number;
  fecha_contratacion: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

interface EmpleadoFormData {
  nombre_completo: string;
  email_empleado: string;
  telefono: string;
  cedula: string;
  direccion: string;
  sueldo_base: number;
  porcentaje_comision: number;
  fecha_contratacion: string;
  estado: 'activo' | 'inactivo'; // ✅ Agregado campo estado
}

export default function EmpleadosPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  const { showToast } = useToast();

  // Estados
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filteredEmpleados, setFilteredEmpleados] = useState<Empleado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [empleadoToDelete, setEmpleadoToDelete] = useState<string | null>(null);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [formData, setFormData] = useState<EmpleadoFormData>({
    nombre_completo: '',
    email_empleado: '',
    telefono: '',
    cedula: '',
    direccion: '',
    sueldo_base: 0,
    porcentaje_comision: 0,
    fecha_contratacion: '',
    estado: 'activo' // ✅ Agregado campo estado
  });

  // Paginación
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calcular página actual basado en offset
  useEffect(() => {
    setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1);
  }, [itemOffset, itemsPerPage]);

  // Datos para mostrar en tabla
  const endOffset = itemOffset + itemsPerPage - 1;
  const currentEmpleados = filteredEmpleados.slice(itemOffset, endOffset + 1);
  const pageCount = Math.ceil(totalCount / itemsPerPage);

  // Validación de email
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Función para eliminar empleado
  const eliminarEmpleado = async (empleadoId: string) => {
    // Mostrar modal de confirmación personalizado
    setEmpleadoToDelete(empleadoId);
    setShowDeleteModal(true);
  };

  // Función para confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!empleadoToDelete) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('id', empleadoToDelete);
        
      if (error) {
        console.error('Error eliminando empleado:', error);
        showToast('Error eliminando empleado', 'error');
        return;
      }
      
      showToast('Empleado eliminado exitosamente', 'success');
      await loadEmpleados();
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setEmpleadoToDelete(null);
    }
  };

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setShowDeleteModal(false);
    setEmpleadoToDelete(null);
  };

  // Cargar empleados
  const loadEmpleados = async () => {
    try {
      setLoading(true);
      const { data, error, count } = await supabase
        .from('empleados')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user?.empresa_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando empleados:', error);
        showToast('Error cargando empleados', 'error');
        return;
      }

      setEmpleados(data || []);
      setFilteredEmpleados(data || []);
      setTotalCount(count || 0); // Usar totalCount del servidor
      setItemOffset(0); // Resetear a primera página al cargar
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar email
    if (!validateEmail(formData.email_empleado)) {
      showToast('Por favor, ingresa un email válido', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      if (editingEmpleado) {
        // Actualizar empleado existente
        const { error } = await supabase
          .from('empleados')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEmpleado.id);
          
        if (error) {
          console.error('Error actualizando empleado:', error);
          showToast('Error actualizando empleado', 'error');
          return;
        }
        
        showToast('Empleado actualizado exitosamente', 'success');
      } else {
        // Crear nuevo empleado
        const { error } = await supabase
          .from('empleados')
          .insert({
            ...formData,
            empresa_id: user?.empresa_id,
            estado: 'activo', // ✅ Forzar el valor correcto para la constraint
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error creando empleado:', error);
          showToast('Error creando empleado', 'error');
          return;
        }
        
        showToast('Empleado creado exitosamente', 'success');
      }
      
      // Limpiar y cerrar modal
      setShowModal(false);
      setEditingEmpleado(null);
      setFormData({
        nombre_completo: '',
        email_empleado: '',
        telefono: '',
        cedula: '',
        direccion: '',
        sueldo_base: 0,
        porcentaje_comision: 0,
        fecha_contratacion: '',
        estado: 'activo' // ✅ Agregado campo estado
      });
      
      // Recargar lista
      await loadEmpleados();
      
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el cambio de inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sueldo_base' || name === 'porcentaje_comision' ? parseFloat(value) || 0 : value
    }));
  };

  // Filtrar empleados
  useEffect(() => {
    const filtered = empleados.filter(empleado =>
      empleado.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.email_empleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.cedula.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmpleados(filtered);
    setItemOffset(0); // Resetear a primera página al filtrar
  }, [empleados, searchTerm]);

  useEffect(() => {
    if (user?.empresa_id) {
      loadEmpleados();
    }
  }, [user?.empresa_id]);

  if (!user?.empresa_id) {
    return (
      <MainLayout>
        <div className="p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Restringido</h2>
            <p className="text-gray-600">No tienes una empresa asignada para gestionar empleados.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Empleados</h1>
          <p className="text-gray-600">Administra la ficha técnica de tu personal</p>
        </div>

        {/* Controles */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingEmpleado(null);
              setFormData({
                nombre_completo: '',
                email_empleado: '',
                telefono: '',
                cedula: '',
                direccion: '',
                sueldo_base: 0,
                porcentaje_comision: 0,
                fecha_contratacion: '',
                estado: 'activo' // ✅ Agregado campo estado
              });
              setShowModal(true);
            }}
            className="flex items-center"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Agregar Empleado
          </Button>
        </div>

        {/* Tabla de empleados */}
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cédula
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salario
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
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : currentEmpleados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? 'No se encontraron empleados con esos criterios' : 'No hay empleados registrados'}
                      </td>
                    </tr>
                  ) : (
                    currentEmpleados.map((empleado: Empleado) => (
                      <tr key={empleado.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{empleado.nombre_completo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{empleado.cedula || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{empleado.email_empleado}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{empleado.telefono || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${empleado.sueldo_base.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            empleado.estado === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {empleado.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingEmpleado(empleado);
                                setFormData({
                                  nombre_completo: empleado.nombre_completo,
                                  email_empleado: empleado.email_empleado,
                                  telefono: empleado.telefono,
                                  cedula: empleado.cedula,
                                  direccion: empleado.direccion,
                                  sueldo_base: empleado.sueldo_base,
                                  porcentaje_comision: empleado.porcentaje_comision,
                                  fecha_contratacion: empleado.fecha_contratacion,
                                  estado: empleado.estado as 'activo' | 'inactivo' // ✅ Agregado campo estado
                                });
                                setShowModal(true);
                              }}
                            >
                           <PencilSquareIcon className="w-4 h-4" />
                              
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => eliminarEmpleado(empleado.id)}
                              disabled={loading}
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pageCount > 0 && (
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {itemOffset + 1} a {Math.min(endOffset + 1, filteredEmpleados.length)} de {filteredEmpleados.length} resultados
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
                    onClick={() => setItemOffset(Math.min(itemOffset + itemsPerPage, totalCount - itemsPerPage))}
                    disabled={itemOffset + itemsPerPage >= totalCount}
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal para agregar/editar empleado */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
              <CardHeader>
                <CardTitle>
                  {editingEmpleado ? 'Editar Empleado' : 'Agregar Empleado'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        value={formData.nombre_completo}
                        onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email_empleado}
                        onChange={(e) => setFormData({ ...formData, email_empleado: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="empleado@ejemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cédula</label>
                      <input
                        type="text"
                        required
                        value={formData.cedula}
                        onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="123-456789-0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Dirección</label>
                      <textarea
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        rows={3}
                        placeholder="Calle, número, ciudad, país"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sueldo Base</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.sueldo_base}
                        onChange={(e) => setFormData({ ...formData, sueldo_base: parseFloat(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">Sueldo base mensual</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Porcentaje de Comisión</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.porcentaje_comision}
                        onChange={(e) => setFormData({ ...formData, porcentaje_comision: parseFloat(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">Porcentaje asignado por servicios</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Fecha de Contratación</label>
                      <input
                        type="date"
                        required
                        value={formData.fecha_contratacion}
                        onChange={(e) => setFormData({ ...formData, fecha_contratacion: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      />
                    </div>
                    {editingEmpleado && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <select
                          value={formData.estado}
                          onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'activo' | 'inactivo' })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : (editingEmpleado ? 'Actualizar' : 'Guardar')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar este empleado? Todos los datos asociados serán eliminados permanentemente.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelarEliminacion}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmarEliminacion}
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
