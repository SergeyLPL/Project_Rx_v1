import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/receipts/[id] — получить чек с товарами
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params

  const { data: receipt } = await supabase
    .from('receipts')
    .select('*, items:receipt_items(*)')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (!receipt) {
    return NextResponse.json({ error: 'Чек не найден' }, { status: 404 })
  }

  return NextResponse.json({ receipt })
}

/**
 * PUT /api/receipts/[id] — обновить чек
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { type, shop_name, date, items } = body

  // Обновляем шапку чека
  const { error: receiptError } = await supabase
    .from('receipts')
    .update({ type, shop_name, date })
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (receiptError) {
    return NextResponse.json({ error: receiptError.message }, { status: 500 })
  }

  // Удаляем старые товары
  await supabase.from('receipt_items').delete().eq('receipt_id', id)

  // Рассчитываем новую сумму
  const total = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

  // Обновляем сумму чека
  await supabase.from('receipts').update({ total }).eq('id', id)

  // Вставляем новые товары
  const itemsToInsert = items.map((item: any) => ({
    receipt_id: id,
    name: item.name || '',
    quantity: item.quantity || 1,
    unit_price: item.unit_price || 0,
    total: item.total || 0,
    category: item.category || 'Другое',
  }))

  const { error: itemsError } = await supabase.from('receipt_items').insert(itemsToInsert)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  const { data: updatedReceipt } = await supabase
    .from('receipts')
    .select('*, items:receipt_items(*)')
    .eq('id', id)
    .single()

  return NextResponse.json({ receipt: updatedReceipt })
}

/**
 * DELETE /api/receipts/[id] — удалить чек
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params

  // Удаляем товары (сработает CASCADE, но явно надёжнее)
  await supabase.from('receipt_items').delete().eq('receipt_id', id)

  // Удаляем чек — триггер refund_receipt_balance() вернёт баланс
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
