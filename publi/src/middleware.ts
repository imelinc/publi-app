import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password', '/waitlist', '/api/waitlist']

function isProtected(pathname: string): boolean {
  // Todo lo que esté bajo el grupo (dashboard)
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/calendario') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/configuracion') ||
    pathname.startsWith('/metricas') ||
    pathname.startsWith('/nueva-publicacion') ||
    pathname.startsWith('/ai')
  )
}

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificar si hay cookies de Supabase
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.includes('-auth-token'))

  let user = null

  if (hasAuthCookie) {
    // Solo si existe la cookie llamamos a Supabase para verificar/refrescar la sesión
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    user = supabaseUser
  }

  // Sin sesión en ruta protegida → /login
  if (!user && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión en /login → /dashboard
  if (user && pathname === '/login') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
