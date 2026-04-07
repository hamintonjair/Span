import { NextResponse, type NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/jwt'
import { createAdminClient } from '@/lib/supabase/admin'

export async function middleware(request: NextRequest) {
  console.log('--- MIDDLEWARE CHECK ---', request.nextUrl.pathname)

  // 1. Excluir todas las APIs de la redirección de suscripción
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log('MIDDLEWARE: Ruta API, continuando sin redirección de suscripción')
    return NextResponse.next()
  }

  // 2. Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback', '/test-flow', '/api/auth/login', '/api/auth/register-admin', '/api/auth/me', '/api/auth/logout', '/dashboard', '/admin-dashboard', '/dashboard-empresa', '/finanzas', '/auditoria', '/comunicacion', '/usuarios', '/(admin)', '/(dashboard)']
  
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    console.log('MIDDLEWARE: Ruta pública, continuando sin validación')
    return NextResponse.next()
  }

  // 3. Lista blanca - Excluir la propia página de suscripción
  if (request.nextUrl.pathname === '/suscripcion') {
    console.log('MIDDLEWARE: Usuario en página de suscripción, permitiendo acceso')
    return NextResponse.next()
  }

  // 4. Validación básica de autenticación
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    console.log('MIDDLEWARE: Sin token, redirigiendo a login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyJWT(token)

  if (!payload) {
    console.log('MIDDLEWARE: Token inválido, redirigiendo a login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 5. Lógica de redirección para empresas suspendidas/vencidas
  if (payload.rol !== 'admin_global' && payload.empresa_id) {
    try {
      const supabase = createAdminClient()
      
      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('estado, fecha_vencimiento')
        .eq('id', payload.empresa_id)
        .single()

      if (error || !empresa) {
        console.log('MIDDLEWARE: Empresa no encontrada, redirigiendo a login')
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const isSuspended = empresa.estado === 'suspendido'
      const isExpired = empresa.fecha_vencimiento && new Date(empresa.fecha_vencimiento) < new Date()
      
      // SI la empresa está suspendida O la suscripción está vencida
      // Y SI el usuario intenta entrar a cualquier página que NO sea /suscripcion
      // ENTONCES: Redirigir a /suscripcion
      if ((isSuspended || isExpired)) {
        console.log(`MIDDLEWARE: Empresa ${isSuspended ? 'suspendida' : 'con suscripción vencida'}, redirigiendo a suscripción`)
        const suscripcionUrl = new URL('/suscripcion', request.url)
        suscripcionUrl.searchParams.set('error', 'EMPRESA_SUSPENDIDA')
        suscripcionUrl.searchParams.set('message', isSuspended ? 'Tu cuenta de empresa ha sido suspendida. Contacta a soporte.' : 'Tu suscripción ha vencido. Por favor, realiza tu pago para continuar.')
        return NextResponse.redirect(suscripcionUrl)
      }

      console.log('MIDDLEWARE: Empresa activa, permitiendo acceso')
    } catch (error) {
      console.error('MIDDLEWARE: Error verificando estado de empresa:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else {
    console.log('MIDDLEWARE: Admin global o sin empresa_id, permitiendo acceso')
  }

  console.log('MIDDLEWARE: Acceso permitido')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
