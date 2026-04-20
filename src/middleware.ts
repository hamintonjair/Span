import { NextResponse, type NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/jwt'
import { createAdminClient } from '@/lib/supabase/admin'

export async function middleware(request: NextRequest) {
  // Excluir rutas de Chrome DevTools y otros recursos del sistema
  if (request.nextUrl.pathname.startsWith('/.well-known/') || 
      request.nextUrl.pathname.includes('chrome-devtools') ||
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.includes('favicon')) {
    return NextResponse.next()
  }

  console.log('--- MIDDLEWARE CHECK ---', request.nextUrl.pathname)

  // 1. Excluir todas las APIs de la redirección de suscripción
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log('MIDDLEWARE: Ruta API, continuando sin redirección de suscripción')
    return NextResponse.next()
  }

  // 2. Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback', '/test-flow', '/api/auth/login', '/api/auth/register-admin', '/api/auth/me', '/api/auth/logout', '/dashboard', '/admin-dashboard', '/dashboard-empresa', '/finanzas', '/auditoria', '/comunicacion', '/usuarios', '/(admin)', '/(dashboard)']

  // 2.5. Rutas que requieren verificación de módulos específicos
  const moduleRoutes = [
    { path: '/analytics', permission: 'analytics' },
    { path: '/inventario', permission: 'inventory' },
    { path: '/mis-comisiones', permission: 'commissions' },
    { path: '/marketing', permission: 'marketing' },
    { path: '/nomina', permission: 'nominas' },
    { path: '/soporte', permission: 'priority_support' }
  ];

  // Para admin_global, permitir acceso a todas las rutas de dashboard
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    console.log('MIDDLEWARE: Ruta pública o admin global, continuando sin validación')
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

  // 5. Verificación de módulos específicos
  if (payload.rol !== 'admin_global' && payload.empresa_id) {
    try {
      const supabase = createAdminClient()
      
      // Verificar si la ruta actual requiere un módulo específico
      const requestedModule = moduleRoutes.find(
        module => request.nextUrl.pathname.startsWith(module.path)
      );

      if (requestedModule) {
        console.log(`MIDDLEWARE: Verificando acceso al módulo: ${requestedModule.permission}`)
        
        // Obtener datos del plan con permisos
        const { data: empresa, error } = await supabase
          .from('empresas')
          .select(`
            estado, 
            fecha_vencimiento,
            planes!inner (
              tiene_inventario,
              tiene_comisiones,
              tiene_marketing,
              tiene_nominas,
              tiene_analytics,
              soporte_prioritario
            )
          `)
          .eq('id', payload.empresa_id)
          .single()

        if (error || !empresa) {
          console.log('MIDDLEWARE: Empresa no encontrada, redirigiendo a login')
          return NextResponse.redirect(new URL('/login', request.url))
        }

        const isSuspended = empresa.estado === 'suspendido'
        const isExpired = empresa.fecha_vencimiento && new Date(empresa.fecha_vencimiento) < new Date()
        const planData = (empresa.planes as any) || {}

        // Verificar si tiene acceso al módulo solicitado
        const hasModuleAccess = 
          requestedModule.permission === 'analytics' ? planData.tiene_analytics :
          requestedModule.permission === 'inventory' ? planData.tiene_inventario :
          requestedModule.permission === 'commissions' ? planData.tiene_comisiones :
          requestedModule.permission === 'marketing' ? planData.tiene_marketing :
          requestedModule.permission === 'nominas' ? planData.tiene_nominas :
          requestedModule.permission === 'priority_support' ? planData.soporte_prioritario :
          false;

        console.log(`MIDDLEWARE: Acceso al módulo ${requestedModule.permission}: ${hasModuleAccess}`)

        // SI la empresa está suspendida O la suscripción está vencida O no tiene acceso al módulo
        if ((isSuspended || isExpired || !hasModuleAccess)) {
          let message = '';
          let error = '';

          if (isSuspended) {
            error = 'EMPRESA_SUSPENDIDA';
            message = 'Tu cuenta de empresa ha sido suspendida. Contacta a soporte.';
          } else if (isExpired) {
            error = 'SUSCRIPCION_VENCIDA';
            message = 'Tu suscripción ha vencido. Por favor, realiza tu pago para continuar.';
          } else if (!hasModuleAccess) {
            error = 'MODULO_NO_DISPONIBLE';
            message = `El módulo ${requestedModule.permission} no está disponible en tu plan actual. Actualiza tu suscripción para acceder.`;
          }

          console.log(`MIDDLEWARE: Redirigiendo a suscripción: ${message}`)
          const suscripcionUrl = new URL('/suscripcion', request.url)
          suscripcionUrl.searchParams.set('error', error)
          suscripcionUrl.searchParams.set('message', message)
          suscripcionUrl.searchParams.set('modulo', requestedModule.permission)
          return NextResponse.redirect(suscripcionUrl)
        }
      }

      // Si no requiere módulo específico, verificar estado básico de la empresa
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
