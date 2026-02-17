'use client'

import {
  SessionProvider,
  useSession,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from 'next-auth/react'
import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'

// ─── Profile shape exposed to components ───
interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'student' | 'instructor'
}

interface AuthContextValue {
  /** The raw NextAuth session user (null when signed out) */
  user: { id: string; email: string; name: string; role: string } | null
  /** Convenience profile object that mirrors the old API surface */
  profile: UserProfile | null
  /** true while the session is being fetched */
  loading: boolean
  /** true once the session has been fetched at least once */
  initialized: boolean
  /** Sign in with email + password → returns { error?: string } */
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  /** Register a new user → returns { error?: string } */
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'student' | 'instructor'
  ) => Promise<{ error?: string }>
  /** Sign out */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Inner provider (needs SessionProvider above it) ───
function AuthContextInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const initialized = status !== 'loading'

  const user =
    session?.user
      ? {
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.name ?? '',
          role: session.user.role ?? 'student',
        }
      : null

  const profile: UserProfile | null = user
    ? {
        id: user.id,
        email: user.email,
        full_name: user.name,
        role: user.role as 'student' | 'instructor',
      }
    : null

  // ── Sign in ──
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    const res = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      return { error: res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error }
    }
    return {}
  }

  // ── Sign up (calls our register API then auto-signs in) ──
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'student' | 'instructor'
  ): Promise<{ error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role }),
      })

      const data = await res.json()
      if (!res.ok) {
        return { error: data.error || 'Registration failed' }
      }

      // Auto sign-in after successful registration
      return signIn(email, password)
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }

  // ── Sign out ──
  const signOutHandler = async () => {
    await nextAuthSignOut({ redirect: false })
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, initialized, signIn, signUp, signOut: signOutHandler }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Public provider (wraps SessionProvider + our context) ───
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  )
}

// ─── Hook ───
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
