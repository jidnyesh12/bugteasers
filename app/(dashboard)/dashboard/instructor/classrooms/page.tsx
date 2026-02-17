'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState, useCallback } from 'react'
import type { Classroom } from '@/lib/types'

export default function ClassroomsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()

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
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
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
      </div>

      {/* Classrooms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[var(--accent-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-[var(--text-muted)]">Loading classrooms…</p>
          </div>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No classrooms yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm">
            Create your first classroom and share the join code with your students to get started.
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
          {classrooms.map((c, index) => (
            <div
              key={c.id}
              className="card p-0 overflow-hidden group animate-slide-up"
              style={{ animationDelay: `${index * 60}ms` }}
              id={`classroom-card-${c.id}`}
            >
              {/* Color accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />

              <div className="p-5">
                {/* Title & date */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                      {c.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Created {formatDate(c.created_at)}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-500 ml-3 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                </div>

                {/* Join code */}
                <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-0.5">
                      Join Code
                    </p>
                    <p className="text-lg font-bold text-[var(--accent-primary)] font-mono tracking-widest">
                      {c.join_code}
                    </p>
                  </div>
                  <button
                    onClick={() => copyJoinCode(c.join_code, c.id)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    title="Copy join code"
                    id={`copy-code-${c.id}`}
                  >
                    {copiedId === c.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Instructor info */}
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {profile?.full_name || 'Instructor'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Classroom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
            onClick={resetForm}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-[var(--border-primary)] animate-slide-up" id="create-classroom-modal">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Create Classroom
                  </h2>
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
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Join Code
                </label>

                {/* Toggle */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setAutoGenerate(true)}
                    className={`
                      flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer
                      ${autoGenerate
                        ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                        : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                      }
                    `}
                    id="auto-generate-btn"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                      </svg>
                      Auto-generate
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoGenerate(false)}
                    className={`
                      flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer
                      ${!autoGenerate
                        ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                        : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                      }
                    `}
                    id="manual-code-btn"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Manual Entry
                    </span>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
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
