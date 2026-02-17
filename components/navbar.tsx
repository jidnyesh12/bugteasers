'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

export function Navbar() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  return (
    <nav className="sticky top-0 z-50 h-16 bg-white border-b-2 border-[var(--border-primary)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <img src="/favicon.png" alt="CodeGuruAI" className="h-10 w-10 object-contain" />
          <span className="ml-3 text-xl font-bold text-[var(--text-primary)]">CodeGuruAI</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-full">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {profile.full_name}
                </span>
              </div>
              <button
                onClick={async () => { await signOut(); router.push('/login') }}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
