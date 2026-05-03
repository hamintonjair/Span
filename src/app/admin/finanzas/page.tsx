'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { obtenerReporteFinancieroAction } from '@/app/actions/admin';
import { obtenerConfiguracionGlobalAction } from '@/app/actions/configuracion-global';
import { createClient } from '@/lib/supabase/client';
import ReactPaginate from 'react-paginate';
import { 
  DocumentArrowDownIcon,
  BanknotesIcon,
  CalculatorIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaccion {
  id: string;
  monto: number;
  fecha_envio: string;
  fecha_verificacion: string;
  estado: string;
  notas: string;
  empresa_id: string;
  verificado_por: string;
  empresas?: {
    id: string;
    nombre: string;
  };
  planes?: {
    id: string;
    nombre: string;
  };
}

interface ReporteFinanciero {
  transacciones: Transaccion[];
  resumen: {
    total: number;
    promedio: number;
    variacion: number;
    cantidadTransacciones: number;
  };
  empresas: Array<{ id: string; nombre: string }>;
}

interface ReporteResponse {
  success: boolean;
  data?: ReporteFinanciero;
  error?: string;
}

// Función para formatear moneda colombiana
const formatearMoneda = (cantidad: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cantidad);
};

// Función para formatear fecha
const formatearFecha = (fecha: string): string => {
  const fechaObj = new Date(fecha);
  return fechaObj.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function FinanzasPage() {
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedEmpresa, setSelectedEmpresa] = useState('todas');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const itemsPerPage = 10;

  // Cargar empresas y reporte una sola vez al inicio
  useEffect(() => {
    cargarEmpresas();
    cargarReporteFinanciero();
  }, []);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedEmpresa, fechaInicio, fechaFin]);

  const cargarEmpresas = async () => {
    try {
      const result = await obtenerReporteFinancieroAction();
      if (result.success && result.data?.empresas) {
        setEmpresas(result.data.empresas);
      }
    } catch (error) {
      console.error('Error cargando empresas:', error);
    }
  };

  const cargarReporteFinanciero = async () => {
    try {
      setLoading(true);
      const result = await obtenerReporteFinancieroAction(
        fechaInicio || undefined, 
        fechaFin || undefined,
        selectedEmpresa === 'todas' ? undefined : selectedEmpresa
      );
      
      if (result.success && result.data) {
        setReporte(result.data);
      } else {
        console.error('Error cargando reporte financiero:', result.error);
      }
    } catch (error) {
      console.error('Error en cargarReporteFinanciero:', error);
    } finally {
      setLoading(false);
    }
  };

  
  // Paginación
  const offset = currentPage * itemsPerPage;
  const currentPageItems = reporte?.transacciones.slice(offset, offset + itemsPerPage) || [];
  const pageCount = Math.ceil((reporte?.transacciones.length || 0) / itemsPerPage);

  // Filtrado local por fecha y empresa
  const transaccionesFiltradas = reporte?.transacciones?.filter((t: any) => {
    // Filtro por empresa
    if (selectedEmpresa !== 'todas' && t.empresa_id !== selectedEmpresa) {
      return false;
    }

    // Filtro por fecha
    if (fechaInicio || fechaFin) {
      const fechaTransaccion = new Date(t.fecha_verificacion);
      const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : null;
      const fechaFinDate = fechaFin ? new Date(fechaFin) : null;

      if (fechaInicioDate && fechaTransaccion < fechaInicioDate) {
        return false;
      }
      if (fechaFinDate && fechaTransaccion > fechaFinDate) {
        return false;
      }
    }

    return true;
  }) || [];

  // Paginación con datos filtrados
  const offsetFiltrado = currentPage * itemsPerPage;
  const currentPageItemsFiltrados = transaccionesFiltradas.slice(offsetFiltrado, offsetFiltrado + itemsPerPage) || [];
  const pageCountFiltrado = Math.ceil(transaccionesFiltradas.length / itemsPerPage);

  // Empresas suspendidas por no pago
  const empresasSuspendidas = reporte?.empresasSuspendidas || [];

  // Calcular pendientes de pago (empresas suspendidas por no pago)
  const empresasSuspendidasPorNoPago = empresasSuspendidas || [];
  const cantidadEmpresasSuspendidas = empresasSuspendidasPorNoPago.length;
  const totalPendientes = reporte?.montoEmpresasSuspendidas || 0;

  // Calcular KPIs con datos filtrados
  const totalIngresosFiltrado = transaccionesFiltradas.reduce((sum: number, t: any) => sum + (t.monto || 0), 0);
  const cantidadTransaccionesFiltrado = transaccionesFiltradas.length;
  const ticketPromedioFiltrado = cantidadTransaccionesFiltrado > 0 ? totalIngresosFiltrado / cantidadTransaccionesFiltrado : 0;

  // Encontrar valor máximo para gráfico
  const ingresosTotales = reporte?.ingresosPorMes?.map((ingreso: any) => ingreso.total) || [];
  const maxIngreso = ingresosTotales.length > 0 ? Math.max(...ingresosTotales) : 1;

  const handlePageClick = (selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected);
  };

  // Función para exportar transacciones a Excel
  const exportarTransaccionesExcel = () => {
    if (!reporte?.transacciones || reporte.transacciones.length === 0) {
      return;
    }

    // Preparamos los datos para el Excel
    const data = reporte.transacciones.map((transaccion: any) => ({
      'Fecha Verificación': formatearFecha(transaccion.fecha_verificacion),
      'Nombre Empresa': transaccion.empresas?.nombre || 'Empresa desconocida',
      'Referencia': `#${transaccion.id.slice(0, 8)}`,
      'Monto': transaccion.monto || 0,
      'Estado': transaccion.estado || '',
      'Fecha Envío': formatearFecha(transaccion.fecha_envio),
      'Nombre Usuario': transaccion.usuario_nombre || transaccion.usuarios_sistema?.nombre || 'No verificado',
      'Nota': transaccion.notas || '',
      'Plan': transaccion.planes?.nombre || 'Sin plan'
    }));

    // Creamos la hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transacciones Financieras");

    // Auto-ajuste de columnas
    const colWidths = [
      { wch: 20 }, // Fecha Verificación
      { wch: 25 }, // Nombre Empresa
      { wch: 15 }, // Referencia
      { wch: 15 }, // Monto
      { wch: 12 }, // Estado
      { wch: 20 }, // Fecha Envío
      { wch: 25 }, // Nombre Usuario
      { wch: 30 }, // Nota
      { wch: 20 }  // Plan
    ];
    ws['!cols'] = colWidths;

    // Generamos el nombre del archivo con fecha y filtros
    let filename = `transacciones_financieras_${new Date().toISOString().split('T')[0]}`;
    
    // Agregar información de filtros al nombre
    if (selectedEmpresa !== 'todas') {
      const empresaNombre = empresas.find(e => e.id === selectedEmpresa)?.nombre || selectedEmpresa;
      filename += `_${empresaNombre}`;
    }
    
    if (fechaInicio) {
      filename += `_desde_${fechaInicio}`;
    }
    
    if (fechaFin) {
      filename += `_hasta_${fechaFin}`;
    }

    // Descargamos el archivo .xlsx
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  // Función auxiliar para procesar SVG a PNG con canvas
  const procesarLogoParaPDF = async (logoUrl: string): Promise<string> => {
    if (!logoUrl) return '';
    
    // Si no es SVG, retornar la URL original
    if (!logoUrl.includes('image/svg+xml')) {
      return logoUrl;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }
        
        img.onload = () => {
          // Configurar tamaño del canvas (40x30mm a 72dpi = ~113x85px)
          canvas.width = 113;
          canvas.height = 85;
          
          // Dibujar la imagen SVG en el canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convertir a PNG Base64
          const pngDataUrl = canvas.toDataURL('image/png');
          resolve(pngDataUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Error cargando la imagen SVG'));
        };
        
        // Cargar la imagen SVG
        img.src = logoUrl;
      } catch (error) {
        reject(error);
      }
    });
  };

  // Función para generar PDF de recibo
  const generarPDF = async (transaccion: any) => {
    try {
      // Obtener configuración global
      const config = await obtenerConfiguracionGlobalAction();
      
      // Obtener administrador de la empresa
      const supabase = createClient();
      let nombreAdmin = 'N/A';
      
      try {
        const { data: adminData } = await supabase
          .from('usuarios_sistema')
          .select('nombre')
          .eq('empresa_id', transaccion.empresa_id)
          .eq('rol', 'admin_empresa')
          .single();
        
        if (adminData && (adminData as any).nombre) {
          nombreAdmin = (adminData as any).nombre;
        }
      } catch (adminError) {
        console.error('Error obteniendo administrador:', adminError);
        // Continuar con N/A si hay error
      }
      
      // Crear documento PDF tamaño carta
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      // Configurar fuentes
      doc.setFont('helvetica');

      // Procesar logo dinámicamente si existe
      if (config?.logo_url) {
        try {
          // Usar función auxiliar para procesar SVG a PNG si es necesario
          const processedLogo = await procesarLogoParaPDF(config.logo_url);
          
          if (processedLogo) {
            // Agregar logo procesado (siempre será PNG) - centrado
            doc.addImage(processedLogo, 'PNG', 92, 15, 25, 25);
          } else {
            // Fallback a logo estático - centrado
            doc.setFillColor(251, 146, 60); // Color amber-500
            doc.circle(105, 27, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('SPAN', 105, 32, { align: 'center' });
          }
        } catch (logoError) {
          console.error('Error procesando logo:', logoError);
          // Fallback a logo estático si hay error - centrado
          doc.setFillColor(251, 146, 60); // Color amber-500
          doc.circle(105, 27, 12, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('SPAN', 105, 32, { align: 'center' });
        }
      } else {
        // Fallback a logo estático si no hay logo - centrado
        doc.setFillColor(251, 146, 60); // Color amber-500
        doc.circle(105, 27, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SPAN', 105, 32, { align: 'center' });
      }

      // Información de la empresa con datos dinámicos - centrada
      let infoY = 45;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(config?.titular || 'Span Business', 105, infoY, { align: 'center' });
      infoY += 4;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // NIT dinámico
      doc.text(`NIT: ${config?.documento_titular || 'N/A'}`, 105, infoY, { align: 'center' });
      infoY += 4;
      
      // Teléfono dinámico
      doc.text(`Teléfono: ${config?.whatsapp_soporte || 'N/A'}`, 105, infoY, { align: 'center' });
      infoY += 4;
      
      // Dirección y ciudad dinámicas
      if (config?.direccion && config?.ciudad) {
        doc.text(`${config.direccion} en ${config.ciudad}`, 105, infoY, { align: 'center' });
      } else if (config?.direccion) {
        doc.text(config.direccion, 105, infoY, { align: 'center' });
      } else if (config?.ciudad) {
        doc.text(config.ciudad, 105, infoY, { align: 'center' });
      } else {
        doc.text('Email: contacto@span.com', 105, infoY, { align: 'center' });
      }

      // Línea separadora - más cerca de los datos
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 70, 195, 70);

      // Título del recibo - más cerca de la línea
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RECIBO DE PAGO', 105, 78, { align: 'center' });

      // Datos del cliente - espaciado compacto
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      let clienteY = 88;
      
      // Cliente
      doc.text('Cliente:', 15, clienteY);
      doc.setFont('helvetica', 'bold');
      doc.text(transaccion.empresas?.nombre || 'Empresa desconocida', 45, clienteY);
      
      // Administrador
      clienteY += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('Administrador:', 15, clienteY);
      doc.setFont('helvetica', 'bold');
      doc.text(nombreAdmin, 45, clienteY);
      
      // NIT
      clienteY += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('NIT:', 15, clienteY);
      doc.setFont('helvetica', 'bold');
      doc.text(transaccion.empresas?.nit || 'N/A', 45, clienteY);
      
      // Teléfono
      clienteY += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('Teléfono:', 15, clienteY);
      doc.setFont('helvetica', 'bold');
      doc.text(transaccion.empresas?.telefono || 'N/A', 45, clienteY);
      
      // Dirección
      clienteY += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('Dirección:', 15, clienteY);
      doc.setFont('helvetica', 'bold');
      doc.text(transaccion.empresas?.direccion || 'N/A', 45, clienteY);

      // Debug: Verificar datos de la transacción y plan
      console.log('Datos de transacción en PDF:', transaccion);
      console.log('Nombre del plan:', transaccion.planes?.nombre);

      // Tabla de detalles - más cerca de los datos del cliente
      autoTable(doc, {
        head: [['Concepto', 'Período', 'Monto']],
        body: [
          [
            `Suscripción - ${transaccion.planes?.nombre || 'Plan General'}`,
            `${formatearFecha(transaccion.fecha_verificacion)}`,
            `$${transaccion.monto?.toLocaleString('es-CO') || '0'}`
          ]
        ],
        startY: 120,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [251, 146, 60],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60 },
          2: { cellWidth: 40, halign: 'right' }
        }
      });

      // Total
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: $${transaccion.monto?.toLocaleString('es-CO') || '0'}`, 160, finalY);

      // Nota al pie
      const notaY = finalY + 30;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const nota = 'Este documento es un soporte de pago administrativo y no constituye una factura de venta electrónica';
      doc.text(nota, 105, notaY, { align: 'center', maxWidth: 170 });

      // Fecha y firma
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 25, notaY + 20);
      doc.text('Firma autorizada:', 140, notaY + 20);
      
      // Agregar nombre del titular debajo de "Firma autorizada:"
      doc.text(config?.titular || 'N/A', 140, notaY + 25);
      
      // Línea de firma
      doc.line(140, notaY + 30, 190, notaY + 30);

      // Generar nombre del archivo
      const nombreEmpresa = transaccion.empresas?.nombre || 'Empresa';
      const fecha = new Date().toISOString().split('T')[0];
      const filename = `Recibo_Span_${nombreEmpresa.replace(/[^a-zA-Z0-9]/g, '_')}_${fecha}.pdf`;

      // Descargar el PDF
      doc.save(filename);

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfaf6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reporte financiero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporte Financiero</h1>
          <p className="text-gray-500 text-lg">Análisis completo de ingresos y transacciones</p>
        </div>
        <Button
          onClick={exportarTransaccionesExcel}
          variant="outline"
          className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:border-amber-600"
          disabled={!reporte?.transacciones || reporte.transacciones.length === 0}
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Barra de Filtros Inteligente */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
        </div>
        
        {/* Dropdown Empresa */}
        <div className="flex-1 max-w-xs">
          <select
            value={selectedEmpresa}
            onChange={(e) => setSelectedEmpresa(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value="todas">Todas las Empresas</option>
            {empresas.map((empresa: any) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Rango de Fechas */}
        <div className="flex-1 max-w-xs">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            placeholder="Fecha inicio"
          />
        </div>
        <div className="flex-1 max-w-xs">
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            placeholder="Fecha fin"
          />
        </div>
      </div>

      {/* Métricas Avanzadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Ingresos por Plan */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <CalculatorIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Ingresos por Plan</h3>
            </div>
            <div className="space-y-1">
              {reporte?.metricasAvanzadas?.recaudacionPorPlan ? 
                Object.entries(reporte.metricasAvanzadas.recaudacionPorPlan)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 2)
                  .map(([plan, monto]) => (
                    <div key={plan} className="flex justify-between text-sm">
                      <span className="text-gray-600">{plan}:</span>
                      <span className="font-medium text-gray-900">{formatearMoneda(monto as number)}</span>
                    </div>
                  ))
                : (
                  <div className="text-sm text-gray-500">Sin datos</div>
                )
              }
            </div>
          </CardContent>
        </Card>

        {/* Efectividad de Cobro */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-50 rounded-lg mr-3">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Efectividad de Cobro</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Aprobados:</span>
                <span className="font-medium text-green-600">
                  {formatearMoneda(reporte?.metricasAvanzadas?.estadoCobro?.aprobados || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rechazados:</span>
                <span className="font-medium text-red-600">
                  {formatearMoneda(reporte?.metricasAvanzadas?.estadoCobro?.rechazados || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Día Pico de Pagos */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-50 rounded-lg mr-3">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Día Pico de Pagos</h3>
            </div>
            <div className="text-sm">
              <div className="text-gray-600 mb-1">Día con más pagos:</div>
              <div className="font-medium text-gray-900">
                {reporte?.metricasAvanzadas?.diaMayorFlujo || 'Sin datos'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Total Ingresos */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Total Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatearMoneda(totalIngresosFiltrado)}
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm text-amber-600">
              <BanknotesIcon className="w-4 h-4 mr-1" />
              <span>{cantidadTransaccionesFiltrado} transacciones</span>
            </div>
          </CardContent>
        </Card>

        {/* Pendientes de Pago */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <CalculatorIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatearMoneda(totalPendientes)}
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm text-yellow-600">
              <CalculatorIcon className="w-4 h-4 mr-1" />
              <span>{cantidadEmpresasSuspendidas} empresas suspendidas</span>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Promedio */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <CalculatorIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatearMoneda(ticketPromedioFiltrado)}
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <CalculatorIcon className="w-4 h-4 mr-1" />
              <span>Por transacción</span>
            </div>
          </CardContent>
        </Card>

        {/* Crecimiento */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                (reporte?.resumen?.variacion || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {(reporte?.resumen?.variacion || 0) >= 0 ? (
                  <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Crecimiento</p>
                <p className={`text-2xl font-bold ${
                  (reporte?.resumen?.variacion || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(reporte?.resumen?.variacion || 0) >= 0 ? '+' : ''}
                  {(reporte?.resumen?.variacion || 0).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className={`flex items-center text-sm ${
              (reporte?.resumen?.variacion || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(reporte?.resumen?.variacion || 0) >= 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              )}
              <span>vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Empresas Suspendidas por No Pago */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <DocumentArrowDownIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Suspendidas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {empresasSuspendidas.length}
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm text-red-600">
              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
              <span>Por no pago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras Mensual */}
      <Card className="bg-white border border-gray-100 shadow-sm rounded-xl mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Evolución Mensual</h3>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {!reporte?.ingresosPorMes || reporte.ingresosPorMes.length === 0 ? (
              <div className="w-full text-center text-gray-500">
                No hay datos de ingresos disponibles
              </div>
            ) : (
              reporte.ingresosPorMes.map((ingreso: any, index: any) => {
                const altura = (ingreso.total / maxIngreso) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-56">
                      <div 
                        className="w-full bg-amber-500/80 rounded-t-md transition-all duration-500 hover:bg-amber-600"
                        style={{ height: `${altura}%`, minHeight: '4px' }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      <div className="font-medium">{ingreso.mes.split(' ')[0]}</div>
                      <div className="text-gray-400">{ingreso.mes.split(' ')[1]}</div>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 mt-1">
                      {formatearMoneda(ingreso.total)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Transacciones */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Transacciones ({transaccionesFiltradas.length || 0})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPageItemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay transacciones registradas
                  </td>
                </tr>
              ) : (
                currentPageItemsFiltrados.map((transaccion: any) => {
                  const estado = transaccion.estado?.toLowerCase() || '';
                  const estadoBadge = estado === 'completado' || estado === 'aprobado' || estado === 'pagado' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completado
                    </span>
                  ) : estado === 'pendiente' || estado === 'pending' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Fallido
                    </span>
                  );

                  return (
                    <tr key={transaccion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearFecha(transaccion.fecha_verificacion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaccion.empresas?.nombre || 'Empresa desconocida'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{transaccion.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                        {formatearMoneda(transaccion.monto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {estadoBadge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          {transaccion.empresas?.telefono && (
                            <a
                              href={`https://wa.me/57${transaccion.empresas.telefono.replace(/\D/g, '')}?text=Hola,%20somos%20el%20equipo%20de%20${encodeURIComponent(reporte?.nombreEmpresa || 'Span')}.%20Te%20escribimos%20por%20tu%20suscripción...`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full p-0 hover:bg-green-200 transition-colors"
                              title="Contactar por WhatsApp"
                            >
                              <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => generarPDF(transaccion)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-full p-0 hover:bg-amber-200 transition-colors"
                            title="Generar Recibo PDF"
                          >
                            <DocumentTextIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pageCountFiltrado > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-center">
              <ReactPaginate
                previousLabel={"← Anterior"}
                nextLabel={"Siguiente →"}
                breakLabel={"..."}
                pageCount={pageCountFiltrado}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageClick}
                containerClassName={"flex items-center gap-2"}
                pageClassName={"px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"}
                pageLinkClassName={"text-gray-700 hover:text-gray-900"}
                previousClassName={"px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"}
                previousLinkClassName={"text-gray-700 hover:text-gray-900"}
                nextClassName={"px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"}
                nextLinkClassName={"text-gray-700 hover:text-gray-900"}
                breakClassName={"px-3 py-2"}
                breakLinkClassName={"text-gray-500"}
                activeClassName={"bg-amber-500 border-amber-500 text-white hover:bg-amber-600"}
                disabledClassName={"opacity-50 cursor-not-allowed"}
                forcePage={currentPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
