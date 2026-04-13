import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rx Finance — Учёт личных финансов',
  description: 'Приложение для учёта доходов и расходов',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
