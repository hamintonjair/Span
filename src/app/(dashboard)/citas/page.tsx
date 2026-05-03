'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Calendar, Search, UserPlus, Clock, CheckCircle, FileText, ChevronLeft, ChevronRight, Plus, Play, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { useCancelacionAutomatica } from '@/hooks/use-cancelacion-automatica';
import { registrarLog } from '@/lib/audit';

// Interfaces TypeScript
interface Cita {
  id: string;
  empresa_id: string;
  cliente_id: string;
  empleado_id: string;
  fecha: string;
  estado: 'pendiente' | 'confirmada' | 'en_atencion' | 'atendido' | 'finalizado' | 'cancelada' | 'anulada' | 'vencida';
  total_estimado: number;
  servicios_ids: string[];
  notas?: string | null;
  created_at: string;
  updated_at: string;
  clientes?: {
    nombre: string;
    cedula?: string;
  };
  empleados?: {
    nombre: string;
    rol?: string;
  };
  servicios?: {
    nombre: string;
    precio?: number;
    duracion_minutos?: number;
  };
}

interface Cliente {
  id: string;
  empresa_id: string;
  nombre: string;
  cedula?: string;
  email?: string;
  telefono?: string;
  created_at: string;
  updated_at: string;
}

interface Empleado {
  id: string;
  empresa_id: string;
  nombre_completo: string;
  email_empleado: string;
  telefono?: string;
  direccion?: string;
  cedula?: string;
  estado: string;
  sueldo_base?: number;
  porcentaje_comision?: number;
  fecha_contratacion?: string;
  created_at: string;
  updated_at: string;
}

interface Servicio {
  id: string;
  empresa_id: string;
  nombre: string;
  precio: number;
  duracion_minutos: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

export default function CitasPage() {
  const { user, loading } = useJWTAuth();
  
  // Estados para datos
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estados para modales
  const [showNuevaCitaModal, setShowNuevaCitaModal] = useState(false);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [showCitasDiaModal, setShowCitasDiaModal] = useState(false);
  const [showCitaDetalleModal, setShowCitaDetalleModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [selectedDayCitas, setSelectedDayCitas] = useState<Cita[]>([]);
  
  // Estados para calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Inicializar cancelación automática global
  useCancelacionAutomatica();
  
  // Formulario nueva cita
  interface NuevaCita {
    cliente_id: string;
    empleado_id: string;
    servicios_ids: string[];
    fecha: string;
    notas: string;
  }
  
  const [nuevaCita, setNuevaCita] = useState<NuevaCita>({
    cliente_id: '',
    empleado_id: '',
    servicios_ids: [],
    fecha: '',
    notas: ''
  });
  
  // Estados de búsqueda
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [busquedaEmpleado, setBusquedaEmpleado] = useState('');
  const [busquedaServicio, setBusquedaServicio] = useState('');

  // Estados para paginación/limitación
  const [limiteResultados, setLimiteResultados] = useState(3);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  
  // Estados para modales de selección
  const [showModalClientes, setShowModalClientes] = useState(false);
  const [showModalEmpleados, setShowModalEmpleados] = useState(false);
  const [showModalServicios, setShowModalServicios] = useState(false);
  
  // Estados para toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Función para mostrar toast
  const mostrarToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Función para formatear fecha con timezone de Bogotá
  const formatearFechaBogota = (fechaString: string) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleTimeString('es-CO', { 
        timeZone: 'America/Bogota', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return fechaString;
    }
  };

  // Función para formatear fecha completa con timezone de Bogotá
  const formatearFechaCompletaBogota = (fechaString: string) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formateando fecha completa:', error);
      return fechaString;
    }
  };

  // Función para convertir fecha local a UTC con offset correcto
  const convertirFechaLocalAUTC = (fechaLocal: string) => {
    try {
      // Parsear la fecha local como si estuviera en Bogotá
      const fechaEnBogota = new Date(fechaLocal);
      
      // Convertir a UTC manteniendo la hora local de Bogotá
      const fechaUTC = toZonedTime(fechaEnBogota, 'America/Bogota');
      
      // Retornar string ISO con offset explícito
      return fechaUTC.toISOString();
    } catch (error) {
      console.error('Error convirtiendo fecha local a UTC:', error);
      return fechaLocal;
    }
  };

  // Función para convertir fecha UTC a hora local de Bogotá
  const convertirUTCAHoraBogota = (fechaUTCString: string) => {
    try {
      const fechaUTC = new Date(fechaUTCString);
      const fechaEnBogota = fromZonedTime(fechaUTC, 'America/Bogota');
      return fechaEnBogota;
    } catch (error) {
      console.error('Error convirtiendo UTC a hora Bogotá:', error);
      return new Date(fechaUTCString);
    }
  };

