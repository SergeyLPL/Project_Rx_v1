import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/balance-history — получить историю баланса по дням
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  // Получаем все счета пользователя
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', session.user.id)

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ history: [] })
  }

  // Получаем все чеки за последние 30 дней
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, type, total, date, account_id')
    .eq('user_id', session.user.id)
    .gte('date', thirtyDaysAgo.toISOString())
    .order('date', { ascending: true })

  // Текущий баланс
  const { data: currentAccounts } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', session.user.id)

  const currentBalance = currentAccounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0

  if (!receipts || receipts.length === 0) {
    return NextResponse.json({
      history: [{ date: new Date().toISOString().split('T')[0], balance: currentBalance }]
    })
  }

  // Группируем по дням: расходы вычитаем, доходы прибавляем
  const dailyChange: Record<string, number> = {}
  receipts.forEach(r => {
    const day = r.date?.split('T')[0] || ''
    if (day) {
      const amount = r.type === 'income' ? r.total : -r.total
      dailyChange[day] = (dailyChange[day] || 0) + amount
    }
  })

  // Строим историю: от прошлого к текущему
  const history: { date: string; balance: number }[] = []
  
  // Начальный баланс = текущий - все изменения за период
  const totalChange = Object.values(dailyChange).reduce((s, v) => s + v, 0)
  let runningBalance = currentBalance - totalChange

  // Проходим по всем 30 дням
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]

    if (dailyChange[dayStr] !== undefined) {
      runningBalance += dailyChange[dayStr]
    }

    history.push({
      date: dayStr,
      balance: Math.max(0, Math.round(runningBalance * 100) / 100)
    })
  }

  return NextResponse.json({ history })
}
