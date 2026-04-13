import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Защищённый layout для /dashboard
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a2825] px-4 py-4">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-[#c9a84c]/30 flex items-center justify-center">
              <span className="text-[#c9a84c] text-sm">☑</span>
            </div>
            <h1 className="text-lg font-semibold text-[#c9a84c]">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/accounts" className="text-sm text-[#8a8578] hover:text-[#c9a84c] transition-colors">
              Счета
            </a>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-[#8a8578] hover:text-[#f5f0e8] transition-colors"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-sm mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
