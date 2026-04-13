import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/transactions — список транзакций
 * POST /api/transactions — создание транзакции
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('account_id')

  let query = supabase
    .from('transactions')
    .select(`
      *,
      account:accounts(name, icon)
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data: transactions, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transactions })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const body = await request.json()
  const { account_id, type, amount, category, description, date } = body

  if (!account_id || !type || !amount) {
    return NextResponse.json({ error: 'account_id, type и amount обязательны' }, { status: 400 })
  }

  // Проверяем что счёт принадлежит пользователю
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', account_id)
    .eq('user_id', session.user.id)
    .single()

  if (!account) {
    return NextResponse.json({ error: 'Счёт не найден' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: session.user.id,
      account_id,
      type,
      amount,
      category,
      description,
      date: date || new Date().toISOString().split('T')[0],
    })
    .select('*, account:accounts(name, icon)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transaction: data })
}
