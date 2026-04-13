'use client'

import { useState } from 'react'

const ACCOUNT_ICONS = ['💳', '🏦', '💵', '👛', '💰', '🏠', '', '', '🎯', '🎮']

interface AddAccountModalProps {
  open: boolean
  onClose: () => void
  onAdd: (name: string, icon: string, initialBalance: number) => Promise<void>
}

export default function AddAccountModal({ open, onClose, onAdd }: AddAccountModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('💳')
  const [initialBalance, setInitialBalance] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onAdd(name.trim(), icon, parseFloat(initialBalance) || 0)
      setName('')
      setIcon('💳')
      setInitialBalance('')
      onClose()
    } catch (err) {
      alert('Ошибка создания счёта')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#161618] rounded-t-2xl p-6 animate-fade-in border-t border-[#2a2825]">
        <div className="w-10 h-1 bg-[#2a2825] rounded-full mx-auto mb-6" />
        <h3 className="text-lg font-semibold text-[#f5f0e8] mb-4">Новый счёт</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    icon === i
                      ? 'bg-[#c9a84c]/30 border border-[#c9a84c]'
                      : 'bg-[#2a2825] border border-transparent hover:border-[#c9a84c]/30'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Например: Дебетовая"
              maxLength={30}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Начальный остаток, ₽</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="input"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-dark flex-1">Отмена</button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-gold flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
