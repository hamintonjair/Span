import { Metadata } from 'next'
import { MainLayout } from '@/components/layout/main-layout'

export const metadata: Metadata = {
  title: 'Comunicación - Span',
  description: 'Gestión de mensajes globales',
}

export default function ComunicacionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
