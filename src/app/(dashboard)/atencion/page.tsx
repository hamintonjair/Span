'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Search, Plus, Minus, Trash2, CreditCardIcon, Scissors, X, ArrowLeft, User, Package, DollarSign, CreditCard, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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
  descripcion?: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

interface Producto {
  id: string;
  empresa_id: string;
  nombre: string;
  precio: number; // Mantener para compatibilidad
  precio_venta: number; // Campo real de Supabase
  descripcion?: string;
  tipo?: string; // Campo tipo para filtrar 'insumo'
  stock?: number; // Campo stock para verificar disponibilidad
  iva: number; // Campo IVA de la base de datos
  estado: string;
  created_at: string;
  updated_at: string;
}

interface ServicioAdicional {
  servicio_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface ProductoAdicional {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export default function AtencionPage() {
  const { user, loading } = useJWTAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const citaId = searchParams.get('cita_id');

  // Estados para datos
  const [cita, setCita] = useState<Cita | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estados para servicios y productos adicionales
  const [serviciosAdicionales, setServiciosAdicionales] = useState<ServicioAdicional[]>([]);
  const [productosAdicionales, setProductosAdicionales] = useState<ProductoAdicional[]>([]);
  const [busquedaServicio, setBusquedaServicio] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [resultadosServicios, setResultadosServicios] = useState<Servicio[]>([]);
  const [resultadosProductos, setResultadosProductos] = useState<Producto[]>([]);
  const [buscandoServicios, setBuscandoServicios] = useState(false);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  
  // Estados para modales de catálogo completo
  const [modalServicios, setModalServicios] = useState(false);
  const [modalProductos, setModalProductos] = useState(false);
  const [paginaServicios, setPaginaServicios] = useState(1);
  const [paginaProductos, setPaginaProductos] = useState(1);
  const [busquedaModalServicios, setBusquedaModalServicios] = useState('');
  const [busquedaModalProductos, setBusquedaModalProductos] = useState('');
  const [totalServicios, setTotalServicios] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);
  
  // Constantes de paginación
  const ITEMS_POR_PAGINA = 10;
  const ITEMS_VISTA_PREVIA = 5;

  // Estados para modales
  const [showModalPago, setShowModalPago] = useState(false);
  const [showModalTicket, setShowModalTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  // Estados para toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Estado de transición para finalizar atención
  const [isCompleting, setIsCompleting] = useState(false);

  // Función para mostrar toast
  const mostrarToast = (message: string, type: 'success' | 'error' | 'info') => {
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

  // Funciones para cargar catálogos con paginación
  const cargarCatalogoServicios = async (pagina = 1, busqueda = '') => {
    try {
      const offset = (pagina - 1) * ITEMS_POR_PAGINA;
      
      let query = (supabase as any)
        .from('servicios')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user?.empresa_id)
        .eq('estado', 'activo')
        .range(offset, offset + ITEMS_POR_PAGINA - 1);

      if (busqueda.length >= 2) {
        query = query.ilike('nombre', `%${busqueda}%`);
      }

      const { data, count, error } = await query;
      
      if (!error) {
        setResultadosServicios(data || []);
        setTotalServicios(count || 0);
        setPaginaServicios(pagina);
      }
    } catch (error) {
      console.error('Error cargando catálogo de servicios:', error);
    }
  };

  const cargarCatalogoProductos = async (pagina = 1, busqueda = '') => {
    try {
      const offset = (pagina - 1) * ITEMS_POR_PAGINA;
      
      let query = (supabase as any)
        .from('productos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user?.empresa_id)
        .eq('estado', 'activo')
        .neq('tipo', 'insumo')
        .range(offset, offset + ITEMS_POR_PAGINA - 1);

      if (busqueda.length >= 2) {
        query = query.ilike('nombre', `%${busqueda}%`);
      }

      const { data, count, error } = await query;
      
      if (!error) {
        setResultadosProductos(data || []);
        setTotalProductos(count || 0);
        setPaginaProductos(pagina);
      }
    } catch (error) {
      console.error('Error cargando catálogo de productos:', error);
    }
  };

  // Debounce hook para búsquedas
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedBusquedaServicio = useDebounce(busquedaServicio, 500);
  const debouncedBusquedaProducto = useDebounce(busquedaProducto, 500);

  // Efecto para asegurar renderizado cuando los arrays tienen datos
  useEffect(() => {
 
  }, [serviciosAdicionales, productosAdicionales]);

  // Efecto para búsqueda de servicios con debouncing
  useEffect(() => {
    if (debouncedBusquedaServicio.length >= 2 && user?.empresa_id) {
      buscarServicios(debouncedBusquedaServicio);
    } else {
      setResultadosServicios([]);
    }
  }, [debouncedBusquedaServicio]);

  // Búsqueda de productos con debouncing
  useEffect(() => {
    if (debouncedBusquedaProducto.length >= 2 && user?.empresa_id) {
      buscarProductos(debouncedBusquedaProducto);
    } else {
      setResultadosProductos([]);
    }
  }, [debouncedBusquedaProducto]);

  const buscarServicios = async (termino: string) => {
    if (!user?.empresa_id) return;
    
    setBuscandoServicios(true);
    try {
      const { data, error } = await (supabase as any)
        .from('servicios')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .ilike('nombre', `%${termino}%`) // Búsqueda insensible a mayúsculas/minúsculas
        .order('nombre')
        .limit(50); // Aumentar límite para mostrar más servicios

      if (error) throw error;
      setResultadosServicios(data || []);
      console.log('🔍 Servicios encontrados en búsqueda:', data?.length || 0);
    } catch (error) {
      console.error('Error buscando servicios:', error);
      mostrarToast('Error buscando servicios', 'error');
    } finally {
      setBuscandoServicios(false);
    }
  };

  const buscarProductos = async (termino: string) => {
    if (!user?.empresa_id) return;
    
    setBuscandoProductos(true);
    try {
      const { data, error } = await (supabase as any)
        .from('productos')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .neq('tipo', 'insumo') // Excluir productos tipo 'insumo'
        .ilike('nombre', `%${termino}%`) // Búsqueda insensible a mayúsculas/minúsculas
        .order('nombre')
        .limit(50); // Aumentar límite para mostrar más productos

      if (error) throw error;
      setResultadosProductos(data || []);
      console.log('🔍 Productos encontrados en búsqueda:', data?.length || 0);
    } catch (error) {
      console.error('Error buscando productos:', error);
      mostrarToast('Error buscando productos', 'error');
    } finally {
      setBuscandoProductos(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!user.empresa_id) {
      mostrarToast('Usuario no autenticado', 'error');
      return;
    }
    if (!citaId) {
      mostrarToast('No se proporcionó ID de cita', 'error');
      return;
    }
    // Cargar datos de la cita (cliente, empleado)
    cargarDatosAtencion();
  }, [user, loading, citaId]);

  // useEffect independiente para cargar ítems guardados
  useEffect(() => {
    if (citaId && cita && servicios.length > 0 && productos.length > 0) {
    
      cargarServiciosProductosGuardados();
    }
  }, [citaId, cita, servicios.length, productos.length]);

  const cargarDatosAtencion = async () => {
    if (!user?.empresa_id) {
      mostrarToast('Usuario no autenticado', 'error');
      return;
    }
    
    setLoadingData(true);
    try {
 
      // Cargar datos de la cita
      const { data: citaData, error: citaError } = await (supabase as any)
        .from('citas')
        .select('*')
        .eq('id', citaId)
        .eq('empresa_id', user.empresa_id)
        .single();

      if (citaError) {
        console.error('Error cargando cita:', citaError);
        throw citaError;
      }

      if (!citaData) {
        throw new Error('Cita no encontrada');
      }

      setCita(citaData);
      console.log('✅ Cita cargada:', citaData);

      // Cambiar estado a 'en_atencion'
      const { error: updateError } = await (supabase as any)
        .from('citas')
        .update({ 
          estado: 'en_atencion',
          updated_at: new Date().toISOString()
        })
        .eq('id', citaId);

      if (updateError) {
        console.error('Error actualizando estado de cita:', updateError);
        throw updateError;
      }

      console.log('✅ Estado de cita actualizado a "en_atencion"');

      // Cargar datos del cliente
      const { data: clienteData, error: clienteError } = await (supabase as any)
        .from('clientes')
        .select('*')
        .eq('id', citaData.cliente_id)
        .single();

      if (clienteError) {
        console.error('Error cargando cliente:', clienteError);
        throw clienteError;
      }
      setCliente(clienteData);
      console.log('✅ Cliente cargado:', clienteData);

      // Cargar datos del empleado
      const { data: empleadoData, error: empleadoError } = await (supabase as any)
        .from('empleados')
        .select('*')
        .eq('id', citaData.empleado_id)
        .single();

      if (empleadoError) {
        console.error('Error cargando empleado:', empleadoError);
        throw empleadoError;
      }
      setEmpleado(empleadoData);
      console.log('✅ Empleado cargado:', empleadoData);

      // Cargar servicios disponibles
      const { data: serviciosData, error: serviciosError } = await (supabase as any)
        .from('servicios')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .order('nombre');

      if (serviciosError) {
        console.error('Error cargando servicios:', serviciosError);
        throw serviciosError;
      }
      setServicios(serviciosData || []);
      console.log('✅ Servicios cargados:', serviciosData?.length || 0);

      // Cargar productos disponibles
      const { data: productosData, error: productosError } = await (supabase as any)
        .from('productos')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo')
        .order('nombre');

      if (productosError) {
        console.error('Error cargando productos:', productosError);
        throw productosError;
      }
      setProductos(productosData || []);
      console.log('✅ Productos cargados:', productosData?.length || 0);

      // NOTA: Los servicios originales y adicionales se cargan en cargarServiciosProductosGuardados
      // para evitar duplicación y asegurar sincronización correcta

      // Cargar servicios y productos adicionales guardados en BD
      await cargarServiciosProductosGuardados();

      console.log('🔍 Después de cargar desde BD - servicios:', serviciosAdicionales.length);
      console.log('🔍 Después de cargar desde BD - productos:', productosAdicionales.length);

    } catch (error) {
      console.error('💥 Error cargando datos de atención:', error);
      mostrarToast('Error al cargar datos de atención', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const cargarEstadoDesdeLocalStorage = () => {
    if (!citaId) return;
    
    try {
      const guardado = localStorage.getItem(`atencion_${citaId}`);
      if (guardado) {
        const estado = JSON.parse(guardado);
        // NO sobrescribir el catálogo general, solo cargar estado adicional
        // setServiciosAdicionales(estado.serviciosAdicionales || []);
        // setProductosAdicionales(estado.productosAdicionales || []);
        console.log('✅ Estado adicional encontrado en localStorage (no se aplica aún)');
      }
    } catch (error) {
      console.error('Error cargando estado desde localStorage:', error);
    }
  };

  const cargarServiciosProductosGuardados = async () => {
    if (!cita || !citaId) return;

    try {
      console.log('🔄 Cargando servicios y productos adicionales desde BD...');
      
      // 1. Cargar servicios adicionales desde BD
      const { data: serviciosData, error: errorServicios } = await (supabase as any)
        .from('cita_servicios_adicionales')
        .select('*')
        .eq('cita_id', citaId);

      // 2. Cargar productos desde BD
      const { data: productosData, error: errorProductos } = await (supabase as any)
        .from('cita_productos')
        .select('*')
        .eq('cita_id', citaId);

      if (errorServicios || errorProductos) {
        console.error('Error cargando datos guardados:', errorServicios || errorProductos);
        return;
      }

      // 3. Formatear servicios guardados
      const serviciosGuardados = serviciosData ? serviciosData.map((sg: any) => ({
        servicio_id: sg.servicio_id,
        cantidad: sg.cantidad,
        precio_unitario: sg.precio_unitario,
        subtotal: sg.subtotal
      })) : [];

      // 4. Formatear productos guardados
      const productosGuardados = productosData ? productosData.map((pg: any) => ({
        producto_id: pg.producto_id,
        cantidad: pg.cantidad,
        precio_unitario: pg.precio_unitario,
        subtotal: pg.subtotal
      })) : [];

      // 5. Crear servicios originales a partir de los servicios_ids de la cita
      let serviciosOriginalesFormateados: any[] = [];
      if (cita.servicios_ids && cita.servicios_ids.length > 0 && servicios.length > 0) {
        serviciosOriginalesFormateados = servicios
          .filter((servicio: Servicio) => cita.servicios_ids.includes(servicio.id))
          .map((servicio: Servicio) => ({
            servicio_id: servicio.id,
            cantidad: 1,
            precio_unitario: servicio.precio,
            subtotal: servicio.precio
          }));
      }

      // 6. Combinar servicios originales con adicionales (evitando duplicados)
      const serviciosFinales = [...serviciosOriginalesFormateados];
      
      // Agregar servicios adicionales que no estén ya en los originales
      serviciosGuardados.forEach((servicioGuardado: any) => {
        const yaExiste = serviciosFinales.some(sa => sa.servicio_id === servicioGuardado.servicio_id);
        if (!yaExiste) {
          serviciosFinales.push(servicioGuardado);
        } else {
          // Si ya existe, actualizar cantidad y subtotal
          const existente = serviciosFinales.find(sa => sa.servicio_id === servicioGuardado.servicio_id);
          if (existente) {
            existente.cantidad += servicioGuardado.cantidad;
            existente.subtotal += servicioGuardado.subtotal;
          }
        }
      });

      // 7. Establecer estados finales
      setServiciosAdicionales(serviciosFinales);
      setProductosAdicionales(productosGuardados);

      console.log('✅ Servicios originales:', serviciosOriginalesFormateados.length);
      console.log('✅ Servicios adicionales guardados:', serviciosGuardados.length);
      console.log('✅ Productos guardados:', productosGuardados.length);
      console.log('✅ Servicios finales combinados:', serviciosFinales.length);

    } catch (error) {
      console.error('💥 Error cargando servicios y productos guardados:', error);
      mostrarToast('Error al cargar datos guardados', 'error');
    }
  };

  // Función para actualizar inventario de productos
  const actualizarInventarioProducto = async (productoId: string, cantidad: number) => {
    try {
      // Primero obtener el stock actual
      const { data: productoActual, error: errorConsulta } = await (supabase as any)
        .from('productos')
        .select('stock')
        .eq('id', productoId)
        .single();

      if (errorConsulta) {
        console.error('Error consultando stock actual:', errorConsulta);
        return;
      }

      // Calcular nuevo stock
      const stockActual = productoActual?.stock || 0;
      const nuevoStock = stockActual + cantidad;

      // Actualizar con el nuevo valor
      const { error } = await (supabase as any)
        .from('productos')
        .update({ 
          stock: nuevoStock
        })
        .eq('id', productoId);

      if (error) {
        console.error('Error actualizando inventario:', error);
      } else {
        console.log(`✅ Stock actualizado: ${stockActual} → ${nuevoStock}`);
      }
    } catch (error) {
      console.error('Error en actualizarInventarioProducto:', error);
    }
  };

  // Función para agregar servicio
  const agregarServicio = async (servicio: Servicio) => {
    if (!cita || !citaId) return;

    try {
      // Verificar si el servicio ya existe en la cita
      const existente = serviciosAdicionales.find(s => s.servicio_id === servicio.id);
      
      if (existente) {
        // UPDATE: Sumar +1 a la cantidad
        const nuevaCantidad = existente.cantidad + 1;
        const nuevoSubtotal = nuevaCantidad * existente.precio_unitario;
        
        // Actualizar en base de datos
        const { error } = await (supabase as any)
          .from('cita_servicios_adicionales')
          .update({
            cantidad: nuevaCantidad,
            subtotal: nuevoSubtotal
          })
          .eq('cita_id', citaId)
          .eq('servicio_id', servicio.id);

        if (error) throw error;

        // Actualizar en estado local
        setServiciosAdicionales(prev => 
          prev.map(s => 
            s.servicio_id === servicio.id 
              ? { ...s, cantidad: nuevaCantidad, subtotal: nuevoSubtotal }
              : s
          )
        );
        
      } else {
        // INSERT: Agregar nuevo servicio
        const precioUnitario = servicio.precio;
        const subtotal = precioUnitario * 1;
        
        // Insertar en base de datos
        const { error } = await (supabase as any)
          .from('cita_servicios_adicionales')
          .insert({
            cita_id: citaId,
            servicio_id: servicio.id,
            cantidad: 1,
            precio_unitario: precioUnitario,
            subtotal: subtotal
          });

        if (error) throw error;

        // Agregar al estado local
        setServiciosAdicionales(prev => [...prev, {
          servicio_id: servicio.id,
          cantidad: 1,
          precio_unitario: precioUnitario,
          subtotal: subtotal
        }]);
      }
      
      setBusquedaServicio('');
      mostrarToast('Servicio agregado', 'success');
      
    } catch (error) {
      console.error('Error agregando servicio:', error);
      mostrarToast('Error al agregar servicio', 'error');
    }
  };

  // Función para agregar producto
  const agregarProducto = async (producto: Producto) => {
    if (!cita || !citaId) return;

    try {
      // Verificar si el producto ya existe en la cita
      const existente = productosAdicionales.find(p => p.producto_id === producto.id);
      
      if (existente) {
        // UPDATE: Sumar +1 a la cantidad
        const nuevaCantidad = existente.cantidad + 1;
        const nuevoSubtotal = nuevaCantidad * existente.precio_unitario;
        
        // Actualizar en base de datos
        const { error } = await (supabase as any)
          .from('cita_productos')
          .update({
            cantidad: nuevaCantidad,
            subtotal: nuevoSubtotal
          })
          .eq('cita_id', citaId)
          .eq('producto_id', producto.id);

        if (error) throw error;

        // Actualizar en estado local
        setProductosAdicionales(prev => 
          prev.map(p => 
            p.producto_id === producto.id 
              ? { ...p, cantidad: nuevaCantidad, subtotal: nuevoSubtotal }
              : p
          )
        );

        // Actualizar inventario
        await actualizarInventarioProducto(producto.id, -1);
        
      } else {
        // INSERT: Agregar nuevo producto (solo si hay stock disponible)
        if (producto.stock && producto.stock > 0) {
          const precioUnitario = Number(producto.precio_venta || 0);
          const subtotal = precioUnitario * 1;
          
          // Insertar en base de datos
          const { error } = await (supabase as any)
            .from('cita_productos')
            .insert({
              cita_id: citaId,
              producto_id: producto.id,
              cantidad: 1,
              precio_unitario: precioUnitario,
              subtotal: subtotal
            });

          if (error) throw error;

          // Agregar al estado local
          setProductosAdicionales(prev => [...prev, {
            producto_id: producto.id,
            cantidad: 1,
            precio_unitario: precioUnitario,
            subtotal: subtotal,
            iva: producto.iva || 0
          }]);

          // Actualizar inventario
          await actualizarInventarioProducto(producto.id, -1);
        } else {
          mostrarToast('Producto sin stock disponible', 'error');
        }
      }
      
      setBusquedaProducto('');
      mostrarToast('Producto agregado', 'success');
      
    } catch (error) {
      console.error('Error agregando producto:', error);
      mostrarToast('Error al agregar producto', 'error');
    }
  };

  // Función para eliminar servicio adicional
  const eliminarServicio = async (servicioId: string) => {
    if (!cita || !citaId) return;

    try {
      // Eliminar de base de datos
      const { error } = await (supabase as any)
        .from('cita_servicios_adicionales')
        .delete()
        .eq('cita_id', citaId)
        .eq('servicio_id', servicioId);

      if (error) throw error;

      // Eliminar del estado local
      setServiciosAdicionales(prev => 
        prev.filter(s => s.servicio_id !== servicioId)
      );

      mostrarToast('Servicio eliminado', 'success');
      
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      mostrarToast('Error al eliminar servicio', 'error');
    }
  };

  // Función para eliminar producto adicional
  const eliminarProducto = async (productoId: string) => {
    if (!cita || !citaId) return;

    try {
      // Obtener el producto a eliminar para devolver al inventario
      const productoAEliminar = productosAdicionales.find(p => p.producto_id === productoId);
      
      if (productoAEliminar) {
        // Eliminar de base de datos
        const { error } = await (supabase as any)
          .from('cita_productos')
          .delete()
          .eq('cita_id', citaId)
          .eq('producto_id', productoId);

        if (error) throw error;

        // Devolver al inventario
        await actualizarInventarioProducto(productoId, productoAEliminar.cantidad);

        // Eliminar del estado local
        setProductosAdicionales(prev => 
          prev.filter(p => p.producto_id !== productoId)
        );

        mostrarToast('Producto eliminado', 'success');
      }
      
    } catch (error) {
      console.error('Error eliminando producto:', error);
      mostrarToast('Error al eliminar producto', 'error');
    }
  };

  const finalizarAtencion = async () => {
    try {
      if (!cita || !cliente || !empleado) {
        mostrarToast('Faltan datos para finalizar la atención', 'error');
        return;
      }

      // Establecer estado de completando para bloquear renderizado de errores
      setIsCompleting(true);

      // 1. Calcular totales completos
      const subtotalServicios = serviciosAdicionales.reduce((acc, sa) => acc + sa.subtotal, 0);
      const subtotalProductos = productosAdicionales.reduce((acc, pa) => acc + pa.subtotal, 0);
      const subtotalTotal = subtotalServicios + subtotalProductos;
      
      // Calcular IVA total
      const ivaTotal = productosAdicionales.reduce((acc, pa) => {
        const producto = productos.find(p => p.id === pa.producto_id);
        const porcentaje = producto?.iva || 0;
        return acc + (pa.subtotal * (porcentaje / 100));
      }, 0);
      
      const totalConIVA = subtotalTotal + ivaTotal;

 

      // 2. Actualizar inventario final (restar stock de productos adicionales)
      // Nota: Los productos ya se restaron al agregarlos, pero verificamos por seguridad
      for (const productoAdicional of productosAdicionales) {
        const producto = productos.find(p => p.id === productoAdicional.producto_id);
        if (producto && productoAdicional.cantidad > 0) {
          // Verificar si el producto ya fue descontado del inventario
          // Solo restamos si no se había restado antes (productos que no son originales)
          const esProductoOriginal = false; // Los productos adicionales nunca son originales
          
          if (!esProductoOriginal) {
            // Opcional: verificar stock actual antes de restar
            const { data: stockActual } = await (supabase as any)
              .from('productos')
              .select('stock')
              .eq('id', producto.id)
              .single();
            
            
            // Si el stock aún es suficiente, restamos (por si acaso no se restó antes)
            if (stockActual && stockActual.stock >= productoAdicional.cantidad) {
              await actualizarInventarioProducto(producto.id, -productoAdicional.cantidad);
            } else {
              console.log(`⚠️ Stock insuficiente para ${producto.nombre}, saltando resta`);
            }
          }
        }
      }

      // 3. Crear Venta (igual que POS)
      // Generar número de factura aleatorio de 9 dígitos
      const numFactura = Math.floor(100000000 + Math.random() * 900000000).toString();
      
      const ventaData = {
        empresa_id: user?.empresa_id,
        cliente_id: cliente.id,
        vendedor_id: user?.id, // Usuario del sistema que vende
        cita_id: cita.id, // Vincular con la cita
        subtotal: subtotalTotal,
        impuestos: ivaTotal, // Usar 'impuestos' en lugar de 'iva'
        total: totalConIVA,
        metodo_pago: 'efectivo', // Por defecto, se puede ajustar
        estado: 'completada',
        fecha: new Date().toISOString(), // Usar 'fecha' en lugar de 'created_at'
        numero_factura: numFactura // Agregar número de factura de 9 dígitos
      };

      
      // Asegurarse de que no haya campo 'iva'
      if ('iva' in ventaData) {
        console.error('❌ ERROR: Campo "iva" encontrado en ventaData');
        delete (ventaData as any).iva;
      }
      
      const { data: ventaCreada, error: ventaError } = await (supabase as any)
        .from('ventas')
        .insert(ventaData)
        .select()
        .single();

      if (ventaError) {
        console.error('Error creando venta:', ventaError);
        mostrarToast('Error al crear la venta', 'error');
        return;
      }


      // 4. Insertar detalles de la venta (servicios)
      for (const servicioAdicional of serviciosAdicionales) {
        const servicio = servicios.find(s => s.id === servicioAdicional.servicio_id);
        if (servicio) {
          await (supabase as any)
            .from('detalles_ventas') // ✅ Nombre correcto de la tabla
            .insert({
              venta_id: ventaCreada.id,
              servicio_id: servicioAdicional.servicio_id,
              producto_id: null,
              cantidad: servicioAdicional.cantidad,
              precio_unitario: servicioAdicional.precio_unitario,
              descuento: 0, // ✅ Campo requerido en la tabla
              subtotal: servicioAdicional.subtotal
            });
        } else {
          console.error('❌ Servicio no encontrado:', servicioAdicional.servicio_id);
        }
      }

      // 5. Insertar detalles de la venta (productos)
      for (const productoAdicional of productosAdicionales) {
        const producto = productos.find(p => p.id === productoAdicional.producto_id);
        if (producto) {
          console.log('💾 Insertando producto:', productoAdicional);
          await (supabase as any)
            .from('detalles_ventas') // ✅ Nombre correcto de la tabla
            .insert({
              venta_id: ventaCreada.id,
              servicio_id: null,
              producto_id: productoAdicional.producto_id,
              cantidad: productoAdicional.cantidad,
              precio_unitario: productoAdicional.precio_unitario,
              descuento: 0, // ✅ Campo requerido en la tabla
              subtotal: productoAdicional.subtotal
            });
        } else {
          console.error('❌ Producto no encontrado:', productoAdicional.producto_id);
        }
      }

      // 6. Actualizar estado de la cita a 'completada'
      const { error: updateError } = await (supabase as any)
        .from('citas')
        .update({
          estado: 'completada',
          total_estimado: totalConIVA,
          updated_at: new Date().toISOString()
        })
        .eq('id', citaId);

      if (updateError) {
        console.error('Error actualizando estado de cita:', updateError);
        mostrarToast('Error al finalizar atención', 'error');
        return;
      }

      // 7. Limpiar localStorage
      localStorage.removeItem(`atencion_${citaId}`);

      mostrarToast('Atención finalizada y venta generada correctamente', 'success');

      // 8. Abrir ticket de venta en la misma pestaña (sin nueva ventana)
      setTimeout(() => {
        // Abrir ticket de venta en la misma pestaña con parámetro from
        window.location.href = `/ventas/imprimir/${ventaCreada.id}?from=atencion`;
        
        // NOTA: No limpiamos el estado isCompleting para mantener el spinner visible
        // hasta que la nueva página del ticket cargue por completo
      }, 1000);

    } catch (error) {
      console.error('❌ Error finalizando atención:', error);
      // Restaurar estado si hay error
      setIsCompleting(false);
      mostrarToast('Error al finalizar la atención', 'error');
    }
  };

  const calcularTotal = () => {
    const totalServicios = serviciosAdicionales.reduce((acc, sa) => acc + sa.subtotal, 0);
    const totalProductos = productosAdicionales.reduce((acc, pa) => acc + pa.subtotal, 0);
    return totalServicios + totalProductos;
  };

  const calcularIVA = () => {
    // Calcular IVA dinámico basado en el campo iva de cada producto
    return productosAdicionales.reduce((acc, pa) => {
      const producto = productos.find(p => p.id === pa.producto_id);
      // Usar campo 'iva' directamente desde el producto del catálogo
      const porcentaje = producto?.iva || 0; 
      const precioUnitario = Number(producto?.precio_venta || 0);
      return acc + (pa.subtotal * (porcentaje / 100));
    }, 0);
  };

  const calcularTotalConIVA = () => {
    return calcularTotal() + calcularIVA();
  };

  const guardarServiciosProductosAdicionales = async () => {
    if (!cita || !citaId) return;

    try {
      // Guardar servicios adicionales
      for (const servicioAd of serviciosAdicionales) {
        const esOriginal = cita.servicios_ids.includes(servicioAd.servicio_id);
        
        if (!esOriginal) {
          // Solo guardar servicios adicionales (no los originales)
          await (supabase as any)
            .from('cita_servicios_adicionales')
            .insert({
              cita_id: citaId,
              servicio_id: servicioAd.servicio_id,
              cantidad: servicioAd.cantidad,
              precio_unitario: servicioAd.precio_unitario,
              subtotal: servicioAd.subtotal,
              created_at: new Date().toISOString()
            });
        }
      }

      // Guardar productos adicionales
      for (const productoAd of productosAdicionales) {
        await (supabase as any)
          .from('cita_productos')
          .insert({
            cita_id: citaId,
            producto_id: productoAd.producto_id,
            cantidad: productoAd.cantidad,
            precio_unitario: productoAd.precio_unitario,
            subtotal: productoAd.subtotal,
            created_at: new Date().toISOString()
          });
      }

    } catch (error) {
      console.error('Error guardando servicios/productos adicionales:', error);
      throw error;
    }
  };

  const serviciosFiltrados = Array.isArray(servicios) 
  ? servicios.filter(servicio => 
      servicio.nombre.toLowerCase().includes(busquedaServicio.toLowerCase()) &&
      !(cita?.servicios_ids || []).includes(servicio.id) // Evitar duplicados con null-safety
    ).slice(0, ITEMS_VISTA_PREVIA) // Limitar a 5 resultados
  : [];

  const productosFiltrados = Array.isArray(productos) 
  ? productos.filter(producto => 
      producto.tipo !== 'insumo' && 
      producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
      (producto.precio_venta ?? 0) > 0 && // Mostrar productos con precio_venta > 0
      (producto.stock || 0) > 0 // Solo mostrar productos con stock disponible
    ).slice(0, ITEMS_VISTA_PREVIA) // Limitar a 5 resultados
  : [];

  if (loading || loadingData) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-gray-500 mb-2">
              {loading ? 'Verificando autenticación...' : 'Cargando datos de atención...'}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isCompleting) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Generando ticket...</h1>
            <p className="text-gray-600">Por favor, espera mientras procesamos la finalización de la atención</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !cita || !cliente || !empleado) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              No se pudo cargar la información de la atención.
            </div>
            <Button
              onClick={() => router.push('/citas')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Volver al Calendario
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
        <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push('/citas')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Calendario
            </Button>
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900">Panel de Atención Activa</h1>
              <p className="text-gray-600">Gestionando servicios para {cliente.nombre}</p>
            </div>
          </div>
          <div className="text-right w-full lg:w-auto">
            <div className="text-sm text-gray-500">Cita #{cita.id.slice(-8)}</div>
            <div className="text-lg font-semibold text-blue-600">
              Total: ${(calcularTotal() || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Contenido Principal - Vista Dividida */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          
          {/* Izquierda: Datos del Cliente y Servicio Agendado */}
          <div className="space-y-6">
            {/* Información del Cliente */}
            <Card className="w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <Input value={cliente.nombre} disabled className="bg-gray-50 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                  <Input value={cliente.cedula || 'N/A'} disabled className="bg-gray-50 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <Input value={cliente.telefono || 'N/A'} disabled className="bg-gray-50 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                  <Input value={empleado.nombre_completo} disabled className="bg-gray-50 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                  <Input 
                    value={formatearFechaCompletaBogota(cita.fecha)} 
                    disabled 
                    className="bg-gray-50 w-full" 
                  />
                </div>
                {cita.notas && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                    <textarea 
                      value={cita.notas} 
                      disabled 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Servicios Originales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Servicios Agendados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviciosAdicionales.filter(sa => 
                    cita.servicios_ids.includes(sa.servicio_id)
                  ).map((servicioAdicional) => {
                    const servicio = servicios.find(s => s.id === servicioAdicional.servicio_id);
                    return (
                      <div key={servicioAdicional.servicio_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{servicio?.nombre}</div>
                          <div className="text-sm text-gray-500">
                            {servicio?.duracion_minutos} min - ${(servicio?.precio || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${(servicioAdicional.subtotal || 0).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">x{servicioAdicional.cantidad}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Derecha: Espacio para añadir servicios adicionales */}
          <div className="space-y-6">
            {/* Agregar Servicios Adicionales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Servicios Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar servicio (mínimo 2 caracteres)..."
                    value={busquedaServicio}
                    onChange={(e) => setBusquedaServicio(e.target.value)}
                    className="pl-10"
                  />
                  {buscandoServicios && (
                    <div className="absolute right-3 top-3">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {serviciosFiltrados.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    <div className="p-2 space-y-2">
                      {serviciosFiltrados.map((servicio) => (
                        <div
                          key={servicio.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => agregarServicio(servicio)}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{servicio.nombre}</div>
                            <div className="text-sm text-gray-500">
                              {servicio.duracion_minutos} min
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-semibold text-green-600">
                                ${(servicio?.precio ?? 0).toFixed(2)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón Ver más servicios */}
                {servicios.length > ITEMS_VISTA_PREVIA && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setModalServicios(true);
                      cargarCatalogoServicios(1, '');
                    }}
                    className="w-full"
                  >
                    Ver todos los servicios ({servicios.length})
                  </Button>
                )}

                {/* Lista de servicios adicionales */}
                <div className="space-y-2">
                  {(() => {
                    console.log('🔍 Renderizando serviciosAdicionales:', serviciosAdicionales);
                    console.log('🔍 Renderizando servicios:', servicios);
                    console.log('🔍 Cita servicios_ids:', cita?.servicios_ids);
                    return null;
                  })()}
                  {serviciosAdicionales.map((servicioAdicional) => {
                    const servicio = servicios.find(s => s.id === servicioAdicional.servicio_id);
                    const esOriginal = cita.servicios_ids.includes(servicioAdicional.servicio_id);
                    
                    return (
                      <div key={servicioAdicional.servicio_id} className="flex flex-row justify-between items-center w-full p-3 gap-3 overflow-hidden border rounded-lg">
                        <div className="flex flex-col flex-1 min-w-0 items-start">
                          <div className="font-medium flex items-center gap-2 truncate w-full">
                            {servicio?.nombre}
                            {esOriginal && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Original</span>}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${(servicio?.precio || 0).toFixed(2)} c/u
                          </div>
                          <div className="text-green-600 font-bold mt-1">
                            ${(servicioAdicional.subtotal || 0).toFixed(2)} x{servicioAdicional.cantidad}
                          </div>
                        </div>
                        <div className="flex shrink-0">
                          {!esOriginal && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => eliminarServicio(servicioAdicional.servicio_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Agregar Productos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar producto (mínimo 2 caracteres)..."
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    className="pl-10 w-full text-sm"
                  />
                  {buscandoProductos && (
                    <div className="absolute right-3 top-3">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {/* Filtrar productos antes del renderizado */}
                {/* const productosFiltrados = resultadosProductos.filter(p => 
                  p.tipo !== 'insumo' && 
                  p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
                ); */}

                {productosFiltrados.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    <div className="p-2 space-y-2">
                      {productosFiltrados.map((producto) => (
                        <div
                          key={producto.id}
                          className="flex flex-row justify-between items-center w-full p-3 gap-3 overflow-hidden border rounded-lg bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => agregarProducto(producto)}
                        >
                          <div className="flex flex-col flex-1 min-w-0 items-start">
                            <div className="font-medium text-gray-900 truncate w-full">{producto?.nombre}</div>
                            <div className="text-sm text-gray-500">
                              Disponible: {producto.stock || 0} unidades
                            </div>
                            <div className="text-green-600 font-bold mt-1">
                              ${Number(producto?.precio_venta || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex shrink-0">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón Ver más productos */}
                {productos.length > ITEMS_VISTA_PREVIA && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setModalProductos(true);
                      cargarCatalogoProductos(1, '');
                    }}
                    className="w-full"
                  >
                    Ver todos los productos ({productos.length})
                  </Button>
                )}

                {/* Lista de productos */}
                <div className="space-y-2">
                  {(() => {
                    console.log('🔍 Renderizando productosAdicionales:', productosAdicionales);
                    console.log('🔍 Renderizando productos:', productos);
                    return null;
                  })()}
                  {productosAdicionales.map((productoAdicional) => {
                    const producto = productos.find(p => p.id === productoAdicional.producto_id);
                    console.log('🔍 Buscando producto:', {
                      buscando_id: productoAdicional.producto_id,
                      productos_disponibles: productos.map(p => ({ id: p.id, nombre: p.nombre })),
                      encontrado: producto
                    });
                    
                    return (
                      <div key={productoAdicional.producto_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{producto?.nombre}</div>
                          <div className="text-sm text-gray-500">
                            ${(producto?.precio_venta ?? 0).toFixed(2)} c/u
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-medium">${(productoAdicional.subtotal || 0).toFixed(2)}</div>
                            <div className="text-sm text-gray-500">x{productoAdicional.cantidad}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => eliminarProducto(productoAdicional.producto_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Resumen y Botón Final */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Resumen de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${(calcularTotal() || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span>{calcularIVA().toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{calcularTotalConIVA().toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
                  </div>
                </div>
                
                <Button
                  onClick={finalizarAtencion}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Finalizar y Generar Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal del Ticket */}
      {showModalTicket && ticketData && (
        <Modal
          isOpen={showModalTicket}
          onClose={() => setShowModalTicket(false)}
          title="Ticket de Venta"
          size="md"
        >
          <div className="bg-white p-6">
            {/* Encabezado del Ticket - Fallback BEAUTYPRO */}
            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto mb-4 bg-black rounded-full flex items-center justify-center shadow-lg">
                <Scissors className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">BEAUTYPRO</h2>
              <p className="text-sm text-gray-600 font-bold mb-1">NIT: 900.123.456-7</p>
              <p className="text-sm text-gray-600">Dirección del salón</p>
              <p className="text-sm text-gray-600">Teléfono: 123-456-7890</p>
              <p className="text-sm text-gray-600">Quibdó, Chocó</p>
            </div>

            {/* Información de la Venta */}
            <div className="border-t border-b py-4 mb-4">
              <div className="text-sm space-y-1">
                <div><strong>Fecha:</strong> {new Date(ticketData.fecha_emision).toLocaleString('es-CO')}</div>
                <div><strong>Cliente:</strong> {ticketData.cliente.nombre}</div>
                <div><strong>Cédula:</strong> {ticketData.cliente.cedula || 'N/A'}</div>
                <div><strong>Empleado:</strong> {ticketData.empleado.nombre}</div>
                <div><strong>Cita:</strong> #{ticketData.cita.id.slice(-8)}</div>
              </div>
            </div>

            {/* Detalles de Servicios */}
            {ticketData.servicios.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between font-bold mb-2 text-sm">
                  <span>SERVICIO</span>
                  <span>TOTAL</span>
                </div>
                <div className="space-y-1 text-sm">
                  {ticketData.servicios.map((servicio: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{servicio.nombre} x{servicio.cantidad}</span>
                      <span>${(servicio?.subtotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalles de Productos */}
            {ticketData.productos.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between font-bold mb-2 text-sm">
                  <span>PRODUCTO</span>
                  <span>TOTAL</span>
                </div>
                <div className="space-y-1 text-sm">
                  {ticketData.productos.map((producto: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{producto.nombre} x{producto.cantidad}</span>
                      <span>${(producto?.subtotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totales */}
            <div className="border-t pt-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${(ticketData.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span>${(ticketData.iva || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL A PAGAR:</span>
                  <span>${(ticketData.total_con_iva || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Pie del Ticket */}
            <div className="text-center mt-6 pt-4 border-t">
              <p className="text-xs text-gray-600">¡Gracias por su visita!</p>
              <p className="text-xs text-gray-600">Vuelva pronto</p>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowModalTicket(false)}
                className="flex-1"
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  window.print();
                  setShowModalTicket(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Imprimir Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Catálogo de Servicios */}
      <Modal
        isOpen={modalServicios}
        onClose={() => setModalServicios(false)}
        title="Catálogo de Servicios"
      >
        <div className="space-y-4">
          {/* Búsqueda en modal */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar servicios..."
              value={busquedaModalServicios}
              onChange={(e) => {
                setBusquedaModalServicios(e.target.value);
                setPaginaServicios(1);
                cargarCatalogoServicios(1, e.target.value);
              }}
              className="pl-10"
            />
          </div>

          {/* Lista de servicios con paginación */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {resultadosServicios.map((servicio) => (
              <div
                key={servicio.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  agregarServicio(servicio);
                  setModalServicios(false);
                }}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{servicio.nombre}</div>
                  <div className="text-sm text-gray-500">
                    {servicio.duracion_minutos} min • {servicio.descripcion || 'Sin descripción'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ${(servicio?.precio ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {resultadosServicios.length} de {totalServicios} servicios
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                disabled={paginaServicios === 1}
                onClick={() => cargarCatalogoServicios(paginaServicios - 1, busquedaModalServicios)}
              >
                Anterior
              </Button>
              <span className="px-3 py-1 text-sm">
                Página {paginaServicios} de {Math.ceil(totalServicios / ITEMS_POR_PAGINA)}
              </span>
              <Button 
                variant="outline" 
                disabled={paginaServicios >= Math.ceil(totalServicios / ITEMS_POR_PAGINA)}
                onClick={() => cargarCatalogoServicios(paginaServicios + 1, busquedaModalServicios)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de Catálogo de Productos */}
      <Modal
        isOpen={modalProductos}
        onClose={() => setModalProductos(false)}
        title="Catálogo de Productos"
      >
        <div className="space-y-4">
          {/* Búsqueda en modal */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar productos..."
              value={busquedaModalProductos}
              onChange={(e) => {
                setBusquedaModalProductos(e.target.value);
                setPaginaProductos(1);
                cargarCatalogoProductos(1, e.target.value);
              }}
              className="pl-10"
            />
          </div>

          {/* Lista de productos con paginación */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {resultadosProductos.map((producto) => (
              <div
                key={producto.id}
                className={`flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer ${
                  (producto.stock || 0) === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => {
                  if ((producto.stock || 0) > 0) {
                    agregarProducto(producto);
                    setModalProductos(false);
                  }
                }}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{producto.nombre}</div>
                  <div className="text-sm text-gray-500">
                    Stock: {producto.stock || 0} unidades • IVA: {producto.iva || 0}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {producto.descripcion || 'Sin descripción'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ${(producto?.precio_venta ?? 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ${((producto?.precio_venta ?? 0) * (1 + (producto?.iva || 0) / 100)).toFixed(2)} con IVA
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    disabled={(producto.stock || 0) === 0}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {resultadosProductos.length} de {totalProductos} productos
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                disabled={paginaProductos === 1}
                onClick={() => cargarCatalogoProductos(paginaProductos - 1, busquedaModalProductos)}
              >
                Anterior
              </Button>
              <span className="px-3 py-1 text-sm">
                Página {paginaProductos} de {Math.ceil(totalProductos / ITEMS_POR_PAGINA)}
              </span>
              <Button 
                variant="outline" 
                disabled={paginaProductos >= Math.ceil(totalProductos / ITEMS_POR_PAGINA)}
                onClick={() => cargarCatalogoProductos(paginaProductos + 1, busquedaModalProductos)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};