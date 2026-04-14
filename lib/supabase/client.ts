import { createBrowserClient } from '@supabase/ssr'

/**
 * Клиент Supabase для браузера (клиентский код)
 * Использует anon ключ — безопасен для фронтенда
 */
export function createClient() {
  console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // sameSite: 'lax' позволяет кукам работать при переходах,
        // но для IP адресов лучше использовать 'none' если есть проблемы,
        // однако 'lax' обычно достаточно для SPA.
        sameSite: 'lax',
        path: '/',
        // domain: '' - явно не указываем, чтобы браузер сам подставил текущий IP
      }
    }
  )
}
