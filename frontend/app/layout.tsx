import type { Metadata } from 'next'
import '@/styles/index.css'
import { ToastProvider } from '@/hooks/useToast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Learning Log — 知识沉淀图谱',
  description: '从 AI 对话到结构化知识图谱的完整闭环',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body><ToastProvider><ErrorBoundary>{children}</ErrorBoundary></ToastProvider></body>
    </html>
  )
}
