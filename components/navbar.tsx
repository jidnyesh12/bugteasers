'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

export function Navbar() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  return (
    <nav className="sticky top-0 z-50 h-14 bg-white border-b border-[var(--border-primary)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/favicon.png" alt="CodeGuruAI" width={40} height={40} className="object-contain" />
          <span className="text-lg font-black tracking-tight text-[var(--text-primary)]">
            CodeGuru<span className="text-[var(--accent-primary)]">AI</span>
          </span>
        </Link>

        {/* Right side */}
        {profile && (
          <div className="flex items-center gap-2">
            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
              <div className="w-6 h-6 rounded-md bg-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-white leading-none">
                  {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)] max-w-[140px] truncate">
                {profile.full_name}
              </span>
              <span className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                {profile.role}
              </span>
            </div>
            <button
              onClick={async () => { await signOut(); router.push('/login') }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
