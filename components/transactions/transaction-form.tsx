'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const CATEGORIES = {
  income: ['Зарплата', 'Подарок', 'Инвестиции', 'Продажа', 'Кэшбэк', 'Другое'],
  expense: ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Одежда', 'Здоровье', 'Связь', 'Подписки', 'Образование', 'Другое'],
}

interface Transaction {
  id?: string
  account_id: string
  type: 'income' | 'expense'
  amount: string | number
  category: string
  description: string
  date: string
}

interface TransactionFormProps {
  open: boolean
  transaction: Transaction | null
  accounts: { id: string; name: string; icon: string }[]
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

export default function TransactionForm({ open, transaction, accounts, onClose, onSubmit }: TransactionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState<Transaction>({
    account_id: '', type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (transaction) {
      setForm({
        id: transaction.id, account_id: transaction.account_id, type: transaction.type,
        amount: transaction.amount.toString(), category: transaction.category || '',
        description: transaction.description || '', date: transaction.date,
      })
      setPreview(null)
    } else {
      setForm({ account_id: accounts[0]?.id || '', type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] })
      setPreview(null)
    }
  }, [transaction, accounts])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.account_id || !form.amount) return
    setLoading(true)
    try {
      await onSubmit({ ...form, amount: typeof form.amount === 'number' ? form.amount : parseFloat(form.amount) })
      onClose()
    } catch (err) { alert('Ошибка сохранения') } finally { setLoading(false) }
  }

  // Распознавание чека
  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Превью
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setOcrLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.error) {
        alert(`Ошибка распознавания: ${data.error}`)
        return
      }

      // Заполняем форму данными из чека
      setForm(prev => ({
        ...prev,
        type: 'expense',
        amount: data.total?.toString() || prev.amount,
        category: data.category || 'Еда',
        description: data.shop_name || prev.description,
        date: data.date || prev.date,
      }))
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`)
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#161618] rounded-t-2xl p-6 animate-fade-in border-t border-[#2a2825] max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#2a2825] rounded-full mx-auto mb-6" />
        <h3 className="text-lg font-semibold text-[#f5f0e8] mb-4">{transaction ? 'Редактировать' : 'Новая транзакция'}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Кнопка сканирования чека */}
          {!transaction && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleScanReceipt}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="w-full py-3 bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] rounded-xl font-medium hover:bg-[#c9a84c]/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {ocrLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Распознаю чек...
                  </>
                ) : (
                  <>📷 Распознать чек</>
                )}
              </button>

              {/* Превью фото */}
              {preview && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-[#2a2825]">
                  <img src={preview} alt="Чек" className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPreview(null)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Тип */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setForm({ ...form, type: 'expense', category: '' })}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${form.type === 'expense' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#2a2825] text-[#8a8578] border border-transparent'}`}>
              Расход
            </button>
            <button type="button" onClick={() => setForm({ ...form, type: 'income', category: '' })}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${form.type === 'income' ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30' : 'bg-[#2a2825] text-[#8a8578] border border-transparent'}`}>
              Доход
            </button>
          </div>

          {/* Счёт */}
          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Счёт</label>
            <select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} className="input" required>
              <option value="">Выберите счёт</option>
              {accounts.map((a) => (<option key={a.id} value={a.id}>{a.icon} {a.name}</option>))}
            </select>
          </div>

          {/* Сумма */}
          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Сумма, ₽</label>
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input text-lg font-bold" placeholder="0.00" required />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Категория</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
              <option value="">Без категории</option>
              {CATEGORIES[form.type].map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Дата</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" required />
          </div>

          {/* Описание (магазин) */}
          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Описание / Магазин</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Название магазина" maxLength={100} />
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-dark flex-1">Отмена</button>
            <button type="submit" disabled={loading} className="btn-gold flex-1 disabled:opacity-50">{loading ? 'Сохранение...' : transaction ? 'Сохранить' : 'Добавить'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
