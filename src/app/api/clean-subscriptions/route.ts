import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Primero, encontrar el ID de la empresa 'BeautyPro Central'
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id')
      .eq('nombre', 'BeautyPro Central')
      .single();

    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: 'Empresa BeautyPro Central no encontrada' },
        { status: 404 }
      );
    }

    console.log('Empresa BeautyPro Central ID:', empresa.id);

    // Obtener todas las suscripciones de esta empresa
    const { data: suscripciones, error: susError } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('empresa_id', empresa.id)
      .order('creado_en', { ascending: false });

    if (susError) {
      console.error('Error obteniendo suscripciones:', susError);
      return NextResponse.json(
        { error: 'Error obteniendo suscripciones' },
        { status: 500 }
      );
    }

    console.log(`Se encontraron ${suscripciones?.length || 0} suscripciones`);

    if (!suscripciones || suscripciones.length <= 1) {
      return NextResponse.json({
        success: true,
        message: 'No hay duplicados para limpiar',
        total: suscripciones?.length || 0
      });
    }

    // Agrupar por fecha de creación (mismo día) para encontrar duplicados
    const gruposPorFecha: { [key: string]: any[] } = {};
    
    suscripciones.forEach(sus => {
      const fecha = new Date(sus.creado_en).toDateString();
      if (!gruposPorFecha[fecha]) {
        gruposPorFecha[fecha] = [];
      }
      gruposPorFecha[fecha].push(sus);
    });

    let eliminados = 0;
    const idsAEliminar: string[] = [];

    // Para cada grupo de duplicados, mantener el más reciente y eliminar los demás
    Object.values(gruposPorFecha).forEach(grupo => {
      if (grupo.length > 1) {
        // Ordenar por creado_en descendente y eliminar todos excepto el primero
        const ordenados = grupo.sort((a, b) => 
          new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
        );
        
        // Eliminar todos excepto el primero (el más reciente)
        for (let i = 1; i < ordenados.length; i++) {
          idsAEliminar.push(ordenados[i].id);
        }
      }
    });

    // Eliminar duplicados
    if (idsAEliminar.length > 0) {
      const { error: deleteError } = await supabase
        .from('suscripciones')
        .delete()
        .in('id', idsAEliminar);

      if (deleteError) {
        console.error('Error eliminando duplicados:', deleteError);
        return NextResponse.json(
          { error: 'Error eliminando duplicados' },
          { status: 500 }
        );
      }

      eliminados = idsAEliminar.length;
    }

    return NextResponse.json({
      success: true,
      message: `Limpieza completada`,
      totalOriginal: suscripciones.length,
      duplicadosEliminados: eliminados,
      totalFinal: suscripciones.length - eliminados,
      idsEliminados: idsAEliminar
    });

  } catch (error) {
    console.error('Error en limpieza de suscripciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
