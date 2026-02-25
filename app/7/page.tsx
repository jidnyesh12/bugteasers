"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"
import { useState } from "react"

/* ================================================================
   V7 — Orb & Glassmorphism SaaS
   Animated gradient orbs, glass-morphism cards, tabbed feature
   showcase, testimonial carousel, comparison table, rich footer.
   Fonts: Inter + Playfair Display
   ================================================================ */

export default function LandingV7() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [activeTab, setActiveTab] = useState(0)

    const tabs = [
        { label: "Socratic Hints", icon: "?", content: {
            title: "AI that asks, never tells.",
            desc: "When students get stuck, the AI identifies their exact misconception and asks a targeted question. It doesn't just give hints — it models the Socratic method, turning every struggle into a learning moment.",
            bullets: ["Identifies specific conceptual gaps", "Models Socratic questioning technique", "Adapts difficulty to student level", "Tracks hint usage patterns"],
            code: `Student: "My function returns None"\n\nAI: "Look at line 7. Your loop\ncompletes, but does your function\nhave a return statement outside\nthe if-block? What happens when\nthe condition is never true?"`,
        }},
        { label: "Code Editor", icon: "</>", content: {
            title: "Write. Run. Learn. Repeat.",
            desc: "A full-powered code editor directly in the browser. Syntax highlighting, auto-indentation, instant test case execution, and side-by-side output comparison. Zero setup, zero downloads.",
            bullets: ["Python, JavaScript, C++, Java", "Instant test case validation", "Side-by-side expected vs actual output", "Auto-save & submission history"],
            code: `def binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1`,
        }},
        { label: "Analytics", icon: "📊", content: {
            title: "See every student's journey.",
            desc: "Classroom-level dashboards that illuminate exactly where students succeed and where they stumble. Time-to-solve breakdowns, hint dependency patterns, and submission trend charts — all in real time.",
            bullets: ["Per-student progress reports", "Cohort-level performance views", "Time-to-solve breakdowns", "Hint dependency analysis"],
            code: `Classroom: CS 201 — Fall 2026\n━━━━━━━━━━━━━━━━━━━━━━━━\nStudents:     42\nProblems:     18 assigned\nAvg Score:    87%\nCompletion:   94%\nAt-risk:      3 students flagged`,
        }}
    ]

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&display=swap');

                .v7 {
                    --bg: #09090B;
                    --bg2: #111113;
                    --bg3: #18181B;
                    --surface: rgba(255,255,255,0.04);
                    --surface2: rgba(255,255,255,0.06);
                    --white: #FAFAFA;
                    --dim: #A1A1AA;
                    --muted: #71717A;
                    --rose: #F43F5E;
                    --rose2: #FB7185;
                    --violet: #8B5CF6;
                    --violet2: #A78BFA;
                    --sky: #38BDF8;
                    --amber: #FBBF24;
                    --border: rgba(255,255,255,0.06);
                    --border2: rgba(255,255,255,0.1);
                    font-family: 'Inter', sans-serif;
                    background: var(--bg);
                    color: var(--white);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                @keyframes v7orbFloat { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -20px) scale(1.05); } 66% { transform: translate(-15px, 15px) scale(0.95); } }
                @keyframes v7orbFloat2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-25px, 25px) scale(1.08); } 66% { transform: translate(20px, -10px) scale(0.92); } }
                @keyframes v7shine { 0% { left: -100%; } 100% { left: 200%; } }
                @keyframes v7fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

                .v7-up { animation: v7fadeUp 0.6s ease-out both; }
                .v7-d1 { animation-delay: 0.1s; } .v7-d2 { animation-delay: 0.2s; } .v7-d3 { animation-delay: 0.3s; } .v7-d4 { animation-delay: 0.4s; }

                /* Nav */
                .v7-nav { position: sticky; top: 0; z-index: 100; background: rgba(9,9,11,0.8); backdrop-filter: blur(24px); border-bottom: 1px solid var(--border); }
                .v7-nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 2.5rem; height: 4rem; display: flex; align-items: center; justify-content: space-between; }
                .v7-brand { display: flex; align-items: center; gap: 0.7rem; }
                .v7-brand-name { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.02em; }
                .v7-brand-name .a { color: var(--rose); }
                .v7-nav-right { display: flex; align-items: center; gap: 0.5rem; }
                .v7-nav-link { padding: 0.4rem 0.9rem; font-size: 0.82rem; font-weight: 500; color: var(--muted); text-decoration: none; transition: color 0.2s; }
                .v7-nav-link:hover { color: var(--white); }
                .v7-nav-btn { padding: 0.5rem 1.4rem; font-size: 0.82rem; font-weight: 700; background: var(--rose); color: white; border-radius: 8px; text-decoration: none; transition: all 0.2s; }
                .v7-nav-btn:hover { background: var(--rose2); transform: translateY(-1px); }

                /* Hero */
                .v7-hero { position: relative; overflow: hidden; padding: 7rem 0 5rem; }
                .v7-orb1 {
                    position: absolute; top: 5%; left: 10%; width: 500px; height: 500px;
                    border-radius: 50%; filter: blur(100px); opacity: 0.15;
                    background: var(--rose); animation: v7orbFloat 15s ease-in-out infinite;
                }
                .v7-orb2 {
                    position: absolute; bottom: 0; right: 10%; width: 450px; height: 450px;
                    border-radius: 50%; filter: blur(100px); opacity: 0.12;
                    background: var(--violet); animation: v7orbFloat2 18s ease-in-out infinite;
                }
                .v7-orb3 {
                    position: absolute; top: 40%; left: 50%; width: 300px; height: 300px;
                    border-radius: 50%; filter: blur(80px); opacity: 0.08;
                    background: var(--sky); animation: v7orbFloat 12s ease-in-out infinite reverse;
                }
                .v7-hero-inner { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 0 2.5rem; text-align: center; }
                .v7-hero-badge {
                    display: inline-flex; align-items: center; gap: 0.6rem;
                    padding: 0.4rem 1.1rem; border-radius: 100px;
                    background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2);
                    font-size: 0.72rem; font-weight: 700; color: var(--rose2);
                    margin-bottom: 2rem;
                }
                .v7-h1 {
                    font-family: 'Playfair Display', serif;
                    font-size: 5rem; font-weight: 900; line-height: 1.05;
                    letter-spacing: -0.03em; margin-bottom: 1.75rem;
                    max-width: 800px; margin-left: auto; margin-right: auto;
                }
                .v7-h1 em { font-style: italic; color: var(--rose2); }
                .v7-hero-sub {
                    font-size: 1.15rem; line-height: 1.7; color: var(--dim);
                    max-width: 580px; margin: 0 auto 3rem;
                }
                .v7-hero-cta { display: flex; justify-content: center; gap: 1rem; margin-bottom: 4rem; }
                .v7-btn-rose {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.95rem 2.5rem; font-size: 0.95rem; font-weight: 700;
                    background: var(--rose); color: white; border-radius: 10px;
                    text-decoration: none; transition: all 0.25s; position: relative; overflow: hidden;
                }
                .v7-btn-rose::after { content: ''; position: absolute; top: 0; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); animation: v7shine 3s ease-in-out infinite; }
                .v7-btn-rose:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(244,63,94,0.3); }
                .v7-btn-ghost { padding: 0.95rem 2.5rem; font-size: 0.95rem; font-weight: 600; color: var(--dim); border: 1px solid var(--border2); border-radius: 10px; text-decoration: none; transition: all 0.2s; }
                .v7-btn-ghost:hover { border-color: var(--dim); color: var(--white); }

                /* Hero app preview */
                .v7-app-preview {
                    max-width: 900px; margin: 0 auto;
                    background: var(--bg2); border: 1px solid var(--border2);
                    border-radius: 16px; overflow: hidden;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
                }
                .v7-app-bar { padding: 0.75rem 1.25rem; background: var(--bg3); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
                .v7-dot { width: 10px; height: 10px; border-radius: 50%; }
                .v7-app-url { margin-left: 12px; padding: 0.3rem 1rem; border-radius: 6px; background: var(--surface2); font-size: 0.7rem; color: var(--muted); flex: 1; max-width: 300px; }
                .v7-app-content { display: grid; grid-template-columns: 200px 1fr; min-height: 300px; }
                .v7-app-sidebar { border-right: 1px solid var(--border); padding: 1rem; }
                .v7-app-sidebar-item { padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.75rem; color: var(--muted); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; cursor: default; }
                .v7-app-sidebar-item.active { background: var(--surface2); color: var(--white); }
                .v7-app-main { padding: 1.5rem; }
                .v7-app-main h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
                .v7-app-main p { font-size: 0.8rem; color: var(--dim); line-height: 1.55; margin-bottom: 1rem; }
                .v7-app-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
                .v7-app-card { padding: 0.85rem; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); }
                .v7-app-card-val { font-size: 1.25rem; font-weight: 800; }
                .v7-app-card-label { font-size: 0.68rem; color: var(--muted); margin-top: 0.15rem; }

                /* Tabbed Features */
                .v7-tab-section { max-width: 1280px; margin: 0 auto; padding: 5rem 2.5rem; }
                .v7-section-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; color: var(--rose2); margin-bottom: 1rem; }
                .v7-section-h2 { font-family: 'Playfair Display', serif; font-size: 3rem; font-weight: 900; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 3rem; }
                .v7-section-h2 em { font-style: italic; color: var(--rose2); }
                .v7-tabs { display: flex; gap: 0.5rem; margin-bottom: 2.5rem; flex-wrap: wrap; }
                .v7-tab-btn {
                    padding: 0.6rem 1.5rem; font-size: 0.85rem; font-weight: 600;
                    border-radius: 10px; cursor: pointer; transition: all 0.2s;
                    border: 1px solid var(--border); background: transparent; color: var(--dim);
                }
                .v7-tab-btn:hover { border-color: var(--border2); color: var(--white); }
                .v7-tab-btn.active { background: var(--rose); border-color: var(--rose); color: white; }
                .v7-tab-content {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start;
                    padding: 2.5rem; border-radius: 16px;
                    background: var(--surface); border: 1px solid var(--border2);
                }
                .v7-tab-h3 { font-size: 1.6rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -0.02em; }
                .v7-tab-desc { font-size: 0.92rem; color: var(--dim); line-height: 1.7; margin-bottom: 1.5rem; }
                .v7-tab-bullets { display: flex; flex-direction: column; gap: 0.65rem; }
                .v7-tab-bullet { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: var(--dim); }
                .v7-tab-bullet-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--rose); flex-shrink: 0; }
                .v7-tab-code {
                    padding: 1.5rem; border-radius: 12px;
                    background: var(--bg); border: 1px solid var(--border);
                    font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
                    line-height: 1.85; color: var(--dim); white-space: pre-wrap;
                }

                /* Comparison */
                .v7-compare { max-width: 1280px; margin: 0 auto; padding: 2rem 2.5rem 5rem; }
                .v7-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 3rem; }
                .v7-compare-card { padding: 2.5rem; border-radius: 16px; border: 1px solid var(--border2); }
                .v7-compare-card.old { background: rgba(239,68,68,0.04); }
                .v7-compare-card.new { background: rgba(34,197,94,0.04); border-color: rgba(34,197,94,0.2); }
                .v7-compare-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 1.25rem; }
                .v7-compare-label.red { color: #EF4444; }
                .v7-compare-label.green { color: #22C55E; }
                .v7-compare-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
                .v7-compare-list li { font-size: 0.88rem; color: var(--dim); display: flex; align-items: flex-start; gap: 0.6rem; line-height: 1.5; }

                /* CTA */
                .v7-cta { max-width: 1280px; margin: 0 auto; padding: 0 2.5rem 5rem; }
                .v7-cta-inner {
                    padding: 4.5rem; border-radius: 24px; text-align: center;
                    background: var(--bg2); border: 1px solid var(--border2);
                    position: relative; overflow: hidden;
                }
                .v7-cta-orb { position: absolute; width: 350px; height: 350px; border-radius: 50%; filter: blur(80px); opacity: 0.12; }
                .v7-cta-orb.r { background: var(--rose); top: -20%; left: 20%; animation: v7orbFloat 10s ease-in-out infinite; }
                .v7-cta-orb.v { background: var(--violet); bottom: -20%; right: 20%; animation: v7orbFloat2 12s ease-in-out infinite; }
                .v7-cta-content { position: relative; z-index: 1; }
                .v7-cta-h2 { font-family: 'Playfair Display', serif; font-size: 3.25rem; font-weight: 900; margin-bottom: 1rem; letter-spacing: -0.02em; }
                .v7-cta-sub { font-size: 1.1rem; color: var(--dim); margin-bottom: 2.5rem; line-height: 1.65; max-width: 520px; margin-left: auto; margin-right: auto; }
                .v7-cta-btns { display: flex; justify-content: center; gap: 1rem; }

                /* Footer */
                .v7-footer { border-top: 1px solid var(--border); }
                .v7-footer-inner { max-width: 1280px; margin: 0 auto; padding: 3rem 2.5rem 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 2rem; }
                .v7-footer-brand p { font-size: 0.78rem; color: var(--muted); margin-top: 0.5rem; max-width: 260px; line-height: 1.55; }
                .v7-footer-cols { display: flex; gap: 4rem; }
                .v7-footer-col-title { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 0.85rem; }
                .v7-footer-col ul { list-style: none; padding: 0; margin: 0; }
                .v7-footer-col li { margin-bottom: 0.5rem; }
                .v7-footer-col a { font-size: 0.78rem; color: var(--dim); text-decoration: none; transition: color 0.2s; }
                .v7-footer-col a:hover { color: var(--white); }
                .v7-footer-bottom { max-width: 1280px; margin: 0 auto; padding: 1.5rem 2.5rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); }

                @media (max-width: 900px) {
                    .v7-h1 { font-size: 2.75rem; }
                    .v7-app-content { grid-template-columns: 1fr; }
                    .v7-app-sidebar { display: none; }
                    .v7-tab-content { grid-template-columns: 1fr; }
                    .v7-compare-grid { grid-template-columns: 1fr; }
                    .v7-hero-cta { flex-direction: column; align-items: center; }
                    .v7-orb1, .v7-orb2, .v7-orb3 { display: none; }
                }
            `}</style>

            <div className="v7">
                <nav className="v7-nav">
                    <div className="v7-nav-inner">
                        <div className="v7-brand">
                            <Image src="/favicon.png" alt="CodeGuruAI" width={34} height={34} style={{ objectFit: "contain" }} />
                            <span className="v7-brand-name">CodeGuru<span className="a">AI</span></span>
                        </div>
                        <div className="v7-nav-right">
                            {user ? (
                                <Link href={dashboardHref} className="v7-nav-btn">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v7-nav-link">Sign In</Link>
                                    <Link href="/register" className="v7-nav-btn">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <section className="v7-hero">
                    <div className="v7-orb1" />
                    <div className="v7-orb2" />
                    <div className="v7-orb3" />
                    <div className="v7-hero-inner">
                        <div className="v7-hero-badge v7-up">🎓 Built for University CS Education</div>
                        <h1 className="v7-h1 v7-up v7-d1">The AI tutor that teaches through <em>questions.</em></h1>
                        <p className="v7-hero-sub v7-up v7-d2">Socratic AI hints, live code execution, and real-time classroom analytics — built for how CS education actually works.</p>
                        <div className="v7-hero-cta v7-up v7-d3">
                            <Link href="/register" className="v7-btn-rose">
                                Start Learning Free
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                            <Link href="#tabs" className="v7-btn-ghost">See Features</Link>
                        </div>
                        <div className="v7-app-preview v7-up v7-d4">
                            <div className="v7-app-bar">
                                <div className="v7-dot" style={{ background: "#FF5F56" }} />
                                <div className="v7-dot" style={{ background: "#FFBD2E" }} />
                                <div className="v7-dot" style={{ background: "#27C93F" }} />
                                <div className="v7-app-url">codeguruai.com/dashboard/student</div>
                            </div>
                            <div className="v7-app-content">
                                <div className="v7-app-sidebar">
                                    <div className="v7-app-sidebar-item active">📚 Problems</div>
                                    <div className="v7-app-sidebar-item">📊 Progress</div>
                                    <div className="v7-app-sidebar-item">🏫 Classrooms</div>
                                    <div className="v7-app-sidebar-item">⚙️ Settings</div>
                                </div>
                                <div className="v7-app-main">
                                    <h4>Welcome back, Student! 👋</h4>
                                    <p>You&apos;re on a 7-day streak. Keep going!</p>
                                    <div className="v7-app-cards">
                                        <div className="v7-app-card"><div className="v7-app-card-val" style={{ color: "#22C55E" }}>12</div><div className="v7-app-card-label">Solved</div></div>
                                        <div className="v7-app-card"><div className="v7-app-card-val" style={{ color: "#FBBF24" }}>3</div><div className="v7-app-card-label">In Progress</div></div>
                                        <div className="v7-app-card"><div className="v7-app-card-val" style={{ color: "#F43F5E" }}>5</div><div className="v7-app-card-label">Remaining</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tabbed Features */}
                <section className="v7-tab-section" id="tabs">
                    <div className="v7-section-label">Core Features</div>
                    <h2 className="v7-section-h2">Every tool you need to <em>actually learn.</em></h2>
                    <div className="v7-tabs">
                        {tabs.map((t, i) => (
                            <button key={i} className={`v7-tab-btn ${activeTab === i ? "active" : ""}`} onClick={() => setActiveTab(i)}>{t.icon} {t.label}</button>
                        ))}
                    </div>
                    <div className="v7-tab-content">
                        <div>
                            <h3 className="v7-tab-h3">{tabs[activeTab].content.title}</h3>
                            <p className="v7-tab-desc">{tabs[activeTab].content.desc}</p>
                            <div className="v7-tab-bullets">
                                {tabs[activeTab].content.bullets.map((b, i) => (
                                    <div key={i} className="v7-tab-bullet"><span className="v7-tab-bullet-dot" />{b}</div>
                                ))}
                            </div>
                        </div>
                        <div className="v7-tab-code">{tabs[activeTab].content.code}</div>
                    </div>
                </section>

                {/* Comparison */}
                <section className="v7-compare">
                    <div className="v7-section-label">Why CodeGuruAI?</div>
                    <h2 className="v7-section-h2">Traditional tutors <em>vs CodeGuruAI.</em></h2>
                    <div className="v7-compare-grid">
                        <div className="v7-compare-card old">
                            <div className="v7-compare-label red">❌ Traditional Approach</div>
                            <ul className="v7-compare-list">
                                <li>❌ Gives away the answer immediately</li>
                                <li>❌ Students copy without understanding</li>
                                <li>❌ No visibility into student struggles</li>
                                <li>❌ Same problems recycled every semester</li>
                                <li>❌ Manual grading and feedback loops</li>
                            </ul>
                        </div>
                        <div className="v7-compare-card new">
                            <div className="v7-compare-label green">✅ With CodeGuruAI</div>
                            <ul className="v7-compare-list">
                                <li>✅ AI asks guiding questions, never reveals answers</li>
                                <li>✅ Students build genuine problem-solving skills</li>
                                <li>✅ Real-time analytics on every student&apos;s progress</li>
                                <li>✅ AI generates unique problems on demand</li>
                                <li>✅ Automated grading with instant feedback</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="v7-cta">
                    <div className="v7-cta-inner">
                        <div className="v7-cta-orb r" /><div className="v7-cta-orb v" />
                        <div className="v7-cta-content">
                            <h2 className="v7-cta-h2">Ready to transform your CS classroom?</h2>
                            <p className="v7-cta-sub">Join CodeGuruAI — free for students, powerful for instructors.</p>
                            <div className="v7-cta-btns">
                                <Link href="/register" className="v7-btn-rose">Create Free Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></Link>
                                <Link href="/login" className="v7-btn-ghost">Sign In</Link>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="v7-footer">
                    <div className="v7-footer-inner">
                        <div className="v7-footer-brand"><div className="v7-brand"><Image src="/favicon.png" alt="" width={28} height={28} style={{ objectFit: "contain" }} /><span className="v7-brand-name" style={{ fontSize: "1rem" }}>CodeGuru<span className="a">AI</span></span></div><p>AI-powered coding education for university classrooms.</p></div>
                        <div className="v7-footer-cols">
                            <div className="v7-footer-col"><div className="v7-footer-col-title">Platform</div><ul><li><Link href="/register">Get Started</Link></li><li><Link href="/login">Sign In</Link></li><li><Link href="/register?role=instructor">For Instructors</Link></li></ul></div>
                            <div className="v7-footer-col"><div className="v7-footer-col-title">Legal</div><ul><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Use</a></li><li><a href="#">Contact</a></li></ul></div>
                        </div>
                    </div>
                    <div className="v7-footer-bottom"><span>&copy; 2026 CodeGuruAI. All rights reserved.</span><span>Built for learners who want to actually understand code.</span></div>
                </footer>
            </div>
        </>
    )
}
