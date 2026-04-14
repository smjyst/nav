import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh session — required for Server Components to read auth state
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Auth routes: redirect to dashboard if already logged in
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // App routes: redirect to login if not authenticated
  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/markets') ||
    pathname.startsWith('/portfolio') ||
    pathname.startsWith('/validate') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/briefing') ||
    pathname.startsWith('/alerts') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/buy')

  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
