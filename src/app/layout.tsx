import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ASpan - Sistema de Gestión',
  description: 'Sistema completo de gestión para tu negocio',
  icons: {
    icon: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
