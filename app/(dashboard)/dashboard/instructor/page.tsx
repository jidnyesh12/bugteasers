'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { FullPageLoader } from '@/components/ui/loading'

export default function InstructorDashboard() {
  const { profile, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) return

    if (!profile) {
      router.replace('/login')
      return
    }

    // CRITICAL: Prevent students from accessing instructor dashboard
    if (profile.role === 'student') {
      router.replace('/dashboard/student')
      return
    }
  }, [profile, loading, initialized, router])

  if (!initialized || loading || !profile || profile.role !== 'instructor') {
    return <FullPageLoader />
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Banner with Wave Animation */}
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
              Welcome, {profile?.full_name || 'Instructor'}
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Manage your classrooms and track student progress
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/15 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <span className="text-sm font-semibold text-[var(--accent-primary)]">Instructor</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Problems',
            value: '0',
            trend: 'Create your first',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            ),
            color: 'var(--accent-primary)',
            bgColor: 'bg-teal-50',
          },
          {
            label: 'Pending Reviews',
            value: '0',
            trend: 'All caught up',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            ),
            color: 'var(--accent-secondary)',
            bgColor: 'bg-amber-50',
          },
          {
            label: 'Active Students',
            value: '0',
            trend: 'Invite students',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ),
            color: 'var(--accent-tertiary)',
            bgColor: 'bg-cyan-50',
          },
          {
            label: 'Classrooms',
            value: '0',
            trend: 'Create classroom',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
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
        {/* Recent Submissions */}
        <div className="lg:col-span-3 card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Submissions</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">No submissions yet</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Student submissions will appear here once they start solving problems</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              {
                label: 'Manage Classrooms',
                description: 'View and edit classes',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                ),
              },
              {
                label: 'Problem Bank',
                description: 'Create and manage problems',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                ),
              },
              {
                label: 'View Analytics',
                description: 'Track student progress',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
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
