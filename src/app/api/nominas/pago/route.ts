import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    try {
        console.log('=== INICIO PROCESO PAGO NÓMINA ===');

     

        // Obtener token de la cookie
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            console.error('Error: No token provided');
            return NextResponse.json(
                { error: 'No autorizado - Token faltante' },
                { status: 401 }
            );
        }

        // Verificar token
        const payload = await verifyJWT(token);

        if (!payload) {
            console.error('Error: Token inválido');
            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 401 }
            );
        }

        // Obtener datos del request
        const body = await request.json();
        

        const {
            empresa_id,
            empleado_id,
            periodo_tipo,
            fecha_inicio,
            fecha_fin,
            sueldo_base,
            total_comisiones,
            total_pagar,
            comisiones_ids
        } = body;

        // Validar datos requeridos
        if (!empresa_id || !empleado_id || !comisiones_ids || comisiones_ids.length === 0) {
            console.error('Error: Datos incompletos', { empresa_id, empleado_id, comisiones_ids });
            return NextResponse.json(
                { error: 'Datos incompletos' },
                { status: 400 }
            );
        }

        // Validar que el usuario pertenezca a la empresa
        if (payload.empresa_id !== empresa_id) {
            console.error('Error: Usuario no pertenece a la empresa', { payload_empresa_id: payload.empresa_id, request_empresa_id: empresa_id });
            return NextResponse.json(
                { error: 'No autorizado para esta empresa' },
                { status: 403 }
            );
        }

        // Validar que el usuario tenga rol de admin_empresa
        if (payload.rol !== 'admin_empresa') {
            console.error('Error: Permisos insuficientes', { user_rol: payload.rol });
            return NextResponse.json(
                { error: 'Permisos insuficientes' },
                { status: 403 }
            );
        }

        console.log('Creando cliente admin forzado...');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!, // Asegúrate que esta sea la SERVICE ROLE, no la anon
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );
   

        const nominaData = {
            empresa_id: empresa_id,
            empleado_id: empleado_id,
            periodo_tipo: periodo_tipo,
            fecha_inicio: fecha_inicio,
            fecha_fin: fecha_fin,
            // Forzamos conversión a número por seguridad
            sueldo_base: Number(sueldo_base) || 0,
            total_comisiones: Number(total_comisiones) || 0,
            total_pagar: Number(total_pagar) || 0,
            estado: 'pagado',
            // ✅ Agregamos metodo_pago porque tu tabla lo requiere
            metodo_pago: 'efectivo'
        };

       

        const { data: nomina, error: nominaError } = await supabaseAdmin
            .from('nominas')
            .insert(nominaData)
            .select()
            .single();

        if (nominaError) {
            console.error('Error creando nómina:', nominaError);
            return NextResponse.json(
                { error: 'Error creando nómina', details: nominaError },
                { status: 500 }
            );
        }

      

        // Actualizar comisiones a pagado
        const { error: updateError } = await supabaseAdmin
            .from('comisiones')
            .update({ estado: 'pagado', nomina_id: nomina.id })
            .in('id', comisiones_ids);

        if (updateError) {
            console.error('Error actualizando comisiones:', updateError);
            return NextResponse.json(
                { error: 'Error actualizando comisiones', details: updateError },
                { status: 500 }
            );
        }

        
        // Obtener datos de la empresa para el ticket
        const { data: empresa, error: empresaError } = await supabaseAdmin
            .from('empresas')
            .select('*')
            .eq('id', empresa_id)
            .single();

        if (empresaError) {
            console.error('Error obteniendo datos de empresa:', empresaError);
            // No fallar toda la transacción, pero advertir
            console.warn('Continuando sin datos de empresa para ticket');
        }

     
        // TODO: Agregar movimiento de caja después de que funcione lo básico
        // console.log('PASO 4: Creando movimiento de caja...');
        // const movimientoCajaData = {
        //   empresa_id: empresa_id,
        //   tipo: 'egreso',
        //   concepto: `Pago de nómina - ${empleado_id}`,
        //   monto: total_pagar,
        //   categoria: 'nomina',
        //   referencia_id: nomina.id
        // };
        // 
        // console.log('Datos de movimiento de caja:', movimientoCajaData);
        // 
        // const { error: cajaError } = await supabaseAdmin
        //   .from('movimientos_caja')
        //   .insert(movimientoCajaData);
        // 
        // if (cajaError) {
        //   console.error('Error creando movimiento de caja:', cajaError);
        //   // No fallar toda la transacción por el movimiento de caja
        //   console.warn('Continuando sin movimiento de caja');
        // }

       

        return NextResponse.json({
            success: true,
            nomina: nomina,
            empresa: empresa || null
        });

    } catch (error) {
        console.error('=== ERROR EN PROCESO PAGO NÓMINA ===');
        console.error('Detalle del error:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');

        return NextResponse.json(
            {
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}