'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { createClient } from '@/lib/supabase-client';
import { actualizarMensajeGlobalAction } from '@/app/actions/admin';

interface ConfiguracionGlobal {
  id: string;
  mensaje_global: string;
  iva_porcentaje: number;
  creado_en: string;
  actualizado_en: string;
}

export default function ComunicacionPage() {
  const router = useRouter();
  const { user } = useJWTAuth();
  const [configuracion, setConfiguracion] = useState<ConfiguracionGlobal | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Verificar si el usuario es admin_global
    if (user && user.rol !== 'admin_global') {
      router.push('/dashboard');
      return;
    }
    
    if (user && user.rol === 'admin_global') {
      cargarConfiguracion();
    }
  }, [user, router]);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando configuración:', error);
        return;
      }

      if (data) {
        setConfiguracion(data);
        setMensaje(data?.mensaje_global || '');
      } else {
        // Crear configuración por defecto si no existe
        await crearConfiguracionPorDefecto();
      }
    } catch (error) {
      console.error('Error en cargarConfiguracion:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearConfiguracionPorDefecto = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_global')
        .insert({
          mensaje_global: '',
          iva_porcentaje: 16
        })
        .select()
        .single();

      if (error) throw error;

      setConfiguracion(data);
      setMensaje('');
    } catch (error) {
      console.error('Error creando configuración por defecto:', error);
    }
  };

  const guardarMensaje = async () => {
    if (!user?.id) {
      console.error('Error: No se pudo identificar al administrador');
      return;
    }

    setGuardando(true);
    try {
      const result = await actualizarMensajeGlobalAction(mensaje, user.id);

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar el mensaje global');
      }

      // Mostrar toast de éxito
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      toast.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 00-2 0v2a1 1 0 002 0v-2a1 1 0 00-2 0zm0 4a1 1 0 102 0v2a1 1 0 102 0v-2a1 1 0 00-2 0z" clip-rule="evenodd"></path>
        </svg>
        <span>✅ Mensaje global actualizado</span>
      `;
      document.body.appendChild(toast);

      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);

      await cargarConfiguracion();

    } catch (error) {
      console.error('Error guardando mensaje:', error);

      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      toast.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 00-2 0v2a1 1 0 002 0v-2a1 1 0 00-2 0zm0 4a1 1 0 102 0v2a1 1 0 102 0v-2a1 1 0 00-2 0z" clip-rule="evenodd"></path>
        </svg>
        <span>Error al guardar mensaje</span>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 5000);
    } finally {
      setGuardando(false);
    }
  };

  const limpiarMensaje = async () => {
    if (!configuracion) return;

    setGuardando(true);
    try {
      const { error } = await supabase
        .from('configuracion_global')
        .update({
          mensaje_global: null,
          actualizado_en: new Date().toISOString()
        })
        .eq('id', configuracion.id);

      if (error) throw error;

      setMensaje('');
      
      // Mostrar toast de éxito
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      toast.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 00-2 0v2a1 1 0 002 0v-2a1 1 0 00-2 0zm0 4a1 1 0 102 0v2a1 1 0 102 0v-2a1 1 0 00-2 0z" clip-rule="evenodd"></path>
        </svg>
        <span>✅ Mensaje global eliminado</span>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);

      await cargarConfiguracion();
      
    } catch (error) {
      console.error('Error limpiando mensaje:', error);
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      toast.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 00-2 0v2a1 1 0 002 0v-2a1 1 0 00-2 0zm0 4a1 1 0 102 0v2a1 1 0 102 0v-2a1 1 0 00-2 0z" clip-rule="evenodd"></path>
        </svg>
        <span>Error al eliminar mensaje</span>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 5000);
    } finally {
      setGuardando(false);
    }
  };

  // Verificar autenticación y rol
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (user.rol !== 'admin_global') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[100vw] px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 whitespace-normal">📢 Comunicación</h1>
          <p className="text-gray-600 text-sm md:text-base whitespace-normal">Gestión de mensajes globales para todas las empresas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Formulario de mensaje */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 whitespace-normal">Mensaje Global</h2>
              <p className="text-gray-600 text-sm whitespace-normal">
                Este mensaje se mostrará a todas las empresas en sus dashboards
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando configuración...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje para todas las empresas
                    </label>
                    <textarea
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Escribe aquí el mensaje que se mostrará a todas las empresas..."
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={guardarMensaje}
                      disabled={guardando}
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                    >
                      {guardando ? 'Guardando...' : '💾 Guardar Mensaje'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={limpiarMensaje}
                      disabled={guardando}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                    >
                      🗑️ Limpiar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vista previa */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 whitespace-normal">Vista Previa</h2>
              <p className="text-gray-600 text-sm whitespace-normal">
                Así verán las empresas el mensaje en su dashboard
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📢</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1">Comunicado Importante</h3>
                    {mensaje ? (
                      <p className="text-amber-800 whitespace-pre-wrap">{mensaje}</p>
                    ) : (
                      <p className="text-amber-600 italic">No hay mensaje global activo</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Configuración actual */}
              {configuracion && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Configuración Actual</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>IVA:</strong> {configuracion.iva_porcentaje}%</p>
                    <p><strong>Última actualización:</strong> {new Date(configuracion.actualizado_en).toLocaleDateString()}</p>
                    <p><strong>Estado del mensaje:</strong> {mensaje ? 'Activo' : 'Sin mensaje'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Impacto del Mensaje</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                  <p className="text-sm text-gray-600">Empresas activas</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">👥</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                  <p className="text-sm text-gray-600">Usuarios que verán el mensaje</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{mensaje ? 'Activo' : 'Inactivo'}</p>
                  <p className="text-sm text-gray-600">Estado del mensaje global</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
