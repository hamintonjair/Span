'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  caracteristicas: string[];
  tiene_inventario?: boolean;
  tiene_comisiones?: boolean;
  tiene_marketing?: boolean;
  tiene_nominas?: boolean;
  tiene_analytics?: boolean;
  soporte_prioritario?: boolean;
  limite_usuarios?: number;
  limite_sucursales?: number;
  popular?: boolean;
}

interface Empresa {
  id: string;
  nombre: string;
  plan_id: string;
  estado_suscripcion: string;
  fecha_vencimiento: string;
}

export default function SuscripcionPage() {
  const router = useRouter();
  const { user, loading } = useJWTAuth();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const supabase = createClient();

  // Mapeo de nombres técnicos a nombres bonitos
  const nombresBonitos = {
    tiene_inventario: 'Gestión de Inventario',
    tiene_comisiones: 'Módulo de Comisiones',
    tiene_marketing: 'Herramientas de Marketing',
    tiene_nominas: 'Gestión de Nóminas',
    tiene_analytics: 'Analytics y Reportes',
    soporte_prioritario: 'Soporte Prioritario 24/7'
  };

  // Lista de columnas a evaluar
  const columnasBeneficios = [
    'tiene_inventario',
    'tiene_comisiones',
    'tiene_marketing',
    'tiene_nominas',
    'tiene_analytics',
    'soporte_prioritario'
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && !user.empresa_id) {
      router.push('/dashboard');
      return;
    }

    if (user && user.rol === 'admin_global') {
      router.push('/admin-dashboard');
      return;
    }

    if (user && user.empresa_id) {
      cargarDatosEmpresa();
      cargarPlanes();
    }
  }, [user, loading, router]);

  const handleSeleccionarPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const confirmarCambioPlan = async () => {
    if (!selectedPlan || !empresa) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/update-empresa-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresa.id,
          plan_id: selectedPlan.id
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Error al actualizar el plan');
      }

      await cargarDatosEmpresa();
      setShowConfirmModal(false);
      setSelectedPlan(null);
      
      setMessage({
        type: 'success',
        text: `Plan actualizado a ${selectedPlan.nombre} exitosamente`
      });
    } catch (error) {
      console.error('Error actualizando plan:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar el plan. Intente nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanDiferencias = (nuevoPlan: Plan) => {
    if (!empresa) return null;
    
    const planActual = planes.find(p => p.id === empresa.plan_id);
    if (!planActual) return null;

    return {
      precio: nuevoPlan.precio - planActual.precio,
      beneficios: {
        nuevos: columnasBeneficios.filter(columna => 
          (nuevoPlan[columna as keyof Plan] as boolean) === true && 
          (planActual[columna as keyof Plan] as boolean) !== true
        ),
        perdidos: columnasBeneficios.filter(columna => 
          (nuevoPlan[columna as keyof Plan] as boolean) !== true && 
          (planActual[columna as keyof Plan] as boolean) === true
        )
      }
    };
  };

  const getVencimientoMessage = () => {
    if (!empresa?.fecha_vencimiento) return null;
    
    const today = new Date();
    const vencimientoDate = new Date(empresa.fecha_vencimiento);
    const daysUntilVencimiento = Math.ceil((vencimientoDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilVencimiento <= 2 && daysUntilVencimiento > 0) {
      return {
        type: 'warning' as const,
        text: `⚠️ Su pago vence en ${daysUntilVencimiento} día${daysUntilVencimiento === 1 ? '' : 's'}. Recuerde subir su comprobante en el módulo de Finanzas.`
      };
    }
    
    if (daysUntilVencimiento <= 0) {
      return {
        type: 'error' as const,
        text: 'Su suscripción está vencida. Por favor, realice su pago para continuar usando el servicio.'
      };
    }
    
    return null;
  };

  const cargarDatosEmpresa = async () => {
    try {
      if (!user?.empresa_id) return;
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', user.empresa_id)
        .single();

      if (error) throw error;
      setEmpresa(data);
    } catch (error) {
      console.error('Error cargando datos de empresa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarPlanes = async () => {
    try {
      const { data, error } = await supabase
        .from('planes')
        .select('*')
        .order('precio', { ascending: true });

      if (error) throw error;
      
      console.log('Planes cargados:', data); // Debug
      setPlanes(data || []);
    } catch (error) {
      console.error('Error cargando planes:', error);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'bg-green-100 text-green-800';
      case 'vencida':
        return 'bg-red-100 text-red-800';
      case 'suspendida':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !user.empresa_id) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
            <Button onClick={() => router.push('/login')}>
              Volver al Login
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full space-y-8 px-4 py-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Suscripción</h1>
          <p className="text-gray-600">Gestiona tu plan y estado de pago</p>
        </div>

        {/* Mensajes */}
        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Mensaje de vencimiento */}
        {getVencimientoMessage() && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            getVencimientoMessage()?.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
              'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{getVencimientoMessage()?.text}</span>
          </div>
        )}

        {/* Estado Actual */}
        {empresa && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Estado Actual</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Empresa</p>
                  <p className="text-lg font-medium text-gray-900">{empresa.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estado de Suscripción</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(empresa.estado_suscripcion)}`}>
                    {empresa.estado_suscripcion}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha de Vencimiento</p>
                  <p className="text-lg font-medium text-gray-900">
                    {empresa.fecha_vencimiento ? formatearFecha(empresa.fecha_vencimiento) : 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Beneficios del Plan Actual */}
              {empresa.plan_id && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Beneficios de tu Plan Actual:</p>
                  <div className="space-y-3">
                    {(() => {
                      const planActual = planes.find(p => p.id === empresa.plan_id);
                      if (!planActual) {
                        return <p className="text-sm text-gray-500">Plan no encontrado</p>;
                      }
                      
                      return (
                        <div className="space-y-3">
                          {/* Mostrar todos los campos del plan */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Campos básicos */}
                            <div className="space-y-2">
                              <div className="flex items-center text-sm">
                                <span className="font-medium text-gray-600 mr-2">Plan:</span>
                                <span className="text-gray-900">{planActual.nombre}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <span className="font-medium text-gray-600 mr-2">Precio:</span>
                                <span className="text-gray-900">${planActual.precio}/mes</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <span className="font-medium text-gray-600 mr-2">Descripción:</span>
                                <span className="text-gray-900">{planActual.descripcion}</span>
                              </div>
                            </div>
                            
                            {/* Beneficios dinámicos */}
                            <div className="space-y-2">
                              {columnasBeneficios.map((columna) => {
                                const valor = planActual[columna as keyof Plan] as boolean;
                                return (
                                  <div key={columna} className="flex items-center text-sm">
                                    {valor === true ? (
                                      <span className="text-green-500 mr-2">✅</span>
                                    ) : (
                                      <span className="text-red-500 mr-2">❌</span>
                                    )}
                                    <span className={valor === true ? 'text-green-700 font-medium' : 'text-gray-400'}>
                                      {nombresBonitos[columna as keyof typeof nombresBonitos]}
                                    </span>
                                  </div>
                                );
                              })}
                              
                              {/* Límite de usuarios */}
                              <div className="flex items-center text-sm">
                                <span className="text-blue-500 mr-2">👥</span>
                                <span className="text-blue-700 font-medium">
                                  Límite de Usuarios: {planActual.limite_usuarios}
                                </span>
                              </div>
                              
                              {/* Límite de sucursales */}
                              <div className="flex items-center text-sm">
                                <span className="text-purple-500 mr-2">🏢</span>
                                <span className="text-purple-700 font-medium">
                                  Límite de Sucursales: {planActual.limite_sucursales}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Características adicionales si existen */}
                          {planActual.caracteristicas && Array.isArray(planActual.caracteristicas) && planActual.caracteristicas.length > 0 && (
                            <div className="border-t pt-3">
                              <p className="text-sm font-medium text-gray-600 mb-2">Características Adicionales:</p>
                              <div className="space-y-1">
                                {planActual.caracteristicas.map((caracteristica, index) => (
                                  <div key={index} className="flex items-center text-sm text-gray-600">
                                    <span className="text-green-500 mr-2">✅</span>
                                    {caracteristica}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Planes Disponibles */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Planes Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planes.map((plan) => {
              console.log('Renderizando plan:', plan); // Debug por cada plan
              return (
              <Card key={plan.id} className={plan.popular ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader>
                  {plan.popular && (
                    <div className="text-center">
                      <span className="inline-flex px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-center text-gray-900">{plan.nombre}</h3>
                  <p className="text-3xl font-bold text-center text-gray-900">
                    ${plan.precio}
                    <span className="text-lg font-medium text-gray-500">/mes</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center mb-4">{plan.descripcion}</p>
                  <ul className="space-y-3 mb-6">
                    {/* Información básica del plan */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 mr-2">Descripción:</span>
                        <span className="text-gray-700">{plan.descripcion}</span>
                      </div>
                    </div>
                    
                    {/* Beneficios dinámicos desde la base de datos */}
                    {columnasBeneficios.some(columna => plan[columna as keyof Plan] === true) && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">Beneficios:</p>
                        {columnasBeneficios.map((columna) => {
                          const valor = plan[columna as keyof Plan] as boolean;
                          if (valor === undefined || valor === null) return null;
                          
                          return (
                            <div key={columna} className="flex items-center text-sm ml-4">
                              {valor === true ? (
                                <span className="text-green-500 mr-2">✅</span>
                              ) : (
                                <span className="text-red-500 mr-2">❌</span>
                              )}
                              <span className={valor === true ? 'text-green-700 font-medium' : 'text-gray-400'}>
                                {nombresBonitos[columna as keyof typeof nombresBonitos]}
                              </span>
                            </div>
                          );
                        })}
                        
                        {/* Límite de usuarios */}
                        <div className="flex items-center text-sm ml-4">
                          <span className="text-blue-500 mr-2">👥</span>
                          <span className="text-blue-700 font-medium">
                            Límite de Usuarios: {plan.limite_usuarios}
                          </span>
                        </div>
                        
                        {/* Límite de sucursales */}
                        <div className="flex items-center text-sm ml-4">
                          <span className="text-purple-500 mr-2">🏢</span>
                          <span className="text-purple-700 font-medium">
                            Límite de Sucursales: {plan.limite_sucursales}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Características adicionales si existen */}
                    {plan.caracteristicas && Array.isArray(plan.caracteristicas) && plan.caracteristicas.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">Características Adicionales:</p>
                        {plan.caracteristicas.map((caracteristica, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600 ml-4">
                            <span className="text-green-500 mr-2">✅</span>
                            {caracteristica}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Si no hay beneficios ni características */}
                    {!columnasBeneficios.some(columna => plan[columna as keyof Plan] === true) && 
                     (!plan.caracteristicas || plan.caracteristicas.length === 0) && (
                      <div className="text-sm text-gray-500">
                        <span className="text-green-500 mr-2">✅</span>
                        Plan estándar con funcionalidades básicas
                      </div>
                    )}
                  </ul>
                  <Button
                    className="w-full"
                    variant={empresa?.plan_id === plan.id ? "outline" : "primary"}
                    disabled={empresa?.plan_id === plan.id}
                    onClick={() => handleSeleccionarPlan(plan)}
                  >
                    {empresa?.plan_id === plan.id ? 'Plan Actual' : 'Seleccionar Plan'}
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>

        {/* Información de Pagos */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Información de Pagos</h2>
            <p className="text-gray-600">
              Para subir comprobantes y ver el historial completo, visita el módulo de 
              <span className="font-medium"> Finanzas</span> en el menú lateral
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                El historial completo de pagos y comprobantes está disponible en el módulo Finanzas
              </p>
              <Button
                onClick={() => router.push('/finanzas-empresa')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ir a Finanzas
              </Button>
            </div>
          </CardContent>
        </Card>
      

        {/* Modal de Confirmación de Cambio de Plan */}
        {showConfirmModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar Cambio de Plan
              </h3>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  ¿Estás seguro que deseas cambiar tu plan?
                </p>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {selectedPlan.nombre} - ${selectedPlan.precio}/mes
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedPlan.descripcion}
                  </p>
                </div>
              </div>

              {getPlanDiferencias(selectedPlan) && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Cambios:</p>
                  
                  {getPlanDiferencias(selectedPlan)!.precio !== 0 && (
                    <p className={`text-sm ${getPlanDiferencias(selectedPlan)!.precio > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {getPlanDiferencias(selectedPlan)!.precio > 0 ? '+' : ''}
                      ${getPlanDiferencias(selectedPlan)!.precio}/mes
                    </p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Beneficios del Nuevo Plan */}
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-2">Nuevos Beneficios:</p>
                      <ul className="text-sm space-y-1">
                        {getPlanDiferencias(selectedPlan)!.beneficios.nuevos.map((columna: string, i: number) => (
                          <li key={i} className="flex items-center text-green-600">
                            <CheckCircleIcon className="w-3 h-3 mr-2" />
                            {nombresBonitos[columna as keyof typeof nombresBonitos]}
                          </li>
                        ))}
                        {selectedPlan.caracteristicas && Array.isArray(selectedPlan.caracteristicas) && selectedPlan.caracteristicas.map((carac: string, i: number) => (
                          <li key={i} className="flex items-center text-green-600">
                            <CheckCircleIcon className="w-3 h-3 mr-2" />
                            {carac}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Beneficios que se Pierden */}
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-2">Beneficios que Perderás:</p>
                      <ul className="text-sm space-y-1">
                        {getPlanDiferencias(selectedPlan)!.beneficios.perdidos.map((columna: string, i: number) => (
                          <li key={i} className="flex items-center text-red-600">
                            <XMarkIcon className="w-3 h-3 mr-2" />
                            {nombresBonitos[columna as keyof typeof nombresBonitos]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedPlan(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmarCambioPlan}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Actualizando...' : 'Confirmar Cambio'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
