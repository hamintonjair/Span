import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    console.log('Iniciando limpieza de suscripciones duplicadas...');

    // 1. Obtener todas las suscripciones vencidas agrupadas por empresa y periodo
    const { data: suscripciones, error: susError } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('estado_pago', 'vencido')
      .order('creado_en', { ascending: false });

    if (susError) {
      console.error('Error obteniendo suscripciones:', susError);
      return NextResponse.json(
        { error: 'Error obteniendo suscripciones' },
        { status: 500 }
      );
    }

    console.log(`Se encontraron ${suscripciones?.length || 0} suscripciones vencidas`);

    if (!suscripciones || suscripciones.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay suscripciones vencidas para limpiar',
        eliminadas: 0
      });
    }

    // 2. Agrupar por empresa_id para encontrar duplicados
    const grupos: { [key: string]: any[] } = {};
    
    suscripciones.forEach(sus => {
      const key = sus.empresa_id;
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(sus);
    });

    let totalEliminadas = 0;
    const idsAEliminar: string[] = [];

    // 3. Para cada grupo con duplicados, mantener el más reciente y eliminar los demás
    Object.entries(grupos).forEach(([empresaId, grupo]) => {
      if (grupo.length > 1) {
        console.log(`Found ${grupo.length} vencidas para empresa: ${empresaId}`);
        
        // Ordenar por creado_en descendente (más reciente primero)
        const ordenados = grupo.sort((a, b) => 
          new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
        );
        
        // Mantener el primero (más reciente) y marcar los demás para eliminación
        for (let i = 1; i < ordenados.length; i++) {
          idsAEliminar.push(ordenados[i].id);
        }
        
        console.log(`Keeping: ${ordenados[0].id} (${new Date(ordenados[0].creado_en).toISOString()})`);
        console.log(`Marking for deletion: ${ordenados.slice(1).map(s => s.id).join(', ')}`);
      }
    });

    // 4. Eliminar duplicados
    if (idsAEliminar.length > 0) {
      console.log(`Eliminando ${idsAEliminar.length} suscripciones duplicadas...`);
      
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

      totalEliminadas = idsAEliminar.length;
      console.log(`✅ ${totalEliminadas} suscripciones duplicadas eliminadas`);
    }

    return NextResponse.json({
      success: true,
      message: 'Limpieza de duplicados completada',
      totalSuscripciones: suscripciones.length,
      gruposConDuplicados: Object.values(grupos).filter(g => g.length > 1).length,
      duplicadosEliminados: totalEliminadas,
      idsEliminados: idsAEliminar
    });

  } catch (error) {
    console.error('Error en limpieza de duplicados:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
