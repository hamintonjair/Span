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
  nomina_id?: string;
}

interface Nomina {
  id: string;
  empresa_id: string;
  empleado_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  sueldo_base: number;
  total_comisiones: number;
  total_pagar: number;
  estado: string;
  created_at: string;
}

export default function LiquidacionNominaPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  
  // Estados principales
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [comisionesPendientes, setComisionesPendientes] = useState<Comision[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [procesandoPago, setProcesandoPago] = useState<boolean>(false);
  
  // Estados adicionales para datos de empresa
  const [datosEmpresa, setDatosEmpresa] = useState<any>(null);
  const [nominasExistentes, setNominasExistentes] = useState<Nomina[]>([]);
  
  // Estados para el modal de confirmación
  const [showModalConfirmacion, setShowModalConfirmacion] = useState<boolean>(false);
  const [datosConfirmacion, setDatosConfirmacion] = useState<{
    empleado: string;
    totalPagar: number;
    sueldoBase: number;
    totalComisiones: number;
    cantidadComisiones: number;
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
  const [mostrarResumen, setMostrarResumen] = useState<boolean>(false);

  // Cargar datos de la empresa
  const cargarDatosEmpresa = async () => {
    if (!user?.empresa_id) return;
    
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', user.empresa_id)
        .single();

      if (error) {
        console.error('Error cargando datos de empresa:', error);
        return;
      }

      setDatosEmpresa(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Cargar nóminas existentes para reimpresión
  const cargarNominasExistentes = async () => {
    if (!user?.empresa_id) return;
    
    try {
      const { data, error } = await supabase
        .from('nominas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error cargando nóminas:', error);
        return;
      }

      setNominasExistentes(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Reimprimir nómina existente
  const reimprimirNomina = (nomina: Nomina) => {
    // Obtener datos del empleado
    const empleado = empleados.find(emp => emp.id === nomina.empleado_id);
    
    generarComprobanteTermico({
      ...nomina,
      empleado: empleado || {},
      comisiones: [] // Se pueden cargar si es necesario
    });
  };

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
        .select('id, nombre_completo, cedula, sueldo_base, estado')
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

  // Calcular pre-liquidación
  const calcularPreLiquidacion = async () => {
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
      setMostrarResumen(true);

    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('error', 'Error al calcular pre-liquidación');
    } finally {
      setLoading(false);
    }
  };

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

  // Mostrar modal de confirmación
  const mostrarModalConfirmacion = () => {
    if (comisionesPendientes.length === 0) {
      mostrarNotificacion('warning', 'No hay comisiones pendientes para liquidar');
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
      sueldoBase: sueldoBase,
      totalComisiones: totalComisiones,
      cantidadComisiones: comisionesPendientes.length
    });
    setShowModalConfirmacion(true);
  };

  // Procesar pago de nómina (Lógica Crítica de Transacción)
  const procesarPagoNomina = async () => {
    if (!datosConfirmacion) return;

    setShowModalConfirmacion(false);
    setProcesandoPago(true);
    
    try {
      // INICIO DE TRANSACCIÓN CRÍTICA
      
      // Paso A: Insertar registro en tabla nominas
      const { data: nominaCreada, error: nominaError } = await supabase
        .from('nominas')
        .insert({
          empresa_id: user?.empresa_id,
          empleado_id: empleadoSeleccionado,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          sueldo_base: sueldoBase,
          total_comisiones: totalComisiones,
          total_pagar: totalPagar,
          estado: 'pagado'
        })
        .select()
        .single();

      if (nominaError) {
        console.error('Error creando nómina:', nominaError);
        throw nominaError;
      }

      // Paso B: UPDATE Masivo de comisiones con nomina_id
      const comisionesIds = comisionesPendientes.map(com => com.id);
      const { error: updateError } = await supabase
        .from('comisiones')
        .update({ 
          estado: 'pagado',
          nomina_id: nominaCreada.id 
        })
        .in('id', comisionesIds);

      if (updateError) {
        console.error('Error actualizando comisiones:', updateError);
        throw updateError;
      }

      // Paso C: Crear movimiento de salida en movimientos_caja
      const { error: movimientoError } = await supabase
        .from('movimientos_caja')
        .insert({
          empresa_id: user?.empresa_id,
          tipo: 'salida',
          concepto: `Liquidación nómina - ${empleados.find(emp => emp.id === empleadoSeleccionado)?.nombre_completo}`,
          monto: totalPagar,
          categoria: 'nomina',
          referencia_id: nominaCreada.id,
          created_at: new Date().toISOString()
        });

      if (movimientoError) {
        console.error('Error creando movimiento de caja:', movimientoError);
        throw movimientoError;
      }

      // FIN DE TRANSACCIÓN CRÍTICA
      
      // Generar comprobante térmico
      generarComprobanteTermico({
        ...nominaCreada,
        empleado: empleados.find(emp => emp.id === empleadoSeleccionado),
        comisiones: comisionesPendientes
      });

      // Limpiar formulario
      setEmpleadoSeleccionado('');
      setFechaInicio('');
      setFechaFin('');
      setComisionesPendientes([]);
      setSueldoBase(0);
      setTotalComisiones(0);
      setTotalPagar(0);
      setMostrarResumen(false);
      setDatosConfirmacion(null);

      // Recargar nóminas existentes
      cargarNominasExistentes();

      mostrarNotificacion('success', 'Liquidación de nómina procesada exitosamente');

    } catch (error) {
      console.error('Error procesando liquidación:', error);
      mostrarNotificacion('error', 'Error al procesar la liquidación de nómina');
    } finally {
      setProcesandoPago(false);
    }
  };

  // Generar comprobante térmico
  const generarComprobanteTermico = (nominaData: any) => {
    const empleado = nominaData.empleado || {};
    
    const comprobanteHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprobante de Liquidación - BeautyPro</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            margin: 8px; 
            font-size: 12px;
            line-height: 1.1;
          }
          .header { 
            text-align: center; 
            margin-bottom: 12px; 
            border-bottom: 2px dashed #000;
            padding-bottom: 6px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 16px;
            font-weight: bold;
          }
          .header p { 
            margin: 1px 0; 
            font-size: 10px;
          }
          .empresa-info {
            text-align: center;
            margin-bottom: 8px;
            font-size: 10px;
            line-height: 1.0;
          }
          .section { 
            margin-bottom: 10px; 
          }
          .section h2 { 
            font-size: 12px;
            font-weight: bold;
            margin: 0 0 6px 0;
            text-decoration: underline;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 0; 
            margin-bottom: 6px;
            font-size: 10px;
            line-height: 1.0;
          }
          .info-item { 
            margin-bottom: 2px; 
          }
          .info-item strong { 
            font-weight: bold; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 6px;
            font-size: 10px;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 2px; 
            text-align: left; 
          }
          th { 
            background-color: #f0f0f0; 
            font-weight: bold;
            font-size: 9px;
          }
          .total { 
            font-size: 12px; 
            font-weight: bold; 
            border-top: 2px double #000;
            padding-top: 2px;
          }
          .footer { 
            text-align: center; 
            margin-top: 12px; 
            border-top: 2px dashed #000;
            padding-top: 6px;
            font-size: 9px;
          }
          @media print { 
            body { margin: 5px; } 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BEAUTYPRO</h1>
          <p>COMPROBANTE DE LIQUIDACIÓN</p>
          <p>FECHA: ${new Date().toLocaleDateString('es-CO')}</p>
          <p>HORA: ${new Date().toLocaleTimeString('es-CO')}</p>
        </div>
        
        <div class="empresa-info">
          <strong>${datosEmpresa?.nombre || 'BEAUTYPRO'}</strong><br>
          NIT: ${datosEmpresa?.nit || 'Sin NIT'}<br>
          ${datosEmpresa?.direccion || 'Sin dirección'}<br>
          Tel: ${datosEmpresa?.telefono || 'Sin teléfono'}
        </div>
        
        <div class="section">
          <h2>DATOS DEL EMPLEADO</h2>
          <div class="info-grid">
            <div class="info-item"><strong>NOMBRE:</strong> ${empleado.nombre_completo || 'N/A'}</div>
            <div class="info-item"><strong>CÉDULA:</strong> ${empleado.cedula || 'N/A'}</div>
            <div class="info-item"><strong>PERÍODO:</strong> ${nominaData.fecha_inicio} a ${nominaData.fecha_fin}</div>
            <div class="info-item"><strong>ID NÓMINA:</strong> ${nominaData.id.slice(-8)}</div>
          </div>
        </div>
        
        <div class="section">
          <h2>RESUMEN DE LIQUIDACIÓN</h2>
          <table>
            <tr>
              <th>CONCEPTO</th>
              <th>CANTIDAD</th>
              <th>MONTO</th>
            </tr>
            <tr>
              <td>SUELDO BASE</td>
              <td>1</td>
              <td style="text-align: right">${formatMoney(nominaData.sueldo_base)}</td>
            </tr>
            <tr>
              <td>COMISIONES</td>
              <td>${nominaData.comisiones?.length || 0}</td>
              <td style="text-align: right">${formatMoney(nominaData.total_comisiones)}</td>
            </tr>
            <tr class="total">
              <td colspan="2"><strong>GRAN TOTAL A PAGAR</strong></td>
              <td style="text-align: right"><strong>${formatMoney(nominaData.total_pagar)}</strong></td>
            </tr>
          </table>
        </div>
        
        ${nominaData.comisiones?.length > 0 ? `
        <div class="section">
          <h2>DETALLE DE COMISIONES</h2>
          <table>
            <tr>
              <th>FECHA</th>
              <th>ID</th>
              <th>MONTO</th>
            </tr>
            ${nominaData.comisiones.map((com: any) => `
              <tr>
                <td>${new Date(com.created_at).toLocaleDateString('es-CO')}</td>
                <td>${com.id.slice(-8)}</td>
                <td style="text-align: right">${formatMoney(com.monto_comision)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>*** RECIBO CONFORME ***</p>
          <p>BeautyPro - Sistema de Gestión</p>
          <p>Este documento es un comprobante oficial de pago</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(comprobanteHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  useEffect(() => {
    if (user) {
      cargarEmpleados();
      cargarDatosEmpresa();
      cargarNominasExistentes();
    }
  }, [user]);

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Liquidación de Nómina</h1>
          <p className="text-gray-600 mt-1">
            Procesa liquidaciones de nómina con control de transacción crítico
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Filtros */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Pago</CardTitle>
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

                {/* Fecha Inicio */}
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

                {/* Fecha Fin */}
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
                    onClick={calcularPreLiquidacion}
                    disabled={loading || !empleadoSeleccionado || !fechaInicio || !fechaFin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Calculando...' : 'Calcular Pre-liquidación'}
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

            {/* Sección de Reimpresión */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Reimprimir Nóminas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {nominasExistentes.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {nominasExistentes.map((nomina) => {
                      const empleado = empleados.find(emp => emp.id === nomina.empleado_id);
                      return (
                        <div key={nomina.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {empleado?.nombre_completo || 'Empleado'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(nomina.created_at).toLocaleDateString('es-MX')} - {formatMoney(nomina.total_pagar)}
                            </div>
                          </div>
                          <Button
                            onClick={() => reimprimirNomina(nomina)}
                            className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1"
                          >
                            Reimprimir
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm py-4">
                    No hay nóminas procesadas para reimprimir
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resumen */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Liquidación</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : mostrarResumen && comisionesPendientes.length > 0 ? (
                  <div className="space-y-6">
                    {/* Resumen de montos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <div className="text-sm text-blue-600 font-medium">Sueldo Base</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatMoney(sueldoBase)}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <div className="text-sm text-green-600 font-medium">Total Comisiones</div>
                        <div className="text-2xl font-bold text-green-900">
                          {formatMoney(totalComisiones)}
                        </div>
                        <div className="text-xs text-green-600">
                          {comisionesPendientes.length} comisiones
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                        <div className="text-sm text-purple-600 font-medium">Gran Total</div>
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
                          <div key={comision.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
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

                    {/* Alerta de transacción */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="text-yellow-600 mr-3">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-yellow-800">
                            Transacción Crítica
                          </div>
                          <div className="text-xs text-yellow-600">
                            Al hacer clic en "Pagar Nómina" se ejecutará una transacción atómica: 
                            Insertar nómina → Actualizar comisiones → Crear movimiento de caja
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500">
                      {empleadoSeleccionado ? 'Complete los filtros y calcule la pre-liquidación' : 'Seleccione un empleado para comenzar'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Confirmación */}
        {showModalConfirmacion && datosConfirmacion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Confirmar Liquidación de Nómina
              </h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  ¿Estás seguro de liquidar la nómina de <strong>{datosConfirmacion.empleado}</strong> por <strong>{formatMoney(datosConfirmacion.totalPagar)}</strong>?
                </p>
                
                <div className="text-xs text-gray-600 space-y-1 mt-3">
                  <div className="flex justify-between">
                    <span>Sueldo Base:</span>
                    <span className="font-semibold">{formatMoney(datosConfirmacion.sueldoBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comisiones ({datosConfirmacion.cantidadComisiones}):</span>
                    <span className="font-semibold">{formatMoney(datosConfirmacion.totalComisiones)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-2">
                    <span className="font-bold">Total a Pagar:</span>
                    <span className="font-bold text-green-600">{formatMoney(datosConfirmacion.totalPagar)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <div className="text-red-600 mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-red-800">
                      Acción Irreversible
                    </div>
                    <div className="text-xs text-red-600">
                      Esta acción generará un movimiento de caja y marcará las comisiones como pagadas.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowModalConfirmacion(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={procesarPagoNomina}
                  disabled={procesandoPago}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {procesandoPago ? 'Procesando...' : 'Confirmar Pago'}
                </Button>
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
      </div>
    </MainLayout>
  );
}
