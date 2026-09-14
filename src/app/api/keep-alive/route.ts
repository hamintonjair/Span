import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Ping ligero a Supabase para evitar que el proyecto se pause por inactividad
// (los proyectos gratuitos de Supabase se pausan automáticamente tras ~7 días sin actividad).
// Pensado para ser llamado periódicamente por un cron externo (ver .github/workflows/keep-alive.yml).
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('planes')
      .select('id')
      .limit(1);

    if (error) {
      console.error('keep-alive: error consultando Supabase:', error);
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('keep-alive: error inesperado:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
