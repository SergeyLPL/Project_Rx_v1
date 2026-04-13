import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware для защиты роутов
 * - Без авторизации: /dashboard → /login
 * - С авторизацией: /login, /register → /dashboard
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ 
            name, 
            value, 
            ...options,
            sameSite: 'lax',
            path: '/'
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({ 
            name, 
            value: '', 
            ...options,
            sameSite: 'lax',
            path: '/',
            maxAge: 0
          })
        },
      },
    }
  )

  // Проверяем сессию
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/register')
  
  // Все защищённые маршруты
  const protectedRoutes = ['/dashboard', '/accounts', '/transactions', '/reports']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Не авторизован → редирект с защищённых на login
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Авторизован → редирект с login/register на dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

// Применяем middleware ко всем защищённым роутам
export const config = {
  matcher: ['/login', '/register', '/dashboard/:path*', '/accounts/:path*', '/transactions/:path*', '/reports/:path*'],
}
