'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChevronDownIcon,
  KeyIcon,
  UserMinusIcon,
  EnvelopeIcon,
  EllipsisHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { obtenerTodosLosUsuariosAction, toggleEstadoUsuarioAction, restablecerClaveUsuarioAction, enviarEmailNotificacionAction, editarPerfilUsuarioAction, obtenerHistorialUsuarioAction } from '@/app/actions/admin';
import { enviarContraseñaTemporal } from '@/services/email.service';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import * as XLSX from 'xlsx';

// Componente Button temporal para evitar errores de importación
const SimpleButton = ({ 
  children, 
  variant = 'outline', 
  size = 'md', 
  className = '', 
  onClick,
  disabled = false 
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string; 
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 disabled:bg-amber-400 disabled:hover:bg-amber-400',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400 disabled:hover:bg-gray-400',
    outline: 'border border-amber-600 text-amber-600 hover:bg-amber-50 focus:ring-amber-500 disabled:border-gray-400 disabled:text-gray-400 disabled:hover:bg-gray-50',
    ghost: 'text-amber-600 hover:bg-amber-50 focus:ring-amber-500 disabled:text-gray-400 disabled:hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400 disabled:hover:bg-red-400'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Componente Badge Premium
const Badge = ({ children, variant = 'outline', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'outline' | 'default' | 'destructive' | 'primary' | 'secondary' | 'premium' | 'steel';
  className?: string; 
}) => {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200';
  const variantClasses = {
    outline: 'border border-white/20 text-gray-300 bg-transparent',
    default: 'bg-gray-700 text-white',
    destructive: 'bg-red-500/20 text-red-400 border border-red-500/30',
    primary: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    secondary: 'bg-purple-500/20 text-black border border-purple-500/30',
    premium: 'bg-gradient-to-r from-purple-600/20 to-purple-500/20 text-black border border-purple-400/30',
    steel: 'bg-gradient-to-r from-slate-600/20 to-emerald-600/20 text-black border border-slate-400/30'
  };
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  return <span className={classes}>{children}</span>;
};

// Componente Avatar con iniciales y gradiente
const Avatar = ({ nombre, className = '' }: { nombre: string; className?: string }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center text-white font-semibold text-sm ${className}`}>
      {getInitials(nombre)}
    </div>
  );
};

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  empresa_nombre: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const { showToast } = useToast();
  const { user: adminUser } = useAuth();
  
  // Paginación
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal de contraseña temporal
  const [modalContraseña, setModalContraseña] = useState<{ usuario: Usuario; clave: string } | null>(null);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  
  // Modal de notificación
  const [modalNotificacion, setModalNotificacion] = useState<{ usuario: Usuario } | null>(null);
  const [formDataNotificacion, setFormDataNotificacion] = useState({ asunto: '', mensaje: '' });
  const [enviandoNotificacion, setEnviandoNotificacion] = useState(false);
  
  // Modales de Editar Perfil y Ver Historial
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editFormData, setEditFormData] = useState({ nombre: '', email: '', rol: '' });
  
  // Estados para historial
  const [historial, setHistorial] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Funciones auxiliares para el timeline
  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfiguracionEvento = (tipoEvento: string) => {
    switch (tipoEvento) {
      case 'ESTADO':
        return {
          color: 'bg-green-600',
          icono: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'SEGURIDAD':
        return {
          color: 'bg-amber-600',
          icono: <KeyIcon className="w-4 h-4 text-white" />
        };
      case 'PERFIL':
        return {
          color: 'bg-blue-600',
          icono: <UserCircleIcon className="w-4 h-4 text-white" />
        };
      default:
        return {
          color: 'bg-gray-600',
          icono: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsuarios();
  }, []);

  // Actualizar página actual cuando cambia el offset
  useEffect(() => {
    setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1);
  }, [itemOffset, itemsPerPage]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      console.log('Frontend - Cargando usuarios...');
      const result = await obtenerTodosLosUsuariosAction();
      
      console.log('Frontend - Resultado del servidor:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Error cargando usuarios');
      }
      
      console.log('Frontend - Usuarios recibidos:', result.data);
      setUsuarios(result.data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios basado en el término de búsqueda
  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular paginación
  const endOffset = itemOffset + itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(filteredUsuarios.length / itemsPerPage);

  // Obtener estilo premium para el rol
  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'admin_global':
        return { variant: 'destructive' as const, label: 'Admin Global', icon: '👑' };
      case 'admin_empresa':
        return { variant: 'premium' as const, label: 'Admin Empresa', icon: '🏢' };
      case 'estilista':
        return { variant: 'steel' as const, label: 'Estilista', icon: '✂️' };
      case 'recepcionista':
        return { variant: 'steel' as const, label: 'Recepcionista', icon: '📋' };
      default:
        return { variant: 'outline' as const, label: rol, icon: '👤' };
    }
  };

  const toggleMenu = (usuarioId: string) => {
    setMenuAbierto(menuAbierto === usuarioId ? null : usuarioId);
  };

  const handleCambiarContraseña = (usuario: Usuario) => {
    console.log('Cambiar contraseña para:', usuario.email);
    setMenuAbierto(null);
    // TODO: Implementar modal de cambio de contraseña
  };

  const handleDesactivarUsuario = (usuario: Usuario) => {
    console.log('Desactivar usuario:', usuario.email);
    setMenuAbierto(null);
    // TODO: Implementar desactivación
  };

  const handleEditarPerfil = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setEditFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    });
    setIsEditModalOpen(true);
    setMenuAbierto(null);
  };

  const handleVerHistorial = async (usuario: Usuario) => {
    setSelectedUser(usuario);
    setIsLoadingHistory(true);
    setMenuAbierto(null);
    
    try {
      const result = await obtenerHistorialUsuarioAction(usuario.id);
      
      if (result.success) {
        setHistorial(result.data || []);
        setIsHistoryModalOpen(true);
      } else {
        showToast('Error al cargar historial: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      showToast('Error al cargar historial', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGuardarEdicion = async () => {
    if (!selectedUser) return;

    if (!adminUser?.id) {
      showToast('Error: No se pudo identificar al administrador', 'error');
      return;
    }

    if (!editFormData.nombre.trim() || !editFormData.rol.trim()) {
      showToast('Por favor, completa todos los campos', 'error');
      return;
    }

    try {
      const result = await editarPerfilUsuarioAction(
        selectedUser.id,
        editFormData.nombre,
        editFormData.rol,
        adminUser.id
      );

      if (result.success) {
        showToast('Usuario actualizado exitosamente', 'success');
        setIsEditModalOpen(false);
        setSelectedUser(null);
        setEditFormData({ nombre: '', email: '', rol: '' });

        // Recargar lista de usuarios para reflejar cambios
        await loadUsuarios();
      } else {
        showToast('Error al actualizar usuario: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error guardando cambios perfil:', error);
      showToast('Error al actualizar usuario', 'error');
    }
  };

  const handleEnviarNotificacion = (usuario: Usuario) => {
    setModalNotificacion({ usuario });
    setFormDataNotificacion({ asunto: '', mensaje: '' });
    setMenuAbierto(null);
  };

  const handleEnviarNotificacionSubmit = async () => {
    if (!modalNotificacion) return;

    if (!adminUser?.id) {
      showToast('Error: No se pudo identificar al administrador', 'error');
      return;
    }

    if (!formDataNotificacion.asunto.trim() || !formDataNotificacion.mensaje.trim()) {
      showToast('Por favor, completa todos los campos', 'error');
      return;
    }

    setEnviandoNotificacion(true);
    try {
      const result = await enviarEmailNotificacionAction(
        modalNotificacion.usuario.email,
        formDataNotificacion.asunto,
        formDataNotificacion.mensaje,
        adminUser.id
      );

      if (result.success) {
        showToast('Notificación enviada exitosamente', 'success');
        setModalNotificacion(null);
        setFormDataNotificacion({ asunto: '', mensaje: '' });
      } else {
        showToast('Error al enviar notificación: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error enviando notificación:', error);
      showToast('Error al enviar notificación', 'error');
    } finally {
      setEnviandoNotificacion(false);
    }
  };

  const handleCambiarEstado = async (usuario: Usuario) => {
    if (!adminUser?.id) {
      showToast('Error: No se pudo identificar al administrador', 'error');
      return;
    }

    try {
      setMenuAbierto(null);

      const result = await toggleEstadoUsuarioAction(usuario.id, usuario.activo, adminUser.id);

      if (!result.success) {
        throw new Error(result.error || 'Error actualizando estado');
      }

      // Mostrar mensaje de éxito
      showToast(`Usuario ${usuario.activo ? 'suspendido' : 'activado'} exitosamente`, 'success');

      // Recargar lista de usuarios
      await loadUsuarios();

    } catch (error) {
      console.error('Error cambiando estado:', error);
      showToast('Error al cambiar estado del usuario', 'error');
    }
  };

  const handleRestablecerContraseña = async (usuario: Usuario) => {
    if (!adminUser?.id) {
      showToast('Error: No se pudo identificar al administrador', 'error');
      return;
    }

    try {
      setMenuAbierto(null);

      const result = await restablecerClaveUsuarioAction(usuario.id, adminUser.id);

      if (!result.success) {
        throw new Error(result.error || 'Error restableciendo contraseña');
      }

      // Abrir modal con la contraseña temporal
      setModalContraseña({ usuario, clave: result.nuevaClave! });

    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      alert('Error al restablecer contraseña');
    }
  };

  const handleExportarUsuarios = () => {
    // Filtrar usuarios según el término de búsqueda
    const usuariosFiltrados = usuarios.filter(usuario =>
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (usuariosFiltrados.length === 0) {
      showToast('No hay usuarios para exportar', 'error');
      return;
    }

    // Preparamos los datos para el Excel
    const data = usuariosFiltrados.map(usuario => ({
      'Nombre': usuario.nombre,
      'Email': usuario.email,
      'Rol': usuario.rol,
      'Empresa': usuario.empresa_nombre,
      'Estado': usuario.activo ? 'Activo' : 'Inactivo'
    }));

    // Creamos la hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios del Sistema");

    // Auto-ajuste de columnas
    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 35 }, // Email
      { wch: 20 }, // Rol
      { wch: 30 }, // Empresa
      { wch: 15 }  // Estado
    ];
    ws['!cols'] = colWidths;

    // Generamos el nombre del archivo con fecha
    let filename = `usuarios_sistema_${new Date().toISOString().split('T')[0]}`;

    // Agregar información de búsqueda al nombre si existe
    if (searchTerm) {
      filename += `_busqueda_${searchTerm.replace(/\s+/g, '_')}`;
    }

    // Descargamos el archivo .xlsx
    XLSX.writeFile(wb, `${filename}.xlsx`);

    showToast(`Exportados ${usuariosFiltrados.length} usuarios a Excel`, 'success');
  };

  return (
    <MainLayout>
      <div className="w-full max-w-[100vw] px-4 md:px-6 bg-amber-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="w-full">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 whitespace-normal">Gestión de Usuarios</h1>
              <p className="text-gray-600 text-sm md:text-base whitespace-normal">Administra todos los usuarios del sistema</p>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <SimpleButton
                variant="outline"
                onClick={() => {
                  console.log('Refrescando usuarios manualmente...');
                  loadUsuarios();
                }}
                className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refrescar
              </SimpleButton>
              <SimpleButton
                variant="primary"
                onClick={handleExportarUsuarios}
                className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar
              </SimpleButton>
             
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6 w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="w-full md:flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 w-full"
                />
              </div>
            </div>
            
            {/* Estadísticas */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <Badge variant="default" className="px-4 py-2 bg-green-500/50 text-black border border-green-500/50">
                {filteredUsuarios.filter(u => u.activo).length} Activos
              </Badge>
              <Badge variant="destructive" className="px-4 py-2 bg-red-500/50 text-red-700 border border-red-500/50">
                {filteredUsuarios.filter(u => !u.activo).length} Inactivos
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
              <span className="ml-4 text-gray-400 text-lg">Cargando usuarios...</span>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-black/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Salón
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentUsuarios.map((usuario) => {
                    const rolBadge = getRolBadge(usuario.rol);
                    return (
                      <tr key={usuario.id} className="hover:bg-white/10 transition-all duration-200 border-b border-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar nombre={usuario.nombre} className="mr-3" />
                            <div>
                              <div className="text-sm font-medium text-black">{usuario.nombre}</div>
                              <div className="text-xs text-gray-500">
                                ID: {usuario.id.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-black">{usuario.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-black">{usuario.empresa_nombre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={rolBadge.variant} className="text-xs">
                            <span className="mr-1">{rolBadge.icon}</span>
                            {rolBadge.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={usuario.activo ? 'default' : 'destructive'} 
                            className={`text-xs font-semibold ${
                              usuario.activo 
                                ? 'bg-green-500/50 text-black border border-green-500/30' 
                                : 'bg-red-500/20 text-red-700 border border-red-500/30'
                            }`}
                          >
                            {usuario.activo ? '✓ Activo' : '✗ Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <button
                              onClick={() => toggleMenu(usuario.id)}
                              className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            >
                              <EllipsisHorizontalIcon className="w-5 h-5" />
                            </button>
                            
                            {menuAbierto === usuario.id && (
                              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 backdrop-blur-sm">
                                <button
                                  onClick={() => handleCambiarEstado(usuario)}
                                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 text-left border-b border-gray-100"
                                >
                                  <UserMinusIcon className="w-4 h-4 mr-3 text-orange-600" />
                                  <span>{usuario.activo ? 'Suspender Usuario' : 'Activar Usuario'}</span>
                                </button>
                                <button
                                  onClick={() => handleRestablecerContraseña(usuario)}
                                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 text-left border-b border-gray-100"
                                >
                                  <KeyIcon className="w-4 h-4 mr-3 text-amber-600" />
                                  <span>Restablecer Contraseña</span>
                                </button>
                                <button
                                  onClick={() => handleEnviarNotificacion(usuario)}
                                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 text-left border-b border-gray-100"
                                >
                                  <EnvelopeIcon className="w-4 h-4 mr-3 text-blue-600" />
                                  <span>Enviar Notificación</span>
                                </button>
                                <button
                                  onClick={() => handleVerHistorial(usuario)}
                                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 text-left border-b border-gray-100"
                                >
                                  <UserCircleIcon className="w-4 h-4 mr-3 text-gray-600" />
                                  <span>Ver Historial</span>
                                </button>
                                <button
                                  onClick={() => handleEditarPerfil(usuario)}
                                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 text-left"
                                >
                                  <UserCircleIcon className="w-4 h-4 mr-3 text-green-600" />
                                  <span>Editar Perfil</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredUsuarios.length === 0 && !loading && (
                <div className="text-center py-20 w-full">
                  <UserCircleIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg md:text-xl mb-2 whitespace-normal">No se encontraron usuarios</p>
                  <p className="text-gray-500 text-sm whitespace-normal">
                    {searchTerm ? 'Intenta con otro término de búsqueda' : 'No hay usuarios registrados en el sistema'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Paginación */}
        {filteredUsuarios.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-6 py-3 bg-white border-t border-gray-200 gap-4">
            <div className="text-sm text-gray-700">
              Mostrando {itemOffset + 1} a {Math.min(endOffset, filteredUsuarios.length)} de {filteredUsuarios.length} usuarios
            </div>
            <div className="flex items-center space-x-2">
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => setItemOffset(Math.max(0, itemOffset - itemsPerPage))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </SimpleButton>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {pageCount}
              </span>
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => setItemOffset(Math.min(itemOffset + itemsPerPage, (pageCount - 1) * itemsPerPage))}
                disabled={currentPage === pageCount}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </SimpleButton>
            </div>
          </div>
        )}

        {/* Cerrar menú al hacer clic fuera */}
        {menuAbierto && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setMenuAbierto(null)}
          />
        )}

        {/* Modal de Contraseña Temporal */}
        {modalContraseña && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Contraseña Temporal Generada
                </h3>
                <button
                  onClick={() => setModalContraseña(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  Se ha generado una nueva contraseña temporal para el usuario:
                </p>
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-sm font-mono font-bold text-gray-900 mb-1">
                    {modalContraseña.usuario.nombre}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {modalContraseña.usuario.email}
                  </p>
                  <div className="bg-white border-2 border-amber-500 rounded-md p-3">
                    <p className="text-lg font-mono font-bold text-amber-600">
                      {modalContraseña.clave}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(modalContraseña.clave);
                    alert('Contraseña copiada al portapapeles');
                  }}
                  className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  📋 Copiar Contraseña
                </button>
                
                <button
                  onClick={async () => {
                    if (!modalContraseña) return;
                    
                    setEnviandoEmail(true);
                    try {
                      const result = await enviarContraseñaTemporal(
                        modalContraseña.usuario.email,
                        modalContraseña.usuario.nombre,
                        modalContraseña.clave
                      );
                      
                      if (result.success) {
                        showToast('Contraseña enviada exitosamente por email', 'success');
                      } else {
                        showToast('Error al enviar email: ' + result.error, 'error');
                      }
                    } catch (error) {
                      console.error('Error enviando email:', error);
                      showToast('Error al enviar email', 'error');
                    } finally {
                      setEnviandoEmail(false);
                    }
                  }}
                  disabled={enviandoEmail}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviandoEmail ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      📧 Enviar por Email
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setModalContraseña(null)}
                  className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Notificación */}
        {modalNotificacion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-amber-600 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Enviar Notificación
                </h3>
                <button
                  onClick={() => {
                    setModalNotificacion(null);
                    setFormDataNotificacion({ asunto: '', mensaje: '' });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-4">
                  Enviando notificación a:
                </p>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <p className="text-sm font-medium text-white mb-1">
                    {modalNotificacion.usuario.nombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {modalNotificacion.usuario.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Asunto
                  </label>
                  <input
                    type="text"
                    value={formDataNotificacion.asunto}
                    onChange={(e) => setFormDataNotificacion(prev => ({ ...prev, asunto: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                    placeholder="Escribe el asunto de la notificación"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    value={formDataNotificacion.mensaje}
                    onChange={(e) => setFormDataNotificacion(prev => ({ ...prev, mensaje: e.target.value }))}
                    rows={6}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                    placeholder="Escribe el contenido de la notificación..."
                  />
                </div>
              </div>
              
              <div className="flex flex-col space-y-3 mt-6">
                <button
                  onClick={handleEnviarNotificacionSubmit}
                  disabled={enviandoNotificacion}
                  className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviandoNotificacion ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      📧 Enviar Notificación
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setModalNotificacion(null);
                    setFormDataNotificacion({ asunto: '', mensaje: '' });
                  }}
                  className="w-full bg-gray-700 text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Editar Perfil */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-amber-600 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Editar Perfil de Usuario
                </h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editFormData.nombre}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                    placeholder="Nombre del usuario"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    disabled
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                    placeholder="Email del usuario"
                  />
                  <p className="text-xs text-gray-500 mt-1">El email no puede ser modificado por seguridad</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rol
                  </label>
                  <select
                    value={editFormData.rol}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, rol: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  >
                    <option value="superadmin">Superadmin</option>
                    <option value="admin_empresa">Admin Empresa</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="estilista">Estilista</option>
                    <option value="soporte">Soporte</option>
                    <option value="ventas">Ventas</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3 mt-6">
                <button
                  onClick={handleGuardarEdicion}
                  className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  💾 Guardar Cambios
                </button>
                
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="w-full bg-gray-700 text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Ver Historial */}
        {isHistoryModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-amber-600 rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Historial de Actividad
                </h3>
                <button
                  onClick={() => {
                    setIsHistoryModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Información del Usuario */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{selectedUser.nombre}</h4>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">{selectedUser.empresa_nombre}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${selectedUser.activo ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {selectedUser.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timeline de Actividad */}
              <div className="space-y-4">
                <h4 className="text-white font-medium mb-4">Actividad Reciente</h4>
                
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    <span className="ml-3 text-gray-400">Cargando historial...</span>
                  </div>
                ) : historial.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400">No hay actividad reciente para este usuario.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>
                    
                    {historial.map((evento, index) => {
                      const config = getConfiguracionEvento(evento.tipo_evento);
                      return (
                        <div key={index} className="relative flex items-start space-x-4 pb-4">
                          <div className={`w-8 h-8 ${config.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                            {config.icono}
                          </div>
                          <div className="flex-1 bg-gray-800 rounded-lg p-3">
                            <p className="text-white text-sm font-medium">{evento.descripcion}</p>
                            <p className="text-gray-400 text-xs">{formatearFecha(evento.creado_en)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
