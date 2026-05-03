'use server';

import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

/**
 * Envía reporte de cierre de caja por correo electrónico
 */
export async function enviarReporteCierreAction(
  datosCierre: {
    cajeroNombre: string;
    fechaApertura: string;
    fechaCierre: string;
    montoInicial: number;
    ventasAcumuladas: number;
    montoEsperado: number;
    efectivoReal: number;
    diferencia: number;
    cajaId: string;
  },
  correoEmpresa: string
): Promise<{ success: boolean; error?: string }> {
  try {
    
    // Inicializar cliente de Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Obtener nombre del titular desde configuracion_global
    let titular = '';
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('configuracion_global')
        .select('titular')
        .single() as any;
      
      if (data && data.titular) {
        titular = data.titular;
      }
    } catch (error) {
      console.error('Error al cargar titular para correo:', error);
    }

    // Obtener detalles completos del turno
    const supabase = createClient();
    let ventasDetalladas = [];
    let citasTurno = [];
    let comisionesTurno = [];
    let prestamosData: {
      recaudoEfectivo: number;
      recaudoTransferencias: number;
      egresosPrestamos: number;
      movimientos: any[];
    } = {
      recaudoEfectivo: 0,
      recaudoTransferencias: 0,
      egresosPrestamos: 0,
      movimientos: []
    };
    
    try {
      
      // Obtener información de la caja para fecha de apertura
      const { data: cajaData } = await supabase
        .from('cajas')
        .select('fecha_apertura, empresa_id')
        .eq('id', datosCierre.cajaId)
        .single() as any;
      
      if (cajaData) {
        const fechaAperturaISO = new Date(cajaData.fecha_apertura).toISOString();
        
        // Obtener ventas detalladas
        const { data: ventasData } = await supabase
          .from('ventas')
          .select(`
            id,
            total,
            metodo_pago,
            created_at,
            cita_id,
            cliente:clientes!cliente_id(nombre),
            detalles_ventas(
              id,
              cantidad,
              precio_unitario,
              subtotal,
              producto:productos!producto_id(nombre),
              servicio:servicios!servicio_id(nombre)
            )
          `)
          .eq('caja_id', datosCierre.cajaId)
          .eq('empresa_id', cajaData.empresa_id)
          .gte('created_at', fechaAperturaISO)
          .order('created_at', { ascending: false }) as any;
        
        ventasDetalladas = ventasData || [];
        
        // Obtener citas del turno
        const { data: citasData } = await supabase
          .from('citas')
          .select(`
            id,
            cliente:clientes!cliente_id(nombre),
            empleado:perfiles!empleado_id(nombre),
            estado,
            total,
            fecha_hora
          `)
          .eq('caja_id', datosCierre.cajaId)
          .eq('empresa_id', cajaData.empresa_id)
          .gte('fecha_hora', fechaAperturaISO)
          .order('fecha_hora', { ascending: false }) as any;
        
        citasTurno = citasData || [];
        
        // Obtener comisiones del turno
        const { data: comisionesData } = await supabase
          .from('comisiones')
          .select(`
            id,
            monto_comision,
            empleado:perfiles!empleado_id(nombre),
            created_at
          `)
          .eq('empresa_id', cajaData.empresa_id)
          .gte('created_at', fechaAperturaISO)
          .order('created_at', { ascending: false }) as any;
        
        comisionesTurno = comisionesData || [];
        
        // Obtener movimientos de préstamos (recaudos y egresos)
        
        // 1. Recaudos en efectivo
        const { data: recaudosEfectivo } = await supabase
          .from('movimientos_caja')
          .select('monto, categoria, tipo, metodo_pago, fecha, descripcion')
          .eq('caja_id', datosCierre.cajaId)
          .eq('empresa_id', cajaData.empresa_id)
          .eq('categoria', 'Abono Préstamo')
          .eq('tipo', 'entrada')
          .eq('metodo_pago', 'efectivo')
          .gte('fecha', fechaAperturaISO)
          .order('fecha', { ascending: false }) as any;
        
        // 2. Recaudos en transferencia
        const { data: recaudosTransferencia } = await supabase
          .from('movimientos_caja')
          .select('monto, categoria, tipo, metodo_pago, fecha, descripcion')
          .eq('caja_id', datosCierre.cajaId)
          .eq('empresa_id', cajaData.empresa_id)
          .eq('categoria', 'Abono Préstamo')
          .eq('tipo', 'entrada')
          .eq('metodo_pago', 'transferencia')
          .gte('fecha', fechaAperturaISO)
          .order('fecha', { ascending: false }) as any;
        
        // 3. Egresos de préstamos
        const { data: egresosPrestamos } = await supabase
          .from('movimientos_caja')
          .select('monto, categoria, tipo, metodo_pago, fecha, descripcion')
          .eq('caja_id', datosCierre.cajaId)
          .eq('empresa_id', cajaData.empresa_id)
          .eq('categoria', 'Préstamo')
          .eq('tipo', 'salida')
          .gte('fecha', fechaAperturaISO)
          .order('fecha', { ascending: false }) as any;
        
        // Calcular totales y preparar datos
        prestamosData.recaudoEfectivo = recaudosEfectivo?.reduce((sum: number, mov: any) => sum + (mov.monto || 0), 0) || 0;
        prestamosData.recaudoTransferencias = recaudosTransferencia?.reduce((sum: number, mov: any) => sum + (mov.monto || 0), 0) || 0;
        prestamosData.egresosPrestamos = egresosPrestamos?.reduce((sum: number, mov: any) => sum + (mov.monto || 0), 0) || 0;
        
        // Combinar todos los movimientos para mostrar en el reporte
        prestamosData.movimientos = [];
        
        if (recaudosEfectivo && recaudosEfectivo.length > 0) {
          recaudosEfectivo.forEach((mov: any) => {
            prestamosData.movimientos.push({
              monto: mov.monto,
              categoria: mov.categoria,
              tipo: mov.tipo,
              metodo_pago: mov.metodo_pago,
              fecha: mov.fecha,
              descripcion: mov.descripcion,
              tipoMovimiento: 'Recaudo Efectivo'
            });
          });
        }
        
        if (recaudosTransferencia && recaudosTransferencia.length > 0) {
          recaudosTransferencia.forEach((mov: any) => {
            prestamosData.movimientos.push({
              monto: mov.monto,
              categoria: mov.categoria,
              tipo: mov.tipo,
              metodo_pago: mov.metodo_pago,
              fecha: mov.fecha,
              descripcion: mov.descripcion,
              tipoMovimiento: 'Recaudo Transferencia'
            });
          });
        }
        
        if (egresosPrestamos && egresosPrestamos.length > 0) {
          egresosPrestamos.forEach((mov: any) => {
            prestamosData.movimientos.push({
              monto: mov.monto,
              categoria: mov.categoria,
              tipo: mov.tipo,
              metodo_pago: mov.metodo_pago,
              fecha: mov.fecha,
              descripcion: mov.descripcion,
              tipoMovimiento: 'Egreso Préstamo'
            });
          });
        }
        
        // Ordenar por fecha si hay movimientos
        if (prestamosData.movimientos.length > 0) {
          prestamosData.movimientos.sort((a: any, b: any) => {
            try {
              const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
              const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
              return fechaB - fechaA;
            } catch (error) {
              console.error('Error ordenando movimientos:', error);
              return 0;
            }
          });
        }
        
        
      }
    } catch (error) {
      console.error('Error obteniendo detalles del turno:', error);
      // Continuar sin detalles si hay error
    }

    // Generar plantilla HTML profesional con detalles del turno
    const htmlContent = generateCierreCajaTemplate(datosCierre, titular, {
      ventas: ventasDetalladas,
      citas: citasTurno,
      comisiones: comisionesTurno,
      prestamos: prestamosData
    });

    const { data, error } = await resend.emails.send({
      from: `${titular} <onboarding@resend.dev>`,
      to: [correoEmpresa],
      subject: `¿Reporte de Cierre de Caja - ${datosCierre.cajeroNombre}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error en enviarReporteCierreAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar reporte de cierre'
    };
  }
}

/**
 * Genera plantilla HTML profesional para reporte de cierre de caja
 */
function generateCierreCajaTemplate(datos: {
  cajeroNombre: string;
  fechaApertura: string;
  fechaCierre: string;
  montoInicial: number;
  ventasAcumuladas: number;
  montoEsperado: number;
  efectivoReal: number;
  diferencia: number;
}, titular: string, detallesTurno: {
  ventas: any[];
  citas: any[];
  comisiones: any[];
  prestamos: {
    recaudoEfectivo: number;
    recaudoTransferencias: number;
    egresosPrestamos: number;
    movimientos: any[];
  };
}): string {
  const diferenciaColor = datos.diferencia >= 0 ? '#059669' : '#DC2626';
  const diferenciaTexto = datos.diferencia >= 0 ? 'Sobrante' : 'Faltante';
  const diferenciaIcono = datos.diferencia >= 0 ? '¿' : '¿';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Cierre de Caja</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #2563EB;
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 30px 20px;
        }
        .info-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 25px;
        }
        .info-section h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 16px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .info-label {
          color: #666;
        }
        .info-value {
          font-weight: bold;
          color: #333;
        }
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .summary-table th {
          background-color: #f1f5f9;
          padding: 12px;
          text-align: left;
          font-size: 14px;
          color: #333;
          border-bottom: 2px solid #e2e8f0;
        }
        .summary-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        .summary-table .amount {
          text-align: right;
          font-weight: bold;
          font-family: monospace;
        }
        .difference-row {
          background-color: #fef3c7;
        }
        .difference-row .amount {
          color: ${diferenciaColor};
          font-size: 16px;
        }
        .details-section {
          margin-bottom: 25px;
        }
        .details-section h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 16px;
          border-bottom: 2px solid #2563EB;
          padding-bottom: 8px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .details-table th {
          background-color: #f8f9fa;
          padding: 10px;
          text-align: left;
          font-size: 12px;
          color: #666;
          border-bottom: 1px solid #e2e8f0;
        }
        .details-table td {
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }
        .details-table .amount {
          text-align: right;
          font-weight: bold;
        }
        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-completed { background-color: #d1fae5; color: #065f46; }
        .status-cancelled { background-color: #fee2e2; color: #991b1b; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .method-efectivo { background-color: #d1fae5; color: #065f46; }
        .method-tarjeta { background-color: #fef3c7; color: #92400e; }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>REPORTE DE CIERRE DE CAJA</h1>
          <p>${titular}</p>
        </div>
        
        <div class="content">
          <div class="info-section">
            <h3>INFORMACIÓN DEL TURNO</h3>
            <div class="info-row">
              <span class="info-label">Cajero:</span>
              <span class="info-value">${datos.cajeroNombre}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha Apertura:</span>
              <span class="info-value">${new Date(datos.fechaApertura).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha Cierre:</span>
              <span class="info-value">${new Date(datos.fechaCierre).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
          
          <table class="summary-table">
            <thead>
              <tr>
                <th>CONCEPTO</th>
                <th class="amount">MONTO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monto Inicial</td>
                <td class="amount">$${datos.montoInicial.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Ventas Acumuladas</td>
                <td class="amount">$${datos.ventasAcumuladas.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Monto Esperado</td>
                <td class="amount">$${datos.montoEsperado.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Efectivo Real</td>
                <td class="amount">$${datos.efectivoReal.toFixed(2)}</td>
              </tr>
              <tr class="difference-row">
                <td><strong>${diferenciaIcono} DIFERENCIA (${diferenciaTexto})</strong></td>
                <td class="amount">$${datos.diferencia.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="details-section">
            <h3>DETALLE DE VENTAS</h3>
            ${detallesTurno.ventas.length > 0 ? `
              <table class="details-table">
                <thead>
                  <tr>
                    <th>FOLIO</th>
                    <th>CLIENTE</th>
                    <th>PRODUCTO/SERVICIO</th>
                    <th class="amount">TOTAL</th>
                    <th>MÉTODO</th>
                  </tr>
                </thead>
                <tbody>
                  ${detallesTurno.ventas.map((venta: any) => {
                    const detallesText = venta.detalles_ventas && venta.detalles_ventas.length > 0
                      ? venta.detalles_ventas.map((detalle: any) => 
                          `${detalle.cantidad}x ${detalle.producto?.nombre || detalle.servicio?.nombre || 'ITEM'}`
                        ).join(', ')
                      : 'SIN DETALLES';
                    
                    return `
                    <tr>
                      <td>#${venta.id.slice(0, 8)}</td>
                      <td>${venta.cliente?.nombre || 'SIN CLIENTE'}</td>
                      <td>${detallesText}</td>
                      <td class="amount">$${venta.total.toFixed(2)}</td>
                      <td>
                        <span class="status-badge ${venta.metodo_pago === 'efectivo' ? 'method-efectivo' : 'method-tarjeta'}">
                          ${venta.metodo_pago || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  `;
                  }).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align: center; color: #666; font-style: italic;">No se registraron ventas en este turno</p>'}
          </div>
          
          ${detallesTurno.citas.length > 0 ? `
            <div class="details-section">
              <h3>CITAS ATENDIDAS</h3>
              <table class="details-table">
                <thead>
                  <tr>
                    <th>CLIENTE</th>
                    <th>EMPLEADO</th>
                    <th>FECHA/HORA</th>
                    <th class="amount">TOTAL</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  ${detallesTurno.citas.map(cita => `
                    <tr>
                      <td>${cita.cliente?.nombre || 'SIN CLIENTE'}</td>
                      <td>${cita.empleado?.nombre || 'SIN ASIGNAR'}</td>
                      <td>${new Date(cita.fecha_hora).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td class="amount">$${(cita.total || 0).toFixed(2)}</td>
                      <td>
                        <span class="status-badge ${cita.estado === 'completada' ? 'status-completed' : cita.estado === 'cancelada' ? 'status-cancelled' : 'status-pending'}">
                          ${cita.estado || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          ${(detallesTurno.prestamos.recaudoEfectivo > 0 || detallesTurno.prestamos.recaudoTransferencias > 0 || detallesTurno.prestamos.egresosPrestamos > 0) ? `
            <div class="details-section">
              <h3>PRÉSTAMOS Y RECAUDOS</h3>
              <table class="details-table">
                <thead>
                  <tr>
                    <th>TIPO</th>
                    <th>DESCRIPCIÓN</th>
                    <th class="amount">MONTO</th>
                    <th>MÉTODO</th>
                    <th>FECHA/HORA</th>
                  </tr>
                </thead>
                <tbody>
                  ${detallesTurno.prestamos.movimientos.map(movimiento => `
                    <tr>
                      <td>
                        <span class="status-badge ${movimiento.tipoMovimiento.includes('Recaudo') ? 'method-efectivo' : 'status-cancelled'}">
                          ${movimiento.tipoMovimiento}
                        </span>
                      </td>
                      <td>${movimiento.descripcion || 'SIN DESCRIPCIÓN'}</td>
                      <td class="amount">$${movimiento.monto.toFixed(2)}</td>
                      <td>
                        <span class="status-badge ${movimiento.metodo_pago === 'efectivo' ? 'method-efectivo' : 'method-tarjeta'}">
                          ${movimiento.metodo_pago || 'N/A'}
                        </span>
                      </td>
                      <td>${new Date(movimiento.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #666; font-size: 14px;">Recaudo Préstamos (Efectivo):</span>
                  <span style="font-weight: bold; color: #059669; font-size: 14px;">$${detallesTurno.prestamos.recaudoEfectivo.toFixed(2)}</span>
                </div>
                ${detallesTurno.prestamos.recaudoTransferencias > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #666; font-size: 14px;">Recaudo Préstamos (Transferencia):</span>
                    <span style="font-weight: bold; color: #7c3aed; font-size: 14px;">$${detallesTurno.prestamos.recaudoTransferencias.toFixed(2)}</span>
                  </div>
                ` : ''}
                ${detallesTurno.prestamos.egresosPrestamos > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #666; font-size: 14px;">Egresos Préstamos:</span>
                    <span style="font-weight: bold; color: #dc2626; font-size: 14px;">$${detallesTurno.prestamos.egresosPrestamos.toFixed(2)}</span>
                  </div>
                ` : ''}
                <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #333; font-weight: bold; font-size: 14px;">Neto Préstamos:</span>
                    <span style="font-weight: bold; color: #059669; font-size: 16px;">
                      $${(detallesTurno.prestamos.recaudoEfectivo - detallesTurno.prestamos.egresosPrestamos).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${detallesTurno.comisiones.length > 0 ? `
            <div class="details-section">
              <h3>COMISIONES GENERADAS</h3>
              <table class="details-table">
                <thead>
                  <tr>
                    <th>EMPLEADO</th>
                    <th class="amount">COMISIÓN</th>
                    <th>FECHA</th>
                  </tr>
                </thead>
                <tbody>
                  ${detallesTurno.comisiones.map(comision => `
                    <tr>
                      <td>${comision.empleado?.nombre || 'SIN EMPLEADO'}</td>
                      <td class="amount">$${comision.monto_comision.toFixed(2)}</td>
                      <td>${new Date(comision.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Reporte generado automáticamente por ${titular}</p>
          <p>Fecha de generación: ${new Date().toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
