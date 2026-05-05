import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Obtener suscripciones reales de la tabla suscripciones
    const { data: suscripciones, error: suscripcionesError } = await supabase
      .from('suscripciones')
      .select(`
        id,
        empresa_id,
        plan_id,
        monto,
        estado_pago,
        proximo_vencimiento,
        creado_en,
        actualizado_en,
        empresas!inner (
          id,
          nombre,
          estado,
          fecha_vencimiento
        ),
        planes!inner (
          id,
          nombre,
          precio,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          soporte_prioritario
        )
      `)
      .order('creado_en', { ascending: false });

    if (suscripcionesError) {
      console.error('Error obteniendo suscripciones:', suscripcionesError);
      return NextResponse.json(
        { error: 'Error al obtener suscripciones' },
        { status: 500 }
      );
    }

    // Verificar empresas vencidas y actualizar su estado
    const fechaActual = new Date();
    const empresasVencidas = suscripciones.filter(sub => 
      (sub.proximo_vencimiento && new Date(sub.proximo_vencimiento) < fechaActual) ||
      ((sub.empresas as any)?.fecha_vencimiento && new Date((sub.empresas as any).fecha_vencimiento) < fechaActual)
    );

    // Actualizar estado de empresas vencidas a 'suspendido'
    if (empresasVencidas.length > 0) {
      for (const suscripcion of empresasVencidas) {
        const { error: updateError } = await supabase
          .from('empresas')
          .update({ 
            estado: 'suspendido',
            actualizado_en: new Date().toISOString()
          })
          .eq('id', suscripcion.empresa_id);

        if (updateError) {
          console.error('Error actualizando empresa vencida:', updateError);
        } else {
          console.log(`Empresa ${suscripcion.empresa_id} marcada como vencida`);
        }
      }
    }

    // Recargar suscripciones después de actualizar estados
    const { data: suscripcionesActualizadas, error: reloadError } = await supabase
      .from('suscripciones')
      .select(`
        id,
        empresa_id,
        plan_id,
        monto,
        estado_pago,
        proximo_vencimiento,
        creado_en,
        actualizado_en,
        empresas!inner (
          id,
          nombre,
          estado,
          fecha_vencimiento
        ),
        planes!inner (
          id,
          nombre,
          precio,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          soporte_prioritario
        )
      `)
      .order('creado_en', { ascending: false });

    if (reloadError) {
      console.error('Error recargando suscripciones:', reloadError);
      return NextResponse.json(
        { error: 'Error al recargar suscripciones' },
        { status: 500 }
      );
    }

    // Formatear transacciones para el frontend
    const transacciones = suscripcionesActualizadas.map(sub => {
      const estaVencida = (sub.proximo_vencimiento && new Date(sub.proximo_vencimiento) < fechaActual) ||
                         ((sub.empresas as any)?.fecha_vencimiento && new Date((sub.empresas as any).fecha_vencimiento) < fechaActual);
      
      return {
        id: sub.id,
        empresa_id: sub.empresa_id,
        empresa_nombre: (sub.empresas as any)?.nombre || 'Empresa desconocida',
        plan_id: sub.plan_id,
        plan_nombre: (sub.planes as any)?.nombre || 'Plan desconocido',
        plan_precio: (sub.planes as any)?.precio || 0,
        monto: sub.monto || (sub.planes as any)?.precio || 0,
        fecha_pago: sub.actualizado_en || sub.creado_en,
        estado: sub.estado_pago || (estaVencida ? 'vencido' : 
                (sub.empresas as any)?.estado === 'activo' ? 'pagado' : 
                (sub.empresas as any)?.estado === 'suspendido' ? 'vencido' : 'pendiente'),
        metodo_pago: sub.estado_pago ? 'manual' : 'manual', // Por defecto manual si no hay estado_pago
        periodo_cobertura: new Date().toISOString().slice(0, 7), // YYYY-MM
        proximo_vencimiento: sub.proximo_vencimiento,
        creado_en: sub.creado_en,
        estaVencida: estaVencida // Flag para el frontend
      };
    });

    // También devolver las empresas para el modal - INCLUYENDO CAMPO estado
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select(`
        id,
        nombre,
        plan_id,
        estado,
        fecha_vencimiento,
        creado_en,
        actualizado_en,
        planes!inner (
          id,
          nombre,
          precio,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          soporte_prioritario
        ),
        suscripciones!left (
          id,
          estado_pago,
          proximo_vencimiento
        )
      `)
      .order('creado_en', { ascending: false });

    if (empresasError) {
      console.error('Error obteniendo empresas:', empresasError);
      return NextResponse.json(
        { error: 'Error al obtener empresas' },
        { status: 500 }
      );
    }

    const empresasFormateadas = empresas.map(empresa => {
      console.log('🔍 API DEBUG: Empresa raw data:', empresa);
      console.log('🔍 API DEBUG: Empresa estado:', (empresa as any)?.estado);
      console.log('🔍 API DEBUG: Empresa suscripciones:', (empresa as any)?.suscripciones);
      
      // Obtener estado_pago solo si existe suscripción
      const suscripcion = (empresa as any)?.suscripciones?.[0];
      const estadoPago = suscripcion?.estado_pago || null;
      
      return {
        id: empresa.id,
        nombre: empresa.nombre,
        plan_id: empresa.plan_id,
        plan_nombre: (empresa.planes as any)?.nombre || 'Plan desconocido',
        plan_precio: (empresa.planes as any)?.precio || 0,
        tiene_inventario: (empresa.planes as any)?.tiene_inventario || false,
        tiene_comisiones: (empresa.planes as any)?.tiene_comisiones || false,
        tiene_marketing: (empresa.planes as any)?.tiene_marketing || false,
        soporte_prioritario: (empresa.planes as any)?.soporte_prioritario || false,
        estado: (empresa as any)?.estado || 'pendiente',  // ✅ Campo real de empresas
        estado_pago: estadoPago,  // ✅ Solo si existe suscripción
        fecha_vencimiento: empresa.fecha_vencimiento
      };
    });

    // Obtener TODOS los comprobantes para el contador del dashboard
    const { data: comprobantes, error: comprobantesError } = await supabase
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
        plan_id,
        empresas!inner (
          id,
          nombre
        ),
        planes!left (
          id,
          nombre,
          precio,
          max_usuarios,
          max_empleados,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          soporte_prioritario
        )
      `)
      .order('fecha_envio', { ascending: false });

    // Obtener TODOS los comprobantes aprobados para el Total Recaudado
    const { data: comprobantesAprobados, error: comprobantesAprobadosError } = await supabase
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
        plan_id,
        empresas!inner (
          id,
          nombre
        ),
        planes!left (
          id,
          nombre,
          precio,
          max_usuarios,
          max_empleados,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          soporte_prioritario
        )
      `)
      .eq('estado', 'aprobado')
      .order('actualizado_en', { ascending: false });

    if (comprobantesError) {
      console.error('Error obteniendo comprobantes:', comprobantesError);
      // No fallamos la petición si hay error en comprobantes
    }

    if (comprobantesAprobadosError) {
      console.error('Error obteniendo comprobantes aprobados:', comprobantesAprobadosError);
    }

    const comprobantesFormateados = (comprobantes || []).map(comprobante => ({
      id: comprobante.id,
      empresa_id: comprobante.empresa_id,
      suscripcion_id: comprobante.suscripcion_id,
      nombre_archivo: comprobante.nombre_archivo,
      url_archivo: comprobante.url_archivo,
      tipo_archivo: comprobante.tipo_archivo,
      tamano_bytes: comprobante.tamano_bytes,
      estado: comprobante.estado,
      verificado: comprobante.verificado,
      notas: comprobante.notas,
      fecha_envio: comprobante.fecha_envio,
      fecha_verificacion: comprobante.fecha_verificacion,
      verificado_por: comprobante.verificado_por,
      creado_en: comprobante.creado_en,
      actualizado_en: comprobante.actualizado_en,
      monto: comprobante.monto,
      plan_id: comprobante.plan_id,
      planes: comprobante.planes,
      empresa_nombre: (comprobante.empresas as any)?.nombre || 'Empresa desconocida'
    }));

    // Formatear comprobantes aprobados para el Total Recaudado
    const comprobantesAprobadosFormateados = (comprobantesAprobados || []).map(comprobante => {
      // Obtener el precio del plan desde la empresa asociada al comprobante
      const empresaId = comprobante.empresa_id;
      const empresa = empresasFormateadas.find(emp => emp.id === empresaId);
      const planPrecio = empresa?.plan_precio || 0;
      
      console.log('🔍 API DEBUG: Comprobante aprobado mapeo:', {
        comprobanteId: comprobante.id,
        empresaId: empresaId,
        empresaEncontrada: empresa?.nombre || 'No encontrada',
        planPrecio: planPrecio
      });
      
      return {
        id: comprobante.id,
        empresa_id: comprobante.empresa_id,
        suscripcion_id: comprobante.suscripcion_id,
        nombre_archivo: comprobante.nombre_archivo,
        url_archivo: comprobante.url_archivo,
        tipo_archivo: comprobante.tipo_archivo,
        tamano_bytes: comprobante.tamano_bytes,
        estado: comprobante.estado,
        verificado: comprobante.verificado,
        notas: comprobante.notas,
        fecha_envio: comprobante.fecha_envio,
        fecha_verificacion: comprobante.fecha_verificacion,
        verificado_por: comprobante.verificado_por,
        creado_en: comprobante.creado_en,
        actualizado_en: comprobante.actualizado_en,
        monto: comprobante.monto || planPrecio,  // ✅ Usar monto del comprobante o fallback a precio del plan
        plan_id: comprobante.plan_id,
        planes: comprobante.planes,  // ✅ Incluir datos completos del plan
        empresa_nombre: (comprobante.empresas as any)?.nombre || 'Empresa desconocida',
        plan_precio: planPrecio  // ✅ Precio real del plan de la empresa
      };
    });

    return NextResponse.json({ 
      success: true, 
      transacciones: transacciones,
      empresas: empresasFormateadas,
      comprobantes: comprobantesFormateados,
      comprobantesAprobados: comprobantesAprobadosFormateados  // ✅ Agregar comprobantes aprobados
    });

  } catch (error) {
    console.error('Error en GET /api/suscripciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { empresa_id, monto, metodo, periodo_cobertura, notas, fecha_pago, proximo_vencimiento } = await request.json();

    // Validaciones básicas
    if (!empresa_id || !monto || !periodo_cobertura) {
      return NextResponse.json(
        { error: 'Empresa, monto y período son requeridos' },
        { status: 400 }
      );
    }

    if (monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar que la empresa existe y obtener su plan
    const { data: empresa, error: errorEmpresa } = await supabase
      .from('empresas')
      .select(`
        id,
        nombre,
        plan_id,
        estado,
        planes!inner (
          id,
          nombre,
          precio,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          soporte_prioritario
        )
      `)
      .eq('id', empresa_id)
      .single();

    if (errorEmpresa || !empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si ya existe una suscripción para esta empresa
    const { data: suscripcionExistente, error: suscripcionError } = await supabase
      .from('suscripciones')
      .select('id')
      .eq('empresa_id', empresa_id)
      .maybeSingle();

    let suscripcionActualizada;

    if (!suscripcionError && suscripcionExistente) {
      // Actualizar suscripción existente
      const { data, error } = await supabase
        .from('suscripciones')
        .update({ 
          monto,
          estado_pago: 'pagado',
          proximo_vencimiento: proximo_vencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          actualizado_en: new Date().toISOString()
        })
        .eq('empresa_id', empresa_id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando suscripción:', error);
        return NextResponse.json(
          { error: 'Error actualizando suscripción' },
          { status: 500 }
        );
      }
      suscripcionActualizada = data;
    } else {
      // Crear nueva suscripción
      const { data, error } = await supabase
        .from('suscripciones')
        .insert({
          empresa_id,
          plan_id: empresa.plan_id,
          monto,
          estado_pago: 'pagado',
          proximo_vencimiento: proximo_vencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando suscripción:', error);
        return NextResponse.json(
          { error: 'Error creando suscripción' },
          { status: 500 }
        );
      }
      suscripcionActualizada = data;
    }

    // Actualizar fecha_vencimiento de la empresa sumándole 30 días
    const nuevaFechaVencimiento = new Date();
    nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30);
    
    const { error: updateEmpresaError } = await supabase
      .from('empresas')
      .update({ 
        estado: 'activo',
        fecha_vencimiento: nuevaFechaVencimiento.toISOString().split('T')[0],
        actualizado_en: new Date().toISOString()
      })
      .eq('id', empresa_id);

    if (updateEmpresaError) {
      console.error('Error actualizando fecha_vencimiento de empresa:', updateEmpresaError);
      return NextResponse.json(
        { error: 'Error actualizando fecha de vencimiento de la empresa' },
        { status: 500 }
      );
    }

    // Registrar en logs de actividad (solo columnas que existen)
    const logData: any = {
      // usuario_id: 'admin-global-temp', // Comentado hasta tener JWT real
      empresa_id: empresa_id,
      accion: 'PAGO_MANUAL',
      modulo: 'SUSCRIPCIONES',
      descripcion: `Registro de pago manual para ${empresa.nombre}`
    };

    // Intentar agregar datos_anteriores y datos_nuevos si las columnas existen
    try {
      logData.datos_anteriores = { 
        estado: empresa.estado,
        plan_nombre: (empresa.planes as any)?.nombre
      };
      logData.datos_nuevos = { 
        estado: 'activo',
        monto,
        metodo,
        periodo_cobertura,
        proximo_vencimiento,
        notas
      };
    } catch (e) {
      // Si las columnas no existen, continuamos sin ellas
      console.log('Columnas datos_anteriores/datos_nuevos no disponibles, continuando sin ellas');
    }

    // Intentar agregar ip_address y user_agent si existen
    try {
      logData.ip_address = request.ip || 'unknown';
      logData.user_agent = request.headers.get('user-agent') || 'unknown';
    } catch (e) {
      // Si las columnas no existen, continuamos sin ellas
      console.log('Columnas ip_address/user_agent no disponibles, continuando sin ellas');
    }

    const { error: logError } = await supabase
      .from('logs_actividad')
      .insert(logData);

    if (logError) {
      console.error('Error registrando log:', logError);
      // No fallamos la petición si el log falla
    }

    return NextResponse.json({
      success: true,
      message: 'Pago registrado exitosamente',
      pago: {
        empresa_id,
        empresa_nombre: empresa.nombre,
        plan_nombre: (empresa.planes as any)?.nombre,
        monto,
        metodo,
        periodo_cobertura,
        proximo_vencimiento: suscripcionActualizada.proximo_vencimiento,
        fecha_pago: fecha_pago || new Date().toISOString(),
        notas
      }
    });

  } catch (error) {
    console.error('Error en POST /api/suscripciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
