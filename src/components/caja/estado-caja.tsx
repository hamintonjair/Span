'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Caja } from '@/types/database';

// Función simulada para obtener caja abierta
async function getCajaAbierta(empresaId: string) {
  // Simulación - en producción esto vendría de la base de datos
  return {
    data: {
      id: 'caja-simulada',
      empresa_id: empresaId,
      base_inicial: 1000,
      fecha_apertura: new Date().toISOString(),
      estado: 'abierta' as const,
      creado_por: 'user-simulado',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };
}

interface EstadoCajaProps {
  empresaId: string;
}

export function EstadoCaja({ empresaId }: EstadoCajaProps) {
  const [caja, setCaja] = useState<Caja | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [baseInicial, setBaseInicial] = useState('');
  const [montoFinal, setMontoFinal] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarCaja();
  }, [empresaId]);

  const cargarCaja = async () => {
    try {
      setLoading(true);
      const resultado = await getCajaAbierta(empresaId);
      if (resultado.data) {
        setCaja(resultado.data);
      }
    } catch (error) {
      console.error('Error al cargar caja:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async () => {
    if (!baseInicial || parseFloat(baseInicial) <= 0) {
      alert('Por favor ingrese una base inicial válida');
      return;
    }

    setProcesando(true);
    try {
      // Aquí llamaríamos al servicio de abrirCaja
      // const resultado = await abrirCaja({
      //   empresa_id: empresaId,
      //   base_inicial: parseFloat(baseInicial)
      // });
      
      // Simulación por ahora
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowAperturaModal(false);
      setBaseInicial('');
      await cargarCaja();
    } catch (error) {
      console.error('Error al abrir caja:', error);
      alert('Error al abrir la caja');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!montoFinal || parseFloat(montoFinal) <= 0) {
      alert('Por favor ingrese un monto final válido');
      return;
    }

    setProcesando(true);
    try {
      // Aquí llamaríamos al servicio de cerrarCaja
      // const resultado = await cerrarCaja(caja!.id, parseFloat(montoFinal), empresaId);
      
      // Simulación por ahora
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowCierreModal(false);
      setMontoFinal('');
      await cargarCaja();
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      alert('Error al cerrar la caja');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Estado de Caja</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${caja ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-lg font-medium">
                  {caja ? 'Caja Abierta' : 'Caja Cerrada'}
                </span>
              </div>
              {caja && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Base inicial: ${caja.base_inicial.toFixed(2)}</p>
                  <p>Apertura: {new Date(caja.fecha_apertura).toLocaleTimeString('es-MX')}</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {!caja ? (
                <Button 
                  onClick={() => setShowAperturaModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Abrir Caja
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowCierreModal(true)}
                  variant="secondary"
                >
                  Cerrar Caja
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Apertura de Caja */}
      <Modal
        isOpen={showAperturaModal}
        onClose={() => setShowAperturaModal(false)}
        title="Apertura de Caja"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Base Inicial"
            type="number"
            step="0.01"
            value={baseInicial}
            onChange={(e) => setBaseInicial(e.target.value)}
            placeholder="0.00"
          />
          
          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleAbrirCaja}
              disabled={procesando}
              className="flex-1"
            >
              {procesando ? 'Procesando...' : 'Abrir Caja'}
            </Button>
            <Button
              onClick={() => setShowAperturaModal(false)}
              variant="outline"
              disabled={procesando}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Cierre de Caja */}
      <Modal
        isOpen={showCierreModal}
        onClose={() => setShowCierreModal(false)}
        title="Cierre de Caja"
        size="sm"
      >
        <div className="space-y-4">
          {caja && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Base inicial: <span className="font-medium">${caja.base_inicial.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-600">
                Hora de apertura: <span className="font-medium">{new Date(caja.fecha_apertura).toLocaleTimeString('es-MX')}</span>
              </p>
            </div>
          )}
          
          <Input
            label="Monto Final en Caja"
            type="number"
            step="0.01"
            value={montoFinal}
            onChange={(e) => setMontoFinal(e.target.value)}
            placeholder="0.00"
          />
          
          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleCerrarCaja}
              disabled={procesando}
              className="flex-1"
              variant="secondary"
            >
              {procesando ? 'Procesando...' : 'Cerrar Caja'}
            </Button>
            <Button
              onClick={() => setShowCierreModal(false)}
              variant="outline"
              disabled={procesando}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
