"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

export default function LandingPage() {
    const { user, profile } = useAuth()

    const dashboardHref =
        profile?.role === "instructor"
            ? "/dashboard/instructor"
            : "/dashboard/student"

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Navbar — flat, no blur */}
            <nav className="sticky top-0 z-50 bg-white border-b-2 border-[var(--border-primary)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <img
                                src="/favicon.png"
                                alt="CodeGuruAI"
                                className="h-10 w-10 object-contain"
                            />
                            <span className="ml-3 text-xl font-bold text-[var(--text-primary)]">
                                CodeGuruAI
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {user ? (
                                <Link
                                    href={dashboardHref}
                                    className="px-5 py-2.5 text-sm font-semibold bg-[var(--accent-primary)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] transition-colors"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="px-5 py-2.5 text-sm font-semibold bg-[var(--accent-primary)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] transition-colors"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero — Full coral background */}
            <section className="section-coral relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left — Content */}
                        <div className="animate-slide-up">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 mb-6">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                                <span className="text-sm font-semibold text-white">
                                    AI-Powered Learning
                                </span>
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                                Learn Coding
                                <br />
                                the{" "}
                                <span className="text-[var(--accent-tertiary)]">
                                    Smart Way
                                </span>
                            </h1>
                            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
                                CodeGuru AI gives you Socratic hints that make
                                you think, not answers that do the work for you.
                                Master programming through guided
                                problem-solving.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-white text-[var(--accent-primary)] rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Start Learning Free
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </Link>
                                <Link
                                    href="#features"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    See How It Works
                                </Link>
                            </div>
                        </div>

                        {/* Right — Animated SVG Illustration */}
                        <div className="animate-slide-in-right animate-delay-200 flex justify-center">
                            <svg
                                width="420"
                                height="340"
                                viewBox="0 0 420 340"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Laptop body */}
                                <rect
                                    x="60"
                                    y="60"
                                    width="300"
                                    height="200"
                                    rx="16"
                                    fill="white"
                                    fillOpacity="0.15"
                                    stroke="white"
                                    strokeOpacity="0.3"
                                    strokeWidth="2"
                                />
                                {/* Screen */}
                                <rect
                                    x="78"
                                    y="78"
                                    width="264"
                                    height="160"
                                    rx="8"
                                    fill="white"
                                    fillOpacity="0.1"
                                />
                                {/* Code lines */}
                                <rect
                                    x="98"
                                    y="100"
                                    width="80"
                                    height="6"
                                    rx="3"
                                    fill="white"
                                    fillOpacity="0.6"
                                    className="animate-pulse-slow"
                                />
                                <rect
                                    x="98"
                                    y="116"
                                    width="140"
                                    height="6"
                                    rx="3"
                                    fill="white"
                                    fillOpacity="0.4"
                                    className="animate-pulse-slow animate-delay-200"
                                />
                                <rect
                                    x="98"
                                    y="132"
                                    width="100"
                                    height="6"
                                    rx="3"
                                    fill="white"
                                    fillOpacity="0.6"
                                    className="animate-pulse-slow animate-delay-300"
                                />
                                <rect
                                    x="118"
                                    y="148"
                                    width="70"
                                    height="6"
                                    rx="3"
                                    fill="#FFE66D"
                                    fillOpacity="0.7"
                                    className="animate-pulse-slow animate-delay-100"
                                />
                                <rect
                                    x="118"
                                    y="164"
                                    width="90"
                                    height="6"
                                    rx="3"
                                    fill="white"
                                    fillOpacity="0.4"
                                    className="animate-pulse-slow animate-delay-300"
                                />
                                <rect
                                    x="98"
                                    y="180"
                                    width="120"
                                    height="6"
                                    rx="3"
                                    fill="white"
                                    fillOpacity="0.5"
                                />
                                <rect
                                    x="98"
                                    y="196"
                                    width="60"
                                    height="6"
                                    rx="3"
                                    fill="#4ECDC4"
                                    fillOpacity="0.7"
                                />
                                {/* Keyboard base */}
                                <rect
                                    x="80"
                                    y="264"
                                    width="260"
                                    height="16"
                                    rx="8"
                                    fill="white"
                                    fillOpacity="0.1"
                                />
                                {/* Floating elements */}
                                <circle
                                    cx="340"
                                    cy="90"
                                    r="12"
                                    fill="#FFE66D"
                                    fillOpacity="0.4"
                                    className="animate-float"
                                />
                                <circle
                                    cx="80"
                                    cy="50"
                                    r="8"
                                    fill="#4ECDC4"
                                    fillOpacity="0.5"
                                    className="animate-float animate-delay-200"
                                />
                                <circle
                                    cx="360"
                                    cy="200"
                                    r="6"
                                    fill="white"
                                    fillOpacity="0.3"
                                    className="animate-float animate-delay-300"
                                />
                                {/* Checkmark badge */}
                                <circle
                                    cx="320"
                                    cy="170"
                                    r="20"
                                    fill="white"
                                    fillOpacity="0.2"
                                    className="animate-bounce-slow"
                                />
                                <path
                                    d="M310 170L317 177L330 163"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {/* AI sparkle */}
                                <g
                                    className="animate-wiggle"
                                    style={{ transformOrigin: "70px 280px" }}
                                >
                                    <circle
                                        cx="70"
                                        cy="280"
                                        r="14"
                                        fill="#FFE66D"
                                        fillOpacity="0.3"
                                    />
                                    <path
                                        d="M70 270L72 277L79 277L73 282L75 289L70 284L65 289L67 282L61 277L68 277Z"
                                        fill="white"
                                        fillOpacity="0.6"
                                    />
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>
                {/* Animated Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0 h-24">
                    <svg
                        className="wave"
                        viewBox="0 0 1440 120"
                        preserveAspectRatio="none"
                        style={{ height: "100%" }}
                    >
                        <path
                            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,106.7C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                            fill="white"
                            fillOpacity="1"
                        />
                    </svg>
                    <svg
                        className="wave"
                        viewBox="0 0 1440 120"
                        preserveAspectRatio="none"
                        style={{ height: "100%" }}
                    >
                        <path
                            d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                            fill="white"
                            fillOpacity="0.6"
                        />
                    </svg>
                    <svg
                        className="wave"
                        viewBox="0 0 1440 120"
                        preserveAspectRatio="none"
                        style={{ height: "100%" }}
                    >
                        <path
                            d="M0,96L48,90.7C96,85,192,75,288,69.3C384,64,480,64,576,69.3C672,75,768,85,864,85.3C960,85,1056,75,1152,64C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                            fill="white"
                            fillOpacity="0.4"
                        />
                    </svg>
                </div>
            </section>

            {/* Features Section — flat white */}
            <section id="features" className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center mb-14 animate-slide-up">
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] mb-4">
                            Everything you need to master coding
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg">
                            A comprehensive platform designed for both students
                            and instructors.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 stagger-children">
                        {/* Feature 1 */}
                        <div className="flat-card p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center mx-auto mb-6">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                                Socratic AI Hints
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                Get guided hints that help you discover the
                                solution yourself, building real problem-solving
                                skills.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="flat-card p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-secondary)] flex items-center justify-center mx-auto mb-6">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                                Live Code Execution
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                Write, run, and test your code directly in the
                                browser with real-time feedback and test case
                                validation.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="flat-card p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-blue)] flex items-center justify-center mx-auto mb-6">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                                Progress Analytics
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                Track your learning journey with detailed
                                analytics, streaks, and performance insights.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section — Dark */}
            <section className="section-dark relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center relative z-10">
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
                            Ready to level up your coding skills?
                        </h2>
                        <p className="text-white/60 mb-8 max-w-lg mx-auto text-lg">
                            Join thousands of learners mastering programming
                            with AI-powered guidance.
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:bg-[var(--accent-primary-hover)] transition-colors text-lg"
                        >
                            Create Free Account
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>
                </div>
                {/* Decorative shapes */}
                <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-[var(--accent-primary)] opacity-10 animate-float" />
                <div className="absolute bottom-10 right-20 w-16 h-16 rounded-full bg-[var(--accent-secondary)] opacity-10 animate-float animate-delay-300" />
                <div className="absolute top-1/2 right-1/4 w-12 h-12 rounded-full bg-[var(--accent-tertiary)] opacity-10 animate-float animate-delay-200" />
            </section>

            {/* Footer */}
            <footer className="bg-[var(--bg-secondary)] border-t-2 border-[var(--border-primary)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img
                                src="/favicon.png"
                                alt="CodeGuruAI"
                                className="h-7 w-7 object-contain"
                            />
                            <p className="text-sm text-[var(--text-muted)]">
                                &copy; 2026 CodeGuruAI. Built with care for
                                learners.
                            </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
                            <a
                                href="#"
                                className="hover:text-[var(--text-secondary)] transition-colors"
                            >
                                About
                            </a>
                            <a
                                href="#"
                                className="hover:text-[var(--text-secondary)] transition-colors"
                            >
                                Contact
                            </a>
                            <a
                                href="#"
                                className="hover:text-[var(--text-secondary)] transition-colors"
                            >
                                Privacy
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
