'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { FullPageLoader } from '@/components/ui/loading'

export default function DashboardRedirect() {
  const { profile, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) return

    if (!profile) {
      router.replace('/login')
      return
    }

    if (profile.role === 'instructor') {
      router.replace('/dashboard/instructor')
    } else {
      router.replace('/dashboard/student')
    }
  }, [profile, loading, initialized, router])

  return <FullPageLoader />
}
