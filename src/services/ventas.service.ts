'use server';

import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/types/database';

const supabase = createClient();

// Interfaces temporales hasta que definamos los tipos completos
interface Venta {
  id: string;
  empresa_id: string;
  empleado_id?: string;
  cliente_id?: string;
  cita_id?: string;
  monto_total: number;
  subtotal: number;
  impuestos: number;
  descuentos: number;
  estado: 'pendiente' | 'completada' | 'cancelada';
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  fecha: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id?: string;
  servicio_id?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  total: number;
}

interface Producto {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
  categoria_id?: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

interface Servicio {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion_minutos: number;
  categoria_id?: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

interface CrearVentaData {
  empresa_id: string;
  empleado_id?: string;
  cliente_id?: string;
  cita_id?: string;
  items: Array<{
    tipo: 'producto' | 'servicio';
    id: string;
    cantidad: number;
    descuento?: number;
  }>;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  notas?: string;
}

/**
 * Registra una nueva venta con sus detalles
 * Actualiza el stock de productos automáticamente
 */
export async function registrarVenta(datos: CrearVentaData): Promise<ApiResponse<Venta>> {
  try {
    const supabase = createClient();
    
    // Iniciar transacción manual
    const { data: venta, error: errorVenta } = await supabase.rpc('crear_venta_con_detalle', {
      p_empresa_id: datos.empresa_id,
      p_empleado_id: datos.empleado_id,
      p_cliente_id: datos.cliente_id,
      p_cita_id: datos.cita_id,
      p_items: datos.items,
      p_metodo_pago: datos.metodo_pago,
      p_notas: datos.notas
    });

    if (errorVenta) {
      throw new Error(`Error al registrar venta: ${errorVenta.message}`);
    }

    return {
      data: venta,
      message: 'Venta registrada exitosamente'
    };

  } catch (error) {
    console.error('Error en registrarVenta:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al registrar venta'
    };
  }
}

/**
 * Actualiza una venta existente añadiendo productos/servicios extra (Upselling)
 * Actualiza el monto total y el stock correspondiente
 */
export async function actualizarVentaCita(
  citaId: string,
  empresaId: string,
  itemsAdicionales: Array<{
    tipo: 'producto' | 'servicio';
    id: string;
    cantidad: number;
    descuento?: number;
  }>
): Promise<ApiResponse<Venta>> {
  try {
    // 1. Verificar que la cita exista y pertenezca a la empresa
    const { data: cita, error: errorCita } = await supabase
      .from('citas')
      .select('*')
      .eq('id', citaId)
      .eq('empresa_id', empresaId)
      .single();

    if (errorCita || !cita) {
      return {
        error: 'Cita no encontrada o no pertenece a esta empresa'
      };
    }

    // 2. Buscar venta existente asociada a la cita
    const { data: ventaExistente, error: errorVentaExistente } = await supabase
      .from('ventas')
      .select('*')
      .eq('cita_id', citaId)
      .eq('empresa_id', empresaId)
      .single();

    if (errorVentaExistente && errorVentaExistente.code !== 'PGRST116') {
      throw new Error(`Error al buscar venta existente: ${errorVentaExistente.message}`);
    }

    // 3. Calcular totales de items adicionales
    let subtotalAdicional = 0;
    let impuestosAdicionales = 0;

    for (const item of itemsAdicionales) {
      let precioUnitario = 0;
      let stockActual = 0;

      if (item.tipo === 'producto') {
        // Obtener producto y verificar stock
        const { data: producto, error: errorProducto } = await supabase
          .from('productos')
          .select('precio, stock_actual')
          .eq('id', item.id)
          .eq('empresa_id', empresaId)
          .eq('estado', 'activo')
          .single();

        if (errorProducto || !producto) {
          return {
            error: `Producto ${item.id} no encontrado o no está activo`
          };
        }

        if (producto.stock_actual < item.cantidad) {
          return {
            error: `Stock insuficiente para el producto. Disponible: ${producto.stock_actual}, Solicitado: ${item.cantidad}`
          };
        }

        precioUnitario = producto.precio;
        stockActual = producto.stock_actual;
      } else {
        // Obtener servicio
        const { data: servicio, error: errorServicio } = await supabase
          .from('servicios')
          .select('precio')
          .eq('id', item.id)
          .eq('empresa_id', empresaId)
          .eq('estado', 'activo')
          .single();

        if (errorServicio || !servicio) {
          return {
            error: `Servicio ${item.id} no encontrado o no está activo`
          };
        }

        precioUnitario = servicio.precio;
      }

      const descuento = item.descuento || 0;
      const subtotalItem = (precioUnitario * item.cantidad) - descuento;
      subtotalAdicional += subtotalItem;

      // Actualizar stock si es producto
      if (item.tipo === 'producto') {
        const nuevoStock = stockActual - item.cantidad;
        const { error: errorStock } = await supabase
          .from('productos')
          .update({
            stock_actual: nuevoStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
          .eq('empresa_id', empresaId);

        if (errorStock) {
          throw new Error(`Error al actualizar stock del producto: ${errorStock.message}`);
        }
      }
    }

    // Calcular impuestos (asumiendo 16% IVA)
    impuestosAdicionales = subtotalAdicional * 0.16;

    if (ventaExistente) {
      // 4. Actualizar venta existente
      const nuevoSubtotal = ventaExistente.subtotal + subtotalAdicional;
      const nuevosImpuestos = ventaExistente.impuestos + impuestosAdicionales;
      const nuevoMontoTotal = nuevoSubtotal + nuevosImpuestos - ventaExistente.descuentos;

      const { data: ventaActualizada, error: errorActualizacion } = await supabase
        .from('ventas')
        .update({
          subtotal: nuevoSubtotal,
          impuestos: nuevosImpuestos,
          monto_total: nuevoMontoTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', ventaExistente.id)
        .select()
        .single();

      if (errorActualizacion) {
        throw new Error(`Error al actualizar venta: ${errorActualizacion.message}`);
      }

      // 5. Insertar detalles adicionales
      const detallesParaInsertar = await Promise.all(itemsAdicionales.map(async (item) => {
        let precioUnitario = 0;
        if (item.tipo === 'producto') {
          const { data: producto } = await supabase
            .from('productos')
            .select('precio')
            .eq('id', item.id)
            .single();
          precioUnitario = producto?.precio || 0;
        } else {
          const { data: servicio } = await supabase
            .from('servicios')
            .select('precio')
            .eq('id', item.id)
            .single();
          precioUnitario = servicio?.precio || 0;
        }

        return {
          venta_id: ventaActualizada.id,
          producto_id: item.tipo === 'producto' ? item.id : null,
          servicio_id: item.tipo === 'servicio' ? item.id : null,
          cantidad: item.cantidad,
          precio_unitario: precioUnitario,
          subtotal: (precioUnitario * item.cantidad) - (item.descuento || 0),
          descuento: item.descuento || 0,
          total: (precioUnitario * item.cantidad) - (item.descuento || 0)
        };
      }));

      const { error: errorDetalles } = await supabase
        .from('detalles_venta')
        .insert(detallesParaInsertar);

      if (errorDetalles) {
        throw new Error(`Error al insertar detalles: ${errorDetalles.message}`);
      }

      return {
        data: ventaActualizada,
        message: 'Venta actualizada exitosamente con upselling'
      };

    } else {
      // 6. Crear nueva venta si no existe
      const nuevaVentaData: CrearVentaData = {
        empresa_id: empresaId,
        cita_id: citaId,
        items: itemsAdicionales,
        metodo_pago: 'efectivo', // Por defecto, puede ser parametrizado
        notas: 'Venta generada por upselling en cita'
      };

      return await registrarVenta(nuevaVentaData);
    }

  } catch (error) {
    console.error('Error en actualizarVentaCita:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar venta con upselling'
    };
  }
}

/**
 * Obtiene ventas de una empresa con filtros
 */
export async function getVentas(
  empresaId: string,
  filtros?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    empleado_id?: string;
    estado?: 'pendiente' | 'completada' | 'cancelada';
    metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
    pagina?: number;
    limite?: number;
  }
): Promise<ApiResponse<{ ventas: Venta[], total: number }>> {
  try {
    const pagina = filtros?.pagina || 1;
    const limite = filtros?.limite || 20;
    const offset = (pagina - 1) * limite;

    let query = supabase
      .from('ventas')
      .select(`
        *,
        empleado:empleados!ventas_empleado_id_fkey(
          id,
          perfil:perfiles(id, nombre)
        ),
        detalles_venta(
          id,
          producto_id,
          servicio_id,
          cantidad,
          precio_unitario,
          subtotal,
          total,
          producto:productos(nombre),
          servicio:servicios(nombre)
        )
      `, { count: 'exact' })
      .eq('empresa_id', empresaId);

    // Aplicar filtros
    if (filtros?.fecha_inicio) {
      query = query.gte('fecha', filtros.fecha_inicio);
    }
    if (filtros?.fecha_fin) {
      query = query.lte('fecha', filtros.fecha_fin);
    }
    if (filtros?.empleado_id) {
      query = query.eq('empleado_id', filtros.empleado_id);
    }
    if (filtros?.estado) {
      query = query.eq('estado', filtros.estado);
    }
    if (filtros?.metodo_pago) {
      query = query.eq('metodo_pago', filtros.metodo_pago);
    }

    // Ejecutar consulta con paginación
    const { data: ventas, error, count } = await query
      .order('fecha', { ascending: false })
      .range(offset, offset + limite - 1);

    if (error) {
      throw new Error(`Error al obtener ventas: ${error.message}`);
    }

    return {
      data: {
        ventas: ventas || [],
        total: count || 0
      },
      message: 'Ventas obtenidas exitosamente'
    };

  } catch (error) {
    console.error('Error en getVentas:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al obtener ventas'
    };
  }
}

/**
 * Cancela una venta y devuelve el stock de productos
 */
export async function cancelarVenta(
  ventaId: string,
  empresaId: string,
  motivo?: string
): Promise<ApiResponse<Venta>> {
  try {
    // 1. Obtener venta con sus detalles
    const { data: venta, error: errorVenta } = await supabase
      .from('ventas')
      .select(`
        *,
        detalles_venta(
          id,
          producto_id,
          servicio_id,
          cantidad
        )
      `)
      .eq('id', ventaId)
      .eq('empresa_id', empresaId)
      .single();

    if (errorVenta || !venta) {
      return {
        error: 'Venta no encontrada o no pertenece a esta empresa'
      };
    }

    if (venta.estado === 'cancelada') {
      return {
        error: 'La venta ya está cancelada'
      };
    }

    // 2. Devolver stock de productos
    for (const detalle of venta.detalles_venta) {
      if (detalle.producto_id) {
        const { error: errorStock } = await supabase.rpc('devolver_stock_producto', {
          p_producto_id: detalle.producto_id,
          p_cantidad: detalle.cantidad,
          p_empresa_id: empresaId
        });

        if (errorStock) {
          throw new Error(`Error al devolver stock: ${errorStock.message}`);
        }
      }
    }

    // 3. Actualizar estado de la venta
    const { data: ventaCancelada, error: errorCancelacion } = await supabase
      .from('ventas')
      .update({
        estado: 'cancelada',
        notas: motivo ? `${venta.notas || ''} | CANCELADO: ${motivo}` : `${venta.notas || ''} | CANCELADO`,
        updated_at: new Date().toISOString()
      })
      .eq('id', ventaId)
      .select()
      .single();

    if (errorCancelacion) {
      throw new Error(`Error al cancelar venta: ${errorCancelacion.message}`);
    }

    return {
      data: ventaCancelada,
      message: 'Venta cancelada exitosamente y stock devuelto'
    };

  } catch (error) {
    console.error('Error en cancelarVenta:', error);
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al cancelar venta'
    };
  }
}
