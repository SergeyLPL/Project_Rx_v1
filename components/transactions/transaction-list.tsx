'use client'

import { useState, useEffect } from 'react'
import TransactionForm from './transaction-form'

interface Transaction {
  id: string
  account_id: string
  type: 'income' | 'expense'
  amount: string | number
  category: string
  description: string
  date: string
  account: { name: string; icon: string }
}

interface Account {
  id: string
  name: string
  icon: string
}

interface TransactionListProps {
  accounts: Account[]
}

export default function TransactionList({ accounts }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions')
      const json = await res.json()
      if (json.transactions) setTransactions(json.transactions)
    } catch (err) {
      console.error('Ошибка:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTransactions() }, [])

  const handleSubmit = async (data: any) => {
    const url = editingTransaction ? `/api/transactions/${editingTransaction.id}` : '/api/transactions'
    const method = editingTransaction ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw new Error('Ошибка')
    fetchTransactions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить транзакцию?')) return
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) fetchTransactions()
  }

  const grouped: Record<string, Transaction[]> = {}
  transactions.forEach(t => {
    if (!grouped[t.date]) grouped[t.date] = []
    grouped[t.date].push(t)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (loading) return <div className="text-center py-8 text-[#8a8578]">Загрузка...</div>

  return (
    <div className="space-y-4">
      <button onClick={() => { setEditingTransaction(null); setShowForm(true) }} className="btn-gold w-full">
        + Добавить транзакцию
      </button>

      {sortedDates.length > 0 ? (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date}>
              <h4 className="text-sm text-[#8a8578] mb-2 px-1">
                {new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h4>
              <div className="card rounded-xl overflow-hidden">
                <div className="divide-y divide-[#2a2825]">
                  {grouped[date].map(t => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1c] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{t.account?.icon || '💳'}</span>
                        <div>
                          <p className="text-sm text-[#f5f0e8]">{t.category || 'Без категории'}</p>
                          <p className="text-xs text-[#55504a]">{t.description || t.account?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${t.type === 'income' ? 'text-[#c9a84c]' : 'text-red-400'}`}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                        </span>
                        <button onClick={() => { setEditingTransaction(t); setShowForm(true) }} className="text-[#55504a] hover:text-[#f5f0e8]">✏</button>
                        <button onClick={() => handleDelete(t.id)} className="text-[#55504a] hover:text-red-400">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card rounded-xl p-8 text-center">
          <p className="text-sm text-[#8a8578]">Транзакций пока нет</p>
          <p className="text-xs text-[#55504a] mt-1">Нажмите кнопку выше, чтобы добавить</p>
        </div>
      )}

      <TransactionForm
        open={showForm}
        transaction={editingTransaction}
        accounts={accounts}
        onClose={() => { setShowForm(false); setEditingTransaction(null) }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
