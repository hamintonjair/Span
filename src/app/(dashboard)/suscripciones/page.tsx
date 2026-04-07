'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ReactPaginate from 'react-paginate';
import { MainLayout } from '@/components/layout/main-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Componentes temporales para Dialog
const Dialog = ({ open, onOpenChange, children }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  children: React.ReactNode; 
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const DialogFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-end gap-2 mt-4">{children}</div>
);

// Componentes temporales para CardTitle y CardDescription
const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
);
import { 
  CreditCardIcon, 
  BuildingOfficeIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  BanknotesIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Componente Badge temporal
const Badge = ({ children, variant = 'outline', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'success'; 
  className?: string; 
}) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  const variantClasses = {
    outline: 'border border-gray-300 text-gray-700 bg-white',
    default: 'bg-blue-100 text-blue-800 border border-blue-200',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface Transaccion {
  id: string;
  empresa_id: string;
  empresa_nombre: string;
  plan_id: string;
  plan_nombre: string;
  plan_precio: number;
  monto: number;
  fecha_pago: string;
  estado: 'pagado' | 'pendiente' | 'vencido';
  metodo_pago: 'manual' | 'automatico';
  periodo_cobertura: string; // "2024-02"
  proximo_vencimiento?: string;
  creado_en: string;
  estaVencida?: boolean; // Nuevo flag para alertas visuales
}

interface Comprobante {
  id: string;
  empresa_id: string;
  suscripcion_id?: string;
  plan_id?: string;
  nombre_archivo: string;
  url_archivo: string;
  tipo_archivo: string;
  tamano_bytes: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  verificado: boolean;
  notas?: string;
  fecha_envio: string;
  fecha_verificacion?: string;
  verificado_por?: string;
  empresa_nombre: string;
  actualizado_en?: string;
  plan_precio?: number;
  monto?: number; // Campo adicional para el monto real
  plan_nombre?: string;
  empresas?: {
    id: string;
    nombre: string;
  };
  suscripciones?: {
    id: string;
    monto: number;
  };
}

interface Empresa {
  id: string;
  nombre: string;
  plan_id: string;
  plan_nombre: string;
  plan_precio: number;
  tiene_inventario: boolean;
  tiene_comisiones: boolean;
  tiene_marketing: boolean;
  soporte_prioritario: boolean;
  estado_pago: 'pagado' | 'pendiente' | 'vencido' | null;  // Puede ser null si no hay suscripción
  estado: 'activo' | 'suspendido' | 'pendiente';     // ✅ Estandarizar a minúsculas
  fecha_vencimiento?: string;
  estaVencida?: boolean;
}

export default function SuscripcionesPage() {
  const { user, loading } = useJWTAuth();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [comprobantesPendientes, setComprobantesPendientes] = useState<Comprobante[]>([]);
  const [comprobantesAprobados, setComprobantesAprobados] = useState<Comprobante[]>([]);  // ✅ Agregar estado para aprobados
  const [solicitudesCambioPlan, setSolicitudesCambioPlan] = useState<any[]>([]);  // ✅ Nuevo estado para solicitudes de cambio de plan
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoFormData, setPagoFormData] = useState({
    empresa_id: '',
    monto: '',
    metodo: 'manual',
    periodo: new Date().toISOString().slice(0, 7),
    notas: ''
  });
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'vencidos' | 'pendientes' | 'activos'>('todos');
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<Comprobante | null>(null);
  const [precioPlanActual, setPrecioPlanActual] = useState<number>(0);
  const [procesandoAprobacion, setProcesandoAprobacion] = useState(false);
  const [procesandoRechazo, setProcesandoRechazo] = useState(false);
  const [notasRechazo, setNotasRechazo] = useState('');
  const [notasAprobacion, setNotasAprobacion] = useState(''); // ✅ Agregar notas para aprobación
  const [accionSeleccionada, setAccionSeleccionada] = useState<'aprobar' | 'rechazar' | null>(null); // ✅ Radio button para acción
  const [errorNotas, setErrorNotas] = useState('');

  // ✅ Estados para sistema de notificaciones
  const [showNotification, setShowNotification] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });
  
  // ✅ Estados para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger' as 'danger' | 'warning'
  });

  // Estados para Historial de Pagos
  const [historialPagos, setHistorialPagos] = useState<Comprobante[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCountHistorial, setTotalCountHistorial] = useState(0);
  const [filtroEstadoHistorial, setFiltroEstadoHistorial] = useState('aprobados-rechazados');
  const [fechaInicioHistorial, setFechaInicioHistorial] = useState('');
  const [fechaFinHistorial, setFechaFinHistorial] = useState('');
  const [busquedaEmpresa, setBusquedaEmpresa] = useState('');

  // ✅ Función para mostrar notificaciones
  const showNotificationModal = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotificationConfig({ title, message, type });
    setShowNotification(true);
  };

  // ✅ Función para mostrar confirmación
  const showConfirmModalDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'danger') => {
    setConfirmConfig({ title, message, onConfirm, type });
    setShowConfirmModal(true);
  };

  useEffect(() => {
    if (user?.rol === 'admin_global') {
      loadData();
      loadHistorialPagos();
      loadSolicitudesCambioPlan();  // ✅ Cargar solicitudes de cambio de plan
    }
  }, [user]);

  const loadHistorialPagos = async () => {
    try {
      setLoadingHistorial(true);
      
      // Obtener comprobantes APROBADOS y RECHAZADOS para el historial de pagos
      let query = createClient()
        .from('comprobantes')
        .select(`
          id,
          empresa_id,
          suscripcion_id,
          nombre_archivo,
          url_archivo,
          tipo_archivo,
          tamano_bytes,
          estado,
          verificado,
          notas,
          fecha_envio,
          fecha_verificacion,
          verificado_por,
          creado_en,
          actualizado_en,
          monto,
          empresas!inner (
            id,
            nombre
          )
        `, { count: 'exact' })
        .in('estado', ['aprobado', 'rechazado'])  // ✅ Aprobados y rechazados
        .order('actualizado_en', { ascending: false });
      
      if (fechaFinHistorial) {
        query = query.lte('actualizado_en', new Date(fechaFinHistorial + 'T23:59:59').toISOString());
      }
      
      if (busquedaEmpresa) {
        query = query.ilike('empresas.nombre', `%${busquedaEmpresa}%`);
      }
      
      // Paginación
      const from = itemOffset;
      const to = itemOffset + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error cargando historial de pagos:', error);
        // Si falla la consulta con relaciones, intentar sin ellas
        const fallbackQuery = createClient()
          .from('comprobantes')
          .select('*', { count: 'exact' })
          .in('estado', ['aprobado', 'rechazado'])
          .order('actualizado_en', { ascending: false });

        if (filtroEstadoHistorial !== 'aprobados-rechazados') {
          fallbackQuery.eq('estado', filtroEstadoHistorial);
        }
        
        if (fechaInicioHistorial) {
          fallbackQuery.gte('actualizado_en', new Date(fechaInicioHistorial).toISOString());
        }
        
        if (fechaFinHistorial) {
          fallbackQuery.lte('actualizado_en', new Date(fechaFinHistorial + 'T23:59:59').toISOString());
        }

        if (busquedaEmpresa) {
          fallbackQuery.ilike('empresa_nombre', `%${busquedaEmpresa}%`);
        }

        fallbackQuery.range(from, to);

        const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery;

        if (fallbackError) {
          console.error('Error en consulta fallback:', fallbackError);
        } else {
          setHistorialPagos(fallbackData || []);
          setTotalCountHistorial(fallbackCount || 0);
          console.log('🔍 DEBUG: Fallback historial de pagos:', {
            items: fallbackData?.length,
            totalCount: fallbackCount,
            itemsPerPage: itemsPerPage,
            pageCount: Math.ceil((fallbackCount || 0) / itemsPerPage)
          });
        }
      } else {
          // Usar directamente los datos del comprobante sin sobrescribir el monto
    
        
          setHistorialPagos(data || []);
          setTotalCountHistorial(count || 0);
          console.log('🔍 DEBUG: Historial de pagos cargado:', {
            items: data?.length,
            totalCount: count,
            itemsPerPage: itemsPerPage,
            pageCount: Math.ceil((count || 0) / itemsPerPage),
            currentPage: Math.floor(itemOffset / itemsPerPage) + 1,
            itemOffset: itemOffset,
            shouldShowPagination: (count || 0) > itemsPerPage
          });
        }
    } catch (error) {
      console.error('Error en loadHistorialPagos:', error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Función para obtener monto de suscripción por empresa_id
  const getSubscriptionAmount = async (empresaId: string): Promise<number> => {
    try {
      if (!empresaId) {
        console.error('Empresa ID es null o undefined');
        return 0;
      }
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('suscripciones')
        .select(`
          monto,
          planes!inner (
            precio
          )
        `)
        .eq('empresa_id', empresaId)
        .maybeSingle();
      
      if (error) {
        console.error('Error obteniendo monto de suscripción:', error);
        return 0;
      }
      
      if (!data) {
        console.log('Suscripción no encontrada para empresa:', empresaId, '- buscando precio del plan...');
        // Si no hay suscripción, buscar el plan de la empresa
        return await getPlanPriceFromEmpresa(empresaId);
      }
      
      const monto = (data as any).monto || (data as any).planes?.precio || 0;
      console.log('🔍 DEBUG: Monto de suscripción para empresa', empresaId, ':', monto);
      return monto;
    } catch (error) {
      console.error('Error en getSubscriptionAmount:', error);
      return 0;
    }
  };

  // Función para obtener precio del plan desde la tabla empresas
  const getPlanPriceFromEmpresa = async (empresaId: string): Promise<number> => {
    try {
      if (!empresaId) {
        console.error('Empresa ID es null o undefined');
        return 0;
      }
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          plan_id,
          planes!inner (
            precio
          )
        `)
        .eq('id', empresaId)
        .single();
      
      if (error) {
        console.error('Error obteniendo plan de empresa:', error);
        return 0;
      }
      
      if (!data) {
        console.error('Empresa no encontrada:', empresaId);
        return 0;
      }
      
      const precio = (data as any).planes?.precio || 0;
      console.log('🔍 DEBUG: Precio del plan para empresa', empresaId, ':', precio);
      return precio;
    } catch (error) {
      console.error('Error en getPlanPriceFromEmpresa:', error);
      return 0;
    }
  };

  // Componente para mostrar beneficios del plan
  const PlanBenefits = ({ empresa }: { empresa: Empresa }) => {
    const benefits = [
      { key: 'tiene_inventario', label: 'Inventario', icon: '📦' },
      { key: 'tiene_comisiones', label: 'Comisiones', icon: '💰' },
      { key: 'tiene_marketing', label: 'Marketing', icon: '📢' },
      { key: 'soporte_prioritario', label: 'Soporte Prioritario', icon: '⭐' }
    ];

    return (
      <div className="flex gap-2">
        {benefits.map(benefit => (
          empresa[benefit.key as keyof Empresa] && (
            <span
              key={benefit.key}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              title={benefit.label}
            >
              {benefit.icon} {benefit.label}
            </span>
          )
        ))}
      </div>
    );
  };
  const getPlanPrice = async (planId: string): Promise<number> => {
    // Validación temprana para evitar errores de API
    if (!planId) {
      console.error('Plan ID es null o undefined');
      return 0;
    }
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('planes')
        .select('precio')
        .eq('id', planId)
        .single();
      
      if (error) {
        console.error('Error obteniendo precio del plan:', error);
        return 0;
      }
      
      if (!data) {
        console.error('Plan no encontrado para ID:', planId);
        return 0;
      }
      
      const precio = (data as any).precio || 0;
      console.log('🔍 DEBUG: Precio del plan', planId, ':', precio);
      return precio;
    } catch (error) {
      console.error('Error en getPlanPrice:', error);
      return 0;
    }
  };

  useEffect(() => {
    if (user?.rol === 'admin_global') {
      loadHistorialPagos();
    }
  }, [itemOffset, filtroEstadoHistorial, fechaInicioHistorial, fechaFinHistorial, busquedaEmpresa]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/suscripciones');
      const data = await response.json();

     

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando datos');
      }

      setTransacciones(data.transacciones || []);
      setEmpresas(data.empresas || []);
      setComprobantes(data.comprobantes || []);
      setComprobantesAprobados(data.comprobantesAprobados || []);  // ✅ Establecer comprobantes aprobados
      setComprobantesPendientes((data.comprobantes || []).filter((c: Comprobante) => c.estado === 'pendiente'));  // ✅ Solo pendientes para validación
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // ✅ Función para cargar solicitudes de cambio de plan
  const loadSolicitudesCambioPlan = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('suscripciones')
        .select(`
          *,
          empresas!inner (
            id,
            nombre
          ),
          planes!inner (
            id,
            nombre,
            precio
          )
        `)
        .eq('estado_pago', 'pendiente')
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error cargando solicitudes de cambio de plan:', error);
        return;
      }

      console.log('🔍 DEBUG: Solicitudes de cambio de plan:', data);
      setSolicitudesCambioPlan(data || []);
    } catch (error) {
      console.error('Error en loadSolicitudesCambioPlan:', error);
    }
  };

  // ✅ Función para aprobar solicitud de cambio de plan
  const aprobarSolicitudCambio = async (solicitud: any) => {
    try {
      setProcesandoAprobacion(true);
      const supabase = createClient();

      // Actualizar estado de la suscripción a pagado
      const { error: updateError } = await (supabase
        .from('suscripciones') as any)
        .update({
          estado_pago: 'pagado',
          actualizado_en: new Date().toISOString()
        })
        .eq('id', solicitud.id);

      if (updateError) {
        console.error('Error actualizando suscripción:', updateError);
        showNotificationModal('Error', 'Error al aprobar la solicitud', 'error');
        return;
      }

      // Actualizar plan_id en la tabla empresas para hacer el cambio efectivo
      // ✅ También actualizar fecha de vencimiento sumando 30 días
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
      
      const { error: updateEmpresaError } = await (supabase
        .from('empresas') as any)
        .update({
          plan_id: solicitud.plan_id,
          fecha_vencimiento: fechaVencimiento.toISOString(),
          actualizado_en: new Date().toISOString()
        })
        .eq('id', solicitud.empresa_id);

      if (updateEmpresaError) {
        console.error('Error actualizando empresa:', updateEmpresaError);
        showNotificationModal('Error', 'Error al actualizar el plan de la empresa', 'error');
        return;
      }

      // Recargar datos
      await loadSolicitudesCambioPlan();
      await loadData();
      
      showNotificationModal('✅ Solicitud Aprobada', 'La solicitud de cambio de plan ha sido aprobada exitosamente y el plan de la empresa ha sido actualizado.', 'success');
    } catch (error) {
      console.error('Error en aprobarSolicitudCambio:', error);
      showNotificationModal('Error', 'Error al aprobar la solicitud', 'error');
    } finally {
      setProcesandoAprobacion(false);
    }
  };

  // ✅ Función para rechazar solicitud de cambio de plan
  const rechazarSolicitudCambio = async (solicitud: any) => {
    // ✅ Usar modal de confirmación personalizado
    showConfirmModalDialog(
      '¿Rechazar Solicitud?',
      `¿Estás seguro de rechazar la solicitud de cambio de plan para ${solicitud.empresas?.nombre || 'esta empresa'}? Esta acción no se puede deshacer.`,
      async () => {
        try {
          setProcesandoRechazo(true);
          const supabase = createClient();

          // Eliminar la solicitud pendiente
          const { error } = await (supabase
            .from('suscripciones') as any)
            .delete()
            .eq('id', solicitud.id);

          if (error) {
            console.error('Error eliminando solicitud:', error);
            showNotificationModal('Error', 'Error al rechazar la solicitud', 'error');
            return;
          }

          // Recargar datos
          await loadSolicitudesCambioPlan();
          await loadData();
          
          showNotificationModal('❌ Solicitud Rechazada', 'La solicitud de cambio de plan ha sido rechazada y eliminada del sistema.', 'success');
        } catch (error) {
          console.error('Error en rechazarSolicitudCambio:', error);
          showNotificationModal('Error', 'Error al rechazar la solicitud', 'error');
        } finally {
          setProcesandoRechazo(false);
        }
      },
      'danger'
    );
  };

  // Estadísticas actualizadas con campos correctos de la BD
  const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const stats = {
    totalRecaudadoMes: comprobantesAprobados  // ✅ Usar comprobantes aprobados
      .filter(c => {
        const esAprobado = c.estado === 'aprobado';
        const fechaComprobante = c.actualizado_en || c.fecha_envio;
        const esMesActual = fechaComprobante?.startsWith(mesActual);
        console.log('🔍 DEBUG: Comprobante filtrado:', {
          id: c.id,
          estado: c.estado,
          fecha: fechaComprobante,
          esAprobado,
          esMesActual,
          monto: c.monto
        });
        return esAprobado && esMesActual;
      })
      .reduce((sum, c) => {
        const monto = Number(c.monto) || 0;
        console.log('🔍 DEBUG: Sumando monto:', monto, 'Total actual:', sum);
        return sum + monto;
      }, 0),
    empresasPendientes: empresas.filter(e => {
      // Contar empresas donde:
      // - estado_pago 'pendiente' o 'vencido' (si existe suscripción)
      // - estado === 'suspendido' (si no hay suscripción o está suspendida)
      const pendientePorPago = e.estado_pago === 'vencido' || e.estado_pago === 'pendiente';
      const pendientePorEstado = e.estado === 'suspendido';
      const pendiente = pendientePorPago || pendientePorEstado;
      console.log('🔍 DEBUG: Empresa pendiente:', {
        id: e.id,
        nombre: e.nombre,
        estado: e.estado,           // Campo de empresas
        estado_pago: e.estado_pago,  // Puede ser null si no hay suscripción
        pendientePorPago,
        pendientePorEstado,
        pendiente
      });
      return pendiente;
    }).length + solicitudesCambioPlan.length,  // ✅ Incluir solicitudes de cambio de plan
    suscripcionesActivas: empresas.filter(e => {
      // Contar empresas donde:
      // - estado_pago === 'pagado' (si existe suscripción)
      // - estado === 'activo' (si no hay suscripción o está activa)
      const activaPorEstado = e.estado === 'activo'; // ✅ Solo 'activo' (minúsculas)
      const activaPorPago = e.estado_pago === 'pagado';
      const activa = activaPorEstado || activaPorPago;
      console.log('🔍 DEBUG: Empresa activa:', {
        id: e.id,
        nombre: e.nombre,
        estado: e.estado,           // Campo de empresas
        estado_pago: e.estado_pago,  // Puede ser null si no hay suscripción
        activaPorEstado,
        activaPorPago,
        activa
      });
      return activa;
    }).length,
    totalTransacciones: comprobantes.filter(c => c.estado === 'aprobado').length
  };

  console.log('🔍 DEBUG: Comprobantes por estado:', comprobantes.reduce((acc: any, c) => {
    acc[c.estado] = (acc[c.estado] || 0) + 1;
    return acc;
  }, {}));
  
  // Forzar renderizado con useEffect
  useEffect(() => {
    console.log('🔍 DEBUG: Stats actualizadas:', stats);
  }, [stats]);

  // Forzar actualización cuando cambian los datos
  useEffect(() => {
    console.log('🔍 DEBUG: Datos cambiados - Empresas:', empresas.length, 'Comprobantes:', comprobantes.length);
    // Esto fuerza un re-render cuando los datos se cargan
  }, [empresas, comprobantes]);

  // Función para aprobar comprobante
  const aprobarComprobante = async (comprobanteId: string) => {
    try {
      // Validar que se haya seleccionado la acción de aprobar
      if (accionSeleccionada !== 'aprobar') {
        setErrorNotas('Debes seleccionar la acción "Aprobar" para procesar');
        return;
      }
          
      setProcesandoAprobacion(true);
      console.log('🔍 FRONTEND DEBUG: Aprobando comprobante con ID:', comprobanteId?.trim());

      const response = await fetch(`/api/comprobantes/${comprobanteId?.trim()}/aprobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'aprobar',
          notas: notasAprobacion.trim() || null // ✅ Enviar notas de aprobación
        }),
      });

      const data = await response.json();
      console.log('🔍 FRONTEND DEBUG: Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error aprobando comprobante');
      }

      // Recargar datos automáticamente para actualizar contadores
      await loadData();
      await loadHistorialPagos();
      
      console.log('🔍 FRONTEND DEBUG: Contador actualizado - Aprobados:', stats.totalTransacciones);
      setShowComprobanteModal(false);
      setComprobanteSeleccionado(null);
      setPrecioPlanActual(0);
      setNotasRechazo('');
      setNotasAprobacion('');
      setAccionSeleccionada(null); // ✅ Limpiar radio button de acción
      setErrorNotas('');

    } catch (error) {
      console.error('❌ FRONTEND ERROR: Error aprobando comprobante:', error);
      console.log('❌ FRONTEND DEBUG: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack available'
      });
    } finally {
      setProcesandoAprobacion(false);
    }
  };

  // Función para rechazar comprobante
  const rechazarComprobante = async (comprobanteId: string) => {
    // Validar que se haya seleccionado la acción de rechazar
    if (accionSeleccionada !== 'rechazar') {
      setErrorNotas('Debes seleccionar la acción "Rechazar" para procesar');
      return;
    }

    // Validar que las notas no estén vacías
    if (!notasRechazo.trim()) {
      setErrorNotas('Debes escribir una nota explicando el motivo del rechazo');
      return;
    }

    try {
      setProcesandoRechazo(true);
      setErrorNotas('');

      const response = await fetch(`/api/comprobantes/${comprobanteId}/rechazar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notas: notasRechazo.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error rechazando comprobante');
      }

      // Recargar datos automáticamente para actualizar contadores
      await loadData();
      await loadHistorialPagos();
      
      console.log('Comprobante rechazado:', data.message);
      setShowComprobanteModal(false);
      setComprobanteSeleccionado(null);
      setPrecioPlanActual(0);
      setNotasRechazo('');
      setNotasAprobacion('');
      setAccionSeleccionada(null); // ✅ Limpiar radio button de acción

    } catch (error) {
      console.error('Error rechazando comprobante:', error);
    } finally {
      setProcesandoRechazo(false);
    }
  };

  // Función para abrir modal de comprobante
  const openComprobanteModal = (comprobante: Comprobante) => {
 
    
    setComprobanteSeleccionado(comprobante);
    
    // Usar el precio del plan que viene del API
    const precioPlan = (comprobante as any).planes?.precio || comprobante.monto || 0;
    setPrecioPlanActual(precioPlan);
    
    setShowComprobanteModal(true);
  };

  // Función para detectar si es una solicitud de cambio de plan
  const esCambioPlan = (comprobante: Comprobante) => {
    // Si tiene plan_id y es diferente al plan actual de la empresa
    const empresa = empresas.find(e => e.id === comprobante.empresa_id);
    const esCambio = comprobante.plan_id && empresa && empresa.plan_id !== comprobante.plan_id;
    console.log('🔍 DEBUG: esCambioPlan para comprobante', comprobante.id, ':', {
      comprobante_plan_id: comprobante.plan_id,
      empresa_plan_id: empresa?.plan_id,
      esCambio,
      empresa_nombre: empresa?.nombre
    });
    
    return esCambio;
  };

  // Función para obtener detalles del plan solicitado
  const getDetallesPlanSolicitado = async (planId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('planes')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (error) {
        console.error('Error obteniendo detalles del plan:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error en getDetallesPlanSolicitado:', error);
      return null;
    }
  };

  // Función para calcular monto con IVA
  const calcularMontoConIVA = (precioBase: number) => {
    return precioBase * 1.16; // 16% de IVA
  };

  // Función para obtener precio del plan
  const getPrecioPlan = async (planId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await (supabase
        .from('planes') as any)
        .select('precio')
        .eq('id', planId)
        .single();
      
      if (error) {
        console.error('Error obteniendo precio del plan:', error);
        return 0;
      }
      
      return data?.precio || 0;
    } catch (error) {
      console.error('Error en getPrecioPlan:', error);
      return 0;
    }
  };

  // Función para cerrar modal de comprobante
  const closeComprobanteModal = () => {
    setShowComprobanteModal(false);
    setComprobanteSeleccionado(null);
    setPrecioPlanActual(0);
    setNotasRechazo('');
    setNotasAprobacion('');
    setAccionSeleccionada(null); // ✅ Limpiar radio button de acción
    setErrorNotas('');
  };

  // Función para formatear bytes
  const formatearBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    const opciones: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
  };

  const formatearMonto = (monto: number | string | undefined) => {
    if (!monto || monto === '0') return '$0.00';
    const numMonto = typeof monto === 'string' ? parseFloat(monto) : monto;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numMonto);
  };

  // Abrir modal de pago
  const openPagoModal = () => {
    // Pre-seleccionar la primera empresa pendiente si existe
    const empresaPendiente = empresas.find(e => e.estado_pago !== 'pagado');
    setPagoFormData({
      empresa_id: empresaPendiente?.id || '',
      monto: empresaPendiente?.plan_precio?.toString() || '',
      metodo: 'manual',
      periodo: new Date().toISOString().slice(0, 7), // YYYY-MM
      notas: ''
    });
    setShowPagoModal(true);
  };

  // Cerrar modal de pago
  const closePagoModal = () => {
    setShowPagoModal(false);
    setPagoFormData({
      empresa_id: '',
      monto: '',
      metodo: 'manual',
      periodo: new Date().toISOString().slice(0, 7), // YYYY-MM
      notas: ''
    });
  };

  // Registrar pago manual
  const registrarPagoManual = async () => {
    try {
      setProcesandoPago(true);

      // Calcular próximo vencimiento (30 días desde hoy)
      const proximoVencimiento = new Date();
      proximoVencimiento.setDate(proximoVencimiento.getDate() + 30);
      const proximoVencimientoStr = proximoVencimiento.toISOString().split('T')[0];

      const response = await fetch('/api/suscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: pagoFormData.empresa_id,
          monto: parseFloat(pagoFormData.monto),
          metodo: pagoFormData.metodo,
          periodo_cobertura: pagoFormData.periodo,
          proximo_vencimiento: proximoVencimientoStr,
          notas: pagoFormData.notas,
          fecha_pago: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error registrando pago');
      }

      // Recargar datos automáticamente
      await loadData();
      
      console.log('Pago registrado:', data.message);
      closePagoModal();

    } catch (error) {
      console.error('Error registrando pago:', error);
    } finally {
      setProcesandoPago(false);
    }
  };

  if (loading || loadingData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando suscripciones...</div>
        </div>
      </MainLayout>
    );
  }

  if (!user || user.rol !== 'admin_global') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">No tienes permisos para acceder a esta página</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Financiero</h1>
            <p className="text-gray-600 mt-2">Gestión de suscripciones y pagos</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-2">
              {stats.totalTransacciones} aprobados
            </Badge>
            <Badge variant="default" className="px-3 py-2 bg-green-100 text-green-800">
              {stats.suscripcionesActivas} activas
            </Badge>
            <Badge variant="destructive" className="px-3 py-2">
              {stats.empresasPendientes} pendientes
            </Badge>
          </div>
        </div>

        {/* ✅ Solicitudes de Cambio de Plan */}
        {solicitudesCambioPlan.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Solicitudes de Cambio de Plan</CardTitle>
                  <CardDescription>
                    Gestiona las solicitudes de cambio de plan de las empresas
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {solicitudesCambioPlan.length} pendientes
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Plan Solicitado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha Solicitud
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {solicitudesCambioPlan.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {solicitud.empresas?.nombre || 'Empresa desconocida'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {solicitud.planes?.nombre || 'Plan desconocido'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${solicitud.planes?.precio || 0}/mes
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-blue-600">
                            ${solicitud.monto?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {new Date(solicitud.creado_en).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => aprobarSolicitudCambio(solicitud)}
                              disabled={procesandoAprobacion}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {procesandoAprobacion ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <CheckIcon className="w-4 h-4 mr-1" />
                                  Aprobar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => rechazarSolicitudCambio(solicitud)}
                              disabled={procesandoRechazo}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {procesandoRechazo ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <XMarkIcon className="w-4 h-4 mr-1" />
                                  Rechazar
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BanknotesIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Recaudado Este Mes</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatearMonto(stats.totalRecaudadoMes)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Comprobantes aprobados este mes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Empresas Pendientes de Pago</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {stats.empresasPendientes}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Requieren atención
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Suscripciones Activas</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.suscripcionesActivas}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pagos al día
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empresas y sus Beneficios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
              Empresas y Beneficios de Plan
            </CardTitle>
            <CardDescription>
              Visualiza los beneficios activos de cada empresa según su plan de suscripción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {empresas.map((empresa) => (
                <div key={empresa.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{empresa.nombre}</h3>
                        <span className="text-sm text-gray-500">
                          {empresa.plan_nombre} (${empresa.plan_precio}/mes)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          empresa.estado === 'activo'
                            ? 'bg-green-100 text-green-800' 
                            : empresa.estado === 'suspendido'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {empresa.estado === 'activo' ? 'Activa' : empresa.estado === 'suspendido' ? 'Suspendida' : 'Pendiente'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          empresa.estado_pago === 'pagado'
                            ? 'bg-blue-100 text-blue-800'
                            : empresa.estado_pago === 'vencido'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {empresa.estado_pago === 'pagado' ? 'Pagado' : empresa.estado_pago === 'vencido' ? 'Vencido' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                    <PlanBenefits empresa={empresa} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Transacciones</h2>
          {/* Botón de Registrar Pago Manual eliminado */}
        </div>

        {/* Comprobantes por Validar */}
        {comprobantesPendientes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-amber-600" />
                Comprobantes por Validar ({comprobantesPendientes.length})
              </CardTitle>
              <CardDescription>
                Revisa y aprueba los comprobantes de pago enviados por las empresas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Envío
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Archivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tamaño
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comprobantesPendientes.map((comprobante) => (
                      <tr key={comprobante.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {comprobante.empresa_nombre}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(comprobante.fecha_envio).toLocaleDateString('es-ES')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(comprobante.fecha_envio).toLocaleTimeString('es-ES')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {comprobante.nombre_archivo}
                            </span>
                            {esCambioPlan(comprobante) && (
                              <span className="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium shadow-md animate-pulse">
                                🔄 Solicitud de Cambio de Plan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatearBytes(comprobante.tamano_bytes)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openComprobanteModal(comprobante)}
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Pagos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Historial de Pagos</h3>
                <p className="text-sm text-gray-600">Comprobantes aprobados y rechazados</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filtroEstadoHistorial}
                    onChange={(e) => {
                      setFiltroEstadoHistorial(e.target.value);
                      setItemOffset(0);
                    }}
                  >
                    <option value="aprobados-rechazados">Aprobados y Rechazados</option>
                    <option value="aprobado">Aprobados</option>
                    <option value="rechazado">Rechazados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={fechaInicioHistorial}
                    onChange={(e) => {
                      setFechaInicioHistorial(e.target.value);
                      setItemOffset(0);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={fechaFinHistorial}
                    onChange={(e) => {
                      setFechaFinHistorial(e.target.value);
                      setItemOffset(0);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Empresa</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del salón..."
                    value={busquedaEmpresa}
                    onChange={(e) => {
                      setBusquedaEmpresa(e.target.value);
                      setItemOffset(0);
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiltroEstadoHistorial('aprobados-rechazados');
                      setFechaInicioHistorial('');
                      setFechaFinHistorial('');
                      setBusquedaEmpresa('');
                      setItemOffset(0);
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla de Historial */}
            {historialPagos && historialPagos.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historialPagos.map((comprobante) => (
                        <tr key={comprobante.id} className={comprobante.estado === 'rechazado' ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">
                                {comprobante.empresas?.nombre || comprobante.empresa_nombre || 'Empresa desconocida'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatearFecha(comprobante.actualizado_en || comprobante.fecha_envio)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {comprobante.estado === 'aprobado' ? (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                <CheckCircleIcon className="w-3 h-3" />
                                Aprobado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                <XCircleIcon className="w-3 h-3" />
                                Rechazado
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <CurrencyDollarIcon className="w-4 h-4 text-green-600 mr-1" />
                              {formatearMonto(comprobante.monto)}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openComprobanteModal(comprobante)}
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación con react-paginate */}
                {totalCountHistorial > itemsPerPage && (
                  <div className="flex justify-center mt-6">
                    <ReactPaginate
                      previousLabel={"Anterior"}
                      nextLabel={"Siguiente"}
                      breakLabel={"..."}
                      breakClassName={"break-me"}
                      pageCount={Math.ceil(totalCountHistorial / itemsPerPage)}
                      marginPagesDisplayed={2}
                      pageRangeDisplayed={5}
                      onPageChange={(page) => setItemOffset(page.selected * itemsPerPage)}
                      containerClassName={"pagination flex justify-center gap-2"}
                      activeClassName={"bg-blue-600 text-white px-3 py-2 rounded-md"}
                      pageClassName={"px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"}
                      previousClassName={"px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"}
                      nextClassName={"px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"}
                      disabledClassName={"px-3 py-2 border border-gray-300 rounded-md opacity-50 cursor-not-allowed"}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  {loadingHistorial ? 'Cargando...' : 'No hay comprobantes en el historial'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Comprobante */}
        {showComprobanteModal && comprobanteSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-6xl w-[1200px] max-h-[90vh] flex flex-col shadow-2xl">
              <CardContent className="p-6 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {esCambioPlan(comprobanteSeleccionado) ? 'Solicitud de Cambio de Plan' : 'Ver Comprobante'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeComprobanteModal}
                  >
                    ×
                  </Button>
                </div>

                {/* Nota de diferenciación para cambios de plan */}
                {esCambioPlan(comprobanteSeleccionado) && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                      <div className="text-sm text-blue-800">
                        <strong>Solicitud de cambio:</strong> {empresas.find(e => e.id === comprobanteSeleccionado.empresa_id)?.plan_nombre || 'Plan actual'} → {(comprobanteSeleccionado as any).planes?.nombre || 'Nuevo plan'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {/* Información del Comprobante */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Empresa
                      </label>
                      <div className="text-sm text-gray-900">
                        {comprobanteSeleccionado.empresa_nombre}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Envío
                      </label>
                      <div className="text-sm text-gray-900">
                        {new Date(comprobanteSeleccionado.fecha_envio).toLocaleDateString('es-ES')} {' '}
                        {new Date(comprobanteSeleccionado.fecha_envio).toLocaleTimeString('es-ES')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Archivo
                      </label>
                      <div className="text-sm text-gray-900">
                        {comprobanteSeleccionado.nombre_archivo}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tamaño
                      </label>
                      <div className="text-sm text-gray-900">
                        {formatearBytes(comprobanteSeleccionado.tamano_bytes)}
                      </div>
                    </div>
                  </div>

                  {/* Detalles del Plan - Solo para cambios de plan */}
                  {esCambioPlan(comprobanteSeleccionado) && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🔄</span>
                        Detalles del Nuevo Plan Solicitado
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Plan
                          </label>
                          <div className="text-sm font-semibold text-purple-900">
                            {(comprobanteSeleccionado as any).planes?.nombre || 'Plan desconocido'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio Mensual (con IVA)
                          </label>
                          <div className="text-lg font-bold text-purple-900 bg-purple-100 px-3 py-2 rounded">
                            {formatearMonto(comprobanteSeleccionado.monto || ((comprobanteSeleccionado as any).planes?.precio * 1.16))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Usuarios Permitidos
                          </label>
                          <div className="text-sm font-semibold text-purple-900 bg-purple-100 px-2 py-1 rounded">
                            {(comprobanteSeleccionado as any).planes?.limite_usuarios || 'Ilimitados'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sucursales Permitidas
                          </label>
                          <div className="text-sm font-semibold text-purple-900 bg-purple-100 px-2 py-1 rounded">
                            {(comprobanteSeleccionado as any).planes?.limite_sucursales || 'Ilimitadas'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inventario
                          </label>
                          <div className="text-sm text-gray-900">
                            {(comprobanteSeleccionado as any).planes?.tiene_inventario ? '✅ Sí' : '❌ No'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comisiones
                          </label>
                          <div className="text-sm text-gray-900">
                            {(comprobanteSeleccionado as any).planes?.tiene_comisiones ? '✅ Sí' : '❌ No'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marketing
                          </label>
                          <div className="text-sm text-gray-900">
                            {(comprobanteSeleccionado as any).planes?.tiene_marketing ? '✅ Sí' : '❌ No'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Soporte Prioritario
                          </label>
                          <div className="text-sm text-gray-900">
                            {(comprobanteSeleccionado as any).planes?.soporte_prioritario ? '✅ Sí' : '❌ No'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información de Pago Normal - Solo para pagos regulares */}
                  {!esCambioPlan(comprobanteSeleccionado) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        Detalles del Pago
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto del Pago (con IVA)
                          </label>
                          <div className="text-lg font-bold text-green-900 bg-green-100 px-3 py-2 rounded">
                            {formatearMonto(comprobanteSeleccionado.monto)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                          </label>
                          <div className="text-sm text-gray-900">
                            Pago de Factura Mensual
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vista del Comprobante */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vista del Comprobante
                    </label>
                    <div className="border border-gray-300 rounded-lg bg-gray-50 h-[300px] overflow-y-auto">
                      {comprobanteSeleccionado.tipo_archivo.startsWith('image/') ? (
                        <div className="p-2">
                          <img 
                            src={comprobanteSeleccionado.url_archivo} 
                            alt={comprobanteSeleccionado.nombre_archivo}
                            className="max-w-full h-auto mx-auto"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <DocumentTextIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            <a 
                              href={comprobanteSeleccionado.url_archivo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Abrir archivo en nueva pestaña
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Opciones de acción - Radio Buttons (solo para comprobantes pendientes) */}
                  {comprobanteSeleccionado.estado === 'pendiente' && (
                    <div className="space-y-4 mb-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seleccionar Acción <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center space-x-6">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="accion"
                              value="aprobar"
                              checked={accionSeleccionada === 'aprobar'}
                              onChange={(e) => setAccionSeleccionada(e.target.value as 'aprobar' | 'rechazar')}
                              className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Aprobar
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="accion"
                              value="rechazar"
                              checked={accionSeleccionada === 'rechazar'}
                              onChange={(e) => setAccionSeleccionada(e.target.value as 'aprobar' | 'rechazar')}
                              className="mr-2 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Rechazar
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notas para aprobación (solo si se selecciona aprobar y está pendiente) */}
                  {comprobanteSeleccionado.estado === 'pendiente' && accionSeleccionada === 'aprobar' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas de Aprobación <span className="text-gray-400">(opcional)</span>
                      </label>
                      <textarea
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Notas sobre la aprobación (opcional)..."
                        value={notasAprobacion}
                        onChange={(e) => setNotasAprobacion(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Notas para rechazo (solo si se selecciona rechazar y está pendiente) */}
                  {comprobanteSeleccionado.estado === 'pendiente' && accionSeleccionada === 'rechazar' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas de Rechazo <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errorNotas ? 'border-red-500' : 'border-gray-300'
                        }`}
                        rows={2}
                        placeholder="Motivo del rechazo (obligatorio)..."
                        value={notasRechazo}
                        onChange={(e) => {
                          setNotasRechazo(e.target.value);
                          if (errorNotas) setErrorNotas('');
                        }}
                      />
                    </div>
                  )}

                  {errorNotas && (
                    <p className="text-red-500 text-xs mt-1">{errorNotas}</p>
                  )}

                  {/* Notas existentes */}
                  {comprobanteSeleccionado.notas && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas Existentes
                      </label>
                      <div className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                        {comprobanteSeleccionado.notas}
                      </div>
                    </div>
                  )}

                  {/* Acciones - Footer Fijo */}
                  <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 bg-white sticky bottom-0 z-10 shadow-lg rounded-t-lg">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={closeComprobanteModal}
                    >
                      Cerrar
                    </Button>
                    {/* Solo mostrar botones de acción si está pendiente */}
                    {comprobanteSeleccionado.estado === 'pendiente' && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => rechazarComprobante(comprobanteSeleccionado.id)}
                          disabled={procesandoRechazo || procesandoAprobacion}
                        >
                          {procesandoRechazo ? (
                            <>
                              <ClockIcon className="w-3 h-3 mr-1 animate-spin" />
                              Rechazando...
                            </>
                          ) : (
                            <>
                              <XMarkIcon className="w-3 h-3 mr-1" />
                              Rechazar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => aprobarComprobante(comprobanteSeleccionado.id)}
                          disabled={procesandoAprobacion || procesandoRechazo}
                        >
                          {procesandoAprobacion ? (
                            <>
                              <ClockIcon className="w-3 h-3 mr-1 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-3 h-3 mr-1" />
                              Aprobar
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Registro de Pago Manual */}
        {showPagoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Registrar Pago Manual</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closePagoModal}
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Selección de Empresa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa
                    </label>
                    <select
                      value={pagoFormData.empresa_id}
                      onChange={(e) => {
                        const empresaSeleccionada = empresas.find(emp => emp.id === e.target.value);
                        setPagoFormData({ 
                          ...pagoFormData, 
                          empresa_id: e.target.value,
                          monto: empresaSeleccionada?.plan_precio?.toString() || pagoFormData.monto
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Seleccionar empresa...</option>
                      {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.nombre} - {empresa.plan_nombre} (${empresa.plan_precio}/mes)
                          {empresa.estado_pago !== 'pagado' && ' - PENDIENTE'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Período de Cobertura */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Período de Cobertura
                    </label>
                    <input
                      type="month"
                      value={pagoFormData.periodo}
                      onChange={(e) => setPagoFormData({ ...pagoFormData, periodo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Monto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto del Pago
                    </label>
                    <input
                      type="number"
                      value={pagoFormData.monto}
                      onChange={(e) => setPagoFormData({ ...pagoFormData, monto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {/* Método de Pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago
                    </label>
                    <select
                      value={pagoFormData.metodo}
                      onChange={(e) => setPagoFormData({ ...pagoFormData, metodo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="manual">Manual (Efectivo/Transferencia)</option>
                      <option value="automatico">Automático</option>
                    </select>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas (Opcional)
                    </label>
                    <textarea
                      value={pagoFormData.notas}
                      onChange={(e) => setPagoFormData({ ...pagoFormData, notas: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus-amber-500"
                      rows={3}
                      placeholder="Referencia de transferencia, número de recibo, etc."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={closePagoModal}
                    disabled={procesandoPago}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={registrarPagoManual}
                    disabled={procesandoPago || !pagoFormData.empresa_id || !pagoFormData.monto || parseFloat(pagoFormData.monto) <= 0}
                  >
                    {procesandoPago ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Procesando...
                      </>
                    ) : (
                      'Registrar Pago'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ✅ Modal de Confirmación */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${
              confirmConfig.type === 'danger' ? 'bg-red-100' :
              confirmConfig.type === 'warning' ? 'bg-amber-100' :
              'bg-gray-100'
            }`}>
              {confirmConfig.type === 'danger' && (
                <XMarkIcon className="w-5 h-5 text-red-600" />
              )}
              {confirmConfig.type === 'warning' && (
                <InformationCircleIcon className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {confirmConfig.title}
              </h3>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            {confirmConfig.message}
          </p>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                setShowConfirmModal(false);
                await confirmConfig.onConfirm();
              }}
              className={`px-4 py-2 ${
                confirmConfig.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                confirmConfig.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Modal de Notificaciones */}
      <Dialog open={showNotification} onOpenChange={setShowNotification}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${
              notificationConfig.type === 'success' ? 'bg-green-100' :
              notificationConfig.type === 'error' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              {notificationConfig.type === 'success' && (
                <CheckIcon className="w-5 h-5 text-green-600" />
              )}
              {notificationConfig.type === 'error' && (
                <XMarkIcon className="w-5 h-5 text-red-600" />
              )}
              {notificationConfig.type === 'info' && (
                <InformationCircleIcon className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {notificationConfig.title}
              </h3>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            {notificationConfig.message}
          </p>
          
          <DialogFooter>
            <Button
              onClick={() => setShowNotification(false)}
              className={`w-full ${
                notificationConfig.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                notificationConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
