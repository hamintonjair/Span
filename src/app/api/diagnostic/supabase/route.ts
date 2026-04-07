import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = createAdminClient();
    
    // Test 1: Conexión básica
    const connectionStart = Date.now();
    const { data, error } = await supabase
      .from('empresas')
      .select('count')
      .limit(1);
    const connectionTime = Date.now() - connectionStart;
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Error de conexión a Supabase',
        details: error,
        connectionTime: `${connectionTime}ms`
      }, { status: 500 });
    }
    
    // Test 2: Storage test
    const storageStart = Date.now();
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const storageTime = Date.now() - storageStart;
      
      return NextResponse.json({
        success: true,
        tests: {
          connection: {
            status: 'OK',
            time: `${connectionTime}ms`
          },
          storage: {
            status: 'OK',
            time: `${storageTime}ms`,
            buckets: buckets?.length || 0
          }
        },
        totalTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });
      
    } catch (storageError) {
      return NextResponse.json({
        success: false,
        error: 'Error en Storage de Supabase',
        details: storageError,
        connection: {
          status: 'OK',
          time: `${connectionTime}ms`
        },
        storage: {
          status: 'ERROR',
          error: storageError
        },
        totalTime: `${Date.now() - startTime}ms`
      }, { status: 500 });
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error general del sistema',
      details: error,
      totalTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
}
