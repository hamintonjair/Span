'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LockClosedIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  max_usuarios: number;
  max_empleados: number;
  descripcion: string;
}

export default function SuscripcionExpiradaPage() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [configGlobal, setConfigGlobal] = useState<any>(null);

  useEffect(() => {
    cargarPlanes();
    fetchConfigGlobal();
  }, []);

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

  const getIniciales = () => {
    const nombre = getNombreEmpresa();
    return nombre.substring(0, 2).toUpperCase();
  };

  const cargarPlanes = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('planes')
        .select('*')
        .order('precio', { ascending: true });

      if (error) {
        console.error('Error cargando planes:', error);
        return;
      }

      setPlanes(data as Plan[] || []);
    } catch (error) {
      console.error('Error:', error);
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
          <p className="text-gray-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">{getIniciales()}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{getNombreEmpresa()}</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="border-amber-600 text-amber-600 hover:bg-amber-50"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <LockClosedIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tu periodo de prueba de 15 días ha finalizado
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Para continuar gestionando tu salón con {getNombreEmpresa()}, selecciona uno de nuestros planes y recupera el acceso completo a todas las funciones.
          </p>
        </div>

        {/* Plans Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {planes.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.nombre === 'Pro' ? 'ring-2 ring-amber-600' : ''}`}>
              {plan.nombre === 'Pro' && (
                <div className="absolute top-0 right-0 bg-amber-600 text-white px-3 py-1 rounded-bl-lg text-sm font-medium">
                  RECOMENDADO
                </div>
              )}
              
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.nombre}</h3>
                  <div className="text-4xl font-bold text-amber-600 mb-4">
                    ${plan.precio}
                    <span className="text-lg text-gray-500 font-normal">/mes</span>
                  </div>
                  <p className="text-gray-600">{plan.descripcion}</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">
                      <strong>{plan.max_usuarios}</strong> usuarios
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">
                      <strong>{plan.max_empleados}</strong> empleados
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Gestión completa de citas</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Control de inventario</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Reportes y analytics</span>
                  </div>
                  {plan.nombre === 'Pro' && (
                    <>
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">Soporte prioritario</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">Integraciones avanzadas</span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={() => router.push('/suscripcion')}
                  className={`w-full py-3 font-semibold ${
                    plan.nombre === 'Pro'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.nombre === 'Pro' ? 'Seleccionar Plan Pro' : 'Seleccionar Plan Básico'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            ¿Qué obtienes?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gestión Eficiente</h3>
              <p className="text-gray-600 text-sm">
                Organiza citas, clientes y empleados en una plataforma intuitiva
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Control Total</h3>
              <p className="text-gray-600 text-sm">
                Administra inventario, finanzas y reportes en tiempo real
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Crecimiento Asegurado</h3>
              <p className="text-gray-600 text-sm">
                Herramientas de marketing y fidelización de clientes
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Button
            onClick={() => router.push('/suscripcion')}
            size="lg"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-4 text-lg"
          >
            Ver Planes de Suscripción
          </Button>
          <p className="text-gray-600 mt-4">
            ¿Necesitas ayuda?{' '}
            <a href="/soporte" className="text-amber-600 hover:text-amber-700 font-medium">
              Contacta a nuestro equipo de soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
