import { Metadata } from 'next'
import { MainLayout } from '@/components/layout/main-layout'

export const metadata: Metadata = {
  title: 'Finanzas - Span',
  description: 'Gestión de pagos y comprobantes',
}

export default function FinanzasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
