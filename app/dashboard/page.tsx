import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BalanceTrendChart from '@/components/dashboard/balance-trend-chart'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: accounts } = await supabase.from('accounts').select('*').order('created_at', { ascending: true })
  const totalBalance = accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0

  // Последние 3 транзакции
  const { data: recentReceipts } = await supabase
    .from('receipts')
    .select('id, type, shop_name, total, date, account:accounts(name, icon)')
    .eq('user_id', session.user.id)
    .order('date', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <header className="border-b border-[#2a2825] px-4 py-4">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-[#c9a84c]/30 flex items-center justify-center">
              <span className="text-[#c9a84c] text-sm">☑</span>
            </div>
            <h1 className="text-lg font-semibold text-[#c9a84c]">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/accounts" className="text-sm text-[#8a8578] hover:text-[#c9a84c] transition-colors">Счета</Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm text-[#8a8578] hover:text-[#f5f0e8]">Выйти</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 py-6 space-y-4">
        <div className="card-gold rounded-xl p-5 text-center border-[#c9a84c]/40">
          <p className="text-sm text-[#8a8578] mb-2">Общий баланс</p>
          <p className="text-3xl font-bold text-gold-gradient">
            {totalBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a href="/transactions" className="btn-gold text-center py-3 block">📋 Транзакции</a>
          <a href="/accounts" className="btn-dark text-center py-3 block">🏦 Управление счетами</a>
        </div>

        {accounts && accounts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[#f5f0e8] mb-3">Мои счета</h3>
            <div className="space-y-2">
              {accounts.map((acc: any) => (
                <div key={acc.id} className="card-gold rounded-xl p-4 border-[#c9a84c]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{acc.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-[#f5f0e8]">{acc.name}</p>
                      {acc.is_default && <p className="text-[10px] text-[#55504a]">Основной</p>}
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gold-gradient">
                    {(acc.balance || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Последние транзакции */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#f5f0e8]">Последние чеки</h3>
            <Link href="/transactions" className="text-xs text-[#c9a84c] hover:text-[#e0c068]">Все →</Link>
          </div>

          {/* График тренда баланса */}
          <div className="card rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#f5f0e8]">Тренд баланса</p>
              <span className="badge badge-emerald">30 дней</span>
            </div>
            <BalanceTrendChart />
          </div>

          {recentReceipts && recentReceipts.length > 0 ? (
            <div className="space-y-2">
              {recentReceipts.map((r: any) => (
                <div key={r.id} className="card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.type === 'income' ? '💰' : (r.account?.icon || '🛒')}</span>
                    <div>
                      <p className="text-sm font-medium text-[#f5f0e8]">
                        {r.type === 'income' ? (r.items?.[0]?.category || 'Доход') : (r.shop_name || 'Без названия')}
                      </p>
                      <p className="text-xs text-[#55504a]">
                        {new Date(r.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        {r.account?.name && ` • ${r.account.name}`}
                      </p>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${r.type === 'income' ? 'text-emerald-400' : 'text-gold-gradient'}`}>
                    {r.type === 'income' ? '+' : '-'}{r.total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card rounded-xl p-6 text-center">
              <p className="text-sm text-[#8a8578]">Чеков пока нет</p>
              <Link href="/transactions" className="text-xs text-[#c9a84c] hover:text-[#e0c068] mt-1 inline-block">
                Добавить первый чек →
              </Link>
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#161618] border-t border-[#2a2825]">
        <div className="max-w-sm mx-auto flex">
          <a href="/transactions" className="flex-1 py-3 text-center">
            <span className="text-xl block">📋</span>
            <span className="text-[10px] text-[#55504a]">Транзакции</span>
          </a>
          <a href="/accounts" className="flex-1 py-3 text-center">
            <span className="text-xl block">🏦</span>
            <span className="text-[10px] text-[#55504a]">Счета</span>
          </a>
          <a href="/dashboard" className="flex-1 py-3 text-center border-b-2 border-[#c9a84c]">
            <span className="text-xl block">📊</span>
            <span className="text-[10px] text-[#c9a84c]">Отчёт</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
