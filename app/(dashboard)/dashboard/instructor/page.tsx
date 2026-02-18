'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'
import { FullPageLoader } from '@/components/ui/loading'

const stats = [
  {
    label: 'Total Problems',
    value: '0',
    sub: 'Create your first',
    color: '#2B3F7E',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    label: 'Pending Reviews',
    value: '0',
    sub: 'All caught up',
    color: '#F39C12',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    label: 'Active Students',
    value: '0',
    sub: 'Invite students',
    color: '#1DB97A',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Classrooms',
    value: '0',
    sub: 'Create classroom',
    color: '#7C9CC4',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
]

const quickActions = [
  {
    label: 'Manage Classrooms',
    description: 'View and edit your classes',
    href: '/dashboard/instructor/classrooms',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    label: 'Assignments',
    description: 'Create and assign to classrooms',
    href: '/dashboard/instructor/assignments',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Problem Bank',
    description: 'Create and manage problems',
    href: '/dashboard/instructor/problems',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    label: 'Generate Problem',
    description: 'AI-powered problem creator',
    href: '/dashboard/instructor/problems/new',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
]

export default function InstructorDashboard() {
  const { profile, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role === 'student') { router.replace('/dashboard/student'); return }
  }, [profile, loading, initialized, router])

  if (!initialized || loading || !profile || profile.role !== 'instructor') {
    return <FullPageLoader />
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ── Welcome Banner ── */}
      <div className="bg-[var(--accent-primary)] rounded-2xl p-6 mb-8 overflow-hidden relative">
        {/* Subtle geometric shapes */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/[0.05]" />
        <div className="absolute -right-2 -bottom-10 w-28 h-28 rounded-full bg-white/[0.04]" />
        <div className="absolute right-20 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/[0.04]" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Instructor Dashboard</p>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Instructor'}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Manage your classrooms and track student progress.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <span className="text-sm font-semibold text-white">Instructor</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-[var(--border-primary)] rounded-xl p-5 hover:border-[var(--border-secondary)] transition-colors">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
              style={{ background: `${stat.color}14`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{stat.value}</p>
            <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">{stat.label}</p>
            <p className="text-xs text-[var(--text-muted)] mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Recent Submissions */}
        <div className="lg:col-span-3 bg-white border border-[var(--border-primary)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">Recent Submissions</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">No submissions yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">Student submissions will appear here once they start solving problems</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white border border-[var(--border-primary)] rounded-xl p-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-5">Quick Actions</h2>
          <div className="flex flex-col gap-1">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--accent-primary)] group-hover:text-white group-hover:border-[var(--accent-primary)] transition-all flex-shrink-0">
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{action.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{action.description}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
