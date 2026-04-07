import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Span',
  description: 'Panel de control principal',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
