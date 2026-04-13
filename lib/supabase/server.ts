import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Клиент Supabase для сервера (Server Components, Server Actions)
 * Работает с cookies для сохранения сессии
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ 
              name, 
              value, 
              ...options,
              sameSite: 'lax',
              path: '/'
            })
          } catch {
            // Вызов из Server Component — cookie нельзя установить напрямую
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ 
              name, 
              value: '', 
              ...options,
              sameSite: 'lax',
              path: '/',
              maxAge: 0
            })
          } catch {
            // Вызов из Server Component
          }
        },
      },
    }
  )
}
