'use client'

import { useState, useEffect } from 'react'
import AddAccountModal from './add-account-modal'
import EditAccountModal from './edit-account-modal'

interface Account {
  id: string
  name: string
  icon: string
  currency: string
  is_default: boolean
  balance: number
}

export default function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      const json = await res.json()
      if (json.accounts) setAccounts(json.accounts)
    } catch (err) { console.error('Ошибка:', err) } finally { setLoading(false) }
  }

  useEffect(() => { fetchAccounts() }, [])

  const handleAdd = async (name: string, icon: string, initialBalance: number) => {
    const res = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, icon, initialBalance }) })
    if (!res.ok) throw new Error('Ошибка')
    fetchAccounts()
  }

  const handleUpdate = async (id: string, updates: { name?: string; icon?: string; balance?: number }) => {
    const res = await fetch('/api/accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
    if (!res.ok) throw new Error('Ошибка')
    fetchAccounts()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (!res.ok) throw new Error('Ошибка')
    fetchAccounts()
  }

  const openEdit = (account: Account) => { setEditingAccount(account); setShowEditModal(true) }
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)

  if (loading) return <div className="text-center py-8 text-[#8a8578]">Загрузка...</div>

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#f5f0e8] mb-3">Мои счета</h3>
        <button onClick={() => setShowAddModal(true)} className="btn-gold text-sm py-2 px-4">+ Добавить</button>
      </div>

      {accounts.length > 0 ? (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} onClick={() => openEdit(acc)} className="card-gold rounded-xl p-4 border-[#c9a84c]/30 flex items-center justify-between cursor-pointer hover:border-[#c9a84c]/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">{acc.icon}</span>
                <div>
                  <p className="text-sm font-medium text-[#f5f0e8]">{acc.name}</p>
                  {acc.is_default && <p className="text-[10px] text-[#55504a]">Основной</p>}
                </div>
              </div>
              <p className="text-lg font-bold text-gold-gradient">
                {(acc.balance || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card rounded-xl p-6 text-center">
          <p className="text-sm text-[#8a8578]">Нет счетов</p>
          <p className="text-xs text-[#55504a] mt-1">Добавьте первый счёт</p>
        </div>
      )}

      <AddAccountModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      <EditAccountModal open={showEditModal} account={editingAccount} onClose={() => { setShowEditModal(false); setEditingAccount(null); }} onUpdate={handleUpdate} onDelete={handleDelete} />
    </div>
  )
}
