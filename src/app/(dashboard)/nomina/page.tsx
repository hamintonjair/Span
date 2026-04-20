'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Componente Badge inline
const Badge = ({ className = '', variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }) => {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "text-foreground"
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  return React.createElement('div', { className, ...props });
};

interface Nomina {
  id: string;
  empresa_id: string;
  empleado_id: string;
  periodo_tipo: 'diario' | 'semanal' | 'quincenal' | 'mensual';
  fecha_inicio: string;
  fecha_fin: string;
  sueldo_base: number;
  total_comisiones: number;
  total_pagar: number;
  estado: 'pendiente' | 'pagado';
  created_at: string;
}

interface Empleado {
  id: string;
  nombre_completo: string;
  cedula: string;
  sueldo_base: number;
  estado: string;
}

interface Comision {
  id: string;
  empleado_id: string;
  monto_comision: number;
  estado: string;
  created_at: string;
}

export default function NominaPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  
  // Estados principales
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string>('');
  const [periodoTipo, setPeriodoTipo] = useState<'diario' | 'semanal' | 'quincenal' | 'mensual'>('semanal');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [comisionesPendientes, setComisionesPendientes] = useState<Comision[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [procesandoPago, setProcesandoPago] = useState<boolean>(false);
  
  // Estados para el modal de confirmación
  const [showModalConfirmacion, setShowModalConfirmacion] = useState<boolean>(false);
  const [datosConfirmacion, setDatosConfirmacion] = useState<{
    empleado: string;
    totalPagar: number;
    fechaInicio: string;
    fechaFin: string;
  } | null>(null);
  
  // Estados para notificaciones
  const [notificacion, setNotificacion] = useState<{
    mostrar: boolean;
    tipo: 'success' | 'error' | 'warning';
    mensaje: string;
  }>({
    mostrar: false,
    tipo: 'success',
    mensaje: ''
  });
  
  // Cálculos
  const [sueldoBase, setSueldoBase] = useState<number>(0);
  const [totalComisiones, setTotalComisiones] = useState<number>(0);
  const [totalPagar, setTotalPagar] = useState<number>(0);

  // Formateo de dinero sin decimales (solo punto de mil)
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Cargar empleados
  const cargarEmpleados = async () => {
    if (!user?.empresa_id) return;
    
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('id, nombre_completo, cedula, sueldo_base, empresa_id, estado')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .order('nombre_completo');

      if (error) {
        console.error('Error cargando empleados:', error);
        return;
      }

      setEmpleados(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Actualizar fechas según el periodo
  useEffect(() => {
    const hoy = new Date();
    let inicio: Date;
    let fin: Date;

    switch (periodoTipo) {
      case 'diario':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
        break;
      case 'semanal':
        const diaSemana = hoy.getDay();
        const diasLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diasLunes);
        fin = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quincenal':
        const dia = hoy.getDate();
        if (dia <= 15) {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fin = new Date(hoy.getFullYear(), hoy.getMonth(), 16);
        } else {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 16);
          fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
        }
        break;
      case 'mensual':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
        break;
      default:
        inicio = hoy;
        fin = hoy;
    }

    setFechaInicio(inicio.toISOString().split('T')[0]);
    setFechaFin(fin.toISOString().split('T')[0]);
  }, [periodoTipo]);

  // Función para mostrar notificaciones
  const mostrarNotificacion = (tipo: 'success' | 'error' | 'warning', mensaje: string) => {
    setNotificacion({
      mostrar: true,
      tipo,
      mensaje
    });
    
    // Auto-ocultar después de 4 segundos
    setTimeout(() => {
      setNotificacion(prev => ({ ...prev, mostrar: false }));
    }, 4000);
  };

  // Buscar comisiones pendientes
  const buscarComisiones = async () => {
    if (!empleadoSeleccionado || !fechaInicio || !fechaFin) {
      mostrarNotificacion('warning', 'Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      // Obtener datos del empleado
      const empleado = empleados.find(emp => emp.id === empleadoSeleccionado);
      if (!empleado) {
        mostrarNotificacion('error', 'Empleado no encontrado');
        return;
      }

      // Buscar comisiones pendientes en el rango de fechas
      const { data: comisiones, error } = await supabase
        .from('comisiones')
        .select('*')
        .eq('empleado_id', empleadoSeleccionado)
        .eq('estado', 'pendiente')
        .gte('created_at', new Date(fechaInicio).toISOString())
        .lte('created_at', new Date(fechaFin + 'T23:59:59').toISOString());

      if (error) {
        console.error('Error buscando comisiones:', error);
        mostrarNotificacion('error', 'Error al buscar comisiones');
        return;
      }

      setComisionesPendientes(comisiones || []);
      setSueldoBase(empleado.sueldo_base || 0);
      
      const totalComisionesCalculado = (comisiones || []).reduce((sum, com) => sum + com.monto_comision, 0);
      setTotalComisiones(totalComisionesCalculado);
      setTotalPagar((empleado.sueldo_base || 0) + totalComisionesCalculado);

    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('error', 'Error al buscar comisiones');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar modal de confirmación
  const mostrarModalConfirmacion = () => {
    if (comisionesPendientes.length === 0) {
      mostrarNotificacion('warning', 'No hay comisiones pendientes para pagar');
      return;
    }

    const empleado = empleados.find(emp => emp.id === empleadoSeleccionado);
    if (!empleado) {
      mostrarNotificacion('error', 'Empleado no encontrado');
      return;
    }

    setDatosConfirmacion({
      empleado: empleado.nombre_completo,
      totalPagar: totalPagar,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin
    });
    setShowModalConfirmacion(true);
  };

  // Pagar nómina
  const pagarNomina = async () => {
    if (!datosConfirmacion) return;

    // Validar que el empresa_id exista
    if (!user?.empresa_id) {
      console.error('Error: empresa_id no disponible');
      mostrarNotificacion('error', 'Error de autenticación: empresa_id no disponible');
      return;
    }

    setShowModalConfirmacion(false);
    setProcesandoPago(true);
    
    try {
      // Preparar IDs de comisiones
      const comisionesIds = comisionesPendientes.map(com => com.id);
      
    
      
      // 1. Llamar al endpoint API con service role key
      const response = await fetch('/api/nominas/pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: user.empresa_id,
          empleado_id: empleadoSeleccionado,
          periodo_tipo: periodoTipo,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          sueldo_base: sueldoBase,
          total_comisiones: totalComisiones,
          total_pagar: totalPagar,
          comisiones_ids: comisionesIds
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error del API:', data);
        throw new Error(data.error || 'Error procesando pago');
      }

      const nomina = data.nomina;
      const empresa = data.empresa;

      // 2. Navegar a página de impresión
      window.location.href = `/nomina/imprimir/${nomina.id}`;

      // 3. Limpiar formulario
      setEmpleadoSeleccionado('');
      setComisionesPendientes([]);
      setSueldoBase(0);
      setTotalComisiones(0);
      setTotalPagar(0);
      setDatosConfirmacion(null);

      mostrarNotificacion('success', 'Nómina pagada exitosamente');

    } catch (error) {
      console.error('Error procesando pago:', error);
      mostrarNotificacion('error', 'Error al procesar el pago de nómina');
    } finally {
      setProcesandoPago(false);
    }
  };

  
  useEffect(() => {
    if (user) {
      cargarEmpleados();
    }
  }, [user]);

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Módulo de Nómina</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los pagos de nómina agrupando comisiones por periodos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Configuración */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selector de Empleado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleado
                  </label>
                  <select
                    value={empleadoSeleccionado}
                    onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione un empleado...</option>
                    {empleados.map((empleado) => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Periodo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Periodo
                  </label>
                  <select
                    value={periodoTipo}
                    onChange={(e) => setPeriodoTipo(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>

                {/* Fechas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Botones */}
                <div className="space-y-2">
                  <Button
                    onClick={buscarComisiones}
                    disabled={loading || !empleadoSeleccionado}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Buscando...' : 'Buscar Comisiones'}
                  </Button>
                  
                  <Button
                    onClick={mostrarModalConfirmacion}
                    disabled={procesandoPago || comisionesPendientes.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {procesandoPago ? 'Procesando...' : 'Pagar Nómina'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : comisionesPendientes.length > 0 ? (
                  <div className="space-y-6">
                    {/* Resumen de montos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">Sueldo Base</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatMoney(sueldoBase)}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">Comisiones</div>
                        <div className="text-2xl font-bold text-green-900">
                          {formatMoney(totalComisiones)}
                        </div>
                        <div className="text-xs text-green-600">
                          {comisionesPendientes.length} comisiones
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 font-medium">Total a Pagar</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {formatMoney(totalPagar)}
                        </div>
                      </div>
                    </div>

                    {/* Lista de comisiones */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Comisiones Pendientes ({comisionesPendientes.length})
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {comisionesPendientes.map((comision) => (
                          <div key={comision.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Comisión #{comision.id.slice(-8)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(comision.created_at).toLocaleDateString('es-MX')}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              {formatMoney(comision.monto_comision)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500">
                      {empleadoSeleccionado ? 'No hay comisiones pendientes para este periodo' : 'Seleccione un empleado para comenzar'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación Personalizado */}
      {showModalConfirmacion && datosConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">
                Confirmar Pago de Nómina
              </h3>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    ¿Estás seguro de liquidar la nómina de <span className="font-semibold text-gray-900">{datosConfirmacion.empleado}</span>?
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Periodo:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {datosConfirmacion.fechaInicio} al {datosConfirmacion.fechaFin}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-sm font-semibold text-gray-700">Total a pagar:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatMoney(datosConfirmacion.totalPagar)}
                    </span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-600 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">Acción Irreversible</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Esta acción procesará el pago y marcará las comisiones como pagadas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowModalConfirmacion(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={pagarNomina}
                  disabled={procesandoPago}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  {procesandoPago ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  ) : (
                    'Confirmar y Pagar'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificación Toast */}
      {notificacion.mostrar && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          notificacion.tipo === 'success' ? 'bg-green-500' : 
          notificacion.tipo === 'error' ? 'bg-red-500' : 
          'bg-yellow-500'
        } text-white p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${
          notificacion.mostrar ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notificacion.tipo === 'success' && (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notificacion.tipo === 'error' && (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {notificacion.tipo === 'warning' && (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {notificacion.mensaje}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setNotificacion(prev => ({ ...prev, mostrar: false }))}
                className="inline-flex text-white hover:text-gray-200 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
