'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { FullPageLoader } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

interface EnrolledClassroom {
  id: string
  joined_at: string
  classroom: {
    id: string
    name: string
    instructor_id: string
  }
}

export default function StudentClassroomsPage() {
  const router = useRouter()
  const { profile, loading: authLoading, initialized } = useAuth()
  const { toast } = useToast()

  const [classrooms, setClassrooms] = useState<EnrolledClassroom[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!initialized || authLoading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'student') { router.replace('/dashboard/instructor'); return }
  }, [profile, authLoading, initialized, router])

  const fetchClassrooms = useCallback(async () => {
    try {
      const res = await fetch('/api/classrooms')
      const data = await res.json()
      if (res.ok) {
        setClassrooms(data.classrooms || [])
      } else {
        toast(data.error || 'Failed to load classrooms', 'error')
      }
    } catch {
      toast('Network error', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (profile?.role === 'student') fetchClassrooms()
  }, [profile, fetchClassrooms])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) { toast('Enter a join code', 'warning'); return }
    setJoining(true)
    try {
      const res = await fetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join_code: joinCode })
      })
      const data = await res.json()
      if (res.ok) {
        toast('Joined classroom!', 'success')
        setShowJoinModal(false)
        setJoinCode('')
        fetchClassrooms()
      } else {
        toast(data.error || 'Failed to join', 'error')
      }
    } catch {
      toast('Network error', 'error')
    } finally {
      setJoining(false)
    }
  }

  if (!initialized || authLoading || !profile || profile.role !== 'student') return <FullPageLoader />

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)]">My Classrooms</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            View your enrolled classrooms and access assignments.
          </p>
        </div>
        <Button onClick={() => setShowJoinModal(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Join Classroom
        </Button>
      </div>

      {/* Classrooms List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] animate-spin" />
        </div>
      ) : classrooms.length === 0 ? (
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">No classrooms yet</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-xs mb-6">
            Join a classroom using the code provided by your instructor.
          </p>
          <Button onClick={() => setShowJoinModal(true)}>Join Classroom</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classrooms.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/dashboard/student/classrooms/${c.classroom.id}`)}
              className="group bg-white rounded-xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] font-bold text-lg">
                    {c.classroom.name.charAt(0)}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1 mb-1">
                  {c.classroom.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Joined {new Date(c.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="px-5 py-3 bg-[var(--bg-tertiary)]/50 border-t border-[var(--border-primary)]">
                <span className="text-xs font-semibold text-[var(--accent-primary)]">View Assignments →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setShowJoinModal(false)} />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl border-2 border-[var(--border-primary)] animate-slide-up p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Join Classroom</h2>
              <button onClick={() => setShowJoinModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleJoin}>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Enter the 6-character code provided by your instructor.
              </p>
              <Input
                placeholder="Enter Join Code (e.g. A1B2C3)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="mb-6 uppercase font-mono tracking-widest text-center text-lg"
                maxLength={8}
                required
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowJoinModal(false)}>Cancel</Button>
                <Button type="submit" loading={joining}>Join</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
