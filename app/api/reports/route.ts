import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/reports
 * Параметры:
 * - start_date (YYYY-MM-DD)
 * - end_date (YYYY-MM-DD)
 * - account_id (optional)
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const accountId = searchParams.get('account_id')

  let query = supabase
    .from('transactions')
    .select('type, amount, category, date')
    .gte('date', startDate || '1900-01-01')
    .lte('date', endDate || '2100-12-31')

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data: transactions, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Агрегируем данные
  let totalIncome = 0
  let totalExpense = 0
  const categoryData: Record<string, number> = {}
  const dailyData: Record<string, { income: number; expense: number }> = {}

  transactions?.forEach(t => {
    const amount = t.amount
    const dateStr = t.date

    // Доходы/расходы
    if (t.type === 'income') {
      totalIncome += amount
    } else {
      totalExpense += amount
    }

    // По категориям (только расходы)
    if (t.type === 'expense' && t.category) {
      categoryData[t.category] = (categoryData[t.category] || 0) + amount
    }

    // По дням
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = { income: 0, expense: 0 }
    }
    if (t.type === 'income') {
      dailyData[dateStr].income += amount
    } else {
      dailyData[dateStr].expense += amount
    }
  })

  // Форматируем для графиков
  const categories = Object.keys(categoryData).map(name => ({
    name,
    value: categoryData[name]
  })).sort((a, b) => b.value - a.value)

  const daily = Object.keys(dailyData).sort().map(date => ({
    date,
    Доходы: dailyData[date].income,
    Расходы: dailyData[date].expense
  }))

  return NextResponse.json({
    totalIncome,
    totalExpense,
    categories,
    daily,
    balance: totalIncome - totalExpense
  })
}
