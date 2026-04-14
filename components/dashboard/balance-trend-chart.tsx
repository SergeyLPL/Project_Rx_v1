'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface BalanceHistoryPoint {
  date: string
  balance: number
  displayDate: string
}

export default function BalanceTrendChart() {
  const [history, setHistory] = useState<BalanceHistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'30d' | '1y'>('30d')

  const fetchHistory = async (p: '30d' | '1y') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/balance-history?period=${p}`)
      const data = await res.json()
      if (data.history) {
        const formatted = data.history.map((h: any) => ({
          ...h,
          displayDate: new Date(h.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: p === '1y' ? 'short' : 'numeric'
          })
        }))
        setHistory(formatted)
      }
    } catch (err) {
      console.error('Ошибка загрузки истории:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(period)
  }, [period])

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#2a2825] border-t-[#c9a84c] rounded-full animate-spin" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-[#55504a] text-sm">
        Нет данных за период
      </div>
    )
  }

  const minBalance = Math.min(...history.map(h => h.balance))
  const maxBalance = Math.max(...history.map(h => h.balance))
  const padding = (maxBalance - minBalance) * 0.1 || 1000

  return (
    <div>
      {/* Переключатель периода */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#f5f0e8]">Тренд баланса</p>
        <button
          onClick={() => setPeriod(period === '30d' ? '1y' : '30d')}
          className="badge badge-indigo cursor-pointer hover:opacity-80 transition-opacity"
        >
          {period === '30d' ? '30 дней' : '1 год'}
        </button>
      </div>

      {/* График */}
      <div className="h-32 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#55504a' }}
              interval="preserveStartEnd"
            />
            <YAxis
              hide
              domain={[minBalance - padding, maxBalance + padding]}
            />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽`}
              labelFormatter={(label) => label}
              contentStyle={{
                backgroundColor: '#161618',
                border: '1px solid #2a2825',
                borderRadius: '12px',
                color: '#f5f0e8',
                fontSize: '12px'
              }}
              cursor={{ stroke: '#2a2825', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#c9a84c"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#balanceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#c9a84c', stroke: '#161618', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
