"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"

export default function LandingPage() {
    const { user, profile } = useAuth()

    const dashboardHref =
        profile?.role === "instructor"
            ? "/dashboard/instructor"
            : "/dashboard/student"

    return (
        <div className="min-h-screen w-full bg-white relative">
            {/* Cool Blue Glow Bottom */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: "#ffffff",
                    backgroundImage: `
                        radial-gradient(
                            circle at bottom center,
                            rgba(70, 130, 180, 0.5),
                            transparent 70%
                        )
                    `,
                    filter: "blur(80px)",
                    backgroundRepeat: "no-repeat",
                }}
            />
            
            <div className="relative z-10">
            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-50 bg-white border-b border-[var(--border-primary)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Image src="/favicon.png" alt="CodeGuruAI" width={44} height={44} className="object-contain" />
                            <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">
                                CodeGuru<span className="text-[var(--accent-primary)]">AI</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {user ? (
                                <Link href={dashboardHref} className="px-5 py-2 text-sm font-semibold bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] transition-colors">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                        Log In
                                    </Link>
                                    <Link href="/register" className="px-5 py-2 text-sm font-semibold bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] transition-colors">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-[#020617]">
                {/* Dark Sphere Grid Background */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background: "#020617",
                        backgroundImage: `
                            linear-gradient(to right, rgba(71,85,105,0.3) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(71,85,105,0.3) 1px, transparent 1px),
                            radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)
                        `,
                        backgroundSize: "48px 48px, 48px 48px, 100% 100%",
                    }}
                />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-slide-up">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                                <span className="text-sm font-semibold text-white">AI-Powered Learning</span>
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                                Learn Coding<br />the{" "}
                                <span className="text-[var(--accent-tertiary)]">Smart Way</span>
                            </h1>
                            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
                                CodeGuru AI gives you Socratic hints that make you think, not answers that do the work for you. Master programming through guided problem-solving.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-white text-[var(--accent-primary)] rounded-xl hover:bg-gray-50 transition-colors">
                                    Start Learning Free
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </Link>
                                <Link href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-colors">
                                    See How It Works
                                </Link>
                            </div>
                        </div>
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
                              <div className="absolute -left-6 bottom-16 bg-white rounded-xl border border-[var(--border-primary)] shadow-lg p-3 w-40 animate-float animate-delay-300">
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
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-24">
                    <svg className="wave" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: "100%" }}>
                        <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,106.7C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="white" fillOpacity="1" />
                    </svg>
                    <svg className="wave" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: "100%" }}>
                        <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="white" fillOpacity="0.6" />
                    </svg>
                    <svg className="wave" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: "100%" }}>
                        <path d="M0,96L48,90.7C96,85,192,75,288,69.3C384,64,480,64,576,69.3C672,75,768,85,864,85.3C960,85,1056,75,1152,64C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="white" fillOpacity="0.4" />
                    </svg>
                </div>
            </section>

            {/* ── Features ── */}
            <section id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="mb-14">
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-tight">
                            Built to make you think<br />
                            <span className="text-[var(--accent-primary)]">harder, not just faster.</span>
                        </h2>
                        <p className="text-[var(--text-secondary)] mt-4 text-base max-w-lg leading-relaxed">
                            Most tools give you answers. We give you the question that leads to the answer — because that&apos;s what actually builds skill.
                        </p>
                    </div>

                    {/* Asymmetric card grid */}
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Hero feature — spans 2 cols, navy bg */}
                        <div className="md:col-span-2 bg-[var(--accent-primary)] rounded-2xl p-8 relative overflow-hidden">
                            <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-white/5" />
                            <div className="absolute right-16 top-8 w-24 h-24 rounded-full bg-white/5" />
                            <div className="relative z-10">
                                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-7">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight mb-3">
                                    Socratic AI Hints
                                </h3>
                                <p className="text-white/65 text-sm leading-relaxed max-w-md">
                                    Stuck on a problem? Get a hint that asks you the right question — not one that hands you the solution. You build the reasoning, not just the code.
                                </p>
                                <ul className="mt-7 space-y-2.5">
                                    {[
                                        "Never reveals the answer directly",
                                        "Asks questions that expose your blind spots",
                                        "Forces you to reason through the problem",
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-2.5 text-sm text-white/75">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-tertiary)] shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Two stacked secondary features */}
                        <div className="flex flex-col gap-4">
                            <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6">
                                <div className="w-10 h-10 rounded-xl bg-[var(--accent-tertiary)] flex items-center justify-center mb-5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-black text-[var(--text-primary)] mb-2 tracking-tight">Live Code Execution</h3>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    Write and run your solution right in the browser. Instant test case feedback, no setup needed.
                                </p>
                            </div>
                            <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6">
                                <div className="w-10 h-10 rounded-xl bg-[var(--accent-green)] flex items-center justify-center mb-5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-black text-[var(--text-primary)] mb-2 tracking-tight">Progress Tracking</h3>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    See where you improve and where you struggle. Instructors track your classroom in real time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Bold Statement ── */}
            <section className="bg-[var(--accent-primary)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-[var(--accent-tertiary)] text-xs font-black uppercase tracking-widest mb-5">The Philosophy</p>
                            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                                We don&apos;t give you<br />the answer.<br />
                                <span className="text-white/50">We give you the question<br />that leads to it.</span>
                            </h2>
                        </div>
                        <div className="space-y-5">
                            {[
                                {
                                    title: "For students",
                                    desc: "Struggle through problems with smart guidance. That struggle is where the learning happens — we just make sure you're never completely stuck.",
                                },
                                {
                                    title: "For instructors",
                                    desc: "Create AI-powered problem sets in minutes. Assign to classrooms, track submissions, and see exactly where your students get stuck.",
                                },
                            ].map((item) => (
                                <div key={item.title} className="border-t border-white/10 pt-5">
                                    <p className="text-white text-sm font-bold mb-1">{item.title}</p>
                                    <p className="text-white/55 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="border-t border-[var(--border-primary)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="max-w-xl mx-auto text-center">
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-4">
                            Start learning the right way.
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-10 text-base leading-relaxed">
                            Join CodeGuru AI and learn to solve problems — not just copy solutions.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:bg-[var(--accent-primary-hover)] transition-colors text-base"
                            >
                                Create Free Account
                                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                            <Link href="/login" className="inline-flex items-center justify-center px-8 py-3.5 text-[var(--text-secondary)] font-semibold rounded-xl hover:bg-[var(--bg-secondary)] transition-colors text-base border border-[var(--border-primary)]">
                                Already have an account
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-[var(--accent-primary)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
                    {/* Top row */}
                    <div className="flex flex-col md:flex-row items-start justify-between gap-10 pb-10 border-b border-white/10">
                        {/* Brand */}
                        <div className="max-w-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <Image src="/favicon.png" alt="CodeGuruAI" width={36} height={36} className="object-contain" />
                                <span className="text-lg font-black text-white tracking-tight">CodeGuruAI</span>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed">
                                AI-powered coding education that builds real skills through guided problem-solving.
                            </p>
                        </div>

                        {/* Links */}
                        <div className="flex gap-16">
                            <div>
                                <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-4">Platform</p>
                                <ul className="space-y-3">
                                    <li><Link href="/register" className="text-sm text-white/60 hover:text-white transition-colors">Get Started</Link></li>
                                    <li><Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Sign In</Link></li>
                                    <li><Link href="/register?role=instructor" className="text-sm text-white/60 hover:text-white transition-colors">For Instructors</Link></li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-4">Legal</p>
                                <ul className="space-y-3">
                                    <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</a></li>
                                    <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Terms of Use</a></li>
                                    <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Contact</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom row */}
                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-white/30">&copy; 2026 CodeGuruAI. All rights reserved.</p>
                        <p className="text-xs text-white/25">Built for learners who want to actually understand code.</p>
                    </div>
                </div>
            </footer>
            </div>
        </div>
    )
}
