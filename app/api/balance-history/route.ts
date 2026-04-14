import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/balance-history — получить историю баланса по дням
 * Query params: period=30d | 1y
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') === '1y' ? '1y' : '30d'
  const days = period === '1y' ? 365 : 30

  // Получаем все счета пользователя
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', session.user.id)

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ history: [] })
  }

  // Получаем все чеки за период
  const periodAgo = new Date()
  periodAgo.setDate(periodAgo.getDate() - days)

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, type, total, date')
    .eq('user_id', session.user.id)
    .gte('date', periodAgo.toISOString())
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

  // Группируем по дням
  const dailyChange: Record<string, number> = {}
  receipts.forEach(r => {
    const day = r.date?.split('T')[0] || ''
    if (day) {
      const amount = r.type === 'income' ? r.total : -r.total
      dailyChange[day] = (dailyChange[day] || 0) + amount
    }
  })

  // Строим историю
  const history: { date: string; balance: number }[] = []
  let runningBalance = currentBalance

  // Для 30 дней — идем от прошлого к настоящему
  // Для 1 года — группируем по месяцам
  if (period === '1y') {
    const monthlyChange: Record<string, number> = {}
    Object.entries(dailyChange).forEach(([day, amount]) => {
      const month = day.substring(0, 7) // YYYY-MM
      monthlyChange[month] = (monthlyChange[month] || 0) + amount
    })

    // Начальный баланс = текущий - все изменения
    const totalChange = Object.values(monthlyChange).reduce((s, v) => s + v, 0)
    runningBalance = currentBalance - totalChange

    // За последние 12 месяцев
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthStr = d.toISOString().substring(0, 7)

      if (monthlyChange[monthStr] !== undefined) {
        runningBalance += monthlyChange[monthStr]
      }

      history.push({
        date: monthStr + '-01',
        balance: Math.max(0, Math.round(runningBalance * 100) / 100)
      })
    }
  } else {
    // 30 дней
    const totalChange = Object.values(dailyChange).reduce((s, v) => s + v, 0)
    runningBalance = currentBalance - totalChange

    for (let i = days - 1; i >= 0; i--) {
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
  }

  return NextResponse.json({ history })
}
