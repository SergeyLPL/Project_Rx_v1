'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card text-center max-w-sm animate-fade-in">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-[#f5f0e8] mb-2">Регистрация успешна!</h2>
          <p className="text-sm text-[#8a8578] mb-6">Войдите в аккаунт</p>
          <Link href="/login" className="btn-gold inline-block">
            Перейти ко входу
          </Link>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-semibold text-[#f5f0e8]">Регистрация</h1>
        </div>

        {/* Карточка формы */}
        <div className="card animate-fade-in">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8a8578] mb-2">Имя (опционально)</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Иван Иванов"
              />
            </div>

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
              <label className="block text-sm text-[#8a8578] mb-2">Пароль (мин. 6 символов)</label>
              <input
                type="password"
                required
                minLength={6}
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#8a8578]">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-[#c9a84c] hover:text-[#e0c068] font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
