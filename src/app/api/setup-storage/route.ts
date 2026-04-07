import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Crear bucket para comprobantes de pago
    const { error: bucketError } = await supabase.storage.createBucket('comprobantes-pago', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creando bucket:', bucketError);
      return NextResponse.json({ error: 'Error creando bucket' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Storage configurado exitosamente' 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