  // Función para verificar si una cita está pasada y cancelarla automáticamente
  const verificarYCancelarCitasPasadas = async () => {
    if (!user?.empresa_id) return;

    try {
      // Obtener fecha y hora actual en Bogotá
      const ahora = new Date();
      const ahoraBogota = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Bogota" }));
      
      // Restar 15 minutos para cancelación automática
      const limiteCancelacion = new Date(ahoraBogota.getTime() - 15 * 60000);

      // Buscar citas pendientes
      const { data: citasPendientes, error: errorConsulta } = await (supabase as any)
        .from('citas')
        .select('id, fecha, estado')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'pendiente');

      if (errorConsulta) {
        console.error('Error consultando citas pendientes:', errorConsulta);
        return;
      }

      if (!citasPendientes || citasPendientes.length === 0) {
        return;
      }

      // Filtrar citas que realmente están pasadas (comparando en zona Bogotá)
      const citasPasadas = citasPendientes.filter((cita: any) => {
        const fechaCitaEnBogota = convertirUTCAHoraBogota(cita.fecha);
        return fechaCitaEnBogota < limiteCancelacion;
      });

      if (citasPasadas.length === 0) {
        return;
      }

      // Formatear fecha y hora actual para notas
      const fechaActualBogota = ahoraBogota.toLocaleString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Cancelar cada cita pasada
      for (const cita of citasPasadas) {
        const { error: errorUpdate } = await (supabase as any)
          .from('citas')
          .update({
            estado: 'cancelada',
            notas: `Anulada automáticamente por incumplimiento - ${fechaActualBogota}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', cita.id);

        if (errorUpdate) {
          console.error(`Error cancelando cita ${cita.id}:`, errorUpdate);
        } else {
          // Registrar log de auditoría para cancelación automática
          await registrarLog(supabase, {
            empresa_id: user?.empresa_id || undefined,
            usuario_id: user?.id,
            accion: 'CANCELAR_CITA',
            modulo: 'CITAS',
            detalles: {
              cita_id: cita.id,
              cliente_id: cita.cliente_id,
              cliente_nombre: cita.clientes?.nombre || 'Desconocido',
              empleado_id: cita.empleado_id,
              empleado_nombre: cita.empleados?.nombre || 'Desconocido',
              fecha_original: cita.fecha,
              motivo_cancelacion: 'Anulada automáticamente por incumplimiento',
              cancelado_por: 'Sistema Automático',
              fecha_cancelacion: new Date().toISOString()
            }
          });
        }
      }

      // Recargar citas para actualizar la interfaz
      await cargarDatos();
      

      if (citasPasadas.length > 0) {
        mostrarToast(
          `${citasPasadas.length} cita(s) cancelada(s) automáticamente por incumplimiento`, 
          'info'
        );
      }

    } catch (error) {
      console.error('Error en cancelación automática:', error);
    }
  };
  
  // Estados para mostrar resultados
  const [mostrarClientes, setMostrarClientes] = useState(false);
  const [mostrarEmpleados, setMostrarEmpleados] = useState(false);
  const [mostrarServicios, setMostrarServicios] = useState(false);
  
  // Formulario nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    cedula: '',
    email: '',
    telefono: ''
  });

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!user.empresa_id) {
      alert('Tu usuario no tiene una empresa asignada. Contacta al administrador.');
      return;
    }
    cargarDatos();
  }, [user, loading]);

  const cargarDatos = async (retryCount = 0) => {
    if (!user?.empresa_id) {
      if (retryCount < 3) {
        setTimeout(() => cargarDatos(retryCount + 1), 1000);
        return;
      } else {
        console.error('❌ No hay empresa_id después de 3 intentos:', user);
        alert('Tu usuario no tiene una empresa asignada. Contacta al administrador.');
        return;
      }
    }
    
    setLoadingData(true);
    try {
      // Calcular rango de fechas visible en el calendario (mes actual + 1 mes antes y después)
      const inicioMes = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const finMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      
      // Cargar servicios
      const { data: serviciosData, error: serviciosError } = await (supabase as any)
        .from('servicios')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .order('nombre');

      if (serviciosError) {
        console.error('Error en servicios:', serviciosError);
        throw serviciosError;
      }
      setServicios(serviciosData || []);
      console.log('✅ Servicios cargados:', serviciosData?.length || 0);

      // Cargar clientes
      const { data: clientesData, error: clientesError } = await (supabase as any)
        .from('clientes')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('nombre');

      if (clientesError) {
        console.error('Error en clientes:', clientesError);
        throw clientesError;
      }
      setClientes(clientesData || []);
      
      // Cargar empleados
      const { data: empleadosData, error: empleadosError } = await (supabase as any)
        .from('empleados')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .order('nombre_completo');

      if (empleadosError) {
        console.error('Error en empleados:', empleadosError);
        throw empleadosError;
      }
      setEmpleados(empleadosData || []);

      // Cargar citas con filtro de rango de fechas optimizado Y filtro de estado
      const { data: citasData, error: citasError } = await (supabase as any)
        .from('citas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .gte('fecha', inicioMes.toISOString())
        .lte('fecha', finMes.toISOString())
        .in('estado', ['pendiente', 'confirmada'])  // Solo pendientes y confirmadas
        .order('fecha', { ascending: true });

      if (citasError) {
        console.error('Error en citas:', citasError);
        throw citasError;
      }
      setCitas(citasData || []);
      
      // Estadísticas de citas (solo pendientes/confirmadas para el calendario)
      const hoy = new Date();
      const citasHoy = citasData?.filter((cita: Cita) => {
        const citaDate = new Date(cita.fecha);
        return citaDate.toDateString() === hoy.toDateString();
      }) || [];
      
      const citasPendientes = citasData?.filter((cita: Cita) => cita.estado === 'pendiente') || [];
      const citasConfirmadas = citasData?.filter((cita: Cita) => cita.estado === 'confirmada') || [];

    } catch (error) {
      console.error('💥 Error crítico cargando datos:', error);
      alert('Error al cargar datos. Revisa la consola para más detalles.');
    } finally {
      setLoadingData(false);
    }
  };

  // Efecto para actualización automática de notas cada 5 segundos
  useEffect(() => {
    const intervaloActualizacion = setInterval(() => {
      // Solo actualizar el estado para forzar re-renderizado de notas
      // Esto hace que los conteos regresivos se actualicen en tiempo real
      setCitas(prev => [...prev]);
    }, 5000); // Actualizar cada 5 segundos para tiempo real

    return () => {
      clearInterval(intervaloActualizacion);
    };
  }, []);

  // Recargar datos cuando cambia el mes actual
  useEffect(() => {
    if (user && !loading) {
      cargarDatos();
    }
  }, [currentDate]);

  // Efecto para escuchar cancelaciones automáticas desde el hook global
  useEffect(() => {
    const manejarCancelacionAutomatica = (event: CustomEvent) => {
      const { cantidad, fecha } = event.detail;
      console.log('📅 Recibido evento de cancelación automática:', { cantidad, fecha });
      
      // Recargar datos para actualizar contadores
      cargarDatos();
      
      // Mostrar notificación
      mostrarToast(
        `${cantidad} cita(s) cancelada(s) automáticamente por incumplimiento`, 
        'info'
      );
    };

    // Escuchar evento personalizado
    window.addEventListener('citasCanceladasAutomaticamente', manejarCancelacionAutomatica as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('citasCanceladasAutomaticamente', manejarCancelacionAutomatica as EventListener);
    };
  }, [cargarDatos, mostrarToast]);

  // Efecto para cancelación automática de citas pasadas (local)
  useEffect(() => {
    if (user && !loading && citas.length > 0) {
      // Ejecutar cancelación automática cuando se cargan las citas
      verificarYCancelarCitasPasadas();
    }
  }, [user, loading, citas.length]); // Se ejecuta cuando el usuario está cargado y hay citas

  // Función para resetear el formulario de nueva cita
  const resetFormularioNuevaCita = () => {
    // Obtener fecha y hora actual en formato datetime-local (YYYY-MM-DDTHH:mm)
    const now = new Date();
    
    // Usar método más robusto para formato datetime-local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Formato: YYYY-MM-DDTHH:mm (sin segundos, sin zona horaria)
    const fechaActual = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setNuevaCita({
      cliente_id: '',
      empleado_id: '',
      servicios_ids: [],
      fecha: fechaActual,
      notas: ''
    });
    setBusquedaCliente('');
    setBusquedaEmpleado('');
    setBusquedaServicio('');
    setMostrarClientes(false);
    setMostrarEmpleados(false);
    setMostrarServicios(false);
  };

  // Función para toggle de selección de servicios
  const toggleServicioSeleccionado = (servicioId: string) => {
    setNuevaCita(prev => {
      const serviciosIds = prev.servicios_ids.includes(servicioId)
        ? prev.servicios_ids.filter(id => id !== servicioId)
        : [...prev.servicios_ids, servicioId];
      
      return { ...prev, servicios_ids: serviciosIds };
    });
  };

  // Función para calcular total de servicios
  const getTotalServicios = () => {
    return nuevaCita.servicios_ids.reduce((total, servicioId) => {
      const servicio = servicios.find((s: Servicio) => s.id === servicioId);
      return total + (servicio?.precio || 0);
    }, 0);
  };

  // Función para calcular duración total
  const getDuracionTotal = () => {
    return nuevaCita.servicios_ids.reduce((total, servicioId) => {
      const servicio = servicios.find((s: Servicio) => s.id === servicioId);
      return total + (servicio?.duracion_minutos || 0);
    }, 0);
  };

  // Función para abrir modal de nueva cita con fecha específica
  const abrirModalNuevaCita = (fecha?: string) => {
    resetFormularioNuevaCita();
    
    if (fecha) {
      // Si la fecha viene del calendario (formato YYYY-MM-DD), agregar la hora actual
      if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const fechaConHora = `${fecha}T${hours}:${minutes}`;
        setNuevaCita((prev: NuevaCita) => ({ ...prev, fecha: fechaConHora }));
      } else {
        // Si ya tiene hora (formato YYYY-MM-DDTHH:mm), usarla tal cual
        setNuevaCita((prev: NuevaCita) => ({ ...prev, fecha }));
      }
    }
    
    setShowNuevaCitaModal(true);
  };

  const crearNuevaCita = async () => {
    try {
      console.log('🔍 Validando formulario...', { nuevaCita, user });
      
      if (!user?.empresa_id) {
        console.error('❌ Error: No hay empresa_id en el usuario:', user);
        mostrarToast('Error: No hay empresa_id en el usuario. Por favor, recarga la página.', 'error');
        return;
      }
      
      if (!nuevaCita.cliente_id) {
        mostrarToast('Por favor, selecciona un cliente', 'error');
        return;
      }
      
      if (!nuevaCita.empleado_id) {
        mostrarToast('Por favor, selecciona un empleado', 'error');
        return;
      }
      
      if (!nuevaCita.fecha) {
        mostrarToast('Por favor, selecciona una fecha y hora', 'error');
        return;
      }
      
      if (!nuevaCita.servicios_ids || nuevaCita.servicios_ids.length === 0) {
        mostrarToast('Por favor, selecciona al menos un servicio', 'error');
        return;
      }
      
      if (nuevaCita.cliente_id === 'undefined' || nuevaCita.empleado_id === 'undefined') {
        mostrarToast('Error: IDs inválidos. Por favor, selecciona nuevamente cliente y empleado.', 'error');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token && user?.id) {
        try {
          const { data: refreshSession } = await supabase.auth.refreshSession();
        } catch (refreshError) {
          // Using existing JWT
        }
      }
      
      if (!session?.access_token && !user?.id) {
        console.error('❌ No hay token de acceso ni JWT de usuario. Sesión no válida.');
        mostrarToast('Error: Sesión no válida. Por favor, inicia sesión nuevamente.', 'error');
        return;
      }
      
      const totalEstimado = nuevaCita.servicios_ids.reduce((total, servicioId) => {
        const servicio = servicios.find((s: Servicio) => s.id === servicioId);
        return total + (servicio?.precio || 0);
      }, 0);
      
      // Calcular duración total como suma de todos los servicios seleccionados
      const duracionTotal = nuevaCita.servicios_ids.reduce((total, servicioId) => {
        const servicio = servicios.find((s: Servicio) => s.id === servicioId);
        return total + (servicio?.duracion_minutos || 0);
      }, 0);
      
      const citaParaInsertar = {
        empresa_id: user.empresa_id,
        cliente_id: nuevaCita.cliente_id,
        empleado_id: nuevaCita.empleado_id,
        fecha: convertirFechaLocalAUTC(nuevaCita.fecha),
        estado: 'pendiente',
        total_estimado: totalEstimado || 0,
        duracion_minutos: duracionTotal || 30,
        servicios_ids: nuevaCita.servicios_ids,
        notas: nuevaCita.notas || null,
        usuario_id: user.id
      };
      
      const { data, error } = await (supabase as any)
        .from('citas')
        .insert(citaParaInsertar)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      console.log('✅ Cita creada:', data);

      await cargarDatos();
      
      mostrarToast('¡Cita agendada correctamente!', 'success');
      
      // Registrar log de auditoría
      await registrarLog(supabase, {
        empresa_id: user?.empresa_id || undefined,
        usuario_id: user?.id,
        accion: 'CREAR_CITA',
        modulo: 'CITAS',
        detalles: {
          cita_id: (data as any)?.id,
          cliente_id: nuevaCita.cliente_id,
          cliente_nombre: clientes.find(c => c.id === nuevaCita.cliente_id)?.nombre || 'Desconocido',
          empleado_id: nuevaCita.empleado_id,
          empleado_nombre: empleados.find(e => e.id === nuevaCita.empleado_id)?.nombre_completo || 'Desconocido',
          servicios_ids: nuevaCita.servicios_ids,
          servicios_nombres: nuevaCita.servicios_ids.map(id => servicios.find(s => s.id === id)?.nombre).filter(Boolean),
          fecha: nuevaCita.fecha,
          total_estimado: totalEstimado,
          creado_por: user?.id,
          fecha_creacion: new Date().toISOString()
        }
      });
      
      // Resetear formulario completo
      resetFormularioNuevaCita();
      setShowNuevaCitaModal(false);
    } catch (error) {
      console.error('❌ Error creando cita:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      mostrarToast(`Error al crear la cita: ${errorMessage}`, 'error');
    }
  };

  const crearNuevoCliente = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('clientes')
        .insert({
          empresa_id: user?.empresa_id,
          nombre: nuevoCliente.nombre,
          cedula: nuevoCliente.cedula || null,
          email: nuevoCliente.email || null,
          telefono: nuevoCliente.telefono || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await cargarDatos();
      
      // Registrar log de auditoría
      await registrarLog(supabase, {
        empresa_id: user?.empresa_id || undefined,
        usuario_id: user?.id,
        accion: 'CREAR_CLIENTE',
        modulo: 'CLIENTES',
        detalles: {
          cliente_id: (data as any)?.id,
          nombre: nuevoCliente.nombre,
          telefono: nuevoCliente.telefono,
          email: nuevoCliente.email,
          creado_desde: 'módulo_citas',
          creado_por: user?.id,
          fecha_creacion: new Date().toISOString()
        }
      });
      
      setNuevaCita((prev: NuevaCita) => ({...prev, cliente_id: data.id}));
      
      setNuevoCliente({
        nombre: '',
        cedula: '',
        email: '',
        telefono: ''
      });
      setShowNuevoClienteModal(false);
      
      alert('Cliente creado exitosamente');
    } catch (error) {
      console.error('Error creando cliente:', error);
      alert('Error al crear el cliente');
    }
  };

  const iniciarAtencion = async (citaId: string) => {
    try {
      const cita = citas.find((c: Cita) => c.id === citaId);
      if (!cita) {
        mostrarToast('Error: Cita no encontrada', 'error');
        return;
      }

      console.log('🔄 Iniciando atención para cita:', citaId);

      // Cambiar estado a 'en_atencion' antes de navegar
      const { error } = await (supabase as any)
        .from('citas')
        .update({ 
          estado: 'en_atencion',
          updated_at: new Date().toISOString()
        })
        .eq('id', citaId);

      if (error) {
        console.error('Error actualizando estado de cita:', error);
        throw error;
      }

      // Recargar datos para que la cita desaparezca del calendario
      await cargarDatos();

      // Construir URL con parámetros
      const params = new URLSearchParams({
        cita_id: citaId,
        cliente_id: cita.cliente_id,
        empleado_id: cita.empleado_id,
        servicios_ids: cita.servicios_ids.join(',')
      });
      
      // Navegar a la página de atención
      window.location.href = `/atencion?${params.toString()}`;

    } catch (error) {
      console.error('❌ Error iniciando atención:', error);
      mostrarToast('Error al iniciar atención', 'error');
    }
  };

  const finalizarCita = (cita: Cita) => {
    const params = new URLSearchParams({
      cita_id: cita.id,
      cliente_id: cita.cliente_id,
      empleado_id: cita.empleado_id,
      servicios_ids: (cita.servicios_ids || []).join(',')
    });
    
    window.location.href = `/atenciones?${params.toString()}`;
  };

  const verFactura = (cita: Cita) => {
    alert(`Ver factura de la cita ${cita.id}`);
  };

  // Funciones del calendario
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev: Date) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleVerMasClick = (day: number) => {
    const citasDelDia = getCitasForDay(day);
    setSelectedDayCitas(citasDelDia);
    setShowCitasDiaModal(true);
  };

  const handleCitaClick = (cita: Cita) => {
    setSelectedCita(cita);
    setShowCitaDetalleModal(true);
  };

  const handleDayClick = (day: number) => {
    // Capturar la fecha exacta del día seleccionado
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Obtener hora actual
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Formatear la fecha para el input datetime-local (YYYY-MM-DDTHH:mm) con hora actual
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selected.getDate()).padStart(2, '0');
    const fechaFormateada = `${year}-${month}-${dayStr}T${hours}:${minutes}`;
    
    // Resetear formulario excepto la fecha
    setNuevaCita({
      cliente_id: '',
      empleado_id: '',
      servicios_ids: [],
      fecha: fechaFormateada,
      notas: ''
    });
    
    // Resetear búsquedas
    setBusquedaCliente('');
    setBusquedaEmpleado('');
    setBusquedaServicio('');
    
    // Establecer fecha seleccionada
    setSelectedDate(selected);
    
    // Abrir modal de nueva cita
    setShowNuevaCitaModal(true);
  };

  const getCitasForDay = (day: number) => {
    const localDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = localDate.toLocaleDateString('es-ES', { timeZone: 'America/Bogota' });
    
    return citas.filter((cita: Cita) => {
      const citaDate = new Date(cita.fecha);
      const citaDateStr = citaDate.toLocaleDateString('es-ES', { timeZone: 'America/Bogota' });
      return citaDateStr === dateStr;
    });
  };

  const getCitaConDatos = (cita: Cita) => {
    const cliente = clientes.find((c: Cliente) => c.id === cita.cliente_id);
    const empleado = empleados.find((e: Empleado) => e.id === cita.empleado_id);
    const servicio = servicios.find((s: Servicio) => cita.servicios_ids?.includes(s.id));
    
    return {
      ...cita,
      clienteNombre: cliente?.nombre || 'Cliente desconocido',
      empleadoNombre: empleado?.nombre_completo || 'Empleado desconocido',
      servicioNombre: servicio?.nombre || 'Servicio desconocido',
      servicioPrecio: servicio?.precio || 0
    };
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmada': return 'bg-green-100 text-green-800 border-green-200';
      case 'en_atencion': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'atendido': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'finalizado': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200';
      case 'anulada': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'vencida': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBotonAccion = (cita: Cita) => {
    switch (cita.estado) {
      case 'pendiente':
        return (
          <Button
            size="sm"
            onClick={() => iniciarAtencion(cita.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="w-3 h-3 mr-1" />
            Iniciar Atención
          </Button>
        );
      
      case 'confirmada':
        return (
          <Button
            size="sm"
            onClick={() => iniciarAtencion(cita.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Play className="w-3 h-3 mr-1" />
            Iniciar Atención
          </Button>
        );
      
      case 'en_atencion':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 inline mr-1" />
            En Atención
          </span>
        );
      
      case 'atendido':
        return (
          <Button
            size="sm"
            onClick={() => finalizarCita(cita)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <CreditCard className="w-3 h-3 mr-1" />
            Continuar Atención
          </Button>
        );
      
      case 'finalizado':
        return (
          <div className="flex flex-col space-y-2">
            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Pagado
            </span>
            <Button
              size="sm"
              onClick={() => verFactura(cita)}
              variant="outline"
              className="text-gray-600 border-gray-300"
            >
              <FileText className="w-3 h-3 mr-1" />
              Ver Factura
            </Button>
          </div>
        );
      
      case 'cancelada':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border-red-200">
            Cancelada
          </span>
        );
      
      case 'anulada':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border-gray-200">
            Anulada
          </span>
        );
      
      case 'vencida':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 border-orange-200">
            Vencida
          </span>
        );
      
      default:
        return null;
    }
  };

  // Filtros para búsquedas
  const clientesFiltrados = clientes.filter((cliente: Cliente) => {
    if (!busquedaCliente) return true;
    const busqueda = busquedaCliente.toLowerCase();
    const nombre = cliente.nombre?.toLowerCase() || '';
    const cedula = cliente.cedula || '';
    
    const coincide = nombre.includes(busqueda) || cedula.includes(busqueda);
    
    if (coincide && cedula === busqueda) {
      setNuevaCita((prev: NuevaCita) => ({...prev, cliente_id: cliente.id}));
      setBusquedaCliente(cliente.nombre);
    }
    
    return coincide;
  });

  const empleadosFiltrados = empleados.filter((empleado: Empleado) => {
    if (!busquedaEmpleado) return true;
    const busqueda = busquedaEmpleado.toLowerCase();
    const nombre = empleado.nombre_completo?.toLowerCase() || '';
    const cedula = empleado.cedula || '';
    return nombre.includes(busqueda) || cedula.includes(busqueda);
  });

  const serviciosFiltrados = servicios.filter((servicio: Servicio) => {
    if (!busquedaServicio) return true;
    const busqueda = busquedaServicio.toLowerCase();
    const nombre = servicio.nombre?.toLowerCase() || '';
    return nombre.includes(busqueda);
  });

  const clientesLimitados = clientesFiltrados.slice(0, limiteResultados);
  const empleadosLimitados = empleadosFiltrados.slice(0, limiteResultados);
  const serviciosLimitados = serviciosFiltrados.slice(0, limiteResultados);

  if (loading || loadingData) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-gray-500 mb-2">
              {loading ? 'Verificando autenticación...' : 'Cargando datos...'}
            </div>
            {!user && !loading && (
              <div className="text-sm text-red-500 mb-4">
                No hay sesión activa. 
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="ml-2 text-blue-500 underline"
                >
                  Iniciar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              No hay sesión activa. Por favor, inicia sesión para acceder a esta página.
            </div>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Ir a Login
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Renderizado del calendario
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="border border-gray-100"></div>);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const citasDelDia = getCitasForDay(day);
      const today = isToday(day);
      
      // Altura adaptativa según dispositivo
      const cellHeight = isMobile ? 'min-h-[100px]' : 'min-h-[180px]';
      const maxCitasVisible = isMobile ? 2 : 3;
      const buttonSize = isMobile ? 'w-7 h-7' : 'w-6 h-6';
      const iconSize = isMobile ? 'w-5 h-5' : 'w-4 h-4';
      
      days.push(
        <div
          key={day}
          onClick={(e) => {
            // Permitir crear nueva cita en cualquier día (con o sin citas)
            // Solo si no se hace clic en elementos específicos (citas o "+X más")
            const clickedElement = e.target as HTMLElement;
            const isCitaClick = clickedElement.closest('[data-cita-id]');
            const isVerMasClick = clickedElement.closest('[data-ver-mas]');
            const isPlusButtonClick = clickedElement.closest('[data-plus-button]');
            
            if (!isCitaClick && !isVerMasClick && !isPlusButtonClick) {
              console.log('🔍 Click en día para crear cita:', day, 'citas existentes:', citasDelDia.length);
              handleDayClick(day);
            }
          }}
          className={`${cellHeight} border border-gray-200 p-2 hover:bg-gray-50 transition-colors relative group calendar-cell ${
            today ? 'bg-orange-50 border-2 border-orange-500' : ''
          }`}
        >
          {/* Header del día con número y botón de agregar */}
          <div className={`flex justify-between items-start ${isMobile ? 'mb-1' : 'mb-2'}`}>
            <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} ${today ? 'text-orange-700' : ''}`}>
              {day}
            </div>
            {/* Botón + adaptativo para móvil */}
            <button
              data-plus-button="true"
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔍 Click en botón + del día:', day);
                handleDayClick(day);
              }}
              className={`${buttonSize} bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 ${isMobile ? 'absolute top-1 right-1' : ''}`}
              title="Agendar nueva cita"
            >
              <Plus className={`${iconSize} font-bold`} />
            </button>
          </div>
          
          {/* Lista de citas adaptativa */}
          <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
            {citasDelDia.slice(0, maxCitasVisible).map((cita: Cita) => {
              const citaConDatos = getCitaConDatos(cita);
              return (
                <div
                  key={cita.id}
                  data-cita-id={cita.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🔍 Click directo en cita:', cita.id);
                    handleCitaClick(cita);
                  }}
                  className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 ${getEstadoColor(cita.estado)}`}
                  title={`${citaConDatos.clienteNombre} - ${citaConDatos.servicioNombre}`}
                >
                  {isMobile ? (
                    // Vista móvil: solo hora y nombre del cliente
                    <>
                      <div className="font-medium text-xs">
                        {formatearFechaBogota(cita.fecha).split(' ')[1]}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                      <div className="cita-text-mobile">
                        {citaConDatos.clienteNombre?.split(' ')[0]}
                      </div>
                    </>
                  ) : (
                    // Vista escritorio: más información
                    <>
                      <div className="font-medium">{formatearFechaBogota(cita.fecha).split(' ')[1]}</div>
                      <div className="cita-text">{citaConDatos.clienteNombre?.split(' ')[0]} - {citaConDatos.servicioNombre?.split(' ')[0]}</div>
                    </>
                  )}
                </div>
              );
            })}
            {citasDelDia.length > maxCitasVisible && (
              <div 
                data-ver-mas="true"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🔍 Click en "ver más" del día:', day);
                  handleVerMasClick(day);
                }}
                className={`text-xs cursor-pointer hover:opacity-80 font-medium ${isMobile ? 'text-blue-600 py-0.5' : 'text-blue-600 py-1'}`}
              >
                {isMobile ? (
                  <div className="flex items-center gap-1">
                    <span>+{citasDelDia.length - maxCitasVisible}</span>
                    <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                    <span>más</span>
                  </div>
                ) : (
                  `+${citasDelDia.length - maxCitasVisible} más`
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <MainLayout>
      {/* Estilos CSS para responsividad */}
      <style jsx>{`
        @media (max-width: 768px) {
          .calendar-grid {
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
          }
          .calendar-cell {
            min-height: 100px;
            padding: 4px;
          }
          .cita-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }
          .cita-text-mobile {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 60px;
          }
        }
        @media (min-width: 769px) {
          .calendar-cell {
            min-height: 180px;
            padding: 8px;
          }
        }
      `}</style>
      
      {/* Toast de Notificaciones */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' && <span className="mr-2">✅</span>}
            {toast.type === 'error' && <span className="mr-2">❌</span>}
            {toast.type === 'info' && <span className="mr-2">ℹ️</span>}
            {toast.message}
          </div>
        </div>
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario de Citas</h1>
            <p className="text-gray-600">Gestiona las citas del salón</p>
          </div>
          <Button
            onClick={() => abrirModalNuevaCita()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </Button>
        </div>

        {/* Instrucciones */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ ¿Cómo funciona?</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• <strong>Click en cualquier día:</strong> Crear nueva cita</div>
            <div>• <strong>Botón azul (+):</strong> Agendar nueva cita rápidamente</div>
            <div>• <strong>Click en cita existente:</strong> Ver detalles de la cita</div>
            <div>• <strong>Click en "+X más":</strong> Ver todas las citas del día</div>
            <div className="mt-2 pt-2 border-t border-blue-200 text-xs">
              <strong>Nota:</strong> Solo se muestran citas pendientes y confirmadas. 
              Las citas canceladas, anuladas o vencidas están ocultas para mantener la vista limpia.
            </div>
          </div>
        </div>

        {/* Calendario Mensual Completo */}
        <Card className="border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                <div key={dia} className="text-center text-sm font-medium text-gray-600 py-2">
                  {dia}
                </div>
              ))}
            </div>
            
            {/* Días del mes - CUADRÍCULA COMPLETA */}
            <div className="grid grid-cols-7 gap-1 calendar-grid">
              {renderCalendar()}
            </div>
          </CardContent>
        </Card>

        {/* Modal Nueva Cita */}
        <Modal
          isOpen={showNuevaCitaModal}
          onClose={() => setShowNuevaCitaModal(false)}
          title="Nueva Cita"
          size="lg"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Clientes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o cédula..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {clientesLimitados.length > 0 ? (
                  <>
                    <div className="p-2 text-xs text-gray-600 border-b border-gray-200 bg-gray-50">
                      Mostrando {clientesLimitados.length} de {clientesFiltrados.length} clientes
                    </div>
                    
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Nombre</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Cédula</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientesLimitados.map((cliente: Cliente) => (
                          <tr
                            key={cliente.id}
                            onClick={() => {
                              setNuevaCita((prev: NuevaCita) => ({...prev, cliente_id: cliente.id}));
                              setBusquedaCliente(cliente.nombre || '');
                            }}
                            className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          >
                            <td className="px-2 py-1">{cliente.nombre}</td>
                            <td className="px-2 py-1 text-gray-500">{cliente.cedula || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {clientesFiltrados.length > limiteResultados && (
                      <div className="p-2 text-center border-t border-gray-200">
                        <button
                          onClick={() => setShowModalClientes(true)}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          Mostrar todos los {clientesFiltrados.length} clientes
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-2 text-center">
                    <p className="text-sm text-gray-500 mb-2">No hay clientes disponibles</p>
                    <Button
                      size="sm"
                      onClick={() => setShowNuevoClienteModal(true)}
                      className="text-xs"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Crear Nuevo Cliente
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Empleados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empleado *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar empleado por nombre..."
                  value={busquedaEmpleado}
                  onChange={(e) => setBusquedaEmpleado(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {empleadosLimitados.length > 0 ? (
                  <>
                    <div className="p-2 text-xs text-gray-600 border-b border-gray-200 bg-gray-50">
                      Mostrando {empleadosLimitados.length} de {empleadosFiltrados.length} empleados
                    </div>
                    
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Nombre</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Cédula</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Estado</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Correo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empleadosLimitados.map((empleado: Empleado) => (
                          <tr
                            key={empleado.id}
                            onClick={() => {
                              setNuevaCita((prev: NuevaCita) => ({...prev, empleado_id: empleado.id}));
                              setBusquedaEmpleado(empleado.nombre_completo || '');
                            }}
                            className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          >
                            <td className="px-2 py-1">{empleado.nombre_completo}</td>
                            <td className="px-2 py-1 text-gray-500">
                              {empleado.cedula || '-'}
                            </td>
                            <td className="px-2 py-1 text-gray-500">{empleado.estado}</td>
                            <td className="px-2 py-1 text-gray-500">{empleado.email_empleado || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {empleadosFiltrados.length > limiteResultados && (
                      <div className="p-2 text-center border-t border-gray-200">
                        <button
                          onClick={() => setShowModalEmpleados(true)}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          Mostrar todos los {empleadosFiltrados.length} empleados
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-2 text-center">
                    <p className="text-sm text-gray-500">No hay empleados activos</p>
                  </div>
                )}
              </div>
            </div>

            {/* Servicios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servicios *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar servicios por nombre..."
                  value={busquedaServicio}
                  onChange={(e) => setBusquedaServicio(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Resumen de Selección */}
              {nuevaCita.servicios_ids.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">
                    {nuevaCita.servicios_ids.length} servicio{nuevaCita.servicios_ids.length !== 1 ? 's' : ''} seleccionado{nuevaCita.servicios_ids.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Total: ${getTotalServicios().toFixed(2)} - Duración: {getDuracionTotal()} min
                  </div>
                </div>
              )}
              
              <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {serviciosLimitados.length > 0 ? (
                  <>
                    <div className="p-2 text-xs text-gray-600 border-b border-gray-200 bg-gray-50">
                      Mostrando {serviciosLimitados.length} de {serviciosFiltrados.length} servicios
                    </div>
                    
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 w-8"></th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Servicio</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Precio</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Duración (min)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviciosLimitados.map((servicio: Servicio) => {
                          const isSelected = nuevaCita.servicios_ids.includes(servicio.id);
                          return (
                            <tr
                              key={servicio.id}
                              onClick={() => toggleServicioSeleccionado(servicio.id)}
                              className={`hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                                isSelected ? 'bg-blue-50' : ''
                              }`}
                            >
                              <td className="px-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-2 py-1 font-medium">{servicio.nombre}</td>
                              <td className="px-2 py-1 text-gray-500">${servicio.precio?.toFixed(2)}</td>
                              <td className="px-2 py-1 text-gray-500">{servicio.duracion_minutos} min</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {serviciosFiltrados.length > limiteResultados && (
                      <div className="p-2 text-center border-t border-gray-200">
                        <button
                          onClick={() => setShowModalServicios(true)}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          Mostrar todos los {serviciosFiltrados.length} servicios
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-2 text-center">
                    <p className="text-sm text-gray-500">No hay servicios disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fecha y Hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora *
              </label>
              <Input
                type="datetime-local"
                value={nuevaCita.fecha}
                onChange={(e) => setNuevaCita({...nuevaCita, fecha: e.target.value})}
                required
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={nuevaCita.notas}
                onChange={(e) => setNuevaCita({...nuevaCita, notas: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNuevaCitaModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={crearNuevaCita}
                disabled={!nuevaCita.cliente_id || !nuevaCita.empleado_id || !nuevaCita.fecha || (nuevaCita.servicios_ids?.length === 0)}
              >
                Crear Cita
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Nuevo Cliente */}
        <Modal
          isOpen={showNuevoClienteModal}
          onClose={() => setShowNuevoClienteModal(false)}
          title="Crear Nuevo Cliente"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <Input
                type="text"
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cédula
              </label>
              <Input
                type="text"
                value={nuevoCliente.cedula}
                onChange={(e) => setNuevoCliente({...nuevoCliente, cedula: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <Input
                type="text"
                value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={nuevoCliente.email}
                onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNuevoClienteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={crearNuevoCliente}
                disabled={!nuevoCliente.nombre}
              >
                Crear Cliente
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal para ver todas las citas del día */}
        {showCitasDiaModal && (
          <Modal isOpen={showCitasDiaModal} onClose={() => setShowCitasDiaModal(false)} title="Citas del Día">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                Citas del {selectedDate?.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <div className="space-y-3">
                {selectedDayCitas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay citas para este día</p>
                ) : (
                  selectedDayCitas.map((cita: Cita) => {
                    const citaConDatos = getCitaConDatos(cita);
                    return (
                      <div
                        key={cita.id}
                        onClick={() => handleCitaClick(cita)}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-1 rounded ${getEstadoColor(cita.estado)}`}>
                                {cita.estado}
                              </span>
                              <span className="text-sm font-medium">
                                {new Date(cita.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm"><strong>Cliente:</strong> {citaConDatos.clienteNombre}</p>
                              <p className="text-sm"><strong>Empleado:</strong> {citaConDatos.empleadoNombre}</p>
                              <p className="text-sm"><strong>Servicio:</strong> {citaConDatos.servicioNombre}</p>
                              <p className="text-sm"><strong>Precio:</strong> ${citaConDatos.servicioPrecio.toFixed(2)}</p>
                              {cita.notas && <p className="text-sm"><strong>Notas:</strong> {cita.notas}</p>}
                            </div>
                          </div>
                          <div className="ml-4">
                            {getBotonAccion(cita)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Modal para ver detalle de una cita */}
        {showCitaDetalleModal && selectedCita && (
          <Modal isOpen={showCitaDetalleModal} onClose={() => setShowCitaDetalleModal(false)} title="Detalle de Cita">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Detalle de Cita</h3>
              {(() => {
                const citaConDatos = getCitaConDatos(selectedCita);
                return (
                  <div className="space-y-3">
                    <div>
                      <span className={`text-xs px-2 py-1 rounded ${getEstadoColor(selectedCita.estado)}`}>
                        {selectedCita.estado}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm"><strong>Fecha y Hora:</strong></p>
                      <p className="text-sm">
                        {new Date(selectedCita.fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {' - '}
                        {new Date(selectedCita.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm"><strong>Cliente:</strong> {citaConDatos.clienteNombre}</p>
                    </div>
                    <div>
                      <p className="text-sm"><strong>Empleado:</strong> {citaConDatos.empleadoNombre}</p>
                    </div>
                    <div>
                      <p className="text-sm"><strong>Servicio:</strong> {citaConDatos.servicioNombre}</p>
                    </div>
                    <div>
                      <p className="text-sm"><strong>Precio:</strong> ${citaConDatos.servicioPrecio.toFixed(2)}</p>
                    </div>
                    {selectedCita.notas && (
                      <div>
                        <p className="text-sm"><strong>Notas:</strong> {selectedCita.notas}</p>
                      </div>
                    )}
                    <div className="pt-4 border-t">
                      {getBotonAccion(selectedCita)}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Modal>
        )}

        {/* Modal de selección de clientes */}
        {showModalClientes && (
          <Modal
            isOpen={showModalClientes}
            onClose={() => setShowModalClientes(false)}
            title="Seleccionar Cliente"
            size="xl"
          >
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar cliente por nombre..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {clientesFiltrados.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Nombre</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Cédula</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((cliente: Cliente) => (
                      <tr
                        key={cliente.id}
                        className="hover:bg-gray-50 border-b border-gray-100"
                      >
                        <td className="px-4 py-2">{cliente.nombre}</td>
                        <td className="px-4 py-2 text-gray-500">{cliente.cedula || '-'}</td>
                        <td className="px-4 py-2 text-gray-500">{cliente.email || '-'}</td>
                        <td className="px-4 py-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setNuevaCita((prev: NuevaCita) => ({...prev, cliente_id: cliente.id}));
                              setBusquedaCliente(cliente.nombre);
                              setShowModalClientes(false);
                            }}
                            className="text-xs"
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-2">No hay clientes disponibles</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowModalClientes(false);
                      setShowNuevoClienteModal(true);
                    }}
                    className="text-xs"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Crear Nuevo Cliente
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Modal de selección de empleados */}
        {showModalEmpleados && (
          <Modal
            isOpen={showModalEmpleados}
            onClose={() => setShowModalEmpleados(false)}
            title="Seleccionar Empleado"
            size="xl"
          >
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar empleado por nombre..."
                  value={busquedaEmpleado}
                  onChange={(e) => setBusquedaEmpleado(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {empleadosFiltrados.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Nombre</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Cédula</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Estado</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Correo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleadosFiltrados.map((empleado: Empleado) => (
                      <tr
                        key={empleado.id}
                        className="hover:bg-gray-50 border-b border-gray-100"
                      >
                        <td className="px-4 py-2">{empleado.nombre_completo}</td>
                        <td className="px-4 py-2 text-gray-500">{empleado.cedula || '-'}</td>
                        <td className="px-4 py-2 text-gray-500">{empleado.estado}</td>
                        <td className="px-4 py-2 text-gray-500">{empleado.email_empleado || '-'}</td>
                        <td className="px-4 py-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setNuevaCita((prev: NuevaCita) => ({...prev, empleado_id: empleado.id}));
                              setBusquedaEmpleado(empleado.nombre_completo || '');
                              setShowModalEmpleados(false);
                            }}
                            className="text-xs"
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No hay empleados activos</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Modal de selección de servicios */}
        {showModalServicios && (
          <Modal
            isOpen={showModalServicios}
            onClose={() => setShowModalServicios(false)}
            title="Seleccionar Servicios"
            size="xl"
          >
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar servicio por nombre..."
                  value={busquedaServicio}
                  onChange={(e) => setBusquedaServicio(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {serviciosFiltrados.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Nombre</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Precio</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Duración</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviciosFiltrados.map((servicio: Servicio) => {
                      const isSelected = nuevaCita.servicios_ids.includes(servicio.id);
                      return (
                        <tr
                          key={servicio.id}
                          className="hover:bg-gray-50 border-b border-gray-100"
                        >
                          <td className="px-4 py-2">{servicio.nombre}</td>
                          <td className="px-4 py-2 text-gray-500">${servicio.precio}</td>
                          <td className="px-4 py-2 text-gray-500">{servicio.duracion_minutos} min</td>
                          <td className="px-4 py-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (isSelected) {
                                  setNuevaCita((prev: NuevaCita) => ({
                                    ...prev,
                                    servicios_ids: prev.servicios_ids.filter(id => id !== servicio.id)
                                  }));
                                } else {
                                  setNuevaCita((prev: NuevaCita) => ({
                                    ...prev,
                                    servicios_ids: [...prev.servicios_ids, servicio.id]
                                  }));
                                }
                              }}
                              className={`text-xs ${isSelected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                            >
                              {isSelected ? 'Quitar' : 'Agregar'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No hay servicios disponibles</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {nuevaCita.servicios_ids.length} servicio(s) seleccionado(s)
                </p>
                <Button
                  onClick={() => setShowModalServicios(false)}
                  className="text-xs"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </MainLayout>
  );
};
