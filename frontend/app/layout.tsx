import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/hooks/useToast'

export const metadata: Metadata = {
  title: 'Learning Log - Architecture View',
  description: 'Deep Learning Log System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  )
}
