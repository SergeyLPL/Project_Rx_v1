'use client'

import { useState, useEffect } from 'react'

const ACCOUNT_ICONS = ['💳', '', '💵', '👛', '💰', '🏠', '', '', '🎯', '🎮']

interface Account {
  id: string
  name: string
  icon: string
  balance: number
}

interface EditAccountModalProps {
  open: boolean
  account: Account | null
  onClose: () => void
  onUpdate: (id: string, updates: { name?: string; icon?: string; balance?: number }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function EditAccountModal({ open, account, onClose, onUpdate, onDelete }: EditAccountModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('💳')
  const [balance, setBalance] = useState('0')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (account) {
      setName(account.name)
      setIcon(account.icon)
      setBalance(account.balance?.toString() || '0')
      setConfirmDelete(false)
    }
  }, [account])

  if (!open || !account) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onUpdate(account.id, {
        name: name.trim(),
        icon,
        balance: parseFloat(balance) || 0,
      })
      onClose()
    } catch (err) {
      alert('Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await onDelete(account.id)
      onClose()
    } catch (err) {
      alert('Ошибка удаления')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => { onClose(); setConfirmDelete(false); }} />
      <div className="relative w-full max-w-sm bg-[#161618] rounded-t-2xl p-6 animate-fade-in border-t border-[#2a2825] max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#2a2825] rounded-full mx-auto mb-6" />
        <h3 className="text-lg font-semibold text-[#f5f0e8] mb-4">Редактировать счёт</h3>

        <form onSubmit={handleSave} className="space-y-4">
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
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm text-[#8a8578] mb-2">Остаток, ₽</label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { onClose(); setConfirmDelete(false); }} className="btn-dark flex-1">Отмена</button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-gold flex-1 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-[#2a2825]">
          {confirmDelete ? (
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn-dark flex-1 text-sm">Нет</button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
              >
                Да, удалить
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/20 transition-colors"
            >
              Удалить счёт
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
