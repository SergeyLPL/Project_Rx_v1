import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/accounts — получить все счета пользователя
 * POST /api/accounts — создать новый счёт
 * PATCH /api/accounts — обновить счёт (название, баланс, иконка)
 * DELETE /api/accounts — удалить счёт
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ accounts })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { name, icon, initialBalance } = await request.json()

  if (!name) {
    return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: session.user.id,
      name,
      icon: icon || '💳',
      currency: 'RUB',
      balance: initialBalance || 0,
      is_default: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ account: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id, name, icon, balance } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  }

  const updateData: Record<string, any> = {}
  if (name !== undefined) updateData.name = name
  if (icon !== undefined) updateData.icon = icon
  if (balance !== undefined) updateData.balance = balance

  const { data, error } = await supabase
    .from('accounts')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ account: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  }

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
