import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReceiptList from '@/components/transactions/receipt-list'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: accounts } = await supabase.from('accounts').select('id, name, icon').order('created_at', { ascending: true })

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <header className="border-b border-[#2a2825] px-4 py-4">
        <div className="max-w-sm mx-auto">
          <h1 className="text-lg font-semibold text-[#f5f0e8]">Чеки</h1>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 py-6">
        <ReceiptList accounts={accounts || []} />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#161618] border-t border-[#2a2825]">
        <div className="max-w-sm mx-auto flex">
          <a href="/transactions" className="flex-1 py-3 text-center border-b-2 border-[#c9a84c]">
            <span className="text-xl block">📋</span>
            <span className="text-[10px] text-[#c9a84c]">Чеки</span>
          </a>
          <a href="/accounts" className="flex-1 py-3 text-center">
            <span className="text-xl block">🏦</span>
            <span className="text-[10px] text-[#55504a]">Счета</span>
          </a>
          <a href="/reports" className="flex-1 py-3 text-center">
            <span className="text-xl block">📊</span>
            <span className="text-[10px] text-[#55504a]">Отчёты</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
