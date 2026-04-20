'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ImprimirReporteCajaPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const cajaId = params.id as string;
  
  const [caja, setCaja] = useState<any>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [ingresos, setIngresos] = useState<any>(null);
  const [vendedorNombre, setVendedorNombre] = useState<string>('N/A');
  const [loading, setLoading] = useState(true);

  // Formateador de dinero para Colombia
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    if (user?.empresa_id && cajaId) {
      cargarDatosReporte();
    }
  }, [user?.empresa_id, cajaId]);

  const cargarDatosReporte = async () => {
    try {
      setLoading(true);
      
      // Cargar datos de la caja
      const { data: cajaData, error: cajaError } = await (supabase as any)
        .from('cajas')
        .select('*')
        .eq('id', cajaId)
        .eq('empresa_id', user?.empresa_id)
        .single();

      if (cajaError) {
        console.error('Error cargando caja:', cajaError);
        setLoading(false);
        return;
      }

      setCaja(cajaData);

      // Cargar nombre del vendedor
      let vendedorNombre = 'N/A';
      if (cajaData.vendedor_id) {
        const { data: vendedorData } = await (supabase as any)
          .from('empleados')
          .select('nombre')
          .eq('id', cajaData.vendedor_id)
          .maybeSingle();
        
        vendedorNombre = vendedorData?.nombre || 'N/A';
      }

      // Guardar nombre del vendedor en el estado
      setVendedorNombre(vendedorNombre);

      // Cargar ventas del turno
      const { data: ventasData, error: ventasError } = await (supabase as any)
        .from('ventas')
        .select('*, clientes(nombre), detalles_ventas(*, productos(nombre), servicios(nombre))')
        .eq('empresa_id', user?.empresa_id)
        .gte('created_at', cajaData.fecha_apertura)
        .lte('created_at', cajaData.fecha_cierre)
        .order('created_at');

      if (ventasError) {
        console.error('Error cargando ventas:', ventasError);
      } else {
        setVentas(ventasData || []);
      }

      // Cargar citas del turno con nombres de clientes (sin servicios)
      const { data: citasData, error: citasError } = await (supabase as any)
        .from('citas')
        .select('*')
        .eq('empresa_id', user?.empresa_id)
        .gte('fecha', cajaData.fecha_apertura)
        .lte('fecha', cajaData.fecha_cierre)
        .in('estado', ['atendido', 'finalizado', 'completada'])
        .order('fecha');

      if (citasError) {
        console.error('Error cargando citas:', citasError);
      } else {
        // Obtener todos los IDs únicos de clientes
        const clienteIds = Array.from(new Set((citasData || []).map((c: any) => c.cliente_id).filter(Boolean)));

        // Cargar todos los clientes en una sola consulta
        const clientesData = clienteIds.length > 0 
          ? await (supabase as any).from('clientes').select('id, nombre').in('id', clienteIds)
          : { data: [] };

        // Crear mapa para búsqueda rápida de clientes
        const clientesMap = (clientesData.data || []).reduce((acc: any, cliente: any) => {
          acc[cliente.id] = cliente.nombre;
          return acc;
        }, {});

        // Crear mapa de ventas por cita_id para obtener valores correctos
        const ventasPorCita = (ventasData || [])
          .filter((v: any) => v.cita_id)
          .reduce((acc: any, venta: any) => {
            acc[venta.cita_id] = venta.total;
            return acc;
          }, {});

        // Enriquecer citas usando los mapas
        const citasEnriquecidas = (citasData || []).map((cita: any) => ({
          ...cita,
          cliente_nombre: clientesMap[cita.cliente_id] || 'Cliente sin nombre',
          valor_total: ventasPorCita[cita.id] || cita.valor_total || 0
        }));

        setCitas(citasEnriquecidas);
      }

      // Calcular ingresos
      const ventasPOS = ventasData?.filter((v: any) => !v.cita_id) || [];
      const ventasCitas = ventasData?.filter((v: any) => v.cita_id) || [];
      
      const ingresosPOS = ventasPOS.reduce((sum: number, v: any) => sum + (v.total || 0), 0);
      const ingresosCitas = ventasCitas.reduce((sum: number, v: any) => sum + (v.total || 0), 0);
      const ingresosCitasDirectas = citasData?.reduce((sum: number, c: any) => sum + (c.valor_total || 0), 0) || 0;

      setIngresos({
        ingresosPOS,
        ingresosCitas,
        ingresosCitasDirectas,
        totalGeneral: ingresosPOS + ingresosCitas
      });

    } catch (error) {
      console.error('Error cargando datos del reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para imprimir
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (!caja) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">No se encontró la caja</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            .print-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .shadow-lg {
              box-shadow: none !important;
            }
            .border-gray-200 {
              border: 1px solid #e5e7eb !important;
            }
            .p-8 {
              padding: 1rem !important;
            }
            .mb-8 {
              margin-bottom: 1rem !important;
            }
            .mb-4 {
              margin-bottom: 0.5rem !important;
            }
            table {
              page-break-inside: avoid;
            }
            tr {
              page-break-inside: avoid;
            }
          }
        `
      }} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header - Oculto al imprimir */}
        <div className="bg-white shadow-sm border-b mb-6 no-print">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => window.close()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Cerrar
              </button>
              <h1 className="text-xl font-bold text-gray-900">Reporte de Caja</h1>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* Contenido del Reporte - Visible al imprimir */}
        <div className="max-w-4xl mx-auto px-4 py-6 print-container">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            {/* Encabezado */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reporte de Caja</h2>
              <div className="text-gray-600">
                <p><strong>ID:</strong> #{caja.id?.slice(-8) || 'N/A'}</p>
                <p><strong>Vendedor:</strong> {vendedorNombre}</p>
                <p><strong>Período:</strong></p>
                <p>{new Date(caja.fecha_apertura).toLocaleString('es-CO')}</p>
                <p>hasta</p>
                <p>{new Date(caja.fecha_cierre).toLocaleString('es-CO')}</p>
              </div>
            </div>

          {/* Resumen Financiero */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Monto Apertura</p>
                <p className="text-xl font-bold text-blue-800">{formatMoney(caja.monto_apertura || 0)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Ventas POS</p>
                <p className="text-xl font-bold text-green-800">{formatMoney(ingresos?.ingresosPOS || 0)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Ventas Citas</p>
                <p className="text-xl font-bold text-purple-800">{formatMoney(ingresos?.ingresosCitas || 0)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-600 font-medium">Total Ingresos</p>
                <p className="text-xl font-bold text-yellow-800">{formatMoney(ingresos?.totalGeneral || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 font-medium">Monto Cierre</p>
                <p className="text-xl font-bold text-gray-800">{formatMoney(caja.monto_cierre || 0)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 font-medium">Monto Esperado</p>
                <p className="text-xl font-bold text-gray-800">{formatMoney(caja.monto_esperado || 0)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 font-medium">Balance</p>
                <p className="text-xl font-bold text-red-800">
                  {formatMoney((caja.monto_cierre || 0) - (caja.monto_esperado || 0))}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-600 font-medium">Citas Atendidas</p>
                <p className="text-xl font-bold text-indigo-800">{citas.length}</p>
              </div>
            </div>
          </div>

          {/* Detalles de Ventas */}
          {ventas.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas del Período</h3>
              <div className="space-y-6">
                {ventas.map((venta) => (
                  <div key={venta.id} className="border border-gray-200 rounded-lg p-4">
                    {/* Encabezado de la venta */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Cliente: {venta.clientes?.nombre || 'Cliente sin nombre'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(venta.created_at).toLocaleString('es-CO')} | 
                          {venta.metodo_pago || 'No especificado'}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                          venta.cita_id 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {venta.cita_id ? 'Cita' : 'POS'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatMoney(venta.total || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Detalles de productos y servicios */}
                    {venta.detalles_ventas && venta.detalles_ventas.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-700 mb-2">Productos:</h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio Unitario</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(venta.detalles_ventas as any[]).map((detalle: any, index: number) => (
                                <tr key={`detalle-${index}`}>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {detalle.productos?.nombre || detalle.servicios?.nombre || 'Item sin nombre'}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    {detalle.cantidad || 0}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                    {formatMoney(detalle.precio_unitario || 0)}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                    {formatMoney(detalle.subtotal || 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detalles de Citas */}
          {citas.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Citas Atendidas</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {citas.map((cita) => (
                      <tr key={cita.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {new Date(cita.fecha).toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {cita.cliente_nombre || 'Cliente sin nombre'}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                          {formatMoney(cita.valor_total || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pie de página */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p>Reporte generado el {new Date().toLocaleString('es-CO')}</p>
              <p>Sistema de Gestión de Caja</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
