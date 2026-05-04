'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeftIcon, EnvelopeIcon, UserIcon, BuildingOfficeIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Eye, CheckCircle2, Check, CheckCheck, Send, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ContactoPendiente {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  asunto: string;
  mensaje: string;
  email_destino: string;
  contenido_html: string;
  estado: 'pendiente' | 'enviado' | 'error' | 'leido';
  error_message: string | null;
  creado_en: string;
  enviado_en: string | null;
  leido_en?: string | null;
  atendido_en?: string | null;
}

export default function AdminContactosPage() {
  const [contactos, setContactos] = useState<ContactoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContacto, setSelectedContacto] = useState<ContactoPendiente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'enviado' | 'error' | 'leido'>('todos');

  useEffect(() => {
    cargarContactosTotales(); // Cargar todos los datos para estadísticas
  }, []);

  useEffect(() => {
    cargarContactosFiltrados(); // Cargar datos filtrados para tabla
  }, [filtroEstado]);

  const cargarContactosTotales = async () => {
    try {
      console.log('🔍 DEBUG: Cargando contactos totales para estadísticas...');
      
      const response = await fetch('/api/admin/contactos-pendientes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error en API contactos-pendientes (totales):', errorData);
        setError('Error al cargar los contactos');
        return;
      }

      const result = await response.json();
      console.log('✅ DEBUG: Contactos totales cargados:', result.data?.length, 'contactos');
      
      setContactos(result.data || []);
      setError('');
    } catch (error) {
      console.error('Error en cargarContactosTotales:', error);
      setError('Error al cargar los contactos');
    }
  };

  const cargarContactosFiltrados = async () => {
    try {
      console.log('🔍 DEBUG: Cargando contactos filtrados...', { filtroEstado });
      
      // Construir URL con filtro si es necesario
      let url = '/api/admin/contactos-pendientes';
      if (filtroEstado !== 'todos') {
        url += `?estado=${filtroEstado}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error en API contactos-pendientes (filtrados):', errorData);
        setError('Error al cargar los contactos filtrados');
        return;
      }

      const result = await response.json();
      console.log('✅ DEBUG: Contactos filtrados cargados:', result.data?.length, 'contactos');
      
      // Solo actualizar si no es 'todos' para no sobreescribir los datos totales
      if (filtroEstado !== 'todos') {
        setContactos(result.data || []);
      }
      setError('');
    } catch (error) {
      console.error('Error en cargarContactosFiltrados:', error);
      setError('Error al cargar los contactos filtrados');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (id: string, nuevoEstado: 'enviado' | 'error' | 'pendiente' | 'leido') => {
    try {
      setError('');
      
      console.log('🔍 DEBUG: Actualizando estado vía API route...', { id, nuevoEstado });
      
      const response = await fetch('/api/admin/contactos-pendientes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          estado: nuevoEstado
        }),
      });

      console.log('🔍 DEBUG: Respuesta actualizar API:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error actualizando estado (API):', errorData);
        setError(`Error al actualizar el estado: ${errorData.error || 'Error desconocido'}`);
        return;
      }

      const result = await response.json();
      console.log('🔍 DEBUG: Resultado actualizar API:', { result });

      if (!result.success) {
        console.error('❌ Error en respuesta de API:', result);
        setError('Error al actualizar el estado: La API no confirmó la operación');
        return;
      }

      // Actualizar estado local con los datos del servidor
      setContactos(prev => prev.map(contacto => 
        contacto.id === id 
          ? result.data || { ...contacto, estado: nuevoEstado }
          : contacto
      ));

      // Refrescar los datos para asegurar sincronización
      await cargarContactosTotales();

      console.log('✅ DEBUG: Estado actualizado correctamente:', { id, nuevoEstado });
      setError('');
    } catch (error) {
      console.error('❌ Error en actualizarEstado:', error);
      setError('Error al actualizar el estado: ' + (error instanceof Error ? error.message : 'Error de conexión'));
    }
  };

  const eliminarContacto = async (id: string) => {
    // Mostrar toast de confirmación
    const toastConfirm = document.createElement('div');
    toastConfirm.className = 'fixed top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg z-50 max-w-sm';
    toastConfirm.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-yellow-800">¿Eliminar contacto?</p>
          <p class="mt-1 text-sm text-yellow-700">Esta acción no se puede deshacer.</p>
          <div class="mt-3 flex space-x-2">
            <button id="confirm-delete" class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Eliminar</button>
            <button id="cancel-delete" class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200">Cancelar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(toastConfirm);
    
    // Manejar clicks
    return new Promise<void>((resolve) => {
      const confirmBtn = toastConfirm.querySelector('#confirm-delete');
      const cancelBtn = toastConfirm.querySelector('#cancel-delete');
      
      const cleanup = () => {
        document.body.removeChild(toastConfirm);
        resolve();
      };
      
      confirmBtn?.addEventListener('click', async () => {
        cleanup();
        await performDelete(id);
      });
      
      cancelBtn?.addEventListener('click', cleanup);
      
      // Auto-cerrar después de 10 segundos
      setTimeout(cleanup, 10000);
    });
  };

  const performDelete = async (id: string) => {

    try {
      setError('');
      
      console.log('🔍 DEBUG: Eliminando contacto vía API route...', { id });
      
      const response = await fetch(`/api/admin/contactos-pendientes?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 DEBUG: Respuesta eliminar API:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error eliminando contacto (API):', errorData);
        setError(`Error al eliminar el contacto: ${errorData.error}`);
        return;
      }

      const result = await response.json();
      console.log('🔍 DEBUG: Resultado eliminar API:', { result });

      if (!result.success) {
        setError('Error al eliminar el contacto');
        return;
      }

      // Eliminar del estado local
      setContactos(prev => prev.filter(contacto => contacto.id !== id));
      setShowModal(false);
      setSelectedContacto(null);
      
      console.log('✅ DEBUG: Contacto eliminado correctamente:', { id });
      setError('');
      
      // Mostrar toast de éxito
      showToast('Contacto eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error en eliminarContacto:', error);
      setError('Error al eliminar el contacto');
      showToast('Error al eliminar contacto', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
    const textColor = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-red-800' : 'text-blue-800';
    const iconColor = type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-blue-400';
    
    toast.className = `fixed top-4 right-4 ${bgColor} border rounded-lg p-4 shadow-lg z-50 max-w-sm`;
    toast.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          ${type === 'success' 
            ? '<svg class="h-5 w-5 ' + iconColor + '" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>'
            : type === 'error'
            ? '<svg class="h-5 w-5 ' + iconColor + '" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>'
            : '<svg class="h-5 w-5 ' + iconColor + '" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>'
          }
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium ${textColor}">${message}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Pendiente
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Enviado
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Error
          </span>
        );
      case 'leido':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Leído
          </span>
        );
            default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Desconocido
          </span>
        );
    }
  };

  const contactosFiltrados = contactos.filter(contacto => 
    filtroEstado === 'todos' || contacto.estado === filtroEstado
  );

  const estadisticas = {
    total: contactos.length,
    pendientes: contactos.filter(c => c.estado === 'pendiente').length,
    leidos: contactos.filter(c => c.estado === 'leido').length,
    enviados: contactos.filter(c => c.estado === 'enviado').length,
    errores: contactos.filter(c => c.estado === 'error').length,
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between h-auto md:h-16 py-4 gap-4">
            <div className="flex items-center gap-3 w-full">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700 flex-shrink-0">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 whitespace-normal">
                Mensajes de Contacto
              </h1>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <EnvelopeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 whitespace-normal">
                Gestión de contactos pendientes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="w-full bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="w-8 h-8 text-gray-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{estadisticas.total}</p>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-semibold text-yellow-600">{estadisticas.pendientes}</p>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enviados</p>
                <p className="text-2xl font-semibold text-green-600">{estadisticas.enviados}</p>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-8 h-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Leídos</p>
                <p className="text-2xl font-semibold text-blue-600">{estadisticas.leidos}</p>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="w-8 h-8 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Errores</p>
                <p className="text-2xl font-semibold text-red-600">{estadisticas.errores}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="w-full bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900 whitespace-normal">Filtros</h2>
          </div>
          <div className="px-6 py-4">
            <div className="w-full flex flex-row overflow-x-auto gap-2 pb-2">
              <button
                onClick={() => setFiltroEstado('todos')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({estadisticas.total})
              </button>
              <button
                onClick={() => setFiltroEstado('pendiente')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filtroEstado === 'pendiente'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendientes ({estadisticas.pendientes})
              </button>
              <button
                onClick={() => setFiltroEstado('enviado')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filtroEstado === 'enviado'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Enviados ({estadisticas.enviados})
              </button>
              <button
                onClick={() => setFiltroEstado('error')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filtroEstado === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Errores ({estadisticas.errores})
              </button>
              <button
                onClick={() => setFiltroEstado('leido')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filtroEstado === 'leido'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Leídos ({estadisticas.leidos})
              </button>
                          </div>
          </div>
        </div>

        {/* Lista de Contactos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">
              Lista de Contactos ({contactosFiltrados.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Cargando contactos...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-600 text-center">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={cargarContactosTotales}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : contactosFiltrados.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 text-center">
                <EnvelopeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No hay contactos</p>
                <p className="text-sm">
                  {filtroEstado === 'todos' 
                    ? 'No hay mensajes de contacto registrados'
                    : `No hay contactos con estado "${filtroEstado}"`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asunto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contactosFiltrados.map((contacto) => (
                    <tr key={contacto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contacto.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contacto.email}
                            </div>
                            {contacto.empresa && (
                              <div className="text-xs text-gray-400 flex items-center">
                                <BuildingOfficeIcon className="w-3 h-3 mr-1" />
                                {contacto.empresa}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {contacto.asunto}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(contacto.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(contacto.creado_en).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(contacto.creado_en).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setSelectedContacto(contacto);
                              setShowModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-amber-600 text-amber-600 bg-white hover:bg-amber-50 rounded-md transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </button>
                          {contacto.estado === 'pendiente' && (
                            <>
                              <button
                                onClick={() => actualizarEstado(contacto.id, 'leido')}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-green-600 text-green-600 bg-white hover:bg-green-50 rounded-md transition-colors"
                                title="Marcar leído"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Leído
                              </button>
                              <button
                                onClick={() => actualizarEstado(contacto.id, 'enviado')}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-md transition-colors"
                                title="Marcar enviado"
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Enviado
                              </button>
                              <button
                                onClick={() => actualizarEstado(contacto.id, 'error')}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-red-600 text-red-600 bg-white hover:bg-red-50 rounded-md transition-colors"
                                title="Marcar error"
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Error
                              </button>
                            </>
                          )}
                          {contacto.estado === 'leido' && (
                            <>
                              <button
                                onClick={() => actualizarEstado(contacto.id, 'enviado')}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-md transition-colors"
                                title="Marcar enviado"
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Enviado
                              </button>
                            </>
                          )}
                                                    <button
                            onClick={() => eliminarContacto(contacto.id)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      {showModal && selectedContacto && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-20 mx-auto w-full max-w-md p-4 md:p-6 border shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalles del Contacto
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="text-sm text-gray-900 break-words">{selectedContacto.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900 break-all">{selectedContacto.email}</p>
                  </div>
                  {selectedContacto.telefono && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <p className="text-sm text-gray-900 break-words">{selectedContacto.telefono}</p>
                    </div>
                  )}
                  {selectedContacto.empresa && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Empresa</label>
                      <p className="text-sm text-gray-900 break-words">{selectedContacto.empresa}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asunto</label>
                  <p className="text-sm text-gray-900 break-words">{selectedContacto.asunto}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mensaje</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedContacto.mensaje}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <div className="mt-1">{getEstadoBadge(selectedContacto.estado)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de creación</label>
                    <p className="text-sm text-gray-900 break-words">
                      {new Date(selectedContacto.creado_en).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {selectedContacto.error_message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Error</label>
                    <div className="mt-1 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700 break-words">{selectedContacto.error_message}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  {selectedContacto.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => {
                          actualizarEstado(selectedContacto.id, 'enviado');
                          setShowModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                        title="Marcar como enviado"
                      >
                        <Send className="w-4 h-4" />
                        <span>Marcar como enviado</span>
                      </button>
                      <button
                        onClick={() => {
                          actualizarEstado(selectedContacto.id, 'error');
                          setShowModal(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                        title="Marcar como error"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Marcar como error</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      eliminarContacto(selectedContacto.id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                    title="Eliminar contacto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
