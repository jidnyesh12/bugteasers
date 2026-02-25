"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect } from "react"

/* ================================================================
   V10 — Aurora Noir
   Deep dark with aurora-style gradients, 3D perspective hover cards,
   animated border-gradient cards, horizontal scroll proof bar,
   split feature showcase with live demo mockup, particles effect,
   interactive code comparison, rich multi-layer visual density.
   Fonts: Satoshi (Geist fallback) + General Sans
   ================================================================ */

export default function LandingV10() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [activeDemo, setActiveDemo] = useState<"before" | "after">("after")

    // Animated counters
    const [students, setStudents] = useState(0)
    const [completion, setCompletion] = useState(0)

    useEffect(() => {
        const dur = 2200; const steps = 70; const interval = dur / steps
        let step = 0
        const t = setInterval(() => {
            step++
            const p = step / steps
            const e = 1 - Math.pow(1 - p, 3)
            setStudents(Math.round(e * 15000))
            setCompletion(Math.round(e * 94))
            if (step >= steps) clearInterval(t)
        }, interval)
        return () => clearInterval(t)
    }, [])

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap');

                .v10 {
                    --bg: #030712;
                    --bg2: #0A0F1E;
                    --bg3: #111827;
                    --surface: rgba(255,255,255,0.03);
                    --surface2: rgba(255,255,255,0.06);
                    --white: #F9FAFB;
                    --dim: #9CA3AF;
                    --muted: #6B7280;
                    --emerald: #10B981;
                    --emerald2: #34D399;
                    --blue: #3B82F6;
                    --indigo: #6366F1;
                    --purple: #A855F7;
                    --pink: #EC4899;
                    --amber: #F59E0B;
                    --border: rgba(255,255,255,0.06);
                    --border2: rgba(255,255,255,0.1);
                    font-family: 'Geist', sans-serif;
                    background: var(--bg);
                    color: var(--white);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                @keyframes v10aurora { 0% { transform: rotate(0deg) scale(1); } 33% { transform: rotate(120deg) scale(1.1); } 66% { transform: rotate(240deg) scale(0.9); } 100% { transform: rotate(360deg) scale(1); } }
                @keyframes v10fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes v10float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
                @keyframes v10gradFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes v10spin { to { transform: rotate(360deg); } }
                @keyframes v10pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
                @keyframes v10glow { 0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0); } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.15); } }

                .v10-up { animation: v10fadeUp 0.6s ease-out both; }
                .v10-d1 { animation-delay: 0.1s; } .v10-d2 { animation-delay: 0.2s; } .v10-d3 { animation-delay: 0.3s; } .v10-d4 { animation-delay: 0.4s; } .v10-d5 { animation-delay: 0.5s; }

                /* Nav */
                .v10-nav { position: sticky; top: 0; z-index: 100; background: rgba(3,7,18,0.8); backdrop-filter: blur(24px) saturate(1.5); border-bottom: 1px solid var(--border); }
                .v10-nav-inner { max-width: 1300px; margin: 0 auto; padding: 0 2.5rem; height: 4rem; display: flex; align-items: center; justify-content: space-between; }
                .v10-brand { display: flex; align-items: center; gap: 0.7rem; }
                .v10-brand-text { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.02em; }
                .v10-brand-text .a { background: linear-gradient(135deg, var(--emerald), var(--blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .v10-nav-right { display: flex; align-items: center; gap: 0.5rem; }
                .v10-nav-link { padding: 0.4rem 0.9rem; font-size: 0.82rem; font-weight: 500; color: var(--muted); text-decoration: none; transition: color 0.2s; }
                .v10-nav-link:hover { color: var(--white); }
                .v10-nav-btn { padding: 0.5rem 1.4rem; font-size: 0.82rem; font-weight: 700; background: var(--emerald); color: white; border-radius: 8px; text-decoration: none; transition: all 0.2s; }
                .v10-nav-btn:hover { background: var(--emerald2); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(16,185,129,0.25); }

                /* Hero */
                .v10-hero { position: relative; padding: 7rem 0 4rem; overflow: hidden; }
                .v10-aurora-wrap { position: absolute; top: -50%; left: -25%; width: 150%; height: 200%; z-index: 0; }
                .v10-aurora { position: absolute; filter: blur(120px); opacity: 0.08; animation: v10aurora 30s linear infinite; }
                .v10-aurora.a1 { top: 10%; left: 20%; width: 600px; height: 400px; background: linear-gradient(45deg, var(--emerald), var(--blue)); }
                .v10-aurora.a2 { top: 30%; right: 10%; width: 500px; height: 500px; background: linear-gradient(135deg, var(--indigo), var(--purple)); animation-delay: -10s; }
                .v10-aurora.a3 { bottom: 10%; left: 40%; width: 400px; height: 300px; background: linear-gradient(225deg, var(--pink), var(--amber)); animation-delay: -20s; }

                .v10-hero-grid {
                    position: absolute; inset: 0; z-index: 0;
                    background-image:
                        linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px);
                    background-size: 64px 64px;
                    mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
                    -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
                }

                .v10-hero-inner { position: relative; z-index: 1; max-width: 1300px; margin: 0 auto; padding: 0 2.5rem; text-align: center; }
                .v10-hero-badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.35rem 1.1rem; border-radius: 100px;
                    background: var(--surface2); border: 1px solid var(--border2);
                    font-size: 0.72rem; font-weight: 700; color: var(--emerald2); margin-bottom: 2.5rem;
                }
                .v10-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--emerald); animation: v10pulse 2s ease-in-out infinite; }

                .v10-h1 {
                    font-size: 5.5rem; font-weight: 900; line-height: 1.02;
                    letter-spacing: -0.04em; margin-bottom: 2rem;
                    max-width: 900px; margin-left: auto; margin-right: auto;
                }
                .v10-h1 .grad {
                    background: linear-gradient(135deg, var(--emerald2), var(--blue), var(--indigo), var(--purple));
                    background-size: 300% 300%; animation: v10gradFlow 5s ease infinite;
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .v10-hero-p { font-size: 1.2rem; line-height: 1.7; color: var(--dim); max-width: 600px; margin: 0 auto 3rem; }
                .v10-hero-cta { display: flex; justify-content: center; gap: 0.85rem; margin-bottom: 5rem; }
                .v10-btn-glow {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.95rem 2.5rem; font-size: 0.95rem; font-weight: 700;
                    background: var(--emerald); color: white; border-radius: 10px;
                    text-decoration: none; transition: all 0.25s;
                    animation: v10glow 3s ease-in-out infinite;
                }
                .v10-btn-glow:hover { background: var(--emerald2); transform: translateY(-2px); box-shadow: 0 8px 40px rgba(16,185,129,0.3); }
                .v10-btn-dark { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.95rem 2.5rem; font-size: 0.95rem; font-weight: 600; color: var(--dim); background: var(--surface2); border: 1px solid var(--border2); border-radius: 10px; text-decoration: none; transition: all 0.2s; }
                .v10-btn-dark:hover { border-color: var(--dim); color: var(--white); }

                /* Hero code comparison */
                .v10-demo { max-width: 850px; margin: 0 auto; }
                .v10-demo-tabs { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1rem; }
                .v10-demo-tab {
                    padding: 0.5rem 1.25rem; font-size: 0.8rem; font-weight: 600;
                    border-radius: 8px; cursor: pointer; transition: all 0.2s;
                    border: 1px solid var(--border); background: transparent; color: var(--dim);
                }
                .v10-demo-tab.active { background: var(--emerald); border-color: var(--emerald); color: white; }
                .v10-demo-card {
                    border-radius: 16px; overflow: hidden;
                    background: var(--bg2); border: 1px solid var(--border2);
                    box-shadow: 0 32px 80px rgba(0,0,0,0.4);
                }
                .v10-demo-bar { padding: 0.8rem 1.25rem; background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
                .v10-dot { width: 10px; height: 10px; border-radius: 50%; }
                .v10-demo-tabs-inner { display: flex; gap: 0; margin-left: 1rem; }
                .v10-demo-file { padding: 0.3rem 0.75rem; font-size: 0.68rem; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; }
                .v10-demo-file.active { color: var(--emerald2); border-color: var(--emerald); background: var(--surface); }
                .v10-demo-body {
                    padding: 1.5rem; font-family: 'JetBrains Mono', 'Geist Mono', monospace;
                    font-size: 0.78rem; line-height: 2; min-height: 200px;
                }
                .v10-ln { color: var(--muted); margin-right: 1.5rem; user-select: none; min-width: 1.5rem; display: inline-block; text-align: right; }
                .v10-kw { color: var(--indigo); }
                .v10-fn { color: var(--emerald2); }
                .v10-str { color: var(--amber); }
                .v10-cm { color: #374151; }
                .v10-hl { background: rgba(16,185,129,0.08); display: block; margin: 0 -1.5rem; padding: 0 1.5rem; border-left: 3px solid var(--emerald); }
                .v10-demo-status {
                    padding: 0.7rem 1.25rem; border-top: 1px solid var(--border);
                    background: rgba(0,0,0,0.2); display: flex; align-items: center;
                    justify-content: space-between;
                }
                .v10-status-pass { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--emerald2); }
                .v10-status-hint { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--amber); font-style: italic; }

                /* Floating elements */
                .v10-float-1 {
                    position: absolute; top: 15%; left: 5%; z-index: 2;
                    padding: 0.7rem 1rem; border-radius: 10px;
                    background: var(--bg2); border: 1px solid var(--border2);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                    animation: v10float 4s ease-in-out infinite;
                    font-size: 0.75rem; font-weight: 600;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .v10-float-2 {
                    position: absolute; top: 25%; right: 5%; z-index: 2;
                    padding: 0.7rem 1rem; border-radius: 10px;
                    background: var(--bg2); border: 1px solid var(--border2);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                    animation: v10float 3.5s ease-in-out infinite; animation-delay: 1s;
                    font-size: 0.75rem; font-weight: 600;
                    display: flex; align-items: center; gap: 0.5rem;
                }

                /* Stats ribbon */
                .v10-ribbon {
                    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
                    background: var(--surface);
                }
                .v10-ribbon-inner {
                    max-width: 1300px; margin: 0 auto; padding: 2.5rem;
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem;
                }
                .v10-ribbon-stat { text-align: center; }
                .v10-ribbon-val { font-size: 2.5rem; font-weight: 900; letter-spacing: -0.03em; background: linear-gradient(135deg, var(--emerald2), var(--blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .v10-ribbon-label { font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem; font-weight: 500; }

                /* Features — 3D perspective hover */
                .v10-features { max-width: 1300px; margin: 0 auto; padding: 5rem 2.5rem; }
                .v10-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; color: var(--emerald2); margin-bottom: 1rem; }
                .v10-h2 { font-size: 3.25rem; font-weight: 900; line-height: 1.12; letter-spacing: -0.03em; margin-bottom: 1rem; }
                .v10-h2 .grad { background: linear-gradient(135deg, var(--emerald2), var(--blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .v10-sub { font-size: 1.05rem; color: var(--dim); line-height: 1.65; max-width: 560px; margin-bottom: 3.5rem; }

                .v10-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
                .v10-feat-card {
                    padding: 2.25rem; border-radius: 16px;
                    background: var(--surface); border: 1px solid var(--border2);
                    transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
                    position: relative; overflow: hidden;
                }
                .v10-feat-card:hover {
                    transform: perspective(800px) rotateY(-3deg) rotateX(2deg) translateY(-4px);
                    border-color: rgba(16,185,129,0.3);
                    box-shadow: 0 16px 48px rgba(16,185,129,0.08), 0 0 0 1px rgba(16,185,129,0.1);
                }
                .v10-feat-card::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, var(--emerald), var(--blue), var(--purple));
                    background-size: 200% 100%; animation: v10gradFlow 3s ease infinite;
                    opacity: 0; transition: opacity 0.3s;
                }
                .v10-feat-card:hover::before { opacity: 1; }
                .v10-feat-icon {
                    width: 48px; height: 48px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 1.25rem; position: relative;
                    background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1));
                }
                .v10-feat-title { font-size: 1.1rem; font-weight: 800; margin-bottom: 0.65rem; letter-spacing: -0.01em; }
                .v10-feat-desc { font-size: 0.85rem; color: var(--dim); line-height: 1.65; }
                .v10-feat-tag { margin-top: 1rem; padding: 0.3rem 0.75rem; border-radius: 6px; background: var(--surface2); font-size: 0.68rem; font-weight: 700; color: var(--emerald2); display: inline-block; }

                /* Split section */
                .v10-split { max-width: 1300px; margin: 0 auto; padding: 0 2.5rem 5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
                .v10-split-h2 { font-size: 2.75rem; font-weight: 900; line-height: 1.12; letter-spacing: -0.02em; margin-bottom: 1.25rem; }
                .v10-split-h2 .dim { color: var(--muted); }
                .v10-split-p { font-size: 1rem; color: var(--dim); line-height: 1.7; margin-bottom: 2rem; }
                .v10-split-list { display: flex; flex-direction: column; gap: 1rem; }
                .v10-split-item { display: flex; gap: 1rem; align-items: flex-start; }
                .v10-split-item-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .v10-split-item-text h4 { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.2rem; }
                .v10-split-item-text p { font-size: 0.82rem; color: var(--dim); line-height: 1.55; }

                /* Animated border card */
                .v10-magic-border {
                    position: relative; border-radius: 16px; padding: 2px;
                    background: conic-gradient(from 0deg, var(--emerald), var(--blue), var(--indigo), var(--purple), var(--pink), var(--emerald));
                    animation: v10spin 6s linear infinite;
                    background-size: 100%;
                }
                .v10-magic-border-inner {
                    background: var(--bg2); border-radius: 14px; padding: 2rem;
                }
                .v10-magic-heading { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: var(--emerald2); margin-bottom: 0.75rem; }
                .v10-magic-quote { font-size: 1.1rem; font-weight: 600; line-height: 1.5; font-style: italic; color: var(--dim); }

                /* CTA */
                .v10-cta { max-width: 1300px; margin: 0 auto; padding: 0 2.5rem 5rem; }
                .v10-cta-inner {
                    padding: 5rem; border-radius: 24px; text-align: center;
                    background: var(--bg2); border: 1px solid var(--border2);
                    position: relative; overflow: hidden;
                }
                .v10-cta-aurora {
                    position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse at 30% 30%, rgba(16,185,129,0.06), transparent 50%),
                        radial-gradient(ellipse at 70% 70%, rgba(99,102,241,0.06), transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.04), transparent 50%);
                }
                .v10-cta-content { position: relative; z-index: 1; }
                .v10-cta-h2 { font-size: 3.5rem; font-weight: 900; margin-bottom: 1rem; letter-spacing: -0.03em; }
                .v10-cta-sub { font-size: 1.1rem; color: var(--dim); margin-bottom: 2.5rem; line-height: 1.6; max-width: 520px; margin-left: auto; margin-right: auto; }
                .v10-cta-btns { display: flex; justify-content: center; gap: 0.85rem; }

                /* Footer */
                .v10-footer { border-top: 1px solid var(--border); }
                .v10-footer-inner { max-width: 1300px; margin: 0 auto; padding: 3rem 2.5rem 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 2rem; }
                .v10-footer-brand p { font-size: 0.78rem; color: var(--muted); margin-top: 0.5rem; max-width: 260px; line-height: 1.55; }
                .v10-footer-cols { display: flex; gap: 4rem; }
                .v10-footer-col-title { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 0.85rem; }
                .v10-footer-col ul { list-style: none; padding: 0; margin: 0; }
                .v10-footer-col li { margin-bottom: 0.5rem; }
                .v10-footer-col a { font-size: 0.78rem; color: var(--dim); text-decoration: none; transition: color 0.2s; }
                .v10-footer-col a:hover { color: var(--white); }
                .v10-footer-bottom { max-width: 1300px; margin: 0 auto; padding: 1.5rem 2.5rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); }

                @media (max-width: 900px) {
                    .v10-h1 { font-size: 3rem; }
                    .v10-feat-grid { grid-template-columns: 1fr; }
                    .v10-split { grid-template-columns: 1fr; gap: 2.5rem; }
                    .v10-ribbon-inner { grid-template-columns: repeat(2, 1fr); }
                    .v10-hero-cta { flex-direction: column; align-items: center; }
                    .v10-float-1, .v10-float-2 { display: none; }
                }
            `}</style>

            <div className="v10">
                <nav className="v10-nav">
                    <div className="v10-nav-inner">
                        <div className="v10-brand">
                            <Image src="/favicon.png" alt="" width={34} height={34} style={{ objectFit: "contain" }} />
                            <span className="v10-brand-text">CodeGuru<span className="a">AI</span></span>
                        </div>
                        <div className="v10-nav-right">
                            {user ? (
                                <Link href={dashboardHref} className="v10-nav-btn">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v10-nav-link">Sign In</Link>
                                    <Link href="/register" className="v10-nav-btn">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="v10-hero">
                    <div className="v10-aurora-wrap">
                        <div className="v10-aurora a1" />
                        <div className="v10-aurora a2" />
                        <div className="v10-aurora a3" />
                    </div>
                    <div className="v10-hero-grid" />

                    <div className="v10-float-1">📈 <span style={{ color: "#34D399" }}>94%</span> completion rate</div>
                    <div className="v10-float-2">🧠 <span style={{ color: "#F59E0B" }}>Socratic mode</span> active</div>

                    <div className="v10-hero-inner">
                        <div className="v10-hero-badge v10-up"><div className="v10-badge-dot" /> AI-Powered CS Education</div>
                        <h1 className="v10-h1 v10-up v10-d1">The tutor that teaches through <span className="grad">questions.</span></h1>
                        <p className="v10-hero-p v10-up v10-d2">Socratic AI guidance, in-browser code execution, and real-time classroom analytics. Purpose-built for university CS education.</p>
                        <div className="v10-hero-cta v10-up v10-d3">
                            <Link href="/register" className="v10-btn-glow">
                                Start Learning Free
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                            <Link href="#features" className="v10-btn-dark">See Features</Link>
                        </div>

                        {/* Code Demo Toggle */}
                        <div className="v10-demo v10-up v10-d4">
                            <div className="v10-demo-tabs">
                                <button className={`v10-demo-tab ${activeDemo === "before" ? "active" : ""}`} onClick={() => setActiveDemo("before")}>❌ Without AI Help</button>
                                <button className={`v10-demo-tab ${activeDemo === "after" ? "active" : ""}`} onClick={() => setActiveDemo("after")}>✅ With CodeGuruAI</button>
                            </div>
                            <div className="v10-demo-card">
                                <div className="v10-demo-bar">
                                    <div className="v10-dot" style={{ background: "#FF5F56" }} />
                                    <div className="v10-dot" style={{ background: "#FFBD2E" }} />
                                    <div className="v10-dot" style={{ background: "#27C93F" }} />
                                    <div className="v10-demo-tabs-inner">
                                        <div className="v10-demo-file active">solution.py</div>
                                        <div className="v10-demo-file">tests.py</div>
                                    </div>
                                </div>
                                <div className="v10-demo-body">
                                    {activeDemo === "before" ? (
                                        <>
                                            <div><span className="v10-ln">1</span><span className="v10-kw">def</span> <span className="v10-fn">two_sum</span>(nums, target):</div>
                                            <div><span className="v10-ln">2</span><span className="v10-cm">    # Brute force — O(n²)</span></div>
                                            <div><span className="v10-ln">3</span><span className="v10-kw">    for</span> i <span className="v10-kw">in</span> <span className="v10-fn">range</span>(<span className="v10-fn">len</span>(nums)):</div>
                                            <div><span className="v10-ln">4</span><span className="v10-kw">        for</span> j <span className="v10-kw">in</span> <span className="v10-fn">range</span>(i+1, <span className="v10-fn">len</span>(nums)):</div>
                                            <div><span className="v10-ln">5</span>            <span className="v10-kw">if</span> nums[i] + nums[j] == target:</div>
                                            <div><span className="v10-ln">6</span>                <span className="v10-kw">return</span> <span className="v10-str">[i, j]</span></div>
                                            <div><span className="v10-ln">7</span></div>
                                            <div><span className="v10-ln">8</span><span className="v10-cm">    # Student is stuck — no idea how to optimize</span></div>
                                        </>
                                    ) : (
                                        <>
                                            <div><span className="v10-ln">1</span><span className="v10-kw">def</span> <span className="v10-fn">two_sum</span>(nums, target):</div>
                                            <div><span className="v10-ln">2</span><span className="v10-cm">    # Optimized after AI guidance — O(n)</span></div>
                                            <div className="v10-hl"><span className="v10-ln">3</span>    seen = {'{}'}</div>
                                            <div><span className="v10-ln">4</span><span className="v10-kw">    for</span> i, n <span className="v10-kw">in</span> <span className="v10-fn">enumerate</span>(nums):</div>
                                            <div><span className="v10-ln">5</span>        diff = target - n</div>
                                            <div className="v10-hl"><span className="v10-ln">6</span><span className="v10-kw">        if</span> diff <span className="v10-kw">in</span> seen:</div>
                                            <div className="v10-hl"><span className="v10-ln">7</span>            <span className="v10-kw">return</span> <span className="v10-str">[seen[diff], i]</span></div>
                                            <div className="v10-hl"><span className="v10-ln">8</span>        seen[n] = i</div>
                                        </>
                                    )}
                                </div>
                                <div className="v10-demo-status">
                                    {activeDemo === "after" ? (
                                        <div className="v10-status-pass">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                            All 5 test cases passed — O(n) time
                                        </div>
                                    ) : (
                                        <div className="v10-status-hint">⚠️ Time Limit Exceeded on test case 4</div>
                                    )}
                                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Python 3.11</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="v10-ribbon">
                    <div className="v10-ribbon-inner">
                        <div className="v10-ribbon-stat"><div className="v10-ribbon-val">{students.toLocaleString()}+</div><div className="v10-ribbon-label">Students Learning</div></div>
                        <div className="v10-ribbon-stat"><div className="v10-ribbon-val">{completion}%</div><div className="v10-ribbon-label">Completion Rate</div></div>
                        <div className="v10-ribbon-stat"><div className="v10-ribbon-val">250+</div><div className="v10-ribbon-label">Universities</div></div>
                        <div className="v10-ribbon-stat"><div className="v10-ribbon-val">4.9★</div><div className="v10-ribbon-label">Student Rating</div></div>
                    </div>
                </section>

                {/* Features */}
                <section className="v10-features" id="features">
                    <div className="v10-label">Platform Capabilities</div>
                    <h2 className="v10-h2">Built to make students <span className="grad">think deeper.</span></h2>
                    <p className="v10-sub">Every feature exists to deepen understanding — from AI hints that ask the right question to analytics that reveal where students struggle.</p>
                    <div className="v10-feat-grid">
                        <div className="v10-feat-card"><div className="v10-feat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3 className="v10-feat-title">Socratic AI Hints</h3><p className="v10-feat-desc">Never reveals the answer. Asks precise questions that expose the gap in understanding and force genuine reasoning.</p><span className="v10-feat-tag">Core Feature</span></div>
                        <div className="v10-feat-card"><div className="v10-feat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div><h3 className="v10-feat-title">Live Code Execution</h3><p className="v10-feat-desc">Write and run in-browser. Instant test case feedback, side-by-side comparison. Python, JS, C++, Java.</p><span className="v10-feat-tag">Zero Setup</span></div>
                        <div className="v10-feat-card"><div className="v10-feat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div><h3 className="v10-feat-title">Classroom Analytics</h3><p className="v10-feat-desc">Real-time dashboards showing submissions, completion rates, time-to-solve, and hint dependency patterns.</p><span className="v10-feat-tag">Real-Time</span></div>
                        <div className="v10-feat-card"><div className="v10-feat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div><h3 className="v10-feat-title">AI Problem Generation</h3><p className="v10-feat-desc">Generate unique challenges in minutes. Set topic, difficulty, constraints — AI creates complete problems with test cases.</p><span className="v10-feat-tag">AI Powered</span></div>
                        <div className="v10-feat-card"><div className="v10-feat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><h3 className="v10-feat-title">Classroom Management</h3><p className="v10-feat-desc">Create classrooms, assign sets, track submissions, manage students. Built for how university CS courses actually work.</p><span className="v10-feat-tag">Full Suite</span></div>
                        <div className="v10-feat-card"><div className="v10-feat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h3 className="v10-feat-title">Academic Integrity</h3><p className="v10-feat-desc">AI-generated unique problems mean no answer pools. Every student proves their own understanding.</p><span className="v10-feat-tag">Built In</span></div>
                    </div>
                </section>

                {/* Philosophy split */}
                <section className="v10-split">
                    <div>
                        <div className="v10-label">Our Philosophy</div>
                        <h2 className="v10-split-h2">We don&apos;t give you the answer. <span className="dim">We give you the question that leads to it.</span></h2>
                        <p className="v10-split-p">CodeGuruAI is built on a simple principle: the struggle is where learning happens. Every feature protects that productive struggle while ensuring students are never truly stuck.</p>
                        <div className="v10-split-list">
                            <div className="v10-split-item">
                                <div className="v10-split-item-icon" style={{ background: "rgba(16,185,129,0.1)" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                                <div className="v10-split-item-text"><h4>For Students</h4><p>Intelligent guidance that builds genuine problem-solving skills — not answer dependency.</p></div>
                            </div>
                            <div className="v10-split-item">
                                <div className="v10-split-item-icon" style={{ background: "rgba(99,102,241,0.1)" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
                                <div className="v10-split-item-text"><h4>For Instructors</h4><p>Create problem sets, assign to classrooms, and see exactly where students need help — in real time.</p></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="v10-magic-border">
                            <div className="v10-magic-border-inner">
                                <div className="v10-magic-heading">The Socratic Method</div>
                                <p className="v10-magic-quote">&ldquo;Education is the kindling of a flame, not the filling of a vessel.&rdquo;</p>
                                <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.75rem" }}>— Attributed to Socrates</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="v10-cta">
                    <div className="v10-cta-inner">
                        <div className="v10-cta-aurora" />
                        <div className="v10-cta-content">
                            <h2 className="v10-cta-h2">Start learning the right way.</h2>
                            <p className="v10-cta-sub">Join CodeGuruAI — free for students, powerful for instructors.</p>
                            <div className="v10-cta-btns">
                                <Link href="/register" className="v10-btn-glow">Create Free Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></Link>
                                <Link href="/login" className="v10-btn-dark">Sign In</Link>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="v10-footer">
                    <div className="v10-footer-inner">
                        <div className="v10-footer-brand"><div className="v10-brand"><Image src="/favicon.png" alt="" width={28} height={28} style={{ objectFit: "contain" }} /><span className="v10-brand-text" style={{ fontSize: "1rem" }}>CodeGuru<span className="a">AI</span></span></div><p>AI-powered coding education for university classrooms.</p></div>
                        <div className="v10-footer-cols">
                            <div className="v10-footer-col"><div className="v10-footer-col-title">Platform</div><ul><li><Link href="/register">Get Started</Link></li><li><Link href="/login">Sign In</Link></li><li><Link href="/register?role=instructor">For Instructors</Link></li></ul></div>
                            <div className="v10-footer-col"><div className="v10-footer-col-title">Legal</div><ul><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Use</a></li><li><a href="#">Contact</a></li></ul></div>
                        </div>
                    </div>
                    <div className="v10-footer-bottom"><span>&copy; 2026 CodeGuruAI. All rights reserved.</span><span>Built for learners who want to actually understand code.</span></div>
                </footer>
            </div>
        </>
    )
}
