'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-client';
import { registrarLog } from '@/lib/audit';
import { verificarLimite } from '@/lib/subscriptions';
import { actualizarClaveEmpleadoAction } from '@/app/actions/empresa';
import { 
  UserIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  EyeIcon,
  PencilSquareIcon,
  StopIcon,
  PlayIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Sistema de notificaciones simple
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="flex-shrink-0">
        ${type === 'success' ? '<CheckCircleIcon class="w-5 h-5" />' :
          type === 'error' ? '<XMarkIcon class="w-5 h-5" />' :
          '<MagnifyingGlassIcon class="w-5 h-5" />'}
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium">${message}</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animación de entrada
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Auto-eliminar después de 3 segundos
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
};
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

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin_empresa' | 'recepcionista' | 'estilista';
  activo: boolean;
  empresa_id: string;
  created_at?: string;
  ultimo_acceso?: string;
}

interface Empresa {
  id: string;
  nombre: string;
  plan_id: string;
  total_empleados?: number;
}

interface Plan {
  id: string;
  nombre: string;
  max_usuarios: number;
}

export default function UsuariosPage() {
  const { user, loading } = useJWTAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [loadingPlanes, setLoadingPlanes] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFilter, setRolFilter] = useState<string>('todos');
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  const [limiteInfo, setLimiteInfo] = useState<any>(null);
  
  // Paginación
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calcular página actual basado en offset
  useEffect(() => {
    setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1);
  }, [itemOffset, itemsPerPage]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'recepcionista' as 'admin_empresa' | 'recepcionista' | 'estilista',
    password: ''
  });

  const supabase = createClient();

