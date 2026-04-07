import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    console.log('Iniciando verificación de vencimientos...');

    // 1. Buscar empresas con fecha de vencimiento pasada y estado activo
    const { data: empresasExpiradas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nombre, fecha_vencimiento, estado, plan_id')
      .lt('fecha_vencimiento', new Date().toISOString().split('T')[0])
      .eq('estado', 'activo');

    if (empresasError) {
      console.error('Error buscando empresas expiradas:', empresasError);
      return NextResponse.json(
        { error: 'Error buscando empresas expiradas' },
        { status: 500 }
      );
    }

    console.log(`Se encontraron ${empresasExpiradas?.length || 0} empresas expiradas`);

    if (!empresasExpiradas || empresasExpiradas.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay empresas expiradas',
        procesadas: 0
      });
    }

    let procesadas = 0;
    const errores: string[] = [];

    // 2. Procesar cada empresa expirada
    for (const empresa of empresasExpiradas) {
      try {
        console.log(`Procesando empresa: ${empresa.nombre} (ID: ${empresa.id})`);

        // 2.1. Cambiar estado de empresa a 'suspendido'
        const { error: updateEmpresaError } = await supabase
          .from('empresas')
          .update({ 
            estado: 'suspendido',
            actualizado_en: new Date().toISOString()
          })
          .eq('id', empresa.id);

        if (updateEmpresaError) {
          throw new Error(`Error actualizando empresa: ${updateEmpresaError.message}`);
        }

        // 2.2. Obtener información del plan para el monto
        const { data: plan, error: planError } = await supabase
          .from('planes')
          .select('precio')
          .eq('id', empresa.plan_id)
          .single();

        if (planError || !plan) {
          console.error('Error obteniendo plan:', planError);
          // Continuamos con monto 0 si no hay plan
        }

        // 2.3. Verificar si ya existe una suscripción vencida para esta empresa en el mes actual
        const currentMonth = new Date().getMonth() + 1; // +1 porque getMonth() es 0-indexed
        const currentYear = new Date().getFullYear();

        const { data: suscripcionExistente, error: checkError } = await supabase
          .from('suscripciones')
          .select('*')
          .eq('empresa_id', empresa.id)
          .eq('estado_pago', 'vencido')
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw new Error(`Error verificando suscripción existente: ${checkError.message}`);
        }

        // 2.4. Crear suscripción vencida solo si no existe ninguna para esta empresa
        if (!suscripcionExistente) {
          const { error: suscripcionError } = await supabase
            .from('suscripciones')
            .insert({
              empresa_id: empresa.id,
              estado_pago: 'vencido',
              monto: plan?.precio || 0,
              proximo_vencimiento: empresa.fecha_vencimiento,
              verificado: false,
              creado_en: new Date().toISOString(),
              actualizado_en: new Date().toISOString()
            });

          if (suscripcionError) {
            throw new Error(`Error creando suscripción vencida: ${suscripcionError.message}`);
          }

          console.log(`✅ Suscripción vencida creada para ${empresa.nombre} con monto: ${plan?.precio || 0}`);
        } else {
          console.log(`ℹ️  Ya existe suscripción vencida para ${empresa.nombre}, no se crea duplicado`);
        }

        procesadas++;
        console.log(`✅ Empresa ${empresa.nombre} procesada exitosamente`);

      } catch (error) {
        const errorMsg = `Error procesando empresa ${empresa.nombre}: ${(error as Error).message}`;
        console.error(errorMsg);
        errores.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verificación de vencimientos completada',
      empresasExpiradas: empresasExpiradas.length,
      empresasProcesadas: procesadas,
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error('Error en verificación de vencimientos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
