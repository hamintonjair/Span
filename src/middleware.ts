import { NextResponse, type NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/jwt'
import { createAdminClient } from '@/lib/supabase/admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Excluir rutas del sistema y APIs
  if (pathname.startsWith('/.well-known/') || 
      pathname.includes('chrome-devtools') ||
      pathname.startsWith('/_next/') ||
      pathname.includes('favicon') ||
      pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // 2. Rutas públicas (Landing Page, login, registro y recuperación de contraseña)
  const publicRoutes = ['/', '/login', '/registro', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.includes(pathname)

  // 3. Redirección de cortesía: si usuario está logueado y va a rutas públicas
  const token = request.cookies.get('auth-token')?.value
  
  if (token && isPublicRoute) {
    try {
      const payload = await verifyJWT(token)
      
      if (payload) {
        // Usuario logueado válido, redirigir al dashboard según rol
        const dashboardUrl = (payload.rol === 'admin_global' || payload.rol === 'soporte' || payload.rol === 'ventas') ? '/admin/dashboard-admin' : '/dashboard-empresa'
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    } catch (error) {
      // Token inválido, continuar flujo normal
      console.error('Error verificando token en ruta pública:', error)
    }
  }

  // 4. Si es ruta pública y no hay token válido, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // 5. Para cualquier otra ruta, requerir autenticación
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 6. Verificar token válido
  const payload = await verifyJWT(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 7. Verificación especial para roles administrativos
  if (payload.rol === 'admin_global' || payload.rol === 'soporte' || payload.rol === 'ventas') {
    // Roles administrativos tienen acceso a todo, excepto configuración de empresa
    if (pathname.startsWith('/configuracion-empresa')) {
      return NextResponse.redirect(new URL('/admin/dashboard-admin', request.url))
    }
    return NextResponse.next()
  }

  // 8. Para usuarios no admin, verificar que tengan empresa
  if (!payload.empresa_id) {
    // Usuario sin empresa asignada, enviar a configuración
    return NextResponse.redirect(new URL('/configuracion-empresa', request.url))
  }

  // 9. Rutas especiales que no requieren verificación de módulos
  const specialRoutes = ['/suscripcion', '/configuracion-empresa', '/dashboard-empresa', '/finanzas-empresa']
  if (specialRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // 10. Verificación de módulos específicos
  const moduleRoutes = [
    { path: '/analytics', permission: 'analytics' },
    { path: '/inventario', permission: 'inventory' },
    { path: '/mis-comisiones', permission: 'commissions' },
    { path: '/marketing', permission: 'marketing' },
    { path: '/nomina', permission: 'nominas' },
    { path: '/soporte', permission: 'priority_support' }
  ];

  try {
    const supabase = createAdminClient()
    
    // Verificar si la ruta actual requiere un módulo específico
    const requestedModule = moduleRoutes.find(
      module => pathname.startsWith(module.path)
    )

    if (requestedModule) {
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

      // Si la empresa está suspendida O la suscripción está vencida O no tiene acceso al módulo
      if (isSuspended || isExpired || !hasModuleAccess) {
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
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const isSuspended = empresa.estado === 'suspendido'
    const isExpired = empresa.fecha_vencimiento && new Date(empresa.fecha_vencimiento) < new Date()
    
    // Si la empresa está suspendida O la suscripción está vencida
    if (isSuspended || isExpired) {
      const suscripcionUrl = new URL('/suscripcion', request.url)
      suscripcionUrl.searchParams.set('error', 'EMPRESA_SUSPENDIDA')
      suscripcionUrl.searchParams.set('message', isSuspended ? 'Tu cuenta de empresa ha sido suspendida. Contacta a soporte.' : 'Tu suscripción ha vencido. Por favor, realiza tu pago para continuar.')
      return NextResponse.redirect(suscripcionUrl)
    }

  } catch (error) {
    console.error('Error verificando estado de empresa:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.svg (logo file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
}
