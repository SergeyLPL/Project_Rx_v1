'use client'

import { useState, useEffect } from 'react'
import ReceiptForm from './receipt-form'

interface ReceiptItem {
  id: string
  name: string
  quantity: number
  unit_price: number
  total: number
  category: string
}

interface Receipt {
  id: string
  account_id: string
  type: string
  shop_name: string
  total: number
  date: string
  account: { name: string; icon: string }
  items: ReceiptItem[]
}

interface Account {
  id: string
  name: string
  icon: string
}

interface ReceiptListProps {
  accounts: Account[]
}

export default function ReceiptList({ accounts }: ReceiptListProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null)

  const fetchReceipts = async () => {
    try {
      const res = await fetch('/api/receipts')
      const json = await res.json()
      if (json.receipts) setReceipts(json.receipts)
    } catch (err) {
      console.error('Ошибка:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReceipts() }, [])

  const handleSubmit = async (data: any) => {
    const url = editingReceipt ? `/api/receipts/${editingReceipt.id}` : '/api/receipts'
    const method = editingReceipt ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error || 'Ошибка сохранения')
    }
    setEditingReceipt(null)
    fetchReceipts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить чек? Баланс счёта будет восстановлен.')) return
    
    const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error || 'Ошибка удаления')
      return
    }
    fetchReceipts()
  }

  const handleEdit = async (id: string) => {
    const res = await fetch(`/api/receipts/${id}`)
    const json = await res.json()
    if (json.receipt) {
      setEditingReceipt(json.receipt)
      setShowForm(true)
    }
  }

  const toggleExpand = async (id: string) => {
    if (expandedReceipt === id) {
      setExpandedReceipt(null)
      return
    }

    // Загружаем детали чека
    const res = await fetch(`/api/receipts/${id}`)
    const json = await res.json()
    if (json.receipt) {
      setReceipts(receipts.map(r => r.id === id ? { ...r, items: json.receipt.items } : r))
      setExpandedReceipt(id)
    }
  }

  // Группировка по дате
  const grouped: Record<string, Receipt[]> = {}
  receipts.forEach(r => {
    const dateKey = r.date?.split('T')[0] || 'Неизвестно'
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(r)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (loading) return <div className="text-center py-8 text-[#8a8578]">Загрузка...</div>

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(true)} className="btn-gold w-full">
        📝 Добавить чек
      </button>

      {sortedDates.length > 0 ? (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date}>
              <h4 className="text-sm text-[#8a8578] mb-2 px-1">
                {new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h4>
              <div className="space-y-2">
                {grouped[date].map(r => (
                  <div key={r.id} className="card rounded-xl overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a1c] transition-colors"
                      onClick={() => toggleExpand(r.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{r.type === 'income' ? '💰' : (r.account?.icon || '🛒')}</span>
                        <div>
                          <p className="text-sm font-medium text-[#f5f0e8]">
                            {r.type === 'income' ? (r.items?.[0]?.category || 'Доход') : (r.shop_name || 'Без названия')}
                          </p>
                          <p className="text-xs text-[#55504a]">{r.account?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-lg font-bold ${r.type === 'income' ? 'text-emerald-400' : 'text-gold-gradient'}`}>
                          {r.type === 'income' ? '+' : '-'}{r.total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                        </p>
                        {r.type === 'income' && (
                          <span className="badge badge-emerald">доход</span>
                        )}
                        <span className="text-[#55504a] text-sm">{expandedReceipt === r.id ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex gap-2 px-4 pb-3 border-t border-[#2a2825] pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(r.id) }}
                        className="flex-1 py-2 bg-[#2a2825] text-[#f5f0e8] rounded-lg text-sm font-medium hover:bg-[#3a3835] transition-colors"
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }}
                        className="py-2 px-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                      >
                        🗑
                      </button>
                    </div>

                    {/* Товары чека */}
                    {expandedReceipt === r.id && r.items && r.items.length > 0 && (
                      <div className="border-t border-[#2a2825]">
                        {r.items.map((item: ReceiptItem) => (
                          <div key={item.id} className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1c] border-b border-[#2a2825] last:border-0">
                            <div className="flex-1">
                              <p className="text-sm text-[#f5f0e8]">{item.name}</p>
                              <div className="flex items-center gap-2 text-xs text-[#55504a]">
                                <span>{item.quantity} × {item.unit_price.toFixed(2)} ₽</span>
                                <span className="badge badge-indigo">{item.category}</span>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-[#c9a84c]">{item.total.toFixed(2)} ₽</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {expandedReceipt === r.id && (!r.items || r.items.length === 0) && (
                      <div className="border-t border-[#2a2825] px-4 py-3 text-center text-xs text-[#55504a]">
                        Загрузка товаров...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card rounded-xl p-8 text-center">
          <p className="text-sm text-[#8a8578]">Чеков пока нет</p>
          <p className="text-xs text-[#55504a] mt-1">Нажмите кнопку выше, чтобы добавить</p>
        </div>
      )}

      <ReceiptForm
        open={showForm}
        accounts={accounts}
        receipt={editingReceipt}
        onClose={() => { setShowForm(false); setEditingReceipt(null) }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
