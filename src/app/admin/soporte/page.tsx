'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { 
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { obtenerMensajesTicketAction, enviarMensajeTicketAction, actualizarEstadoTicketAction, obtenerStaffTecnicoAction, actualizarAsignacionTicketAction } from '@/app/actions/soporte';

interface TicketSoporte {
  id: string;
  asunto: string;
  descripcion: string;
  estado: 'abierto' | 'en_progreso' | 'resuelto';
  prioridad: 'alta' | 'media' | 'baja';
  empresa_id: string;
  usuario_creador_id: string;
  asignado_a?: string | null;
  creado_en: string;
  actualizado_en: string;
  empresas?: {
    id: string;
    nombre: string;
  };
  creador?: {
    id: string;
    nombre: string;
  };
  asignado?: {
    id: string;
    nombre: string;
  };
}

interface MensajeTicket {
  id: string;
  mensaje: string;
  es_staff: boolean;
  creado_en: string;
  autor?: {
    nombre: string;
  };
}

interface StaffTecnico {
  id: string;
  nombre: string;
  rol: string;
}

export default function SoportePage() {
  const { user, loading: userLoading } = useJWTAuth();
  const [tickets, setTickets] = useState<TicketSoporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState('');
  
  // Estados para el modal de detalle
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketSoporte | null>(null);
  const [mensajes, setMensajes] = useState<MensajeTicket[]>([]);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [staffTecnico, setStaffTecnico] = useState<StaffTecnico[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const itemsPerPage = 10;

  // Ocultar toast automáticamente después de 3 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Establecer información del usuario y pestaña por defecto cuando el usuario esté disponible
  useEffect(() => {
    if (user && !userLoading) {
      // Establecer pestaña por defecto según el rol
      if (user.rol === 'admin_global') {
        setActiveTab('por-asignar');
      } else if (user.rol === 'soporte') {
        setActiveTab('mis-tickets');
      } else {
        setActiveTab('todos'); // Fallback para otros roles
      }
    }
  }, [user, userLoading]);

  // Cargar tickets de soporte cuando el usuario y la pestaña estén disponibles
  useEffect(() => {
    if (activeTab && user && !userLoading) {
      cargarTickets();
    }
  }, [activeTab, user, userLoading]);

  // Sincronización en tiempo real para mensajes del ticket
  useEffect(() => {
    if (!selectedTicket?.id) return;

    const supabase = createClient();
    const canal = supabase
      .channel(`ticket-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensajes_ticket', 
          filter: `ticket_id=eq.${selectedTicket.id}` 
        },
        async (payload) => {
          console.log('🔔 Nuevo mensaje realtime detectado, recargando...', payload);
          // Volvemos a llamar al Server Action para traer toda la lista fresca con los nombres (JOIN)
          const respuesta = await obtenerMensajesTicketAction(selectedTicket.id);
          if (respuesta.success && respuesta.data) {
            setMensajes(respuesta.data); // Actualizamos el estado de React con la lista completa y fresca
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [selectedTicket?.id]);

  const cargarTickets = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      let query = supabase
        .from('tickets_soporte')
        .select(`
          id,
          asunto,
          descripcion,
          estado,
          prioridad,
          empresa_id,
          usuario_creador_id,
          asignado_a,
          creado_en,
          actualizado_en,
          empresas (
            id,
            nombre
          ),
          creador:usuarios_sistema!tickets_soporte_usuario_creador_id_fkey (
            id,
            nombre
          ),
          asignado:usuarios_sistema!tickets_soporte_asignado_a_fkey (
            id,
            nombre
          )
        `);

      // Aplicar filtros según el rol y la pestaña activa
      if (user?.rol === 'admin_global') {
        switch (activeTab) {
          case 'por-asignar':
            query = query.is('asignado_a', null).neq('estado', 'resuelto');
            break;
          case 'asignados':
            query = query.not('asignado_a', 'is', null).neq('estado', 'resuelto');
            break;
          case 'resueltos':
            query = query.eq('estado', 'resuelto');
            break;
        }
      } else if (user?.rol === 'soporte') {
        switch (activeTab) {
          case 'mis-tickets':
            query = query.eq('asignado_a', user.id).neq('estado', 'resuelto');
            break;
          case 'historial':
            query = query.eq('asignado_a', user.id).eq('estado', 'resuelto');
            break;
        }
      }

      const { data, error } = await query.order('creado_en', { ascending: false });

      if (error) {
        console.error('Error cargando tickets:', error);
        setToast({ message: 'Error cargando tickets de soporte', type: 'error' });
      } else {
        setTickets(data || []);
        console.log(`🎫 Tickets cargados para ${user?.rol} - ${activeTab}:`, data?.length || 0);
      }
    } catch (error) {
      console.error('Error en cargarTickets:', error);
      setToast({ message: 'Error inesperado al cargar tickets', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => 
    ticket.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.empresas?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.creador?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.asignado?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const pageCount = Math.ceil(filteredTickets.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentPageItems = filteredTickets.slice(offset, offset + itemsPerPage);

  const handlePageClick = ({ selected }: any) => {
    setCurrentPage(selected);
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resuelto':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el icono del estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'en_progreso':
        return <ClockIcon className="w-4 h-4" />;
      case 'resuelto':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  // Funciones para manejar el modal de detalle
  const handleVerTicket = async (ticket: TicketSoporte) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
    await cargarMensajes(ticket.id);
    await cargarStaffTecnico();
  };

  const cargarMensajes = async (ticketId: string) => {
    try {
      setLoadingMensajes(true);
      const result = await obtenerMensajesTicketAction(ticketId);
      
      if (result.success) {
        setMensajes(result.data || []);
      } else {
        console.error('Error cargando mensajes:', result.error);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoadingMensajes(false);
    }
  };

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !selectedTicket || !user?.id) return;

    try {
      setEnviandoMensaje(true);
      
      // Para admin, es_staff = true
      const result = await enviarMensajeTicketAction(
        selectedTicket.id,
        nuevoMensaje.trim(),
        user.id,
        true
      );

      if (result.success && result.data) {
        // Actualización reactiva inmediata
        setMensajes(prev => [...prev, result.data]);
        setNuevoMensaje('');
        setToast({ message: 'Mensaje enviado exitosamente', type: 'success' });
        
        // Opcional: Hacer scroll hacia abajo del chat
        setTimeout(() => {
          const chatContainer = document.getElementById('chat-messages-container');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 100);
      } else {
        setToast({ message: result.error || 'Error al enviar mensaje', type: 'error' });
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setToast({ message: 'Error inesperado al enviar mensaje', type: 'error' });
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!selectedTicket) return;

    try {
      const result = await actualizarEstadoTicketAction(selectedTicket.id, nuevoEstado);
      
      if (result.success) {
        setSelectedTicket({ ...selectedTicket, estado: nuevoEstado as any });
        setToast({ message: 'Estado actualizado correctamente', type: 'success' });
      } else {
        setToast({ message: result.error || 'Error al actualizar estado', type: 'error' });
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      setToast({ message: 'Error inesperado al cambiar estado', type: 'error' });
    }
  };

  const cargarStaffTecnico = async () => {
    try {
      setLoadingStaff(true);
      const result = await obtenerStaffTecnicoAction();
      
      if (result.success) {
        setStaffTecnico(result.data || []);
      } else {
        console.error('Error cargando staff técnico:', result.error);
      }
    } catch (error) {
      console.error('Error cargando staff técnico:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleCambiarAsignacion = async (asignadoA: string | null) => {
    if (!selectedTicket) return;

    try {
      const result = await actualizarAsignacionTicketAction(selectedTicket.id, asignadoA);
      
      if (result.success) {
        setSelectedTicket({ ...selectedTicket, asignado_a: asignadoA });
        setToast({ message: 'Ticket asignado correctamente', type: 'success' });
      } else {
        setToast({ message: result.error || 'Error al asignar ticket', type: 'error' });
      }
    } catch (error) {
      console.error('Error cambiando asignación:', error);
      setToast({ message: 'Error inesperado al asignar ticket', type: 'error' });
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener el color de prioridad
  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'media':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'baja':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  
  
  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Soporte Técnico</h1>
          <p className="text-gray-600 mt-1">Gestiona los tickets de soporte de los clientes</p>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Buscador */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por asunto, empresa o creador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Pestañas de navegación */}
        {user && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {user.rol === 'admin_global' ? (
                  <>
                    <button
                      onClick={() => setActiveTab('por-asignar')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'por-asignar'
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Por Asignar
                    </button>
                    <button
                      onClick={() => setActiveTab('asignados')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'asignados'
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Asignados
                    </button>
                    <button
                      onClick={() => setActiveTab('resueltos')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'resueltos'
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Resueltos
                    </button>
                  </>
                ) : user.rol === 'soporte' ? (
                  <>
                    <button
                      onClick={() => setActiveTab('mis-tickets')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'mis-tickets'
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Mis Tickets
                    </button>
                    <button
                      onClick={() => setActiveTab('historial')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'historial'
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Historial
                    </button>
                  </>
                ) : null}
              </nav>
            </div>
          </div>
        )}

        {/* Contenedor principal */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-gray-500">Cargando tickets...</div>
            </div>
          ) : (
            <>
              {/* Tabla de tickets */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asunto / Problema
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de creación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPageItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          {searchTerm ? 'No se encontraron tickets que coincidan con la búsqueda' : 'No hay tickets de soporte registrados'}
                        </td>
                      </tr>
                    ) : (
                      currentPageItems.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {ticket.asunto}
                            </div>
                            {ticket.descripcion && (
                              <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                                {ticket.descripcion}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {ticket.empresas?.nombre || 'Empresa no asignada'}
                            </div>
                            {ticket.creador?.nombre && (
                              <div className="text-xs text-gray-500 mt-1">
                                Por: {ticket.creador.nombre}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoColor(ticket.estado)}`}>
                              {getEstadoIcon(ticket.estado)}
                              <span className="ml-1">
                                {ticket.estado === 'abierto' ? 'Abierto' : 
                                 ticket.estado === 'en_progreso' ? 'En Progreso' : 
                                 'Resuelto'}
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPrioridadColor(ticket.prioridad)}`}>
                              {ticket.prioridad.charAt(0).toUpperCase() + ticket.prioridad.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatearFecha(ticket.creado_en)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleVerTicket(ticket)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-1" />
                              Ver Ticket
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {pageCount > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))}
                        disabled={currentPage === pageCount - 1}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{offset + 1}</span> a{' '}
                          <span className="font-medium">
                            {Math.min(offset + itemsPerPage, filteredTickets.length)}
                          </span>{' '}
                          de <span className="font-medium">{filteredTickets.length}</span> resultados
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Anterior
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))}
                            disabled={currentPage === pageCount - 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Siguiente
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Detalle del Ticket */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header del Modal */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalle del Ticket: {selectedTicket.asunto}
                </h2>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(selectedTicket.estado)}`}>
                    {getEstadoIcon(selectedTicket.estado)}
                    <span className="ml-1">
                      {selectedTicket.estado === 'abierto' ? 'Abierto' : 
                       selectedTicket.estado === 'en_progreso' ? 'En Progreso' : 
                       'Resuelto'}
                    </span>
                  </span>
                  
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPrioridadColor(selectedTicket.prioridad)}`}>
                    {selectedTicket.prioridad.charAt(0).toUpperCase() + selectedTicket.prioridad.slice(1)}
                  </span>
                  
                  <div className="text-sm text-gray-600">
                    Empresa: <span className="font-medium">{selectedTicket.empresas?.nombre || 'N/A'}</span>
                  </div>
                </div>
                
                {/* Selectores de Estado y Asignación (solo para admin) */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Estado:</label>
                    <select
                      value={selectedTicket.estado}
                      onChange={(e) => handleCambiarEstado(e.target.value)}
                      disabled={loadingStaff || selectedTicket.estado === 'resuelto'}
                      className="text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="abierto">Abierto</option>
                      <option value="en_progreso">En Progreso</option>
                      <option value="resuelto">Resuelto</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Asignar a:</label>
                    <select
                      value={selectedTicket.asignado_a || ''}
                      onChange={(e) => handleCambiarAsignacion(e.target.value || null)}
                      disabled={loadingStaff || selectedTicket.estado === 'resuelto'}
                      className="text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 min-w-[150px]"
                    >
                      <option value="">Sin asignar</option>
                      {staffTecnico.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sección Izquierda - Información del Ticket */}
              <div className="w-1/3 border-r border-gray-200 p-6 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Ticket</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedTicket.descripcion}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Creado por</label>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedTicket.creador?.nombre || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha de Creación</label>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatearFecha(selectedTicket.creado_en)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Última Actualización</label>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatearFecha(selectedTicket.actualizado_en)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección Derecha - Chat/Historial */}
              <div className="flex-1 flex flex-col">
                <div id="chat-messages-container" className="flex-1 overflow-y-auto p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Conversación</h3>
                  
                  {loadingMensajes ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-gray-500">Cargando mensajes...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mensajes.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No hay mensajes aún
                        </div>
                      ) : (
                        mensajes.map((mensaje) => (
                          <div
                            key={mensaje.id}
                            className={`flex ${mensaje.es_staff ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                mensaje.es_staff
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <div className="text-xs opacity-75 mb-1">
                                {mensaje.autor?.nombre || 'Usuario'} • {formatearFecha(mensaje.creado_en)}
                              </div>
                              <div className="text-sm">
                                {mensaje.mensaje}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Caja de Respuesta */}
                {selectedTicket?.estado === 'resuelto' ? (
                  <div className="p-4 bg-gray-100 text-gray-500 text-center text-sm rounded-b-lg border-t border-gray-200">
                    <LockClosedIcon className="w-4 h-4 inline-block mr-2" />
                    Este ticket ha sido resuelto y está cerrado para nuevos mensajes.
                  </div>
                ) : (
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex space-x-3">
                      <textarea
                        value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="flex-1 border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 resize-none"
                        rows={3}
                      />
                      <div className="flex flex-col justify-end">
                        <button
                          onClick={handleEnviarMensaje}
                          disabled={!nuevoMensaje.trim() || enviandoMensaje}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {enviandoMensaje ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <PaperAirplaneIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
