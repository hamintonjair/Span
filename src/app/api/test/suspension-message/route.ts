import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Tu cuenta de empresa ha sido suspendida. Contacta a soporte.',
    code: 'EMPRESA_SUSPENDIDA',
    status: 'error'
  });
}
