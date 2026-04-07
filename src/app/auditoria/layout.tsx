import { Metadata } from 'next'
import { MainLayout } from '@/components/layout/main-layout'

export const metadata: Metadata = {
  title: 'Auditoría - Span',
  description: 'Registro de aprobaciones y validaciones',
}

export default function AuditoriaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
