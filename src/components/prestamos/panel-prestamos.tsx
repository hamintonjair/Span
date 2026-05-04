'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { DollarSign, TrendingUp, Users, Calendar, Eye, Plus, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { registrarLog } from '@/lib/audit';

// Tipos para préstamos - Nombres reales de la tabla
interface Prestamo {
  id: string;
  empresa_id: string;
  empleado_id: string;
  monto_total: number; // Campo real
  cuota_mensual: number; // Campo real
  saldo_pendiente: number;
  fecha_prestamo: string; // Tipo date
  fecha_limite: string; // Tipo date
  estado: 'activo' | 'pagado' | 'vencido'; // Estado por defecto 'activo'
  descripcion: string;
  created_at: string;
  updated_at: string;
  empleados?: {
    nombre_completo: string;
    porcentaje_comision?: number;
  };
}

interface PanelPrestamosProps {
  empresaId: string;
}

// Toast notification
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export function PanelPrestamos({ empresaId }: PanelPrestamosProps) {
  const { user } = useJWTAuth();
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNuevoPrestamoModal, setShowNuevoPrestamoModal] = useState(false);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string>('');
  const [empleadoSeleccionadoData, setEmpleadoSeleccionadoData] = useState<any>(null);
  const [efectivoDisponible, setEfectivoDisponible] = useState<number>(0);
  const [formData, setFormData] = useState({
    monto_total: '',
    cuota_mensual: '',
    plazo_meses: '',
    fecha_prestamo: '',
    descripcion: ''
  });
  const [procesando, setProcesando] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);
  const [totalRegistros, setTotalRegistros] = useState(0);
  
  // Estados para modales
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoAbono, setMetodoAbono] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [procesandoAbono, setProcesandoAbono] = useState(false);
  const [pagosPrestamo, setPagosPrestamo] = useState<any[]>([]);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  
  // Estados para búsqueda
  const [busquedaPrestamos, setBusquedaPrestamos] = useState('');
  const [prestamosFiltrados, setPrestamosFiltrados] = useState<Prestamo[]>([]);
  
  const supabase = createClient();

  // Función para calcular cuota mensual automáticamente
  const calcularCuotaMensual = () => {
    const montoTotal = parseFloat(formData.monto_total) || 0;
    const plazoMeses = parseInt(formData.plazo_meses) || 0;
    
    if (montoTotal > 0 && plazoMeses > 0) {
      const cuota = Math.round(montoTotal / plazoMeses);
      setFormData(prev => ({
        ...prev,
        cuota_mensual: cuota.toString()
      }));
    }
  };

  // Efecto para calcular cuota automáticamente
  useEffect(() => {
    calcularCuotaMensual();
  }, [formData.monto_total, formData.plazo_meses]);

  // Efecto para filtrar préstamos en tiempo real
  useEffect(() => {
    if (busquedaPrestamos.trim() === '') {
      setPrestamosFiltrados(prestamos);
    } else {
      const filtrados = prestamos.filter(prestamo => {
        const nombreEmpleado = prestamo.empleados?.nombre_completo?.toLowerCase() || '';
        const busqueda = busquedaPrestamos.toLowerCase();
        return nombreEmpleado.includes(busqueda);
      });
      setPrestamosFiltrados(filtrados);
    }
  }, [busquedaPrestamos, prestamos]);

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // Función de formato de moneda para Colombia
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    if (user?.empresa_id) {
      cargarPrestamos();
      cargarEmpleados();
      cargarEfectivoDisponible();
    }
  }, [user?.empresa_id, paginaActual]); // Añadir paginaActual como dependencia

  const cargarEfectivoDisponible = async () => {
    const disponible = await calcularEfectivoDisponible();
    setEfectivoDisponible(disponible);
  };

  useEffect(() => {
    // Cargar datos del empleado seleccionado
    if (empleadoSeleccionado) {
      const empleado = empleados.find(emp => emp.id === empleadoSeleccionado);
      setEmpleadoSeleccionadoData(empleado || null);
    } else {
      setEmpleadoSeleccionadoData(null);
    }
  }, [empleadoSeleccionado, empleados]);

  const cargarPrestamos = async () => {
    try {
      setLoading(true);
      
      const empresaIdToUse = user?.empresa_id || empresaId;
      if (!empresaIdToUse) {
        console.error('No hay empresa_id disponible');
        return;
      }
      
      // Calcular rango para paginación
      const desde = (paginaActual - 1) * itemsPorPagina;
      const hasta = desde + itemsPorPagina - 1;
      
      // Obtener préstamos paginados y count total en paralelo
      const [prestamosResponse, countResponse] = await Promise.all([
        (supabase as any)
          .from('prestamos')
          .select('*, empleados(nombre_completo, porcentaje_comision)')
          .eq('empresa_id', empresaIdToUse)
          .order('created_at', { ascending: false })
          .range(desde, hasta),
        (supabase as any)
          .from('prestamos')
          .select('id', { count: 'exact', head: true })
          .eq('empresa_id', empresaIdToUse)
      ]);

      const { data: prestamosData, error: prestamosError } = prestamosResponse;
      const { count: totalCount, error: countError } = countResponse;

      if (prestamosError) {
        console.error('Error cargando préstamos:', prestamosError);
        showToast('Error al cargar préstamos', 'error');
      } else if (countError) {
        console.error('Error obteniendo count:', countError);
        showToast('Error al contar préstamos', 'error');
      } else {
        setPrestamos(prestamosData || []);
        setTotalRegistros(totalCount || 0);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error inesperado al cargar préstamos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      const empresaIdToUse = user?.empresa_id || empresaId;
      if (!empresaIdToUse) {
        console.error('No hay empresa_id disponible');
        return;
      }
      
      const { data, error } = await (supabase as any)
        .from('empleados')
        .select('id, nombre_completo, porcentaje_comision')
        .eq('empresa_id', empresaIdToUse)
        .eq('estado', 'activo')
        .order('nombre_completo');

      if (error) {
        console.error('Error cargando empleados:', error);
        showToast('Error al cargar empleados', 'error');
      } else {
        console.log('Datos de empleados:', data);
        setEmpleados(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error inesperado al cargar empleados', 'error');
    }
  };

  // Función para calcular efectivo disponible replicando exactamente la lógica de obtenerIngresosTurno
  const calcularEfectivoDisponible = async () => {
    try {
      const empresaIdToUse = user?.empresa_id || empresaId;
      if (!empresaIdToUse) return 0;

      // Obtener caja abierta con monto_apertura, fecha_apertura y empresa_id
      const { data: cajaData, error: cajaError } = await (supabase as any)
        .from('cajas')
        .select('id, monto_apertura, fecha_apertura, empresa_id')
        .eq('empresa_id', empresaIdToUse)
        .eq('estado', 'abierta')
        .maybeSingle(); // Usar maybeSingle() en lugar de single()

      if (cajaError || !cajaData) {
        console.log('No se encontró caja abierta:', cajaError);
        
        // Mostrar notificación toast al usuario usando el sistema existente
        showToast('No hay caja abierta. Por favor, abre una caja antes de realizar préstamos.', 'error');
        
        return 0;
      }

      // Convertir fecha de apertura a formato ISO (exactamente como obtenerIngresosTurno)
      const fechaAperturaISO = new Date(cajaData.fecha_apertura).toISOString();

      // Consultar ventas filtrando por caja_id, empresa_id y created_at >= fecha_apertura
      // Solo sumar ventas donde metodo_pago = 'efectivo'
      const { data: ventasData, error: ventasError } = await supabase
        .from('ventas')
        .select('total, metodo_pago')
        .eq('caja_id', cajaData.id)
        .eq('empresa_id', cajaData.empresa_id)
        .gte('created_at', fechaAperturaISO)
        .eq('metodo_pago', 'efectivo') as any;

      if (ventasError) {
        console.error('Error obteniendo ventas:', ventasError);
        return cajaData.monto_apertura || 0;
      }

      // Calcular total de ventas en efectivo
      const totalVentasEfectivo = ventasData?.reduce((sum: number, venta: any) => sum + (venta.total || 0), 0) || 0;

      // Consultar préstamos del día para sumar lo prestado hoy
      // Usar monto_total y filtrar por fecha_prestamo (tipo date)
      const fechaActual = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data: prestamosData, error: prestamosError } = await supabase
        .from('prestamos')
        .select('monto_total') // Campo real
        .eq('empresa_id', empresaIdToUse)
        .eq('fecha_prestamo', fechaActual) as any;

      const totalEgresos = prestamosData?.reduce((sum: number, prestamo: any) => sum + (prestamo.monto_total || 0), 0) || 0;

      // Cálculo final: Disponible = monto_apertura + totalVentasEfectivo - totalEgresos
      const disponible = (cajaData.monto_apertura || 0) + totalVentasEfectivo - totalEgresos;
      
      console.log('Cálculo de efectivo disponible (lógica caja):', {
        monto_apertura: cajaData.monto_apertura,
        totalVentasEfectivo,
        totalEgresos,
        disponible
      });

      return disponible;

    } catch (error) {
      console.error('Error calculando efectivo disponible:', error);
      return 0;
    }
  };

  const handleNuevoPrestamo = async () => {
    if (!empleadoSeleccionado || !formData.monto_total || !formData.plazo_meses || !formData.fecha_prestamo) {
      showToast('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    setProcesando(true);
    try {
      const montoTotal = parseFloat(formData.monto_total);
      const cuotaMensual = Math.round(parseFloat(formData.cuota_mensual)); // Math.round() para eliminar decimales
      
      const empresaIdToUse = user?.empresa_id || empresaId;
      if (!empresaIdToUse) {
        console.error('No hay empresa_id disponible para crear préstamo');
        showToast('Error: No se puede identificar la empresa', 'error');
        return;
      }

      // VALIDACIÓN: Verificar que haya caja abierta
      console.log('Validando caja abierta...');
      const { data: cajaData, error: cajaError } = await (supabase as any)
        .from('cajas')
        .select('id, fecha_apertura, monto_apertura')
        .eq('empresa_id', empresaIdToUse)
        .eq('estado', 'abierta')
        .single();

      if (cajaError || !cajaData) {
        console.error('No hay caja abierta:', cajaError);
        showToast('Error: No hay una caja abierta. Debe abrir caja antes de crear préstamos.', 'error');
        return;
      }

      console.log('Caja abierta validada:', cajaData);

      // Validar con la nueva lógica de efectivo disponible
      const efectivoDisponible = await calcularEfectivoDisponible();
      
      if (montoTotal > efectivoDisponible) {
        showToast('No hay suficiente efectivo en caja para este préstamo', 'error');
        return;
      }

      // UNA SOLA PETICIÓN: Insertar préstamo con campos reales
      // Calcular fecha límite sumando meses a la fecha de inicio
      const fechaInicio = new Date(formData.fecha_prestamo);
      const plazoMeses = parseInt(formData.plazo_meses) || 1;
      const fechaLimite = new Date(fechaInicio);
      fechaLimite.setMonth(fechaLimite.getMonth() + plazoMeses);
      
      // Insertar préstamo
      const { data: prestamoData, error: prestamoError } = await (supabase as any)
        .from('prestamos')
        .insert({
          monto_total: montoTotal, // Campo real
          cuota_mensual: cuotaMensual, // Campo real
          saldo_pendiente: montoTotal, // Campo real
          empleado_id: empleadoSeleccionado, // Campo real
          empresa_id: empresaIdToUse, // Campo real
          fecha_prestamo: fechaInicio.toISOString().split('T')[0], // Campo real
          fecha_limite: fechaLimite.toISOString().split('T')[0], // Campo real
          estado: 'activo' // Campo real
        })
        .select()
        .single();

      if (prestamoError) throw prestamoError;

      // Registrar log de auditoría
      await registrarLog(supabase, {
        empresa_id: empresaIdToUse || undefined,
        usuario_id: user?.id,
        accion: 'CREAR_PRESTAMO',
        modulo: 'PRESTAMOS',
        detalles: {
          prestamo_id: (prestamoData as any)?.id,
          empleado_id: empleadoSeleccionado,
          empleado_nombre: empleadoSeleccionadoData?.nombre || 'Desconocido',
          monto_total: montoTotal,
          cuota_mensual: cuotaMensual,
          plazo_meses: plazoMeses,
          fecha_prestamo: fechaInicio.toISOString().split('T')[0],
          fecha_limite: fechaLimite.toISOString().split('T')[0],
          creado_por: user?.id,
          fecha_creacion: new Date().toISOString()
        }
      });

      // Registrar salida de dinero en movimientos_caja (FORZADO)
      if (prestamoData) {
        console.log('Buscando caja abierta para registrar salida...');
        const { data: cajaData, error: cajaError } = await (supabase as any)
          .from('cajas')
          .select('id, fecha_apertura')
          .eq('empresa_id', empresaIdToUse)
          .eq('estado', 'abierta')
          .single();

        console.log('Caja encontrada:', cajaData);
        console.log('Error buscando caja:', cajaError);

        if (cajaData && cajaData.id) {
          const movimientoSalida = {
            caja_id: cajaData.id,
            empresa_id: empresaIdToUse,
            tipo: 'salida',
            categoria: 'Préstamo Entregado',
            monto: montoTotal,
            descripcion: `Salida por préstamo a empleado ${empleadoSeleccionadoData?.nombre || 'ID: ' + empleadoSeleccionado}`,
            fecha: new Date().toISOString(),
            referencia_id: prestamoData.id,
            referencia_tipo: 'prestamo'
          };

          console.log('Registrando movimiento de salida:', movimientoSalida);
          console.log('Fecha de apertura de caja:', cajaData.fecha_apertura);

          const { data: movimientoData, error: errorMovimiento } = await (supabase as any)
            .from('movimientos_caja')
            .insert([movimientoSalida])
            .select();

          if (errorMovimiento) {
            console.error('Error registrando salida de préstamo:', errorMovimiento);
            console.error('Detalles:', errorMovimiento.details);
            console.error('Código:', errorMovimiento.code);
            showToast('Error al registrar salida de préstamo', 'error');
          } else {
            console.log('Salida de préstamo registrada correctamente:', movimientoData);
            showToast('Salida de préstamo registrada', 'success');
          }
        } else {
          console.error('No se encontró caja abierta para registrar el movimiento');
          showToast('No hay caja abierta para registrar el préstamo', 'error');
        }
      }

      // Recargar datos para actualizar visualmente
      await cargarPrestamos();
      await cargarEfectivoDisponible();
      
      // Refrescar estado de caja inmediatamente
      try {
        // Buscar la caja abierta actual para actualizar el disponible
        const { data: cajaActualizada } = await (supabase as any)
          .from('cajas')
          .select('id, monto_apertura')
          .eq('empresa_id', empresaIdToUse)
          .eq('estado', 'abierta')
          .single();

        if (cajaActualizada) {
          console.log('🔄 Caja actualizada después de préstamo:', cajaActualizada);
          // Disparar evento personalizado para notificar al componente de caja
          window.dispatchEvent(new CustomEvent('prestamoCreado', {
            detail: { cajaId: cajaActualizada.id }
          }));
        }
      } catch (error) {
        console.warn('⚠️ Error al refrescar estado de caja:', error);
      }
      
      showToast('Préstamo registrado correctamente', 'success');
      
      // Limpiar formulario
      setFormData({
        monto_total: '',
        cuota_mensual: '',
        plazo_meses: '',
        fecha_prestamo: '',
        descripcion: ''
      });
      setEmpleadoSeleccionado('');
      setEmpleadoSeleccionadoData(null);
      setShowNuevoPrestamoModal(false);

    } catch (error: any) {
      console.error('Error creando préstamo:', error);
      showToast(error.message || 'Error al registrar préstamo', 'error');
    } finally {
      setProcesando(false);
    }
  };

  // Calcular resúmenes con campos reales
  const totalPrestado = prestamos.reduce((sum, p) => sum + (p.monto_total || 0), 0);
  const totalPendiente = prestamos
    .filter(p => p.estado === 'activo') // Usar estado 'activo'
    .reduce((sum, p) => sum + (p.saldo_pendiente || 0), 0);
  const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length;

  // Cálculo de paginación
  const totalPaginas = Math.ceil(totalRegistros / itemsPorPagina);
  

  


  // Funciones de paginación
  const irAPaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const irAPaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  const irAPagina = (numeroPagina: number) => {
    if (numeroPagina >= 1 && numeroPagina <= totalPaginas) {
      setPaginaActual(numeroPagina);
    }
  };

  // Función para registrar abono
  const handleRegistrarAbono = async () => {
    if (!prestamoSeleccionado || !montoAbono) {
      showToast('Por favor complete todos los campos', 'error');
      return;
    }

    const montoAbonoNum = parseFloat(montoAbono);
    const saldoPendienteActual = prestamoSeleccionado.saldo_pendiente || 0;

    // Validación: No permitir abonos mayores al saldo pendiente
    if (montoAbonoNum > saldoPendienteActual) {
      showToast('El abono no puede ser mayor al saldo pendiente', 'error');
      return;
    }

    if (montoAbonoNum <= 0) {
      showToast('El monto del abono debe ser mayor a 0', 'error');
      return;
    }

    setProcesandoAbono(true);
    try {
      // VALIDACIÓN: Verificar que haya caja abierta
      const empresaIdToUse = prestamoSeleccionado.empresa_id || user?.empresa_id || empresaId;
      console.log('Validando caja abierta para abono...');
      
      const { data: cajaData, error: cajaError } = await (supabase as any)
        .from('cajas')
        .select('id, fecha_apertura')
        .eq('empresa_id', empresaIdToUse)
        .eq('estado', 'abierta')
        .single();

      if (cajaError || !cajaData) {
        console.error('No hay caja abierta para registrar abono:', cajaError);
        showToast('Error: No hay una caja abierta. Debe abrir caja antes de registrar abonos.', 'error');
        return;
      }

      console.log('Caja abierta validada para abono:', cajaData);

      // Validación de UUID válido
      if (!prestamoSeleccionado?.id || prestamoSeleccionado.id.length < 10) {
        console.error('ID de préstamo no es un UUID válido:', prestamoSeleccionado?.id);
        showToast('Error: ID de préstamo inválido', 'error');
        return;
      }

      // 1. Calcular el nuevo saldo
      const saldo_actual = prestamoSeleccionado.saldo_pendiente;
      const monto_del_abono = parseFloat(montoAbono);
      const nuevo_saldo = saldo_actual - monto_del_abono;
      const nuevo_estado = nuevo_saldo === 0 ? 'pagado' : 'activo';

      // 2. Insertar el pago en pagos_prestamos (primero debe ser exitoso)
      console.log('Registrando abono con método:', metodoAbono);
      console.log('Valor del selector metodoAbono:', metodoAbono);
      
      const objetoPago = {
        prestamo_id: prestamoSeleccionado.id,
        monto_pago: monto_del_abono,
        empresa_id: empresaIdToUse,
        fecha_pago: new Date().toISOString(),
        metodo_pago: metodoAbono // Capturar valor real del selector
      };


      const { data: pagoData, error: errorPago } = await (supabase as any)
        .from('pagos_prestamos')
        .insert([objetoPago])
        .select();

      
      if (errorPago) {
        console.error('Error al registrar pago:', errorPago);
        throw new Error(`Error al registrar pago: ${errorPago.message}`);
      }

     
      const idLimpio = prestamoSeleccionado.id?.trim(); // ← Sanitizar ID
   

      const { data: updateData, error: errorPrestamo } = await (supabase as any)
        .from('prestamos')
        .update({ 
          saldo_pendiente: nuevo_saldo, 
          estado: nuevo_saldo <= 0 ? 'pagado' : 'activo',
          updated_at: new Date().toISOString()
        })
        .filter('id', 'eq', idLimpio) // ← Filtro explícito en lugar de .match()
        .select();


      // Verificar si el update funcionó correctamente
      if (errorPrestamo) {
        console.error('Error al actualizar préstamo:', errorPrestamo);
        throw new Error(`Error al actualizar préstamo: ${errorPrestamo.message}`);
      }

      if (!updateData || updateData.length === 0) {
        console.error('El update no devolvió datos - posible problema con el ID');
        throw new Error('No se pudo actualizar el saldo en la base de datos');
      }

      // Registrar log de auditoría
      await registrarLog(supabase, {
        empresa_id: empresaIdToUse || undefined,
        usuario_id: user?.id,
        accion: 'PAGAR_CUOTA',
        modulo: 'PRESTAMOS',
        detalles: {
          prestamo_id: prestamoSeleccionado.id,
          empleado_id: prestamoSeleccionado.empleado_id,
          empleado_nombre: prestamoSeleccionado.empleados?.nombre_completo || 'Desconocido',
          monto_pago: monto_del_abono,
          metodo_pago: metodoAbono,
          saldo_anterior: saldo_actual,
          saldo_nuevo: nuevo_saldo,
          nuevo_estado: nuevo_estado,
          pagado_por: user?.id,
          fecha_pago: new Date().toISOString()
        }
      });

      await cargarPrestamos();

      // 5. Obtener caja abierta para registrar movimiento (usar la misma caja validada anteriormente)
      if (cajaData && cajaData.id) { // Usar cajaData ya validado
        // Validar que caja_id sea un UUID válido
        if (cajaData.id.length < 10) {
          console.error('caja_id no es un UUID válido:', cajaData.id);
          throw new Error('El ID de caja no es válido');
        }

        const movimientoData = {
          caja_id: cajaData.id,
          empresa_id: empresaIdToUse, // Mismo empresa_id que el préstamo
          tipo: 'entrada',
          categoria: 'Abono Préstamo',
          monto: monto_del_abono,
          descripcion: `Abono de préstamo - ID: ${idLimpio} (${metodoAbono})`,
          fecha: new Date().toISOString(),
          referencia_id: idLimpio,
          referencia_tipo: 'prestamo',
          metodo_pago: metodoAbono // Guardar método de pago explícitamente
        };

        console.log('Registrando movimiento en caja con método:', metodoAbono);
        console.log('Movimiento a insertar:', movimientoData);


        const { error: errorMovimiento } = await (supabase as any)
          .from('movimientos_caja')
          .insert([movimientoData]);

        if (errorMovimiento) {
          console.warn('Error al registrar movimiento en caja:', errorMovimiento);
          showToast('Abono registrado pero hubo error al actualizar caja', 'error');
        } else {
          console.log('✅ Movimiento en caja registrado correctamente');
        }
      } else {
        console.warn('No hay caja abierta o no se pudo obtener el ID de la caja');
      }

 
      await cargarPrestamos();

      // Cerrar modal y limpiar
      setShowAbonoModal(false);
      setMontoAbono('');
      setPrestamoSeleccionado(null);

      showToast('Abono registrado correctamente', 'success');

    } catch (error: any) {
      console.error('Error registrando abono:', error);
      showToast(error.message || 'Error al registrar abono', 'error');
    } finally {
      setProcesandoAbono(false);
    }
  };

  // Función para cargar pagos de un préstamo
  const cargarPagosPrestamo = async (prestamoId: string) => {
    setCargandoPagos(true);
    try {
      const { data, error } = await (supabase as any)
        .from('pagos_prestamos')
        .select('*')
        .eq('prestamo_id', prestamoId)
        .order('fecha_pago', { ascending: false });

      if (error) {
        console.error('Error cargando pagos:', error);
        showToast('Error al cargar historial de pagos', 'error');
      } else {
        setPagosPrestamo(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error inesperado al cargar pagos', 'error');
    } finally {
      setCargandoPagos(false);
    }
  };

  // Función para abrir modal de detalles
  const handleVerDetalles = async (prestamo: Prestamo) => {

    
    setPrestamoSeleccionado(prestamo);
    setShowDetallesModal(true);
    
    // Recargar datos actualizados del préstamo desde BD
    try {
      const { data: prestamoActualizado, error } = await (supabase as any)
        .from('prestamos')
        .select('*')
        .eq('id', prestamo.id)
        .single();

      if (error) {
        console.error('Error recargando préstamo:', error);
      } else if (prestamoActualizado) {
       
        // Actualizar el estado con los datos frescos de BD
        setPrestamoSeleccionado(prestamoActualizado);
      }
    } catch (error) {
      console.error('Error al recargar préstamo:', error);
    }
    
    // Cargar historial de pagos
    await cargarPagosPrestamo(prestamo.id);
    console.log('================================');
  };

  // Función para abrir modal de abono
  const handleAbrirAbono = (prestamo: Prestamo) => {
    setPrestamoSeleccionado(prestamo);
    setShowAbonoModal(true);
    setMontoAbono('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {toast.message}
          </div>
        ))}
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-purple-700">Total Prestado</div>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              ${totalPrestado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Suma total de préstamos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-amber-700">Total Pendiente</div>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              ${totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Saldo por cobrar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-blue-700">Préstamos Activos</div>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {prestamosActivos}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              En curso actualmente
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-green-700">Efectivo en Caja</div>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              ${efectivoDisponible.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Disponible para préstamos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Préstamos */}
      <Card className="bg-white border-gray-200 w-full max-w-full overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Préstamos Activos</h3>
            <p className="text-sm text-gray-600 mt-1">Gestión de préstamos de empleados</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre de empleado..."
                value={busquedaPrestamos}
                onChange={(e) => setBusquedaPrestamos(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-gray-900 focus:ring-purple-500 w-full sm:w-64"
              />
            </div>
            <Button
              onClick={() => setShowNuevoPrestamoModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Préstamo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto w-full block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Empleado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Monto Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Cuota Mensual</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Fecha Préstamo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Fecha Límite</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Saldo Pendiente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prestamosFiltrados.map((prestamo) => (
                    <tr key={prestamo.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{prestamo.empleados?.nombre_completo || 'Empleado sin nombre'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {formatMoney(prestamo.monto_total)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {formatMoney(prestamo.cuota_mensual)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {prestamo.fecha_prestamo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {prestamo.fecha_limite}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          prestamo.saldo_pendiente > 0 ? 'text-amber-500' : 'text-green-500'
                        }`}>
                          {formatMoney(prestamo.saldo_pendiente)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          prestamo.estado === 'activo' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : prestamo.estado === 'pagado'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {prestamo.estado === 'activo' ? 'Activo' : prestamo.estado === 'pagado' ? 'Pagado' : 'Vencido'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-gray-600 hover:bg-white/10"
                            onClick={() => handleVerDetalles(prestamo)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver detalles
                          </Button>
                          {prestamo.estado === 'activo' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-gray-600 hover:bg-white/10"
                              onClick={() => handleAbrirAbono(prestamo)}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Registrar Abono
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {prestamos.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  No hay préstamos registrados
                </div>
              )}
            </div>
          )}

          {/* Controles de Paginación */}
          {/* Forzar mostrar para depurar */}
          {true && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full p-4 text-sm mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500 text-center md:text-left">
                Página {paginaActual} de {totalPaginas} ({totalRegistros} préstamos) - FORZADO
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={irAPaginaAnterior}
                  disabled={paginaActual === 1}
                  className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </button>

                {/* Números de página */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.max(1, totalPaginas) }, (_, i) => i + 1).map((numPagina) => (
                    <button
                      key={numPagina}
                      onClick={() => irAPagina(numPagina)}
                      className={`px-3 py-1 text-sm border rounded-lg ${
                        paginaActual === numPagina
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {numPagina}
                    </button>
                  ))}
                </div>

                <button
                  onClick={irAPaginaSiguiente}
                  disabled={paginaActual >= totalPaginas}
                  className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles del Préstamo */}
      <Modal
        isOpen={showDetallesModal}
        onClose={() => setShowDetallesModal(false)}
        title="Detalles del Préstamo"
      >
        {prestamoSeleccionado && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 space-y-4">
            {/* Información del Préstamo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Monto Total</label>
                <div className="text-lg font-bold text-gray-900">
                  {formatMoney(prestamoSeleccionado.monto_total)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Cuota Mensual</label>
                <div className="text-lg font-bold text-gray-900">
                  {formatMoney(prestamoSeleccionado.cuota_mensual)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Saldo Pendiente</label>
                <div className={`text-lg font-bold ${prestamoSeleccionado.saldo_pendiente > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                  {formatMoney(prestamoSeleccionado.saldo_pendiente)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Estado</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  prestamoSeleccionado.estado === 'activo' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : prestamoSeleccionado.estado === 'pagado'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {prestamoSeleccionado.estado === 'activo' ? 'Activo' : prestamoSeleccionado.estado === 'pagado' ? 'Pagado' : 'Vencido'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Fecha de Préstamo</label>
                <div className="text-lg font-medium text-gray-900">
                  {new Date(prestamoSeleccionado.fecha_prestamo).toLocaleDateString('es-MX')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Fecha Límite</label>
                <div className="text-lg font-medium text-gray-900">
                  {new Date(prestamoSeleccionado.fecha_limite).toLocaleDateString('es-MX')}
                </div>
              </div>
            </div>

            {/* Sección de Historial de Pagos */}
            <div className="border-t border-white/20 pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Historial de Pagos</h4>
              {cargandoPagos ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                </div>
              ) : pagosPrestamo.length > 0 ? (
                <div className="space-y-2">
                  {pagosPrestamo.map((pago) => (
                    <div key={pago.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            ${pago.monto_pago?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {/* Badge del método de pago */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            pago.metodo_pago === 'efectivo' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {pago.metodo_pago === 'efectivo' ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Efectivo
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                </svg>
                                Transferencia
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {new Date(pago.fecha_pago).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center text-green-500">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Pagado</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p>No hay pagos registrados aún</p>
                  <p className="text-sm mt-2">Los abonos se mostrarán aquí cuando se registren</p>
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-white/20">
              <Button
                variant="outline"
                onClick={() => setShowDetallesModal(false)}
                className="border-white/20 text-gray-600 hover:bg-white/10"
              >
                Cerrar
              </Button>
              {prestamoSeleccionado.estado === 'activo' && (
                <Button
                  onClick={() => {
                    setShowDetallesModal(false);
                    handleAbrirAbono(prestamoSeleccionado);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Registrar Abono
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Registrar Abono */}
      <Modal
        isOpen={showAbonoModal}
        onClose={() => setShowAbonoModal(false)}
        title="Registrar Abono"
      >
        {prestamoSeleccionado && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 space-y-4">
            {/* Información del Préstamo */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-600 font-medium">Información del Préstamo</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Saldo pendiente actual: ${prestamoSeleccionado.saldo_pendiente?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Monto del Abono</label>
              <Input
                type="number"
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
                placeholder="0.00"
                min="0.01"
                max={prestamoSeleccionado.saldo_pendiente || 0}
                step="0.01"
                className="bg-white/10 border-white/20 text-gray-900 focus:ring-amber-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Monto máximo: ${prestamoSeleccionado.saldo_pendiente?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Método de Abono</label>
              <select
                value={metodoAbono}
                onChange={(e) => setMetodoAbono(e.target.value as 'efectivo' | 'transferencia')}
                className="w-full px-3 py-2 bg-white/10 border-white/20 text-gray-900 focus:ring-amber-500 rounded-lg"
              >
                <option value="efectivo">Efectivo (dinero en caja)</option>
                <option value="transferencia">Transferencia (dinero en banco)</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {metodoAbono === 'efectivo' 
                  ? 'Este abono se sumará al efectivo esperado de la caja'
                  : 'Este abono NO afectará el efectivo físico de la caja'
                }
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAbonoModal(false)}
                disabled={procesandoAbono}
                className="border-white/20 text-gray-600 hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRegistrarAbono}
                disabled={procesandoAbono}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {procesandoAbono ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Registrar Abono
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Nuevo Préstamo */}
      <Modal
        isOpen={showNuevoPrestamoModal}
        onClose={() => setShowNuevoPrestamoModal(false)}
        title="Nuevo Préstamo"
      >
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 space-y-4">
          {/* Mensaje de advertencia */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <p className="text-sm text-amber-600">
                Al confirmar, este monto se descontará automáticamente del efectivo en caja.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Empleado</label>
            <select
              value={empleadoSeleccionado}
              onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
            >
              <option value="" className="text-gray-400">Seleccionar empleado</option>
              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id} className="text-gray-900">
                  {empleado.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          {empleadoSeleccionadoData && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Comisión del Empleado</label>
              <Input
                type="text"
                value={`${empleadoSeleccionadoData.porcentaje_comision || 0}%`}
                readOnly
                className="bg-white/10 border-white/20 text-gray-900 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-600 mt-1">Tasa de comisión actual del empleado</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Monto Total</label>
            <Input
              type="number"
              value={formData.monto_total}
              onChange={(e) => setFormData({ ...formData, monto_total: e.target.value })}
              placeholder="0.00"
              className="bg-white/10 border-white/20 text-gray-900 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Cuota Mensual</label>
            <Input
              type="number"
              value={formData.cuota_mensual}
              onChange={(e) => setFormData({ ...formData, cuota_mensual: e.target.value })}
              placeholder="0.00"
              className="bg-white/10 border-white/20 text-gray-900 focus:ring-purple-500"
              readOnly // Solo lectura, se calcula automáticamente
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Plazo (meses)</label>
            <Input
              type="number"
              value={formData.plazo_meses}
              onChange={(e) => setFormData({ ...formData, plazo_meses: e.target.value })}
              placeholder="12"
              className="bg-white/10 border-white/20 text-gray-900 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Fecha de Préstamo</label>
            <Input
              type="date"
              value={formData.fecha_prestamo}
              onChange={(e) => setFormData({ ...formData, fecha_prestamo: e.target.value })}
              className="bg-white/10 border-white/20 text-gray-900 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowNuevoPrestamoModal(false)}
              className="border-white/20 text-gray-600 hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleNuevoPrestamo}
              disabled={procesando}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {procesando ? 'Procesando...' : 'Crear Préstamo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
