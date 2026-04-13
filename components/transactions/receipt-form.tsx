'use client'

import { useState, useEffect, useRef } from 'react'

const CATEGORIES_EXPENSE = ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Одежда', 'Здоровье', 'Связь', 'Подписки', 'Образование', 'Другое']
const CATEGORIES_INCOME = ['Зарплата', 'Подработка', 'Кэшбэк', 'Подарок', 'Возврат', 'Инвестиции', 'Продажа', 'Другое']

interface ReceiptItem {
  id?: string
  name: string
  quantity: number
  unit_price: number
  total: number
  category: string
}

interface ReceiptFormProps {
  open: boolean
  accounts: { id: string; name: string; icon: string }[]
  receipt?: { id: string; account_id: string; shop_name: string; date: string; type: string; items: ReceiptItem[] } | null
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

export default function ReceiptForm({ open, accounts, receipt, onClose, onSubmit }: ReceiptFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [shopName, setShopName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)

  const isEditing = !!receipt

  useEffect(() => {
    if (open) {
      if (receipt) {
        setAccountId(receipt.account_id)
        setTxType((receipt.type as 'income' | 'expense') || 'expense')
        setShopName(receipt.shop_name)
        setDate(receipt.date?.split('T')[0] || new Date().toISOString().split('T')[0])
        setItems(receipt.items || [])
      } else {
        setAccountId(accounts[0]?.id || '')
        setTxType('expense')
        setShopName('')
        setDate(new Date().toISOString().split('T')[0])
        setItems([])
      }
    }
  }, [open, accounts, receipt])

  if (!open) return null

  const total = items.reduce((sum, item) => sum + item.total, 0)

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unit_price: 0, total: 0, category: 'Другое' }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Пересчитываем total при изменении quantity или unit_price
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = Math.round(newItems[index].quantity * newItems[index].unit_price * 100) / 100
    }
    
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Распознавание чека
  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

      setShopName(data.shop_name || '')
      setDate(data.date || new Date().toISOString().split('T')[0])
      
      if (data.items && data.items.length > 0) {
        setItems(data.items.map((item: any) => ({
          name: item.name || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total: item.total || Math.round((item.quantity || 1) * (item.unit_price || 0) * 100) / 100,
          category: item.category || 'Другое',
        })))
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`)
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId) return
    
    // Для дохода достаточно категории и суммы
    if (txType === 'income' && (!items[0]?.category || !items[0]?.total)) return
    // Для расхода нужны товары
    if (txType === 'expense' && items.length === 0) return
    
    setLoading(true)
    try {
      await onSubmit({ account_id: accountId, type: txType, shop_name: shopName, date, items })
      onClose()
    } catch (err) {
      alert('Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#161618] rounded-t-2xl p-5 animate-fade-in border-t border-[#2a2825] max-h-[95vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#2a2825] rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-semibold text-[#f5f0e8] mb-4">
          {isEditing ? '✏️ Редактировать чек' : '📝 Новый чек'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Кнопка сканирования (только при создании) */}
          {!isEditing && (
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
                  Распознаю...
                </>
              ) : (
                <>📷 Распознать чек</>
              )}
            </button>
          </div>
          )}

          {/* Тип транзакции */}
          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Тип операции</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setTxType('expense'); setItems(items.length > 0 ? items : [{ name: '', quantity: 1, unit_price: 0, total: 0, category: '' }]) }}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                  txType === 'expense'
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                    : 'bg-[#2a2825] text-[#8a8578] border-2 border-transparent'
                }`}
              >
                📤 Расход
              </button>
              <button
                type="button"
                onClick={() => { setTxType('income'); setItems([]) }}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                  txType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50'
                    : 'bg-[#2a2825] text-[#8a8578] border-2 border-transparent'
                }`}
              >
                📥 Доход
              </button>
            </div>
          </div>

          {/* ПРОСТАЯ ФОРМА ДЛЯ ДОХОДА */}
          {txType === 'income' && (
            <>
              {/* Счёт */}
              <div>
                <label className="block text-sm text-[#8a8578] mb-2">Счёт</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input" required>
                  <option value="">Выберите</option>
                  {accounts.map((a) => (<option key={a.id} value={a.id}>{a.icon} {a.name}</option>))}
                </select>
              </div>

              {/* Дата */}
              <div>
                <label className="block text-sm text-[#8a8578] mb-2">Дата</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
              </div>

              {/* Категория дохода */}
              <div>
                <label className="block text-sm text-[#8a8578] mb-2">Категория</label>
                <select
                  value={items[0]?.category || ''}
                  onChange={(e) => {
                    const newItems = [{ name: e.target.value, quantity: 1, unit_price: 0, total: 0, category: e.target.value }]
                    setItems(newItems)
                  }}
                  className="input"
                >
                  <option value="">Выберите категорию</option>
                  {CATEGORIES_INCOME.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>

              {/* Сумма дохода */}
              <div>
                <label className="block text-sm text-[#8a8578] mb-2">Сумма, ₽</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={items[0]?.total?.toString() || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setItems([{ name: items[0]?.category || '', quantity: 1, unit_price: 0, total: val, category: items[0]?.category || '' }])
                  }}
                  className="input text-lg font-bold"
                  placeholder="0.00"
                />
              </div>

              {/* Описание (опционально) */}
              <div>
                <label className="block text-sm text-[#8a8578] mb-2">Описание (опционально)</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="input"
                  placeholder="Комментарий"
                  maxLength={100}
                />
              </div>
            </>
          )}

          {/* ПОЛНАЯ ФОРМА ДЛЯ РАСХОДА */}
          {txType === 'expense' && (
          <>
          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Магазин</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="input"
              placeholder="Название магазина"
            />
          </div>

          {/* Счёт и дата */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-[#8a8578] mb-2">Счёт</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input" required>
                <option value="">Выберите</option>
                {accounts.map((a) => (<option key={a.id} value={a.id}>{a.icon} {a.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#8a8578] mb-2">Дата</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
            </div>
          </div>

          {/* Товары */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-[#8a8578]">Товары ({items.length})</label>
              <button type="button" onClick={addItem} className="text-xs text-[#c9a84c] hover:text-[#e0c068]">
                + Добавить
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="bg-[#1a1a1c] rounded-xl p-3 mb-2 border border-[#2a2825]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#8a8578]">Товар {index + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-300 text-sm">
                      ✕
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="input text-sm py-2 px-3"
                    placeholder="Название товара"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-[#55504a]">Кол-во</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="input text-sm py-2 px-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#55504a]">Цена</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="input text-sm py-2 px-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#55504a]">Сумма</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.total}
                        onChange={(e) => updateItem(index, 'total', parseFloat(e.target.value) || 0)}
                        className="input text-sm py-2 px-2"
                      />
                    </div>
                  </div>

                  <select
                    value={item.category}
                    onChange={(e) => updateItem(index, 'category', e.target.value)}
                    className="input text-sm py-2 px-3"
                  >
                    {CATEGORIES_EXPENSE.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-4 text-[#55504a] text-sm">
                Нажмите «+ Добавить» или отсканируйте чек
              </div>
            )}
          </div>

          {/* Итого */}
          {items.length > 0 && (
            <div className="bg-[#c9a84c]/10 rounded-xl p-3 border border-[#c9a84c]/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#f5f0e8]">Итого:</span>
                <span className="text-lg font-bold text-gold-gradient">
                  {total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                </span>
              </div>
            </div>
          )}
          </>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-dark flex-1">Отмена</button>
            <button type="submit" disabled={loading || items.length === 0} className="btn-gold flex-1 disabled:opacity-50">
              {loading ? 'Сохранение...' : 'Сохранить чек'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
