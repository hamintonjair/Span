import { Metadata } from 'next'
import { MainLayout } from '@/components/layout/main-layout'

export const metadata: Metadata = {
  title: 'Admin Global - Span',
  description: 'Panel de administración global',
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
