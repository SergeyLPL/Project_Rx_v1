'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

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
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)

  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [shopName, setShopName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [loading, setLoading] = useState(false)

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
        setSelectedImage(null)
      }
    }
  }, [open, accounts, receipt])

  if (!open) return null

  const total = items.reduce((sum, item) => sum + item.total, 0)

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unit_price: 0, total: 0, category: '' }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = Math.round(newItems[index].quantity * newItems[index].unit_price * 100) / 100
    }
    
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Запуск камеры/галереи через Capacitor или файл для веба
  const handleCapacitorCamera = async () => {
    console.log('[ReceiptForm] handleCapacitorCamera вызвана')
    // Проверяем, работает ли Capacitor (нативное приложение)
    const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNative?.()
    console.log('[ReceiptForm] isNative:', isNative)

    if (isNative) {
      try {
        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt,
        })

        if (image.dataUrl) {
          setSelectedImage(image.dataUrl)
          await performOCR(image.dataUrl)
        }
      } catch (error) {
        console.error('Ошибка камеры:', error)
      }
    } else {
      // Веб-версия — открываем файловый input
      console.log('[ReceiptForm] Веб-версия, открываю fileInput')
      if (fileInputRef.current) {
        console.log('[ReceiptForm] fileInputRef.current существует:', fileInputRef.current)
        fileInputRef.current.click()
      } else {
        console.error('[ReceiptForm] fileInputRef.current = null')
      }
    }
  }

  // Логика распознавания
  const performOCR = async (imageData: string) => {
    setOcrLoading(true)
    try {
      // Конвертируем DataUrl в Blob для отправки
      const base64Response = await fetch(imageData)
      const blob = await base64Response.blob()
      
      const formData = new FormData()
      formData.append('file', blob, 'receipt.jpg')

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        alert(`Ошибка распознавания: ${data.error || 'Неизвестная ошибка'}`)
        return
      }

      // Заполняем данные из ответа
      setShopName(data.shop_name || '')
      setDate(data.date || new Date().toISOString().split('T')[0])
      
      if (data.items && data.items.length > 0) {
        // Для расходов добавляем товары
        if (txType === 'expense') {
          setItems(data.items.map((item: any) => ({
            name: item.name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total: item.total || 0,
            category: item.category || 'Другое',
          })))
        } 
        // Для доходов берем общую сумму
        else if (txType === 'income') {
          const totalIncome = data.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
          setItems([{ 
            name: data.shop_name || 'Доход', 
            quantity: 1, 
            unit_price: 0, 
            total: totalIncome || data.items[0].total || 0, 
            category: data.items[0].category || 'Другое' 
          }])
        }
      }

    } catch (err: any) {
      alert(`Ошибка: ${err.message}`)
    } finally {
      setOcrLoading(false)
    }
  }

  // Обработка загрузки файла (для веба)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[ReceiptForm] handleFileChange вызвана')
    const file = e.target.files?.[0]
    console.log('[ReceiptForm] file:', file)
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      console.log('[ReceiptForm] dataUrl получен, длина:', dataUrl?.length)
      setSelectedImage(dataUrl)
      await performOCR(dataUrl)
    }
    reader.onerror = (err) => console.error('[ReceiptForm] FileReader error:', err)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId) return
    if (txType === 'income' && (!items[0]?.category || !items[0]?.total)) return
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
          {/* Кнопка камеры/галереи */}
          {!isEditing && (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCapacitorCamera}
                  className="flex-1 py-3 bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] rounded-xl font-medium hover:bg-[#c9a84c]/20 transition-colors flex items-center justify-center gap-2"
                >
                  📷 {typeof window !== 'undefined' && !!(window as any).Capacitor ? 'Камера / Галерея' : 'Выбрать файл'}
                </button>
              </div>

              {/* Скрытый input для веба */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                style={{
                  position: 'absolute',
                  opacity: 0,
                  height: 0,
                  width: 0,
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

          {/* Превью фото */}
          {selectedImage && (
            <div className="relative rounded-xl overflow-hidden border border-[#2a2825]">
              <img src={selectedImage} alt="Preview" className="w-full h-48 object-cover" />
              <button 
                type="button" 
                onClick={() => { setSelectedImage(null); setItems([]); setShopName(''); }} 
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}

          {ocrLoading && (
            <div className="text-center text-[#c9a84c] text-sm animate-pulse py-2">
              🔍 Распознаю чек...
            </div>
          )}

          {/* Тип транзакции */}
          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Тип операции</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setTxType('expense'); if(items.length === 0) setItems([{ name: '', quantity: 1, unit_price: 0, total: 0, category: '' }]) }}
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
                      <option value="">Без категории</option>
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
            <button type="submit" disabled={loading || (txType === 'expense' && items.length === 0)} className="btn-gold flex-1 disabled:opacity-50">
              {loading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Добавить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
