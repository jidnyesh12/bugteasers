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
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "#ffffff",
          backgroundImage: `
            radial-gradient(circle at top center, rgba(59, 130, 246, 0.5), transparent 70%)
          `,
        }}
      />
      
      <div className="relative z-10">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
