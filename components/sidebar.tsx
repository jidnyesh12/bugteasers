'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

export function Sidebar() {
  const pathname = usePathname()
  const { profile } = useAuth()

  const isInstructor = profile?.role === 'instructor'

  const instructorLinks = [
    { href: '/dashboard/instructor', label: 'Dashboard', icon: DashboardIcon },
    { href: '/dashboard/instructor/classrooms', label: 'Classrooms', icon: ClassroomIcon },
    { href: '/dashboard/instructor/assignments', label: 'Assignments', icon: AssignmentIcon },
    { href: '/dashboard/instructor/problems', label: 'Problems', icon: ProblemsIcon },
  ]

  const studentLinks = [
    { href: '/dashboard/student', label: 'Dashboard', icon: DashboardIcon },
    { href: '/dashboard/student/classrooms', label: 'My Classrooms', icon: ClassroomIcon },
  ]

  const links = isInstructor ? instructorLinks : studentLinks

  return (
    <aside className="hidden lg:flex flex-col w-56 sticky top-14 self-start h-[calc(100vh-3.5rem)] border-r border-[var(--border-primary)] bg-white overflow-y-auto">
      <div className="px-4 pt-5 pb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          {isInstructor ? 'Instructor' : 'Student'}
        </span>
      </div>

      <nav className="px-3 pb-4 flex flex-col gap-0.5">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/dashboard/instructor' &&
              link.href !== '/dashboard/student' &&
              pathname.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${isActive
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              <link.icon />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto px-4 pb-5 pt-4 border-t border-[var(--border-primary)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center shrink-0">
            <span className="text-[11px] font-black text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] truncate capitalize">
              {profile?.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function ClassroomIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function AssignmentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function ProblemsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
