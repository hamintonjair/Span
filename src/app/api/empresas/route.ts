import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { registrarLogAdmin } from '@/lib/auditAdmin';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Obtener todas las empresas con información de planes y conteo de empleados
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select(`
        id,
        nombre,
        estado,
        plan_id,
        creado_en,
        actualizado_en,
        nit,
        telefono,
        direccion,
        ciudad,
        mensaje_ticket,
        logo_url,
        planes!inner (
          id,
          nombre,
          precio,
          max_usuarios,
          max_empleados
        )
      `)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error obteniendo empresas:', error);
      return NextResponse.json(
        { error: 'Error obteniendo empresas' },
        { status: 500 }
      );
    }

    // Para cada empresa, contar empleados activos y obtener suscripciones
    const empresasConConteo = await Promise.all(
      (empresas || []).map(async (empresa) => {
        const { count, error: countError } = await supabase
          .from('usuarios_sistema')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresa.id)
          .in('rol', ['dueño', 'admin_empresa', 'estilista', 'recepcionista', 'empleado']);

        // Obtener suscripciones de esta empresa, eliminando duplicados por periodo
        const { data: suscripciones, error: susError } = await supabase
          .from('suscripciones')
          .select('*')
          .eq('empresa_id', empresa.id)
          .order('creado_en', { ascending: false });

        // Eliminar duplicados: quedarse solo con el más reciente por empresa_id
        let suscripcionesUnicas: any[] = [];
        if (suscripciones && suscripciones.length > 0) {
          // Agrupar por empresa_id y quedarse con la más reciente
          const suscripcionesPorEmpresa: { [key: string]: any } = {};
          
          suscripciones.forEach((sus: any) => {
            const empresaKey = sus.empresa_id;
            if (!suscripcionesPorEmpresa[empresaKey]) {
              suscripcionesPorEmpresa[empresaKey] = sus;
            } else {
              // Si ya existe, quedarse con la más reciente por creado_en
              const fechaExistente = new Date(suscripcionesPorEmpresa[empresaKey].creado_en);
              const fechaActual = new Date(sus.creado_en);
              if (fechaActual > fechaExistente) {
                suscripcionesPorEmpresa[empresaKey] = sus;
              }
            }
          });
          
          // Convertir el objeto a array
          suscripcionesUnicas = Object.values(suscripcionesPorEmpresa);
        }

        return {
          ...empresa,
          plan_nombre: (empresa.planes as any)?.nombre,
          plan_precio: (empresa.planes as any)?.precio,
          plan_max_usuarios: (empresa.planes as any)?.max_usuarios,
          plan_max_empleados: (empresa.planes as any)?.max_empleados,
          total_empleados: countError ? 0 : count || 0,
          suscripciones: suscripcionesUnicas || [],
          planes: undefined // Eliminamos el objeto anidado para limpiar la respuesta
        };
      })
    );

    return NextResponse.json({
      success: true,
      empresas: empresasConConteo
    });

  } catch (error) {
    console.error('Error en GET /api/empresas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, plan_id, adminId } = await request.json();

    if (!nombre || !plan_id) {
      return NextResponse.json(
        { error: 'Nombre y plan_id son requeridos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar que el plan existe
    const { data: plan, error: planError } = await supabase
      .from('planes')
      .select('id, nombre')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 400 }
      );
    }

    // Calcular fecha de vencimiento (15 días desde hoy - periodo de prueba)
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);

    // Crear empresa
    const { data: nuevaEmpresa, error } = await supabase
      .from('empresas')
      .insert({
        nombre,
        plan_id,
        estado: 'activo',
        estado_suscripcion: 'activa',
        fecha_vencimiento: fechaVencimiento.toISOString(),
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      })
      .select(`
        id,
        nombre,
        estado,
        plan_id,
        creado_en,
        actualizado_en,
        planes (
          id,
          nombre,
          precio,
          max_usuarios,
          max_empleados
        )
      `)
      .single();

    if (error) {
      console.error('Error creando empresa:', error);
      return NextResponse.json(
        { error: 'Error creando empresa' },
        { status: 500 }
      );
    }

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId || null,
        accion: 'CREAR_EMPRESA_API',
        modulo: 'Empresas',
        detalles: {
          empresa_id: nuevaEmpresa.id,
          nombre_empresa: nombre,
          plan_seleccionado: plan.nombre
        }
      });
    } catch (e) {
      console.error('Error silencioso en auditoría global (Crear Empresa API):', e);
    }

    const empresaFormateada = {
      ...nuevaEmpresa,
      plan_nombre: (nuevaEmpresa.planes as any)?.nombre,
      plan_precio: (nuevaEmpresa.planes as any)?.precio,
      plan_max_usuarios: (nuevaEmpresa.planes as any)?.max_usuarios,
      plan_max_empleados: (nuevaEmpresa.planes as any)?.max_empleados,
      total_empleados: 0,
      planes: undefined
    };

    return NextResponse.json({
      success: true,
      message: 'Empresa creada correctamente',
      empresa: empresaFormateada
    });

  } catch (error) {
    console.error('Error en POST /api/empresas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
