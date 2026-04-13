'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push(redirectUrl)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl border border-[#c9a84c]/30 flex items-center justify-center">
              <span className="text-[#c9a84c] text-lg">☑</span>
            </div>
            <span className="text-xl font-semibold text-[#f5f0e8]">Rx Finance</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#f5f0e8]">Вход в аккаунт</h1>
        </div>

        {/* Карточка формы */}
        <div className="card animate-fade-in">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8a8578] mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-[#8a8578] mb-2">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <p className="mt-6 text-center text-sm text-[#8a8578]">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-[#c9a84c] hover:text-[#e0c068] font-medium">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