// Refrescar esquema para asegurar que reconozca la tabla usuarios_sistema
useEffect(() => {
  // Forzar recarga de la página si hay errores de tabla no encontrada
  const handleTableError = (error: any) => {
    if (error?.code === 'PGRST204' || error?.message?.includes('relation "usuarios" does not exist')) {
      window.location.reload();
    }
  };
  
  // Agregar listener global para errores de Supabase
  window.addEventListener('unhandledrejection', (event) => {
    handleTableError(event.reason);
  });
}, []);

  useEffect(() => {
    if (user && user.empresa_id) {
      loadEmpresa();
      loadUsuarios();
      loadPlanes();
    }
  }, [user, itemOffset, searchTerm, rolFilter]); // Agregar dependencias de paginación y filtros

  const loadEmpresa = async () => {
    if (!user?.empresa_id) return;
    
    try {
      setLoadingEmpresa(true);
      
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          *,
          planes(nombre, max_usuarios)
        `)
        .eq('id', user.empresa_id)
        .single();

      if (error) throw error;

      setEmpresa(data);
    } catch (error) {
      console.error('Error cargando empresa:', error);
    } finally {
      setLoadingEmpresa(false);
    }
  };

  const loadPlanes = async () => {
    try {
      setLoadingPlanes(true);
      
      const { data, error } = await supabase
        .from('planes')
        .select('*')
        .order('precio', { ascending: true });

      if (error) throw error;
      
      setPlanes(data || []);
    } catch (error) {
      console.error('Error cargando planes:', error);
    } finally {
      setLoadingPlanes(false);
    }
  };

  const loadUsuarios = async () => {
    if (!user?.empresa_id) return;
    
    try {
      setLoadingUsuarios(true);
      
      let query = supabase
        .from('usuarios_sistema')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.empresa_id);

      // Aplicar filtros
      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (rolFilter !== 'todos') {
        query = query.eq('rol', rolFilter);
      }

      // Paginación
      const from = itemOffset;
      const to = itemOffset + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setUsuarios(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const createUsuario = async () => {
    if (!empresa) return;

    try {
      setCreating(true);
      
      // Verificar límite de usuarios
      const usuariosActivos = usuarios.filter(u => u.activo === true).length;
      const planActual = planes.find(p => p.id === empresa.plan_id);
      
      if (planActual && usuariosActivos >= planActual.max_usuarios) {
        showNotification(`Has alcanzado el límite de ${planActual.max_usuarios} usuarios para tu plan ${planActual.nombre}.`, 'error');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre: formData.nombre,
            rol: formData.rol,
            empresa_id: user?.empresa_id
          }
        }
      });

      if (error) throw error;

      // Crear registro en tabla usuarios_sistema
      const { error: insertError } = await supabase
        .from('usuarios_sistema')
        .insert({
          id: data.user?.id,
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          empresa_id: user?.empresa_id,
          activo: true // Por defecto activo: true
        });

      if (insertError) throw insertError;

      // Registrar log de auditoría
      await registrarLog(supabase, {
        empresa_id: user?.empresa_id || undefined,
        usuario_id: user?.id,
        accion: 'CREAR_USUARIO',
        modulo: 'USUARIOS',
        detalles: {
          usuario_creado_id: data.user?.id,
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          empresa_id: user?.empresa_id,
          creado_por: user?.id,
          fecha_creacion: new Date().toISOString()
        }
      });

      // Resetear formulario y cerrar modal
      setFormData({ nombre: '', email: '', rol: 'recepcionista', password: '' });
      setShowModal(false);
      
      // Limpiar filtros y resetear paginación para asegurar que el nuevo usuario aparezca
      setSearchTerm('');
      setRolFilter('todos');
      setItemOffset(0);
      
      // Recargar usuarios
      await loadUsuarios();
      
      showNotification('Usuario creado exitosamente', 'success');
    } catch (error) {
      console.error('Error creando usuario:', error);
      showNotification('Error al crear usuario: ' + (error as Error).message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const toggleEstado = async (usuarioId: string, nuevoEstado: boolean) => {
    try {
      // Encontrar el usuario para verificar si es admin_empresa
      const usuario = usuarios.find(u => u.id === usuarioId);
      
      if (usuario && usuario.rol === 'admin_empresa') {
        showNotification('No se puede suspender a un administrador de empresa', 'error');
        return;
      }
      
      setUpdatingId(usuarioId);
      
      // Usar el cliente estándar con service role key para bypass de triggers
      const adminClient = createClient();
      
      // Sobrescribir las credenciales para usar service role
      (adminClient as any).supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      (adminClient as any).supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { error } = await adminClient
        .from('usuarios_sistema')
        .update({ 
          activo: nuevoEstado
        })
        .eq('id', usuarioId);

      if (error) {
        console.error('Error con admin client:', error);
        showNotification('Error al actualizar estado', 'error');
        return;
      }

      // Registrar log de auditoría
      await registrarLog(createClient(), {
        empresa_id: user?.empresa_id || undefined,
        usuario_id: user?.id,
        accion: 'ACTUALIZAR_USUARIO',
        modulo: 'USUARIOS',
        detalles: {
          usuario_id: usuarioId,
          nombre: usuario?.nombre,
          email: usuario?.email,
          rol: usuario?.rol,
          cambio_estado: true,
          estado_nuevo: nuevoEstado,
          estado_anterior: !nuevoEstado,
          modificado_por: user?.id,
          fecha_modificacion: new Date().toISOString()
        }
      });

      await loadUsuarios();
      showNotification(
        nuevoEstado ? 'Usuario activado exitosamente' : 'Usuario suspendido exitosamente',
        'success'
      );
    } catch (error) {
      console.error('Error cambiando estado:', error);
      showNotification('Error al cambiar estado del usuario', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const openViewModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowViewModal(true);
  };

  const openEditModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      password: ''
    });
    setShowEditModal(true);
  };

  const updateUsuario = async () => {
    if (!selectedUsuario) return;

    try {
      setCreating(true);
      
      const updateData: any = {
        nombre: formData.nombre,
        rol: formData.rol,
        updated_at: new Date().toISOString() // Forzar actualización del timestamp
      };

      // Verificar si el email cambió y si ya existe
      if (formData.email !== selectedUsuario.email) {
        const { data: emailExistente } = await supabase
          .from('usuarios_sistema')
          .select('email')
          .eq('email', formData.email)
          .neq('id', selectedUsuario.id) // Excluir el usuario actual
          .single();

        if (emailExistente) {
          showNotification('El email ya está en uso por otro usuario', 'error');
          setCreating(false);
          return;
        }

        // Actualizar email en Supabase Auth
        const { error: authError } = await supabase.auth.admin.updateUserById(
          selectedUsuario.id,
          { email: formData.email }
        );
        
        if (authError) {
          showNotification('Error al actualizar email en el sistema de autenticación', 'error');
          setCreating(false);
          return;
        }

        updateData.email = formData.email;
      }

      // Solo actualizar contraseña si se proporciona una nueva
      if (formData.password) {
        const result = await actualizarClaveEmpleadoAction(
          selectedUsuario.id,
          formData.password
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Error al actualizar contraseña');
        }
      }

      const { error } = await supabase
        .from('usuarios_sistema')
        .update(updateData)
        .eq('id', selectedUsuario.id)
        .select(); // Forzar que devuelva el registro actualizado

      if (error) throw error;

      // Registrar log de auditoría
      await registrarLog(supabase, {
        empresa_id: user?.empresa_id || undefined,
        usuario_id: user?.id,
        accion: 'ACTUALIZAR_USUARIO',
        modulo: 'USUARIOS',
        detalles: {
          usuario_id: selectedUsuario.id,
          nombre_anterior: selectedUsuario.nombre,
          nombre_nuevo: formData.nombre,
          email_anterior: selectedUsuario.email,
          email_nuevo: formData.email,
          rol_anterior: selectedUsuario.rol,
          rol_nuevo: formData.rol,
          cambio_password: !!formData.password,
          actualizado_por: user?.id,
          fecha_actualizacion: new Date().toISOString()
        }
      });

      // Resetear formulario y cerrar modal
      setFormData({ nombre: '', email: '', rol: 'recepcionista', password: '' });
      setShowEditModal(false);
      setSelectedUsuario(null);
      
      // Recargar usuarios
      await loadUsuarios();
      
      showNotification('Usuario actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      showNotification('Error al actualizar usuario: ' + (error as Error).message, 'error');
    } finally {
      setCreating(false);
    }
  };

  // Verificar si el usuario puede ser suspendido
  const puedeSerSuspendido = (usuario: Usuario) => {
    // No suspender administradores
    const esProtegido = usuario.rol === 'admin_empresa';
      
    return !esProtegido;
  };

  // Filtrar usuarios según búsqueda y rol
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = !searchTerm || 
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRol = rolFilter === 'todos' || usuario.rol === rolFilter;
    return matchesSearch && matchesRol;
  });

  // Datos para mostrar en tabla
  const endOffset = itemOffset + itemsPerPage - 1;
  const currentUsuarios = filteredUsuarios.slice(itemOffset, endOffset + 1);
  const pageCount = Math.ceil(totalCount / itemsPerPage);

  // Verificar límite de usuarios usando el helper
  const verificarLimiteUsuarios = async () => {
    if (!user?.empresa_id) return false;
    
    try {
      const resultado = await verificarLimite(user.empresa_id, 'usuarios');
      setLimiteInfo(resultado);
      
      if (resultado.alcanzado) {
        setLimiteAlcanzado(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando límite:', error);
      return false;
    }
  };

  const handleCrearUsuario = async () => {
    const puedeCrear = await verificarLimiteUsuarios();
    if (puedeCrear) {
      setShowModal(true);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !user.empresa_id) {
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
            <h1 className="text-3xl font-bold text-gray-900">Usuarios de la Empresa</h1>
            <p className="text-gray-600 mt-2">Gestiona el staff y accesos de tu empresa</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCrearUsuario}
              className="flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              Nuevo Usuario
            </Button>
            <Badge variant="outline" className="px-3 py-2">
              {usuarios.length} usuarios totales
            </Badge>
            <Badge variant="outline" className="px-3 py-2 bg-green-50 text-green-700">
              {usuarios.filter(u => u.activo === true).length} activos
            </Badge>
            <Badge variant="outline" className="px-3 py-2 bg-red-50 text-red-700">
              {usuarios.filter(u => u.activo === false).length} inactivos
            </Badge>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setItemOffset(0); // Resetear a primera página al buscar
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={rolFilter}
                  onChange={(e) => {
                    setRolFilter(e.target.value);
                    setItemOffset(0); // Resetear a primera página al filtrar
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="todos">Todos los roles</option>
                  <option value="admin_empresa">Admin Empresa</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="estilista">Estilista</option>
                </select>
              </div>
              <Button
                variant="outline"
                onClick={loadUsuarios}
                className="flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuarios */}
        <div className="grid gap-6">
          {currentUsuarios.map((usuario) => (
            <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{usuario.nombre}</h3>
                        <p className="text-sm text-gray-600">{usuario.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <ShieldCheckIcon className="w-4 h-4" />
                        <span className="capitalize">{usuario.rol.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={usuario.activo ? 'default' : 'destructive'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <div>
                        Creado: {usuario.created_at ? new Date(usuario.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => openViewModal(usuario)}
                    >
                      <EyeIcon className="w-4 h-4" />
                      
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => openEditModal(usuario)}
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      
                    </Button>
                    
                    <Button
                      variant={usuario.activo ? 'danger' : 'primary'}
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => toggleEstado(usuario.id, !usuario.activo)}
                      disabled={updatingId === usuario.id || !puedeSerSuspendido(usuario)}
                    >
                      {updatingId === usuario.id ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : usuario.activo ? (
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

        {currentUsuarios.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || rolFilter !== 'todos' 
                  ? 'Intenta ajustar los filtros de búsqueda.' 
                  : 'Los usuarios aparecerán aquí cuando los agregues al sistema.'}
              </p>
              {!searchTerm && rolFilter === 'todos' && (
                <Button onClick={handleCrearUsuario}>
                  <UserIcon className="w-4 h-4 mr-2" />
                  Crear Primer Usuario
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Paginación */}
        {pageCount > 0 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Mostrando {itemOffset + 1} a {Math.min(endOffset + 1, filteredUsuarios.length)} de {filteredUsuarios.length} resultados
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

        {/* Modal Nuevo Usuario */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Nuevo Usuario</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  <XMarkIcon className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="ejemplo@correo.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Asegúrese de que el nuevo email sea válido para el acceso al sistema
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                     <option value="admin_empresa">Admin Empresa</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="estilista">Estilista</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Temporal
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={createUsuario}
                    disabled={creating || !formData.nombre || !formData.email || !formData.password}
                    className="flex-1"
                  >
                    {creating ? 'Creando...' : 'Crear Usuario'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Ver Usuario */}
        {showViewModal && selectedUsuario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Detalles del Usuario</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViewModal(false)}
                >
                  <XMarkIcon className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="w-8 h-8 text-amber-600" />
                  </div>
                  <h4 className="text-lg font-semibold">{selectedUsuario.nombre}</h4>
                  <p className="text-gray-600">{selectedUsuario.email}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rol:</span>
                    <span className="font-medium capitalize">{selectedUsuario.rol.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <Badge variant={selectedUsuario.activo ? 'default' : 'destructive'}>
                      {selectedUsuario.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creado:</span>
                    <span className="font-medium">{selectedUsuario.created_at ? new Date(selectedUsuario.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  {selectedUsuario.ultimo_acceso && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Último acceso:</span>
                      <span className="font-medium">{new Date(selectedUsuario.ultimo_acceso).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <Button
                    onClick={() => setShowViewModal(false)}
                    className="w-full"
                  >
                    Cerrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Editar Usuario */}
        {showEditModal && selectedUsuario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Editar Usuario</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  <XMarkIcon className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="ejemplo@correo.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Asegúrese de que el nuevo email sea válido para el acceso al sistema
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="admin_empresa">Admin Empresa</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="estilista">Estilista</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Dejar en blanco para no cambiar"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={updateUsuario}
                    disabled={creating || !formData.nombre}
                    className="flex-1"
                  >
                    {creating ? 'Actualizando...' : 'Actualizar Usuario'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Límite Alcanzado */}
        {limiteAlcanzado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XMarkIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Límite Alcanzado</h3>
                <p className="text-gray-600 mt-2">
                  Has llegado al límite de tu plan actual
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {limiteInfo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Plan actual:</span>
                      <span className="font-semibold">{limiteInfo.plan_nombre}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Usuarios activos:</span>
                      <span className="font-semibold">{limiteInfo.actual}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Límite del plan:</span>
                      <span className="font-semibold text-red-600">{limiteInfo.limite}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setLimiteAlcanzado(false)}
                    className="flex-1"
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/suscripcion'}
                    className="flex-1"
                  >
                    Ver Planes
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
