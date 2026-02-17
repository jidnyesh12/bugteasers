'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UserRole } from '@/lib/types'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signUp } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'warning')
      return
    }
    setLoading(true)

    try {
      await signUp(email, password, fullName, role, role === 'student' ? joinCode : undefined)
      toast('Account created! Please check your email to verify.', 'success')
      router.push('/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Create an account</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Start your coding journey today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full Name"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          id="register-name-input"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          id="register-email-input"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          }
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          showPasswordToggle
          id="register-password-input"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
        />

        {/* Role Selection — flat colored buttons */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
            I am a
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`
                flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer
                ${role === 'student'
                  ? 'bg-[var(--accent-secondary)] border-[var(--accent-secondary)] text-white'
                  : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                }
              `}
              id="register-student-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 7 3 12 0v-5"/>
              </svg>
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('instructor')}
              className={`
                flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer
                ${role === 'instructor'
                  ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white'
                  : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                }
              `}
              id="register-instructor-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Instructor
            </button>
          </div>
        </div>

        {/* Join Code — Slide in for students */}
        {role === 'student' && (
          <div className="animate-slide-up">
            <Input
              label="Classroom Join Code (optional)"
              placeholder="e.g. ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              id="register-joincode-input"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              }
            />
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
          id="register-submit-btn"
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
