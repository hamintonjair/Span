'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ConfiguracionGlobal {
  id?: string;
  banco_nombre: string;
  banco_numero: string;
  banco_titular: string;
  banco_tipo: string;
  whatsapp_soporte: string;
  creado_en?: string;
  actualizado_en?: string;
}

export default function AdminConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionGlobal>({
    banco_nombre: '',
    banco_numero: '',
    banco_titular: '',
    banco_tipo: '',
    whatsapp_soporte: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  // Verificar rol de admin global
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // Obtener rol del usuario
        const { data: userData, error } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('auth_id', session.user.id)
          .single();

        if (error || (userData as any)?.rol !== 'admin_global') {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error verificando rol:', error);
        router.push('/dashboard');
      }
    };

    checkAdminRole();
  }, [router]);

  // Cargar configuración existente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/configuracion-global');
        const data = await response.json();

        if (data.config) {
          setConfig(data.config);
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
        setMessage({
          type: 'error',
          text: 'Error al cargar configuración existente'
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleInputChange = (field: keyof ConfiguracionGlobal, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!config.banco_nombre || !config.banco_numero || !config.banco_titular) {
      setMessage({
        type: 'error',
        text: 'Los campos de banco, número de cuenta y titular son obligatorios'
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/configuracion-global', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Configuración guardada exitosamente'
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error al guardar configuración'
        });
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar configuración'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración Global</h1>
          <p className="text-gray-600 mt-2">
            Administra los datos de pago que verán los clientes
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Datos Bancarios</h2>
            <p className="text-sm text-gray-600">
              Configura la información bancaria que los clientes verán al realizar pagos
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="banco_nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Banco *
                </label>
                <input
                  id="banco_nombre"
                  type="text"
                  value={config.banco_nombre}
                  onChange={(e) => handleInputChange('banco_nombre', e.target.value)}
                  placeholder="Ej: Banco Nacional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="banco_tipo" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cuenta
                </label>
                <input
                  id="banco_tipo"
                  type="text"
                  value={config.banco_tipo}
                  onChange={(e) => handleInputChange('banco_tipo', e.target.value)}
                  placeholder="Ej: Cuenta Corriente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="banco_numero" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Cuenta *
                </label>
                <input
                  id="banco_numero"
                  type="text"
                  value={config.banco_numero}
                  onChange={(e) => handleInputChange('banco_numero', e.target.value)}
                  placeholder="Ej: 1234-5678-9012"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="banco_titular" className="block text-sm font-medium text-gray-700 mb-2">
                  Titular de la Cuenta *
                </label>
                <input
                  id="banco_titular"
                  type="text"
                  value={config.banco_titular}
                  onChange={(e) => handleInputChange('banco_titular', e.target.value)}
                  placeholder="Ej: Mi Empresa S.A."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="whatsapp_soporte" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp de Soporte
                </label>
                <input
                  id="whatsapp_soporte"
                  type="text"
                  value={config.whatsapp_soporte}
                  onChange={(e) => handleInputChange('whatsapp_soporte', e.target.value)}
                  placeholder="Ej: +593 987 654 321"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-white shadow-sm rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Importante</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Los campos marcados con * son obligatorios.</p>
            <p>• Estos datos serán visibles para todos los clientes al momento de realizar pagos.</p>
            <p>• Solo los administradores globales pueden modificar esta configuración.</p>
            <p>• Los cambios se reflejarán inmediatamente en el modal de pago de los clientes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
