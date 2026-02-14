'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'

export default function LandingPage() {
  const { user, profile } = useAuth()

  const dashboardHref = profile?.role === 'instructor' ? '/dashboard/instructor' : '/dashboard/student'

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] bg-grid-pattern">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                Code<span className="text-[var(--accent-primary)]">Guru</span> <span className="text-sm font-medium text-[var(--text-muted)]">AI</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href={dashboardHref} className="px-5 py-2 text-sm font-medium bg-[var(--accent-primary)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] transition-colors shadow-sm">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Log In
                  </Link>
                  <Link href="/register" className="px-5 py-2 text-sm font-medium bg-[var(--accent-primary)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] transition-colors shadow-sm">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/15 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span className="text-sm font-medium text-[var(--accent-primary)]">AI-Powered Learning</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-[var(--text-primary)] leading-tight mb-6">
              Learn Coding the
              <span className="text-[var(--accent-primary)]"> Smart Way</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8 max-w-lg">
              CodeGuru AI gives you Socratic hints that make you think, not answers that do the work for you. Master programming through guided problem-solving.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold bg-[var(--accent-primary)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] transition-all shadow-md"
              >
                Start Learning Free
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-[var(--text-secondary)] bg-white border border-[var(--border-primary)] rounded-xl hover:border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)] transition-all"
              >
                See How It Works
              </Link>
            </div>
          </div>

          {/* Right - Illustration */}
          <div className="animate-slide-in-right animate-delay-200 flex justify-center">
            <div className="relative">
              {/* Main illustration card */}
              <div className="bg-white rounded-2xl border border-[var(--border-primary)] shadow-xl p-6 w-[380px]">
                {/* Code editor mockup */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs text-[var(--text-muted)] ml-2 font-mono">solution.py</span>
                </div>
                <div className="bg-[#1e1e2e] rounded-xl p-4 font-mono text-sm space-y-1.5">
                  <p><span className="text-purple-400">def</span> <span className="text-blue-400">two_sum</span><span className="text-gray-400">(nums, target):</span></p>
                  <p className="text-gray-500 pl-4">seen = {'{}'}</p>
                  <p className="text-gray-500 pl-4"><span className="text-purple-400">for</span> i, n <span className="text-purple-400">in</span> enumerate(nums):</p>
                  <p className="text-gray-500 pl-8">diff = target - n</p>
                  <p className="text-gray-500 pl-8"><span className="text-purple-400">if</span> diff <span className="text-purple-400">in</span> seen:</p>
                  <p className="text-green-400 pl-12">return [seen[diff], i]</p>
                  <p className="text-gray-500 pl-8">seen[n] = i</p>
                </div>
                <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">All test cases passed</span>
                </div>
              </div>

              {/* Floating AI hint card */}
              <div className="absolute -right-8 top-12 bg-white rounded-xl border border-[var(--border-primary)] shadow-lg p-3 w-52 animate-float">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--accent-secondary)] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">AI Hint</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Think about using a hash map to store seen values...
                </p>
              </div>

              {/* Floating streak card */}
              <div className="absolute -left-6 bottom-8 bg-white rounded-xl border border-[var(--border-primary)] shadow-lg p-3 w-40 animate-float animate-delay-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--accent-secondary)] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">7 Day Streak</p>
                    <p className="text-xs text-[var(--text-muted)]">Keep it up!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14 animate-slide-up">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              Everything you need to master coding
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              A comprehensive platform designed for both students and instructors with powerful features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {/* Feature 1 */}
            <div className="card p-6">
              <div className="h-12 w-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Socratic AI Hints</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Get guided hints that help you discover the solution yourself, building real problem-solving skills.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-6">
              <div className="h-12 w-12 rounded-xl bg-[var(--accent-secondary)]/10 flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Live Code Execution</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Write, run, and test your code directly in the browser with real-time feedback and test case validation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-6">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Progress Analytics</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Track your learning journey with detailed analytics, streaks, and performance insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-[var(--accent-primary)] rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to level up your coding skills?
              </h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                Join thousands of learners who are mastering programming with AI-powered guidance.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[var(--accent-primary)] font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
              >
                Create Free Account
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              &copy; 2026 CodeGuru AI. Built with care for learners.
            </p>
            <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
              <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">About</a>
              <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">Contact</a>
              <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
