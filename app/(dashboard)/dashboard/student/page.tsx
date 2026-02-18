'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { FullPageLoader } from '@/components/ui/loading'

const stats = [
  {
    label: 'Problems Solved',
    value: '0',
    sub: 'Just started',
    color: '#2B3F7E',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    label: 'Day Streak',
    value: '0',
    sub: 'Start today',
    color: '#FDB714',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: 'Submissions',
    value: '0',
    sub: 'No submissions yet',
    color: '#7C9CC4',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: 'Accuracy',
    value: '--',
    sub: 'Solve to track',
    color: '#1DB97A',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
]

const quickActions = [
  {
    label: 'Browse Problems',
    description: 'Find challenges to solve',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'View Profile',
    description: 'Update your information',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: 'Leaderboard',
    description: 'See how you compare',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
]

export default function StudentDashboard() {
  const { profile, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role === 'instructor') { router.replace('/dashboard/instructor'); return }
  }, [profile, loading, initialized, router])

  if (!initialized || loading || !profile || profile.role !== 'student') {
    return <FullPageLoader />
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ── Welcome Banner ── */}
      <div className="bg-[var(--accent-primary)] rounded-2xl p-6 mb-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/[0.05]" />
        <div className="absolute -right-2 -bottom-10 w-28 h-28 rounded-full bg-white/[0.04]" />
        <div className="absolute right-20 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/[0.04]" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Student Dashboard</p>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Continue your coding journey. Practice makes perfect.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="text-sm font-semibold text-white">Active Learner</span>
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

        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white border border-[var(--border-primary)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">Recent Activity</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">No activity yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">Start solving problems to see your progress here</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white border border-[var(--border-primary)] rounded-xl p-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-5">Quick Actions</h2>
          <div className="flex flex-col gap-1">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors group text-left w-full cursor-pointer"
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
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
