'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface BalanceHistoryPoint {
  date: string
  balance: number
}

export default function BalanceTrendChart() {
  const [history, setHistory] = useState<BalanceHistoryPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/balance-history')
      .then(res => res.json())
      .then(data => {
        if (data.history) {
          // Фильтруем нулевые значения в начале
          const filtered = data.history.filter((h: BalanceHistoryPoint) => h.balance > 0)
          setHistory(filtered.length > 0 ? filtered : data.history)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

  // Форматируем даты для оси X
  const formattedData = history.map(h => ({
    ...h,
    displayDate: new Date(h.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }))

  return (
    <div className="h-32 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
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
  )
}
