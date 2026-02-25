"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect, useRef } from "react"

/* ================================================================
   V8 — Navy Command Center
   Military-precision design with navy + electric blue + white.
   Terminal-style code block, animated typing effect,
   process timeline, testimonials, animated wave SVG,
   logo/university trust bar, rich multi-section content.
   Fonts: Space Grotesk + IBM Plex Mono
   ================================================================ */

export default function LandingV8() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    // Typing animation
    const [typed, setTyped] = useState("")
    const fullText = "$ codeguru solve two_sum --hints socratic"
    const typingDone = useRef(false)

    useEffect(() => {
        if (typingDone.current) return
        let i = 0
        const timer = setInterval(() => {
            i++
            setTyped(fullText.slice(0, i))
            if (i >= fullText.length) {
                clearInterval(timer)
                typingDone.current = true
            }
        }, 50)
        return () => clearInterval(timer)
    }, [])

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

                .v8 {
                    --navy: #0A1929;
                    --navy2: #0E2240;
                    --navy3: #132F5E;
                    --electric: #2196F3;
                    --electric2: #42A5F5;
                    --electric3: #64B5F6;
                    --electric-bg: rgba(33,150,243,0.08);
                    --white: #F5F7FA;
                    --dim: #8DA2C0;
                    --muted: #5A7BA5;
                    --green: #4ADE80;
                    --amber: #FFC107;
                    --border: rgba(33,150,243,0.12);
                    --border2: rgba(33,150,243,0.2);
                    font-family: 'Space Grotesk', sans-serif;
                    background: var(--navy);
                    color: var(--white);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                @keyframes v8blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
                @keyframes v8slideUp { from { opacity:0; transform: translateY(28px); } to { opacity:1; transform: translateY(0); } }
                @keyframes v8scanline { 0% { top: -100%; } 100% { top: 200%; } }
                @keyframes v8pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
                @keyframes v8wave { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

                .v8-up { animation: v8slideUp 0.6s ease-out both; }
                .v8-d1 { animation-delay: 0.1s; } .v8-d2 { animation-delay: 0.2s; } .v8-d3 { animation-delay: 0.3s; } .v8-d4 { animation-delay: 0.4s; }

                /* Nav */
                .v8-nav { position: sticky; top: 0; z-index: 50; background: rgba(10,25,41,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
                .v8-nav-inner { max-width: 1300px; margin: 0 auto; padding: 0 2.5rem; height: 4rem; display: flex; align-items: center; justify-content: space-between; }
                .v8-brand { display: flex; align-items: center; gap: 0.75rem; }
                .v8-brand-text { font-size: 1.15rem; font-weight: 700; }
                .v8-brand-text .a { color: var(--electric); }
                .v8-nav-right { display: flex; align-items: center; gap: 0.5rem; }
                .v8-nav-link { padding: 0.4rem 0.9rem; font-size: 0.82rem; font-weight: 500; color: var(--dim); text-decoration: none; transition: color 0.2s; }
                .v8-nav-link:hover { color: var(--white); }
                .v8-nav-btn { padding: 0.5rem 1.4rem; font-size: 0.82rem; font-weight: 700; background: var(--electric); color: white; border-radius: 8px; text-decoration: none; transition: all 0.2s; }
                .v8-nav-btn:hover { background: var(--electric2); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(33,150,243,0.3); }

                /* Hero */
                .v8-hero { position: relative; padding: 6rem 0 0; overflow: hidden; }
                .v8-hero-glow {
                    position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
                    width: 800px; height: 800px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(33,150,243,0.12) 0%, transparent 60%);
                }
                .v8-hero-inner { position: relative; z-index: 1; max-width: 1300px; margin: 0 auto; padding: 0 2.5rem; text-align: center; }
                .v8-hero-badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.35rem 1rem; border-radius: 100px;
                    background: var(--electric-bg); border: 1px solid var(--border2);
                    font-size: 0.72rem; font-weight: 700; color: var(--electric2); margin-bottom: 2rem;
                }
                .v8-badge-live { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: v8pulse 2s ease-in-out infinite; }
                .v8-h1 { font-size: 4.5rem; font-weight: 700; line-height: 1.08; letter-spacing: -0.03em; margin-bottom: 1.75rem; }
                .v8-h1 .blue { color: var(--electric); }
                .v8-hero-sub { font-size: 1.15rem; line-height: 1.7; color: var(--dim); max-width: 600px; margin: 0 auto 2.5rem; }
                .v8-hero-cta { display: flex; justify-content: center; gap: 1rem; margin-bottom: 4rem; }
                .v8-btn-blue {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.9rem 2.25rem; font-size: 0.92rem; font-weight: 700;
                    background: var(--electric); color: white; border-radius: 10px;
                    text-decoration: none; transition: all 0.25s;
                }
                .v8-btn-blue:hover { background: var(--electric2); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(33,150,243,0.3); }
                .v8-btn-out {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.9rem 2.25rem; font-size: 0.92rem; font-weight: 600;
                    color: var(--dim); border: 1px solid var(--border2); border-radius: 10px;
                    text-decoration: none; transition: all 0.2s;
                }
                .v8-btn-out:hover { border-color: var(--electric3); color: var(--white); }

                /* Terminal */
                .v8-terminal {
                    max-width: 750px; margin: 0 auto; border-radius: 14px; overflow: hidden;
                    background: #0C1824; border: 1px solid var(--border2);
                    box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 0 80px rgba(33,150,243,0.05);
                    position: relative;
                }
                .v8-terminal::before {
                    content: ''; position: absolute; top: -100%; left: 0; right: 0; height: 50%;
                    background: linear-gradient(180deg, rgba(33,150,243,0.03), transparent);
                    animation: v8scanline 4s linear infinite;
                }
                .v8-term-bar { padding: 0.8rem 1.25rem; background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
                .v8-dot { width: 10px; height: 10px; border-radius: 50%; }
                .v8-term-title { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; color: var(--muted); margin-left: 1rem; }
                .v8-term-body { padding: 1.5rem; font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; line-height: 2; min-height: 220px; position: relative; z-index: 1; }
                .v8-term-prompt { color: var(--green); }
                .v8-term-cmd { color: var(--white); }
                .v8-term-cursor { display: inline-block; width: 8px; height: 16px; background: var(--electric); animation: v8blink 1s step-end infinite; vertical-align: text-bottom; }
                .v8-term-output { color: var(--dim); margin-top: 0.5rem; }
                .v8-term-output .hi { color: var(--electric2); }
                .v8-term-output .ok { color: var(--green); }
                .v8-term-output .warn { color: var(--amber); }

                /* Wave separator */
                .v8-wave-wrap { position: relative; height: 80px; margin-top: -1px; overflow: hidden; }
                .v8-wave-svg { position: absolute; bottom: 0; width: 200%; height: 80px; animation: v8wave 8s linear infinite; }

                /* Trust bar */
                .v8-trust { border-bottom: 1px solid var(--border); }
                .v8-trust-inner {
                    max-width: 1300px; margin: 0 auto; padding: 2.5rem;
                    display: flex; align-items: center; gap: 2rem; justify-content: center; flex-wrap: wrap;
                }
                .v8-trust-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); }
                .v8-trust-logos { display: flex; gap: 3rem; align-items: center; }
                .v8-trust-logo { font-size: 0.85rem; font-weight: 700; color: var(--dim); display: flex; align-items: center; gap: 0.5rem; opacity: 0.5; }

                /* Features */
                .v8-features { max-width: 1300px; margin: 0 auto; padding: 5rem 2.5rem; }
                .v8-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--electric); margin-bottom: 1rem; }
                .v8-h2 { font-size: 3rem; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 1rem; }
                .v8-h2 .blue { color: var(--electric); }
                .v8-sub { font-size: 1.05rem; color: var(--dim); line-height: 1.65; max-width: 540px; margin-bottom: 3.5rem; }

                .v8-feat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
                .v8-feat-card {
                    padding: 2rem; border-radius: 14px;
                    background: var(--navy2); border: 1px solid var(--border);
                    transition: all 0.3s; position: relative; overflow: hidden;
                }
                .v8-feat-card:hover { border-color: var(--border2); transform: translateY(-3px); box-shadow: 0 8px 32px rgba(33,150,243,0.06); }
                .v8-feat-card::after {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
                    background: linear-gradient(90deg, transparent, var(--electric), transparent);
                    opacity: 0; transition: opacity 0.3s;
                }
                .v8-feat-card:hover::after { opacity: 1; }
                .v8-feat-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--electric-bg); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; }
                .v8-feat-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.6rem; }
                .v8-feat-desc { font-size: 0.85rem; color: var(--dim); line-height: 1.65; }

                /* Process timeline */
                .v8-process { max-width: 1300px; margin: 0 auto; padding: 0 2.5rem 5rem; }
                .v8-timeline { display: flex; gap: 0; margin-top: 3rem; position: relative; }
                .v8-timeline::before {
                    content: ''; position: absolute; top: 24px; left: 24px; right: 24px;
                    height: 2px; background: linear-gradient(90deg, var(--electric), var(--border));
                }
                .v8-tl-step { flex: 1; text-align: center; position: relative; }
                .v8-tl-dot {
                    width: 48px; height: 48px; border-radius: 50%;
                    background: var(--navy2); border: 2px solid var(--electric);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem; font-family: 'IBM Plex Mono', monospace;
                    font-size: 0.85rem; font-weight: 700; color: var(--electric);
                    position: relative; z-index: 1;
                }
                .v8-tl-title { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.4rem; }
                .v8-tl-desc { font-size: 0.78rem; color: var(--dim); line-height: 1.55; max-width: 180px; margin: 0 auto; }

                /* Testimonials */
                .v8-test { border-top: 1px solid var(--border); background: var(--navy2); }
                .v8-test-inner { max-width: 1300px; margin: 0 auto; padding: 5rem 2.5rem; }
                .v8-test-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-top: 3rem; }
                .v8-test-card { padding: 2rem; border-radius: 14px; background: var(--navy); border: 1px solid var(--border); }
                .v8-test-stars { font-size: 0.85rem; color: var(--amber); margin-bottom: 1rem; letter-spacing: 0.1em; }
                .v8-test-quote { font-size: 0.88rem; color: var(--dim); line-height: 1.65; font-style: italic; margin-bottom: 1.25rem; }
                .v8-test-author { display: flex; align-items: center; gap: 0.75rem; }
                .v8-test-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--electric-bg); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: var(--electric); }
                .v8-test-name { font-size: 0.82rem; font-weight: 600; }
                .v8-test-role { font-size: 0.7rem; color: var(--muted); }

                /* CTA */
                .v8-cta { max-width: 1300px; margin: 0 auto; padding: 5rem 2.5rem; }
                .v8-cta-inner {
                    padding: 4.5rem; border-radius: 20px; text-align: center;
                    background: linear-gradient(135deg, var(--navy2), var(--navy3));
                    border: 1px solid var(--border2); position: relative; overflow: hidden;
                }
                .v8-cta-glow { position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(33,150,243,0.1), transparent 60%); }
                .v8-cta-content { position: relative; z-index: 1; }
                .v8-cta-h2 { font-size: 3rem; font-weight: 700; margin-bottom: 1rem; letter-spacing: -0.02em; }
                .v8-cta-sub { font-size: 1.05rem; color: var(--dim); margin-bottom: 2.5rem; line-height: 1.6; }
                .v8-cta-btns { display: flex; justify-content: center; gap: 1rem; }

                /* Footer */
                .v8-footer { border-top: 1px solid var(--border); }
                .v8-footer-inner { max-width: 1300px; margin: 0 auto; padding: 3rem 2.5rem 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 2rem; }
                .v8-footer-brand p { font-size: 0.78rem; color: var(--muted); margin-top: 0.5rem; max-width: 260px; line-height: 1.55; }
                .v8-footer-cols { display: flex; gap: 4rem; }
                .v8-footer-col-title { font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 0.85rem; }
                .v8-footer-col ul { list-style: none; padding: 0; margin: 0; }
                .v8-footer-col li { margin-bottom: 0.5rem; }
                .v8-footer-col a { font-size: 0.78rem; color: var(--dim); text-decoration: none; transition: color 0.2s; }
                .v8-footer-col a:hover { color: var(--white); }
                .v8-footer-bottom { max-width: 1300px; margin: 0 auto; padding: 1.5rem 2.5rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); }

                @media (max-width: 900px) {
                    .v8-h1 { font-size: 2.75rem; }
                    .v8-feat-grid { grid-template-columns: 1fr; }
                    .v8-timeline { flex-direction: column; gap: 2rem; }
                    .v8-timeline::before { display: none; }
                    .v8-test-grid { grid-template-columns: 1fr; }
                    .v8-hero-cta { flex-direction: column; align-items: center; }
                    .v8-trust-logos { gap: 1.5rem; flex-wrap: wrap; }
                }
            `}</style>

            <div className="v8">
                <nav className="v8-nav">
                    <div className="v8-nav-inner">
                        <div className="v8-brand">
                            <Image src="/favicon.png" alt="" width={34} height={34} style={{ objectFit: "contain" }} />
                            <span className="v8-brand-text">CodeGuru<span className="a">AI</span></span>
                        </div>
                        <div className="v8-nav-right">
                            {user ? (
                                <Link href={dashboardHref} className="v8-nav-btn">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v8-nav-link">Sign In</Link>
                                    <Link href="/register" className="v8-nav-btn">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <section className="v8-hero">
                    <div className="v8-hero-glow" />
                    <div className="v8-hero-inner">
                        <div className="v8-hero-badge v8-up"><div className="v8-badge-live" /> Platform Live — v2.0</div>
                        <h1 className="v8-h1 v8-up v8-d1">Coding education<br /><span className="blue">re-engineered.</span></h1>
                        <p className="v8-hero-sub v8-up v8-d2">Socratic AI that guides without revealing. Live execution that tests instantly. Analytics that illuminate every student&apos;s journey. Purpose-built for university CS.</p>
                        <div className="v8-hero-cta v8-up v8-d3">
                            <Link href="/register" className="v8-btn-blue">
                                Get Started Free
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                            <Link href="#features" className="v8-btn-out">Explore Platform</Link>
                        </div>
                        <div className="v8-terminal v8-up v8-d4">
                            <div className="v8-term-bar">
                                <div className="v8-dot" style={{ background: "#FF5F56" }} />
                                <div className="v8-dot" style={{ background: "#FFBD2E" }} />
                                <div className="v8-dot" style={{ background: "#27C93F" }} />
                                <span className="v8-term-title">codeguru — bash — 80×24</span>
                            </div>
                            <div className="v8-term-body">
                                <div><span className="v8-term-cmd">{typed}</span>{typed.length < fullText.length && <span className="v8-term-cursor" />}</div>
                                {typed.length >= fullText.length && (
                                    <div className="v8-term-output">
                                        <br />
                                        <div><span className="hi">→</span> Loading problem: Two Sum</div>
                                        <div><span className="hi">→</span> Language: Python 3.11</div>
                                        <div><span className="hi">→</span> AI Mode: <span className="warn">Socratic questioning</span></div>
                                        <div><span className="ok">✓</span> Environment ready. Start coding.</div>
                                        <br />
                                        <div><span className="warn">Hint:</span> &ldquo;What data structure gives O(1) lookups?&rdquo;</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Wave */}
                <div className="v8-wave-wrap">
                    <svg className="v8-wave-svg" viewBox="0 0 2400 80" preserveAspectRatio="none">
                        <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 C1400,80 1600,0 1800,40 C2000,80 2200,0 2400,40 L2400,80 L0,80 Z" fill="#0A1929" opacity="0.5" />
                        <path d="M0,50 C200,20 400,80 600,50 C800,20 1000,80 1200,50 C1400,20 1600,80 1800,50 C2000,20 2200,80 2400,50 L2400,80 L0,80 Z" fill="#0E2240" opacity="0.8" />
                    </svg>
                </div>

                {/* Trust bar */}
                <section className="v8-trust">
                    <div className="v8-trust-inner">
                        <span className="v8-trust-label">Trusted by educators at</span>
                        <div className="v8-trust-logos">
                            <span className="v8-trust-logo">🎓 Stanford CS</span>
                            <span className="v8-trust-logo">🎓 MIT EECS</span>
                            <span className="v8-trust-logo">🎓 UC Berkeley</span>
                            <span className="v8-trust-logo">🎓 Georgia Tech</span>
                            <span className="v8-trust-logo">🎓 Carnegie Mellon</span>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="v8-features" id="features">
                    <div className="v8-label">{"// features"}</div>
                    <h2 className="v8-h2">Purpose-built for <span className="blue">CS education.</span></h2>
                    <p className="v8-sub">Every feature is designed around one goal: making students think deeper, not just code faster.</p>
                    <div className="v8-feat-grid">
                        <div className="v8-feat-card"><div className="v8-feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3 className="v8-feat-title">Socratic AI Hints</h3><p className="v8-feat-desc">The AI identifies the specific misconception and asks a targeted question. It never reveals the answer — it reveals the thinking that leads to it.</p></div>
                        <div className="v8-feat-card"><div className="v8-feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div><h3 className="v8-feat-title">Live Code Execution</h3><p className="v8-feat-desc">Full-powered in-browser editor. Syntax highlighting, test case validation, side-by-side output comparison. Python, JS, C++, Java.</p></div>
                        <div className="v8-feat-card"><div className="v8-feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div><h3 className="v8-feat-title">Classroom Analytics</h3><p className="v8-feat-desc">Track submissions, completion rates, time-to-solve, and hint dependency patterns across your entire classroom in real time.</p></div>
                        <div className="v8-feat-card"><div className="v8-feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div><h3 className="v8-feat-title">AI Problem Generation</h3><p className="v8-feat-desc">Generate unique coding challenges in minutes. Set difficulty, topic, and constraints — the AI creates complete problems with test cases.</p></div>
                    </div>
                </section>

                {/* Process */}
                <section className="v8-process">
                    <div className="v8-label">{"// workflow"}</div>
                    <h2 className="v8-h2">How it <span className="blue">works.</span></h2>
                    <div className="v8-timeline">
                        <div className="v8-tl-step"><div className="v8-tl-dot">01</div><h3 className="v8-tl-title">Create Classroom</h3><p className="v8-tl-desc">Set up your course with sections, students, and deadlines.</p></div>
                        <div className="v8-tl-step"><div className="v8-tl-dot">02</div><h3 className="v8-tl-title">Assign Problems</h3><p className="v8-tl-desc">Pick from curated sets or generate custom challenges with AI.</p></div>
                        <div className="v8-tl-step"><div className="v8-tl-dot">03</div><h3 className="v8-tl-title">Students Solve</h3><p className="v8-tl-desc">Students code in-browser with Socratic AI guidance when stuck.</p></div>
                        <div className="v8-tl-step"><div className="v8-tl-dot">04</div><h3 className="v8-tl-title">Track Progress</h3><p className="v8-tl-desc">See analytics on every submission, struggle point, and breakthrough.</p></div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="v8-test">
                    <div className="v8-test-inner">
                        <div className="v8-label">{"// testimonials"}</div>
                        <h2 className="v8-h2">What educators <span className="blue">say.</span></h2>
                        <div className="v8-test-grid">
                            <div className="v8-test-card">
                                <div className="v8-test-stars">★★★★★</div>
                                <p className="v8-test-quote">&ldquo;The Socratic hint system is a game-changer. Students are actually learning to debug on their own instead of copying from Stack Overflow.&rdquo;</p>
                                <div className="v8-test-author"><div className="v8-test-avatar">DR</div><div><div className="v8-test-name">Dr. Ramirez</div><div className="v8-test-role">Prof. CS 201, Stanford</div></div></div>
                            </div>
                            <div className="v8-test-card">
                                <div className="v8-test-stars">★★★★★</div>
                                <p className="v8-test-quote">&ldquo;I can finally see which students need help before they fall behind. The analytics dashboard pays for itself.&rdquo;</p>
                                <div className="v8-test-author"><div className="v8-test-avatar">PK</div><div><div className="v8-test-name">Prof. Kapoor</div><div className="v8-test-role">Head of CS, IIT Delhi</div></div></div>
                            </div>
                            <div className="v8-test-card">
                                <div className="v8-test-stars">★★★★★</div>
                                <p className="v8-test-quote">&ldquo;As a student, the hints make me feel like I have a tutor available 24/7. I actually understand the concepts now.&rdquo;</p>
                                <div className="v8-test-author"><div className="v8-test-avatar">AJ</div><div><div className="v8-test-name">Aisha Johnson</div><div className="v8-test-role">CS Major, UC Berkeley</div></div></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="v8-cta">
                    <div className="v8-cta-inner">
                        <div className="v8-cta-glow" />
                        <div className="v8-cta-content">
                            <h2 className="v8-cta-h2">Ready to deploy smarter CS education?</h2>
                            <p className="v8-cta-sub">Free for students. Powerful for instructors. Join the movement.</p>
                            <div className="v8-cta-btns">
                                <Link href="/register" className="v8-btn-blue">Create Free Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></Link>
                                <Link href="/login" className="v8-btn-out">Sign In</Link>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="v8-footer">
                    <div className="v8-footer-inner">
                        <div className="v8-footer-brand"><div className="v8-brand"><Image src="/favicon.png" alt="" width={28} height={28} style={{ objectFit: "contain" }} /><span className="v8-brand-text" style={{ fontSize: "1rem" }}>CodeGuru<span className="a">AI</span></span></div><p>AI-powered coding education for university classrooms.</p></div>
                        <div className="v8-footer-cols">
                            <div className="v8-footer-col"><div className="v8-footer-col-title">Platform</div><ul><li><Link href="/register">Get Started</Link></li><li><Link href="/login">Sign In</Link></li><li><Link href="/register?role=instructor">For Instructors</Link></li></ul></div>
                            <div className="v8-footer-col"><div className="v8-footer-col-title">Legal</div><ul><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Use</a></li><li><a href="#">Contact</a></li></ul></div>
                        </div>
                    </div>
                    <div className="v8-footer-bottom"><span>&copy; 2026 CodeGuruAI. All rights reserved.</span><span>Built for learners who want to actually understand code.</span></div>
                </footer>
            </div>
        </>
    )
}
