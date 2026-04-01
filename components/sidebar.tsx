'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

interface SidebarProps {
  isOpen?: boolean
  onToggleSidebar?: () => void
}

export function Sidebar({
  isOpen = true,
  onToggleSidebar,
}: SidebarProps) {
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
  const roleLabel = isInstructor ? 'Instructor' : 'Student'

  return (
    <aside
      className={`
        hidden lg:flex flex-col relative h-full shrink-0
        border-r border-[var(--border-primary)] bg-white overflow-visible
        transition-[width] duration-300 ease-out
        ${isOpen ? 'w-56' : 'w-20'}
      `}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        className="absolute top-6 -right-3 z-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-primary)] bg-white text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </button>

      <div className={`pt-5 pb-3 ${isOpen ? 'px-4' : 'px-2 text-center'}`}>
        <span
          className={`inline-block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ${isOpen ? 'visible' : 'invisible'}`}
        >
          {roleLabel}
        </span>
      </div>

      <nav className={`pb-4 flex flex-col gap-0.5 ${isOpen ? 'px-3' : 'px-2'}`}>
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
              title={link.label}
              className={`
                flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${isOpen ? 'gap-2.5 justify-start' : 'gap-0 justify-center'}
                ${isActive
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              <link.icon />
              <span className={isOpen ? '' : 'hidden'}>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={`mt-auto pb-5 pt-4 border-t border-[var(--border-primary)] ${isOpen ? 'px-4' : 'px-2'}`}>
        <div className={`flex items-center ${isOpen ? 'gap-2.5' : 'justify-center'}`}>
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center shrink-0">
            <span className="text-[11px] font-black text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          {isOpen && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] truncate capitalize">
                {profile?.role}
              </p>
            </div>
          )}
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
