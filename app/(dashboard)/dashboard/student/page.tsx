'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { FullPageLoader } from '@/components/ui/loading'

export default function StudentDashboard() {
  const { profile, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) return

    if (!profile) {
      router.replace('/login')
      return
    }

    // CRITICAL: Prevent instructors from accessing student dashboard
    if (profile.role === 'instructor') {
      router.replace('/dashboard/instructor')
      return
    }
  }, [profile, loading, initialized, router])

  if (!initialized || loading || !profile || profile.role !== 'student') {
    return <FullPageLoader />
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Banner with Wave */}
      <div className="card p-6 mb-8 relative overflow-hidden">
        {/* Animated Wave Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="wave" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: '100%' }}>
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,106.7C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#2B3F7E" fillOpacity="1"/>
          </svg>
          <svg className="wave" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: '100%' }}>
            <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#2B3F7E" fillOpacity="1"/>
          </svg>
          <svg className="wave" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: '100%' }}>
            <path d="M0,96L48,90.7C96,85,192,75,288,69.3C384,64,480,64,576,69.3C672,75,768,85,864,85.3C960,85,1056,75,1152,64C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#2B3F7E" fillOpacity="1"/>
          </svg>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Welcome back, {profile?.full_name || 'Student'}
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Continue your coding journey. Practice makes perfect.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/15 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="text-sm font-semibold text-[var(--accent-primary)]">Active Learner</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Problems Solved',
            value: '0',
            trend: 'Just started',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            ),
            color: 'var(--accent-primary)',
            bgColor: 'bg-teal-50',
          },
          {
            label: 'Day Streak',
            value: '0',
            trend: 'Start today',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            ),
            color: 'var(--accent-secondary)',
            bgColor: 'bg-amber-50',
          },
          {
            label: 'Submissions',
            value: '0',
            trend: 'No submissions yet',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            ),
            color: 'var(--accent-tertiary)',
            bgColor: 'bg-cyan-50',
          },
          {
            label: 'Accuracy',
            value: '--',
            trend: 'Solve problems to track',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
            color: '#16a34a',
            bgColor: 'bg-emerald-50',
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bgColor}`} style={{ color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{stat.label}</p>
            <p className="text-xs text-[var(--text-muted)] mt-2">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3 card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">No activity yet</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Start solving problems to see your progress here</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              {
                label: 'Browse Problems',
                description: 'Find challenges to solve',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                ),
              },
              {
                label: 'View Profile',
                description: 'Update your information',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ),
              },
              {
                label: 'Leaderboard',
                description: 'See how you compare',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                ),
              },
            ].map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] group-hover:bg-[var(--accent-primary)]/10 group-hover:text-[var(--accent-primary)] transition-colors">
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{action.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}