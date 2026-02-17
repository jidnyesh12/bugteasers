'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const { toast } = useToast()

  const redirectTo = searchParams.get('redirect') || null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { profile } = await signIn(email, password)
      toast('Welcome back!', 'success')

      if (redirectTo) {
        router.push(redirectTo)
      } else {
        const dest = profile?.role === 'instructor'
          ? '/dashboard/instructor'
          : '/dashboard/student'
        router.push(dest)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Sign in to continue your learning journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          id="login-email-input"
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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          showPasswordToggle
          id="login-password-input"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
          id="login-submit-btn"
        >
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors"
        >
          Create account
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
