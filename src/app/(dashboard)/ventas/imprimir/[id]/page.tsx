'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { Scissors } from 'lucide-react';

// Formateador de dinero con separadores de miles y decimales para ticket
const formatTicketMoney = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export default function ImprimirTicketPage({ params }: { params: { id: string } }) {
  const { user } = useJWTAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const router = useRouter();
  
  const [venta, setVenta] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasLogoError, setHasLogoError] = useState(false); // Estado para controlar error de logo

  // Función simple para mostrar notificaciones
  const mostrarToast = (message: string, type: 'success' | 'error' | 'info') => {
    // Simple alert para este componente de impresión
    if (type === 'error') {
      console.error('❌', message);
    }
  };

  useEffect(() => {
    if (user?.empresa_id && params.id) {
      cargarDatosImpresion();
    }
    
    // Cleanup function para evitar aborts
    return () => {
      // Limpiar cualquier petición pendiente
    };
  }, [user?.empresa_id, params.id]);

  useEffect(() => {
    // Disparar impresión automática cuando los datos estén cargados
    if (!loading && venta && empresa) {
      // Simplemente esperar un momento y disparar impresión
      // Sin intentar precargar logo para evitar bucles
      setTimeout(() => window.print(), 600);
    }
  }, [loading, venta, empresa]);

  const cargarDatosImpresion = async () => {
    try {
      setLoading(true);

      // Cargar datos de la venta con timeout para evitar abort
      const ventaPromise = supabase
        .from('ventas')
        .select('*, clientes(*), detalles_ventas(*, productos(*), servicios(*)), subtotal, impuestos, total') 
        .eq('id', params.id)
        .eq('empresa_id', user?.empresa_id as any)
        .single();

      const { data: ventaData, error: ventaError } = await Promise.race([
        ventaPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading venta')), 10000)
        )
      ]) as any;

      if (ventaError) throw ventaError;

      // Cargar datos de la empresa con timeout
      const empresaPromise = supabase
        .from('empresas')
        .select('nombre, nit, telefono, direccion, ciudad, mensaje_ticket, logo_url')
        .eq('id', user?.empresa_id as any)
        .single();

      const { data: empresaData, error: empresaError } = await Promise.race([
        empresaPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading empresa')), 10000)
        )
      ]) as any;

      if (empresaError) throw empresaError;

      if (ventaData && empresaData) {
        // @ts-ignore - Ignorar errores de TypeScript para datos de empresa
        // Procesar URL del logo
        const processedEmpresa: any = {
          // @ts-ignore
          nombre: empresaData.nombre,
          // @ts-ignore
          nit: empresaData.nit,
          // @ts-ignore
          telefono: empresaData.telefono,
          // @ts-ignore
          direccion: empresaData.direccion,
          // @ts-ignore
          ciudad: empresaData.ciudad,
          // @ts-ignore
          mensaje_ticket: empresaData.mensaje_ticket,
          // @ts-ignore
          logo_url: (empresaData as any).logo_url // No procesar aquí, procesar en render
        };

        setVenta(ventaData);
        setEmpresa(processedEmpresa);
      }
    } catch (error: any) {
      // Manejar específicamente AbortError
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        return;
      }
      
      // Manejar timeout
      if (error.message?.includes('Timeout')) {
        console.error('⏱️ Timeout cargando datos:', error);
        mostrarToast('Tiempo de espera agotado. Intente recargar la página.', 'error');
        return;
      }
      
      console.error('Error cargando datos de impresión:', error);
      mostrarToast('Error al cargar los datos del ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  const volverAlPOS = () => {
    // Navegación dinámica basada en el parámetro ?from=
    if (from === 'atencion') {
      router.push('/citas/gestion');
    } else {
      router.push('/ventas/nueva');
    }
  };

  // Determinar texto del botón
  const getButtonText = () => {
    if (from === 'atencion') {
      return 'Volver a Citas';
    } else {
      return 'Volver al POS';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ticket...</p>
        </div>
      </div>
    );
  }

  if (!venta || !empresa) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">No se encontraron datos del ticket</p>
          <button
            onClick={volverAlPOS}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al POS
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Estilos de impresión */}
      <style jsx>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          
          .ticket-container {
            width: 80mm;
            margin: 0 auto;
            padding: 16px;
            background: white;
            font-size: 12px;
            line-height: 1.4;
            color: #1f2937;
            box-shadow: none;
            border: none;
          }
          
          .company-name {
            font-size: 18px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 8px;
            color: #111827;
          }
          
          .divider {
            border-top: 1px solid #e5e7eb;
            margin: 12px 0;
          }
          
          .section-title {
            font-size: 11px;
            font-weight: 600;
            text-align: center;
            margin-bottom: 8px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .product-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 11px;
          }
          
          .product-name {
            flex: 1;
            margin-right: 8px;
            font-weight: 500;
          }
          
          .product-qty {
            margin-right: 12px;
            color: #6b7280;
          }
          
          .product-price {
            text-align: right;
            font-weight: 600;
            color: #1f2937;
          }
          
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          
          .total-bold {
            font-weight: 700;
            font-size: 14px;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 8px;
            border-radius: 4px;
            margin-top: 8px;
            color: #111827;
            border: 1px solid #10b981;
          }
          
          .info-text {
            font-size: 11px;
            margin-bottom: 4px;
            color: #4b5563;
          }
          
          .footer-text {
            font-size: 10px;
            margin-top: 12px;
            font-style: italic;
            text-align: center;
            color: #9ca3af;
          }
          
          .logo-img {
            width: 150px;
            height: 80px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }
          
          .logo-placeholder {
            width: 150px;
            height: 80px;
            margin: 0 auto;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .company-info {
            text-align: center;
            margin-bottom: 12px;
          }
          
          .company-info .info-text {
            text-align: center;
            margin-bottom: 2px;
          }
        }
        
        @media screen {
          .ticket-container {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          }
          
          .company-name {
            font-size: 20px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 12px;
            color: #111827;
          }
          
          .divider {
            border-top: 2px solid #e5e7eb;
            margin: 16px 0;
          }
          
          .section-title {
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            margin-bottom: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .product-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
          }
          
          .product-name {
            flex: 1;
            margin-right: 8px;
            font-weight: 500;
          }
          
          .product-qty {
            margin-right: 12px;
            color: #6b7280;
          }
          
          .product-price {
            text-align: right;
            font-weight: 600;
            color: #1f2937;
          }
          
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 12px;
          }
          
          .total-bold {
            font-weight: 700;
            font-size: 16px;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
            color: #111827;
            border: 2px solid #10b981;
          }
          
          .info-text {
            font-size: 12px;
            margin-bottom: 6px;
            color: #4b5563;
          }
          
          .footer-text {
            font-size: 11px;
            margin-top: 16px;
            font-style: italic;
            text-align: center;
            color: #9ca3af;
          }
          
          .logo-img {
            width: 150px;
            height: 80px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }
          
          .logo-placeholder {
            width: 150px;
            height: 80px;
            margin: 0 auto;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .company-info {
            text-align: center;
            margin-bottom: 16px;
          }
          
          .company-info .info-text {
            text-align: center;
            margin-bottom: 4px;
          }
        }
      `}</style>

      <div className="ticket-container">
        {/* Logo y Encabezado - Centrado */}
       {/* Logo y Encabezado - Centrado */}
       
       {/* Logo y Encabezado */}
<div className="text-center mb-4">
  {/* Validamos que haya un logo Base64 Y que no hayamos tenido error previo */}
  {empresa?.logo_url && empresa.logo_url.startsWith('data:image/') && !hasLogoError ? (
    <img 
      src={empresa.logo_url} 
      alt="Logo" 
      className="mx-auto h-auto max-h-[80px] w-auto object-contain mb-2"
      onError={() => {
        setHasLogoError(true);
      }}
    />
  ) : (
    <div className="py-4 border-2 border-dashed border-gray-200 rounded-lg mb-2">
      <Scissors className="w-8 h-8 text-gray-700 mb-1 mx-auto" />
      <div className="text-2xl font-black text-gray-900 tracking-tighter">
        BEAUTYPRO
      </div>
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        Professional Hair Studio
      </div>
    </div>
  )}
</div>
        
        {/* Datos de Empresa - Centrados */}
        <div className="company-info">
          <div className="company-name">{empresa.nombre}</div>
          <div className="info-text font-bold">NIT: {empresa.nit}</div>
          <div className="info-text">Teléfono: {empresa.telefono}</div>
          <div className="info-text">{empresa.direccion}, {empresa.ciudad}</div>
        </div>
        
        <div className="divider"></div>
        
        {/* Información de la Venta */}
        <div className="section-title">TICKET DE VENTA</div>
        <div className="info-text">Factura: #{venta.numero_factura}</div>
        <div className="info-text">Fecha: {new Date(venta.fecha).toLocaleString('es-CO')}</div>
        <div className="info-text">Cliente: {venta.clientes?.nombre}</div>
        <div className="info-text">Cédula: {venta.clientes?.cedula}</div>
        <div className="info-text">Vendedor: {user?.nombre || 'Sistema'}</div>
        
        <div className="divider"></div>
        
        {/* Productos y Servicios */}
        {/* Encabezado de productos en negrita */}
        <div className="product-row font-bold">
          <span className="product-name">DESCRIPCIÓN</span>
          <span className="product-qty">CANT</span>
          <span className="product-price">PRECIO U.</span>
        </div>
        
        {venta.detalles_ventas?.map((detalle: any, index: number) => (
          <div key={index} className="product-row">
            <span className="product-name">
              {detalle.productos?.nombre || detalle.servicios?.nombre || 'Item'}
            </span>
            <span className="product-qty">{detalle.cantidad}</span>
            <span className="product-price">{formatTicketMoney(detalle.precio_unitario || 0)}</span>
          </div>
        ))}
  
        
        <div className="divider"></div>
        
        {/* Totales */}
        <div className="totals-row">
          <span>Subtotal:</span>
          <span>{formatTicketMoney(venta.subtotal || 0)}</span>
        </div>
        <div className="totals-row">
          <span>IVA:</span>
          <span>{formatTicketMoney(venta.impuestos || 0)}</span>
        </div>
        {venta.descuentos > 0 && (
          <div className="totals-row">
            <span>Descuento:</span>
            <span>-{formatTicketMoney(venta.descuentos || 0)}</span>
          </div>
        )}
        <div className="totals-row total-bold">
          <span>TOTAL A PAGAR:</span>
          <span>{formatTicketMoney(venta.total || 0)}</span>
        </div>
        
        <div className="divider"></div>
        
        {/* Método de Pago */}
        <div className="info-text">Método: {venta.metodo_pago}</div>
        
        {/* Pie de página */}
        <div className="footer-text">
          {empresa.mensaje_ticket}
        </div>
      </div>

      {/* Botones - Solo en pantalla, no se imprimen */}
      <div className="no-print fixed bottom-4 right-4">
        <button
          onClick={volverAlPOS}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {getButtonText()}
        </button>
      </div>
    </>
  );
}
