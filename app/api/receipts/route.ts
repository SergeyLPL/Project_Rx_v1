import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/receipts — создать чек с товарами
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const body = await request.json()
  const { account_id, type, shop_name, date, items } = body

  if (!account_id || !items || items.length === 0) {
    return NextResponse.json({ error: 'account_id и items обязательны' }, { status: 400 })
  }

  // Проверяем счёт
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', account_id)
    .eq('user_id', session.user.id)
    .single()

  if (!account) {
    return NextResponse.json({ error: 'Счёт не найден' }, { status: 404 })
  }

  // Рассчитываем общую сумму
  const total = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

  // Создаём чек
  const { data: receipt, error: receiptError } = await supabase
    .from('receipts')
    .insert({
      user_id: session.user.id,
      account_id,
      type: type || 'expense',
      shop_name: shop_name || '',
      total,
      date: date || new Date().toISOString(),
    })
    .select()
    .single()

  if (receiptError) {
    return NextResponse.json({ error: receiptError.message }, { status: 500 })
  }

  // Создаём товары
  const itemsToInsert = items.map((item: any) => ({
    receipt_id: receipt.id,
    name: item.name || '',
    quantity: item.quantity || 1,
    unit_price: item.unit_price || 0,
    total: item.total || 0,
    category: item.category || 'Другое',
  }))

  const { error: itemsError } = await supabase
    .from('receipt_items')
    .insert(itemsToInsert)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Возвращаем чек с товарами
  const { data: fullReceipt } = await supabase
    .from('receipts')
    .select('*, items:receipt_items(*)')
    .eq('id', receipt.id)
    .single()

  return NextResponse.json({ receipt: fullReceipt })
}

/**
 * GET /api/receipts — получить все чеки
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: receipts } = await supabase
    .from('receipts')
    .select('*, account:accounts(name, icon)')
    .order('date', { ascending: false })

  return NextResponse.json({ receipts })
}
