import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { registrarLogAdmin } from '@/lib/auditAdmin';

// Purga automática de logs de auditoría vencidos, según política de retención.
// Protegido con CRON_SECRET: solo debe ser llamado por el workflow programado
// (.github/workflows/purge-auditoria.yml), nunca expuesto públicamente sin token.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const retencionDias = parseInt(process.env.AUDITORIA_RETENCION_DIAS || '365', 10);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retencionDias);
  const cutoffISO = cutoff.toISOString();
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true';

  try {
    const supabase = createAdminClient();

    if (dryRun) {
      const { error: errorAuditoria, count: countAuditoria } = await supabase
        .from('logs_auditoria')
        .select('id', { count: 'exact', head: true })
        .lt('creado_en', cutoffISO);

      if (errorAuditoria) {
        throw errorAuditoria;
      }

      const { error: errorActividad, count: countActividad } = await supabase
        .from('logs_actividad')
        .select('id', { count: 'exact', head: true })
        .lt('creado_en', cutoffISO);

      if (errorActividad) {
        throw errorActividad;
      }

      return NextResponse.json({
        success: true,
        dryRun: true,
        retencionDias,
        cutoff: cutoffISO,
        logsAuditoriaAEliminar: countAuditoria || 0,
        logsActividadAEliminar: countActividad || 0
      });
    }

    const { error: errorAuditoria, count: countAuditoria } = await supabase
      .from('logs_auditoria')
      .delete({ count: 'exact' })
      .lt('creado_en', cutoffISO);

    if (errorAuditoria) {
      throw errorAuditoria;
    }

    const { error: errorActividad, count: countActividad } = await supabase
      .from('logs_actividad')
      .delete({ count: 'exact' })
      .lt('creado_en', cutoffISO);

    if (errorActividad) {
      throw errorActividad;
    }

    await registrarLogAdmin({
      accion: 'PURGA_AUTOMATICA_AUDITORIA',
      modulo: 'CONFIGURACION',
      detalles: {
        retencionDias,
        cutoff: cutoffISO,
        logsAuditoriaEliminados: countAuditoria || 0,
        logsActividadEliminados: countActividad || 0
      }
    });

    return NextResponse.json({
      success: true,
      retencionDias,
      cutoff: cutoffISO,
      logsAuditoriaEliminados: countAuditoria || 0,
      logsActividadEliminados: countActividad || 0
    });
  } catch (error) {
    console.error('Error en purga automática de auditoría:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
