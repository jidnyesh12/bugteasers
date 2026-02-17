'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { FullPageLoader } from '@/components/ui/loading'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, initialized } = useAuth()

  if (!initialized || loading) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
