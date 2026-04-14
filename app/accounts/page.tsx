import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AccountsList from '@/components/accounts/accounts-list'

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: accounts } = await supabase.from('accounts').select('*').order('created_at', { ascending: true })
  const totalBalance = accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <header className="border-b border-[#2a2825] px-4 py-4">
        <div className="max-w-sm mx-auto">
          <h1 className="text-lg font-semibold text-[#f5f0e8]">Мои счета</h1>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 py-6 space-y-4">
        <div className="card-gold rounded-xl p-5 text-center border-[#c9a84c]/40">
          <p className="text-sm text-[#8a8578] mb-2">Общий баланс</p>
          <p className="text-3xl font-bold text-gold-gradient">
            {totalBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
          </p>
        </div>

        <AccountsList />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#161618] border-t border-[#2a2825]">
        <div className="max-w-sm mx-auto flex">
          <a href="/transactions" className="flex-1 py-3 text-center">
            <span className="text-xl block">📋</span>
            <span className="text-[10px] text-[#55504a]">Чеки</span>
          </a>
          <a href="/accounts" className="flex-1 py-3 text-center border-b-2 border-[#c9a84c]">
            <span className="text-xl block">🏦</span>
            <span className="text-[10px] text-[#c9a84c]">Счета</span>
          </a>
          <a href="/dashboard" className="flex-1 py-3 text-center">
            <span className="text-xl block">📊</span>
            <span className="text-[10px] text-[#55504a]">Дашборд</span>
          </a>
          <a href="/reports" className="flex-1 py-3 text-center">
            <span className="text-xl block">📈</span>
            <span className="text-[10px] text-[#55504a]">Отчёт</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
