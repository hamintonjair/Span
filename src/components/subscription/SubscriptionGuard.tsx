'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LockClosedIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  empresaId: string;
}

interface SubscriptionStatus {
  estado_suscripcion: string;
  fecha_vencimiento: string;
  dias_restantes?: number;
  esta_expirada: boolean;
}

export default function SubscriptionGuard({ children, empresaId }: SubscriptionGuardProps) {
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [configGlobal, setConfigGlobal] = useState<any>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    fetchConfigGlobal();
  }, [empresaId]);

  const fetchConfigGlobal = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('titular')
        .single();

      if (error) {
        console.error('Error cargando configuración global:', error);
      } else {
        setConfigGlobal(data);
      }
    } catch (error) {
      console.error('Error general cargando configuración global:', error);
    }
  };

  const getNombreEmpresa = () => {
    return configGlobal?.titular;
  };

  const checkSubscriptionStatus = async () => {
    try {
      const supabase = createClient();
      
      // Obtener datos de suscripción de la empresa
      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('estado_suscripcion, fecha_vencimiento')
        .eq('id', empresaId)
        .single();

      if (error) {
        console.error('Error obteniendo estado de suscripción:', error);
        setLoading(false);
        return;
      }

      if (!empresa) {
        console.error('No se encontró la empresa');
        setLoading(false);
        return;
      }

      const empresaData = empresa as any;
      const fechaVencimiento = new Date(empresaData.fecha_vencimiento);
      const fechaActual = new Date();
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));
      // Bloquear si la fecha venció y el estado no es 'activa'
      const estaExpirada = fechaActual > fechaVencimiento && empresaData.estado_suscripcion !== 'activa';

      setSubscriptionStatus({
        estado_suscripcion: empresaData.estado_suscripcion,
        fecha_vencimiento: empresaData.fecha_vencimiento,
        dias_restantes: diasRestantes,
        esta_expirada: estaExpirada
      });

    } catch (error) {
      console.error('Error verificando suscripción:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 32 32" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="object-contain"
            >
              <circle cx="16" cy="16" r="16" fill="#1f2937"/>
              <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
              <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
              <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
              <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
            </svg>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando suscripción...</p>
        </div>
      </div>
    );
  }

  // Si la suscripción está expirada, mostrar pantalla de bloqueo
  if (subscriptionStatus?.esta_expirada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LockClosedIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
            <p className="text-gray-600">Tu periodo de prueba ha finalizado</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <ClockIcon className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Tu periodo de prueba de 15 días ha finalizado
                </h2>
                <p className="text-gray-600 mb-6">
                  Para continuar usando {getNombreEmpresa()} y gestionar tu salón, necesitas suscribirte a uno de nuestros planes.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-amber-900 mb-2">¿Qué necesitas?</h3>
                <ul className="text-amber-800 space-y-1 text-sm">
                  <li>Selecciona un plan que se ajuste a tus necesidades</li>
                  <li>Realiza el pago de forma segura</li>
                  <li>Recupera acceso inmediato a todas las funciones</li>
                </ul>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => router.push('/suscripcion')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3"
                >
                  Ver Planes de Suscripción
                </Button>
                
                <div className="text-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="text-amber-600 hover:text-amber-700 text-sm"
                  >
                    Verificar estado de pago
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              ¿Necesitas ayuda?{' '}
              <a href="/soporte" className="text-amber-600 hover:text-amber-700 font-medium">
                Contacta a soporte
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si la suscripción está activa, mostrar el contenido normalmente
  return <>{children}</>;
}
