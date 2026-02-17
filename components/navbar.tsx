'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

export function Navbar() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  return (
    <nav className="sticky top-0 z-50 h-16 bg-white/80 backdrop-blur-xl border-b border-[var(--border-primary)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Code<span className="text-[var(--accent-primary)]">Guru</span>{' '}
            <span className="text-sm font-medium text-[var(--text-muted)]">AI</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-lg">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-[var(--accent-primary)]">
                    {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {profile.full_name}
                </span>
              </div>
              <button
                onClick={async () => { await signOut(); router.push('/login') }}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors cursor-pointer"
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
