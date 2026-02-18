'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FullPageLoader } from '@/components/ui/loading'
import type { Classroom } from '@/lib/types'

const STRIPE_COLORS = ['bg-[var(--accent-primary)]', 'bg-[var(--accent-secondary)]', 'bg-[var(--accent-blue)]', 'bg-[var(--accent-tertiary)]']

export default function ClassroomsPage() {
  const { profile, loading: authLoading, initialized } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // CRITICAL: Protect route - only instructors can access
  useEffect(() => {
    if (!initialized || authLoading) return

    if (!profile) {
      router.replace('/login')
      return
    }

    if (profile.role !== 'instructor') {
      router.replace('/dashboard/student')
      return
    }
  }, [profile, authLoading, initialized, router])

  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
    fetchClassrooms()
  }, [fetchClassrooms])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast('Enter a classroom name', 'warning')
      return
    }
    if (!autoGenerate && !joinCode.trim()) {
      toast('Enter a join code or enable auto-generate', 'warning')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          join_code: autoGenerate ? '' : joinCode.trim(),
        }),
      })
      const data = await res.json()

      if (res.ok) {
        toast('Classroom created!', 'success')
        setClassrooms((prev) => [data.classroom, ...prev])
        resetForm()
      } else {
        toast(data.error || 'Failed to create classroom', 'error')
      }
    } catch {
      toast('Network error', 'error')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setName('')
    setJoinCode('')
    setAutoGenerate(true)
    setShowModal(false)
  }

  const copyJoinCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast('Join code copied!', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)]">
            Classrooms
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Create and manage your class batches. Share join codes with students.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} id="create-classroom-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Classroom
        </Button>
      </div>

      {/* Classrooms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] animate-spin" />
            <p className="text-sm text-[var(--text-muted)]">Loading classrooms…</p>
          </div>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="flat-card flex flex-col items-center justify-center py-20 text-center">
          {/* Animated book SVG */}
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-5 animate-float">
            <circle cx="45" cy="45" r="40" fill="var(--bg-tertiary)"/>
            <g transform="translate(22, 25)">
              <path d="M2 4C2 4 10 0 23 0C36 0 44 4 44 4V36C44 36 36 32 23 32C10 32 2 36 2 36V4Z" fill="var(--accent-secondary)" fillOpacity="0.2" stroke="var(--accent-secondary)" strokeOpacity="0.4" strokeWidth="1.5"/>
              <path d="M23 0V32" stroke="var(--accent-secondary)" strokeOpacity="0.3" strokeWidth="1"/>
              <rect x="8" y="10" width="10" height="2" rx="1" fill="var(--accent-secondary)" fillOpacity="0.4"/>
              <rect x="8" y="15" width="8" height="2" rx="1" fill="var(--accent-secondary)" fillOpacity="0.3"/>
              <rect x="28" y="10" width="10" height="2" rx="1" fill="var(--accent-secondary)" fillOpacity="0.4"/>
              <rect x="28" y="15" width="8" height="2" rx="1" fill="var(--accent-secondary)" fillOpacity="0.3"/>
            </g>
          </svg>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">No classrooms yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm">
            Create your first classroom and share the join code with your students.
          </p>
          <Button onClick={() => setShowModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Classroom
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classrooms.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/dashboard/instructor/classrooms/${c.id}`)}
              className="group relative bg-white rounded-xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                      {c.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Created {formatDate(c.created_at)}
                    </p>
                  </div>
                  <div className="bg-[var(--bg-secondary)] p-2 rounded-lg text-[var(--accent-primary)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5" title="Students Enrolled">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span className="font-semibold">{c.classroom_students?.[0]?.count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Assignments Posted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span className="font-semibold">{c.classroom_assignments?.[0]?.count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-[var(--bg-tertiary)]/50 border-t border-[var(--border-primary)] flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Join Code:</span>
                    <span className="text-sm font-mono font-bold text-[var(--text-primary)] tracking-widest">{c.join_code}</span>
                 </div>
                 <button
                    onClick={(e) => {
                        e.stopPropagation()
                        copyJoinCode(c.join_code, c.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    title="Copy Code"
                 >
                    {copiedId === c.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Classroom Modal — flat design */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop — no blur */}
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={resetForm}
          />

          {/* Modal — flat, no shadow */}
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl border-2 border-[var(--border-primary)] animate-slide-up" id="create-classroom-modal">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--border-primary)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    Create Classroom
               w                         </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Set up a new batch for your students
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                id="close-modal-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
              <Input
                label="Classroom Name"
                placeholder="e.g. CS101 — Fall 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                id="classroom-name-input"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                }
              />

              {/* Join Code section */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  Join Code
                </label>

                {/* Toggle */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setAutoGenerate(true)}
                    className={`
                      flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all duration-200 cursor-pointer
                      ${autoGenerate
                        ? 'bg-[var(--accent-primary)]/8 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                        : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                      }
                    `}
                    id="auto-generate-btn"
                  >
                    Auto-generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoGenerate(false)}
                    className={`
                      flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all duration-200 cursor-pointer
                      ${!autoGenerate
                        ? 'bg-[var(--accent-primary)]/8 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                        : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                      }
                    `}
                    id="manual-code-btn"
                  >
                    Manual Entry
                  </button>
                </div>

                {autoGenerate ? (
                  <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <p className="text-xs text-[var(--text-muted)]">
                      A unique 6-character code will be generated automatically.
                    </p>
                  </div>
                ) : (
                  <Input
                    placeholder="e.g. CS101F"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    id="join-code-input"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    }
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={creating} id="submit-classroom-btn">
                  Create Classroom
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
