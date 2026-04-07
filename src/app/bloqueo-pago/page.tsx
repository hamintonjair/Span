'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

export default function BloqueoPagoPage() {
  const searchParams = useSearchParams();
  const [razon, setRazon] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  useEffect(() => {
    setRazon(searchParams.get('razon') || 'vencida');
    setFechaVencimiento(searchParams.get('fecha_vencimiento') || '');
  }, [searchParams]);

  const getMensajePorRazon = (razon: string) => {
    switch (razon) {
      case 'suspendida':
        return 'Tu suscripción ha sido suspendida temporalmente';
      case 'cancelada':
        return 'Tu suscripción ha sido cancelada';
      case 'vencida':
      default:
        return 'Tu suscripción ha vencido';
    }
  };

  const getIconoPorRazon = (razon: string) => {
    switch (razon) {
      case 'suspendida':
        return (
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'cancelada':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'vencida':
      default:
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getColorPorRazon = (razon: string) => {
    switch (razon) {
      case 'suspendida':
        return 'bg-amber-100';
      case 'cancelada':
        return 'bg-red-100';
      case 'vencida':
      default:
        return 'bg-red-100';
    }
  };

  const handleContactarSoporte = () => {
    // Aquí podrías abrir un modal de chat o redirigir a WhatsApp
    window.location.href = 'mailto:soporte@beautypro.com?subject=Suscripción Bloqueada&body=Mi suscripción está bloqueada. Necesito ayuda para renovarla.';
  };

  const handleRenovar = () => {
    // Redirigir a página de pago o facturación
    window.location.href = '/facturacion';
  };

  const handleVerFacturas = () => {
    window.location.href = '/facturacion/historial';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-0">
            <div className={`w-20 h-20 ${getColorPorRazon(razon)} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {getIconoPorRazon(razon)}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Limitado
            </h1>
            <p className="text-gray-600 mb-4">
              {getMensajePorRazon(razon)}
            </p>
            {fechaVencimiento && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">
                  <strong>Fecha de vencimiento:</strong> {new Date(fechaVencimiento).toLocaleDateString('es-MX')}
                </p>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-3">
                🔄 ¿Qué puedes hacer ahora?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 mt-1">💳</span>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Renovar Suscripción</p>
                    <p className="text-xs text-blue-600">Reactiva tu acceso inmediatamente</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 mt-1">💬</span>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Contactar Soporte</p>
                    <p className="text-xs text-blue-600">Obtén ayuda personalizada</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 mt-1">📊</span>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Ver Historial</p>
                    <p className="text-xs text-blue-600">Revisa tus facturas pasadas</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleRenovar}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium"
                size="lg"
              >
                💳 Renovar Suscripción
              </Button>
              
              <Button 
                onClick={handleContactarSoporte}
                variant="outline" 
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                size="lg"
              >
                💬 Contactar Soporte
              </Button>
              
              <Button 
                onClick={handleVerFacturas}
                variant="ghost" 
                className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                size="lg"
              >
                📊 Ver Historial de Facturas
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">📞 ¿Necesitas ayuda inmediata?</h4>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <strong>Email:</strong> soporte@beautypro.com
                </p>
                <p className="text-gray-600">
                  <strong>Teléfono:</strong> +52 1 800 123 4567
                </p>
                <p className="text-gray-600">
                  <strong>Horario:</strong> Lunes a Viernes 9:00 - 18:00
                </p>
              </div>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500 mb-2">
                BeautyPro Salon Management System
              </p>
              <p className="text-xs text-gray-400">
                © 2024 Todos los derechos reservados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
