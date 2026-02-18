"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { UserRole } from "@/lib/types"

function RegisterForm() {
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()
    const { signUp } = useAuth()
    const { toast } = useToast()

    const isInstructor = searchParams.get("role") === "instructor"
    const role: UserRole = isInstructor ? "instructor" : "student"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            toast("Password must be at least 6 characters", "warning")
            return
        }
        if (password !== confirmPassword) {
            toast("Passwords do not match", "error")
            return
        }

        setLoading(true)
        try {
            await signUp(email, password, fullName, role)
            toast(
                "Account created! Please check your email to verify.",
                "success"
            )
            router.push("/login")
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Registration failed"
            toast(message, "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
                    {isInstructor
                        ? "Create instructor account"
                        : "Create your account"}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {isInstructor
                        ? "Set up your instructor profile"
                        : "Start your coding journey today"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Full Name"
                    placeholder="Amol Suryawanshi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    id="register-name-input"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    }
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    showPasswordToggle
                    id="register-confirm-password-input"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    }
                />

                <div className="pt-1">
                    <Button
                        type="submit"
                        loading={loading}
                        className="w-full"
                        size="lg"
                        id="register-submit-btn"
                    >
                        {isInstructor
                            ? "Create Instructor Account"
                            : "Create Account"}
                    </Button>
                </div>
            </form>

            {/* Sign in link */}
            <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors"
                >
                    Sign in
                </Link>
            </p>

            {/* Instructor / Student toggle link — small, unobtrusive */}
            <div className="mt-4 pt-4 border-t border-[var(--border-primary)] text-center">
                {isInstructor ? (
                    <p className="text-xs text-[var(--text-muted)]">
                        Registering as a student?{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                        >
                            Create student account
                        </Link>
                    </p>
                ) : (
                    <p className="text-xs text-[var(--text-muted)]">
                        Are you an instructor?{" "}
                        <Link
                            href="/register?role=instructor"
                            className="font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                        >
                            Register as instructor
                        </Link>
                    </p>
                )}
            </div>
        </>
    )
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] animate-spin" />
                </div>
            }
        >
            <RegisterForm />
        </Suspense>
    )
}
