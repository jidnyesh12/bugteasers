"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect } from "react"

/* ================================================================
   V6 — Immersive Gradient Depths
   Rich layered design with gradient mesh BGs, floating UI mockups,
   animated stats bar, staggered reveals, glassmorphism cards,
   multi-section narrative with visual density matching the original.
   Fonts: Sora + Crimson Pro
   ================================================================ */

export default function LandingV6() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    const [count1, setCount1] = useState(0)
    const [count2, setCount2] = useState(0)
    const [count3, setCount3] = useState(0)

    useEffect(() => {
        const duration = 2000
        const steps = 60
        const interval = duration / steps
        let step = 0
        const timer = setInterval(() => {
            step++
            const progress = step / steps
            const ease = 1 - Math.pow(1 - progress, 3)
            setCount1(Math.round(ease * 15000))
            setCount2(Math.round(ease * 94))
            setCount3(Math.round(ease * 250))
            if (step >= steps) clearInterval(timer)
        }, interval)
        return () => clearInterval(timer)
    }, [])

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');

                .v6 {
                    --bg: #050A18;
                    --bg2: #0A1128;
                    --bg3: #0F1A38;
                    --surface: rgba(255,255,255,0.04);
                    --surface2: rgba(255,255,255,0.07);
                    --white: #F0F0F5;
                    --dim: #8B8FA8;
                    --muted: #5A5E78;
                    --blue: #4F7DF5;
                    --blue2: #6C9AFF;
                    --purple: #8B5CF6;
                    --cyan: #22D3EE;
                    --gold: #F5C842;
                    --border: rgba(255,255,255,0.06);
                    --border2: rgba(255,255,255,0.1);
                    font-family: 'Sora', sans-serif;
                    background: var(--bg);
                    color: var(--white);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                /* Animations */
                @keyframes v6float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                @keyframes v6float2 { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(2deg); } }
                @keyframes v6glow { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
                @keyframes v6slideUp { from { opacity:0; transform: translateY(30px); } to { opacity:1; transform: translateY(0); } }
                @keyframes v6slideRight { from { opacity:0; transform: translateX(-30px); } to { opacity:1; transform: translateX(0); } }
                @keyframes v6pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(79,125,245,0.3); } 50% { box-shadow: 0 0 0 12px rgba(79,125,245,0); } }
                @keyframes v6spin { to { transform: rotate(360deg); } }
                @keyframes v6gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

                .v6-animate-up { animation: v6slideUp 0.6s ease-out both; }
                .v6-d1 { animation-delay: 0.1s; }
                .v6-d2 { animation-delay: 0.2s; }
                .v6-d3 { animation-delay: 0.3s; }
                .v6-d4 { animation-delay: 0.4s; }
                .v6-d5 { animation-delay: 0.5s; }

                /* Nav */
                .v6-nav {
                    position: sticky; top: 0; z-index: 50;
                    background: rgba(5,10,24,0.8);
                    backdrop-filter: blur(20px) saturate(1.5);
                    border-bottom: 1px solid var(--border);
                }
                .v6-nav-inner {
                    max-width: 1300px; margin: 0 auto; padding: 0 2.5rem;
                    height: 4rem; display: flex; align-items: center; justify-content: space-between;
                }
                .v6-brand { display: flex; align-items: center; gap: 0.7rem; }
                .v6-brand-text { font-size: 1.2rem; font-weight: 800; letter-spacing: -0.02em; }
                .v6-brand-text .a { background: linear-gradient(135deg, var(--blue), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .v6-nav-links { display: flex; align-items: center; gap: 0.5rem; }
                .v6-nav-link { padding: 0.4rem 0.9rem; font-size: 0.82rem; font-weight: 500; color: var(--dim); text-decoration: none; transition: color 0.2s; }
                .v6-nav-link:hover { color: var(--white); }
                .v6-nav-btn {
                    padding: 0.5rem 1.5rem; font-size: 0.82rem; font-weight: 700;
                    background: linear-gradient(135deg, var(--blue), var(--purple));
                    color: white; border-radius: 8px; text-decoration: none;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .v6-nav-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(79,125,245,0.3); }

                /* Hero */
                .v6-hero {
                    position: relative; overflow: hidden;
                    padding: 6rem 0 5rem;
                }
                .v6-hero-mesh {
                    position: absolute; inset: 0; z-index: 0;
                    background:
                        radial-gradient(ellipse at 20% 30%, rgba(79,125,245,0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, rgba(139,92,246,0.12) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 100%, rgba(34,211,238,0.08) 0%, transparent 40%);
                }
                .v6-hero-grid {
                    position: absolute; inset: 0; z-index: 0;
                    background-image:
                        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 60px 60px;
                }
                .v6-hero-inner {
                    position: relative; z-index: 1;
                    max-width: 1300px; margin: 0 auto; padding: 0 2.5rem;
                    display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
                }
                .v6-hero-badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.35rem 1rem; border-radius: 100px;
                    background: var(--surface2); border: 1px solid var(--border2);
                    font-size: 0.72rem; font-weight: 600; color: var(--blue2);
                    margin-bottom: 1.5rem;
                }
                .v6-hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cyan); animation: v6glow 2s ease-in-out infinite; }
                .v6-h1 {
                    font-family: 'Crimson Pro', serif;
                    font-size: 4.5rem; font-weight: 800; line-height: 1.05;
                    letter-spacing: -0.03em; margin-bottom: 1.75rem;
                }
                .v6-h1 .grad {
                    background: linear-gradient(135deg, var(--blue2), var(--purple), var(--cyan));
                    background-size: 200% 200%; animation: v6gradient 4s ease infinite;
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .v6-hero-p { font-size: 1.1rem; line-height: 1.7; color: var(--dim); max-width: 480px; margin-bottom: 2.5rem; }
                .v6-hero-cta { display: flex; gap: 1rem; }
                .v6-btn-glow {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.9rem 2.25rem; font-size: 0.92rem; font-weight: 700;
                    background: linear-gradient(135deg, var(--blue), var(--purple));
                    color: white; border-radius: 10px; text-decoration: none;
                    transition: all 0.25s; position: relative; overflow: hidden;
                }
                .v6-btn-glow::after {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(135deg, transparent, rgba(255,255,255,0.1), transparent);
                    transform: translateX(-100%); transition: transform 0.5s;
                }
                .v6-btn-glow:hover::after { transform: translateX(100%); }
                .v6-btn-glow:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(79,125,245,0.35); }
                .v6-btn-ghost {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.9rem 2.25rem; font-size: 0.92rem; font-weight: 600;
                    color: var(--dim); border: 1px solid var(--border2); border-radius: 10px;
                    text-decoration: none; transition: all 0.2s;
                }
                .v6-btn-ghost:hover { border-color: var(--dim); color: var(--white); background: var(--surface); }

                /* Hero visual */
                .v6-hero-visual { position: relative; perspective: 1000px; }
                .v6-editor-wrap {
                    background: var(--bg2); border: 1px solid var(--border2);
                    border-radius: 16px; overflow: hidden;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
                    animation: v6slideUp 0.8s ease-out both;
                    animation-delay: 0.3s;
                }
                .v6-editor-bar {
                    display: flex; align-items: center; gap: 8px;
                    padding: 0.85rem 1.25rem; background: var(--bg3);
                    border-bottom: 1px solid var(--border);
                }
                .v6-dot { width: 10px; height: 10px; border-radius: 50%; }
                .v6-editor-tabs { display: flex; gap: 0; margin-left: 1rem; }
                .v6-tab {
                    padding: 0.3rem 1rem; font-size: 0.7rem; font-weight: 500;
                    color: var(--muted); border-bottom: 2px solid transparent;
                }
                .v6-tab.active { color: var(--blue2); border-color: var(--blue); background: var(--surface); }
                .v6-editor-code {
                    padding: 1.5rem; font-family: 'JetBrains Mono', monospace;
                    font-size: 0.78rem; line-height: 2;
                }
                .v6-ln { color: var(--muted); margin-right: 1.5rem; user-select: none; }
                .v6-kw { color: var(--purple); }
                .v6-fn { color: var(--blue2); }
                .v6-str { color: var(--cyan); }
                .v6-cm { color: #3D4258; }
                .v6-op { color: #7A7E98; }
                .v6-editor-status {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0.6rem 1.25rem; border-top: 1px solid var(--border);
                    background: var(--bg3);
                }
                .v6-status-pass {
                    display: flex; align-items: center; gap: 0.4rem;
                    font-size: 0.72rem; font-weight: 600; color: #34D399;
                }
                .v6-status-lang { font-size: 0.68rem; color: var(--muted); }

                /* Floating cards */
                .v6-float-hint {
                    position: absolute; top: 1rem; right: -2rem; z-index: 2;
                    background: var(--bg2); border: 1px solid var(--border2);
                    border-radius: 12px; padding: 1rem 1.25rem; width: 220px;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
                    animation: v6float 3.5s ease-in-out infinite;
                    animation-delay: 0.5s;
                }
                .v6-float-hint-label {
                    font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.12em; color: var(--gold); margin-bottom: 0.4rem;
                    display: flex; align-items: center; gap: 0.35rem;
                }
                .v6-float-hint-text { font-size: 0.78rem; color: var(--dim); line-height: 1.55; font-style: italic; }

                .v6-float-streak {
                    position: absolute; bottom: 2rem; left: -1.5rem; z-index: 2;
                    background: var(--bg2); border: 1px solid var(--border2);
                    border-radius: 12px; padding: 0.85rem 1.15rem;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
                    animation: v6float2 4s ease-in-out infinite;
                    display: flex; align-items: center; gap: 0.6rem;
                }
                .v6-streak-icon {
                    width: 32px; height: 32px; border-radius: 10px;
                    background: linear-gradient(135deg, var(--gold), #F59E0B);
                    display: flex; align-items: center; justify-content: center;
                }
                .v6-streak-num { font-size: 1rem; font-weight: 800; }
                .v6-streak-label { font-size: 0.65rem; color: var(--muted); }

                /* Stats bar */
                .v6-stats {
                    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
                    background: var(--surface);
                }
                .v6-stats-inner {
                    max-width: 1300px; margin: 0 auto; padding: 2.25rem 2.5rem;
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem;
                }
                .v6-stat { text-align: center; }
                .v6-stat-val {
                    font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em;
                    background: linear-gradient(135deg, var(--blue2), var(--cyan));
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .v6-stat-label { font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem; font-weight: 500; }

                /* Features */
                .v6-features {
                    max-width: 1300px; margin: 0 auto; padding: 5rem 2.5rem;
                }
                .v6-section-overline {
                    font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.25em; color: var(--blue2); margin-bottom: 1rem;
                }
                .v6-section-h2 {
                    font-family: 'Crimson Pro', serif;
                    font-size: 3rem; font-weight: 800; line-height: 1.15;
                    letter-spacing: -0.02em; margin-bottom: 1rem;
                }
                .v6-section-h2 .grad {
                    background: linear-gradient(135deg, var(--blue2), var(--purple));
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .v6-section-sub { font-size: 1.05rem; color: var(--dim); line-height: 1.65; max-width: 560px; margin-bottom: 3.5rem; }

                .v6-feat-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: auto auto; gap: 1.25rem;
                }
                .v6-feat-card {
                    background: var(--surface); border: 1px solid var(--border2);
                    border-radius: 16px; padding: 2rem; position: relative; overflow: hidden;
                    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
                }
                .v6-feat-card:hover {
                    border-color: rgba(79,125,245,0.3);
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(79,125,245,0.08);
                }
                .v6-feat-card.span2 { grid-column: span 2; }
                .v6-feat-card::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, var(--blue), var(--purple), var(--cyan));
                    opacity: 0; transition: opacity 0.3s;
                }
                .v6-feat-card:hover::before { opacity: 1; }
                .v6-feat-icon {
                    width: 46px; height: 46px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 1.25rem;
                }
                .v6-feat-icon.blue { background: rgba(79,125,245,0.12); }
                .v6-feat-icon.purple { background: rgba(139,92,246,0.12); }
                .v6-feat-icon.cyan { background: rgba(34,211,238,0.12); }
                .v6-feat-icon.gold { background: rgba(245,200,66,0.12); }
                .v6-feat-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.6rem; letter-spacing: -0.01em; }
                .v6-feat-desc { font-size: 0.85rem; color: var(--dim); line-height: 1.65; }
                .v6-feat-checklist { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
                .v6-feat-check {
                    display: flex; align-items: center; gap: 0.5rem;
                    font-size: 0.8rem; color: var(--dim);
                }
                .v6-feat-check-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--cyan); flex-shrink: 0; }

                /* Philosophy */
                .v6-phil {
                    border-top: 1px solid var(--border);
                    background: var(--bg2);
                    position: relative; overflow: hidden;
                }
                .v6-phil-mesh {
                    position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse at 70% 30%, rgba(139,92,246,0.08), transparent 50%),
                        radial-gradient(ellipse at 30% 80%, rgba(79,125,245,0.06), transparent 50%);
                }
                .v6-phil-inner {
                    max-width: 1300px; margin: 0 auto; padding: 5rem 2.5rem;
                    display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center;
                    position: relative; z-index: 1;
                }
                .v6-phil-h2 {
                    font-family: 'Crimson Pro', serif;
                    font-size: 3.25rem; font-weight: 800; line-height: 1.1;
                    letter-spacing: -0.02em;
                }
                .v6-phil-h2 .dim { color: var(--muted); }
                .v6-phil-cards { display: flex; flex-direction: column; gap: 1.25rem; }
                .v6-phil-card {
                    padding: 1.75rem; border-radius: 14px;
                    background: var(--surface); border: 1px solid var(--border2);
                    transition: border-color 0.2s;
                }
                .v6-phil-card:hover { border-color: rgba(79,125,245,0.2); }
                .v6-phil-card-label {
                    font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.12em; margin-bottom: 0.5rem;
                }
                .v6-phil-card-label.student { color: var(--cyan); }
                .v6-phil-card-label.instructor { color: var(--gold); }
                .v6-phil-card-text { font-size: 0.88rem; color: var(--dim); line-height: 1.65; }

                /* How it works */
                .v6-how {
                    max-width: 1300px; margin: 0 auto; padding: 5rem 2.5rem;
                }
                .v6-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-top: 3rem; }
                .v6-step { position: relative; }
                .v6-step-num {
                    width: 40px; height: 40px; border-radius: 12px;
                    background: linear-gradient(135deg, var(--blue), var(--purple));
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.85rem; font-weight: 800; margin-bottom: 1.25rem;
                }
                .v6-step-line {
                    position: absolute; top: 20px; left: 52px; right: -12px;
                    height: 1px; background: var(--border2);
                }
                .v6-step-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; }
                .v6-step-desc { font-size: 0.82rem; color: var(--dim); line-height: 1.6; }

                /* CTA */
                .v6-cta {
                    max-width: 1300px; margin: 0 auto; padding: 2rem 2.5rem 5rem;
                }
                .v6-cta-inner {
                    padding: 4rem; border-radius: 20px; text-align: center;
                    background: linear-gradient(135deg, var(--bg3), var(--bg2));
                    border: 1px solid var(--border2); position: relative; overflow: hidden;
                }
                .v6-cta-mesh {
                    position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse at 30% 40%, rgba(79,125,245,0.12), transparent 50%),
                        radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.1), transparent 50%);
                }
                .v6-cta-content { position: relative; z-index: 1; }
                .v6-cta-h2 {
                    font-family: 'Crimson Pro', serif;
                    font-size: 3rem; font-weight: 800; margin-bottom: 1rem;
                    letter-spacing: -0.02em;
                }
                .v6-cta-sub { font-size: 1.05rem; color: var(--dim); margin-bottom: 2.5rem; line-height: 1.6; }
                .v6-cta-buttons { display: flex; justify-content: center; gap: 1rem; }

                /* Footer */
                .v6-footer { border-top: 1px solid var(--border); }
                .v6-footer-inner {
                    max-width: 1300px; margin: 0 auto; padding: 3rem 2.5rem 2rem;
                    display: flex; justify-content: space-between; align-items: flex-start;
                    flex-wrap: wrap; gap: 2rem;
                }
                .v6-footer-brand p { font-size: 0.78rem; color: var(--muted); margin-top: 0.5rem; max-width: 260px; line-height: 1.55; }
                .v6-footer-cols { display: flex; gap: 4rem; }
                .v6-footer-col-title { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 0.85rem; }
                .v6-footer-col ul { list-style: none; padding: 0; margin: 0; }
                .v6-footer-col li { margin-bottom: 0.5rem; }
                .v6-footer-col a { font-size: 0.78rem; color: var(--dim); text-decoration: none; transition: color 0.2s; }
                .v6-footer-col a:hover { color: var(--white); }
                .v6-footer-bottom {
                    max-width: 1300px; margin: 0 auto; padding: 1.5rem 2.5rem;
                    border-top: 1px solid var(--border);
                    display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted);
                }

                @media (max-width: 900px) {
                    .v6-hero-inner { grid-template-columns: 1fr; }
                    .v6-h1 { font-size: 2.75rem; }
                    .v6-stats-inner { grid-template-columns: repeat(2, 1fr); }
                    .v6-feat-grid { grid-template-columns: 1fr; }
                    .v6-feat-card.span2 { grid-column: span 1; }
                    .v6-phil-inner { grid-template-columns: 1fr; gap: 2.5rem; }
                    .v6-steps { grid-template-columns: 1fr 1fr; }
                    .v6-step-line { display: none; }
                    .v6-float-hint, .v6-float-streak { display: none; }
                }
            `}</style>

            <div className="v6">
                <nav className="v6-nav">
                    <div className="v6-nav-inner">
                        <div className="v6-brand">
                            <Image src="/favicon.png" alt="CodeGuruAI" width={34} height={34} style={{ objectFit: "contain" }} />
                            <span className="v6-brand-text">CodeGuru<span className="a">AI</span></span>
                        </div>
                        <div className="v6-nav-links">
                            {user ? (
                                <Link href={dashboardHref} className="v6-nav-btn">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v6-nav-link">Sign In</Link>
                                    <Link href="/register" className="v6-nav-btn">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="v6-hero">
                    <div className="v6-hero-mesh" />
                    <div className="v6-hero-grid" />
                    <div className="v6-hero-inner">
                        <div>
                            <div className="v6-hero-badge v6-animate-up"><div className="v6-hero-badge-dot" /> AI-Powered Education Platform</div>
                            <h1 className="v6-h1 v6-animate-up v6-d1">Learn coding the<br /><span className="grad">smart way.</span></h1>
                            <p className="v6-hero-p v6-animate-up v6-d2">CodeGuruAI guides students with Socratic hints that provoke genuine understanding — never handing out solutions. Built for university classrooms.</p>
                            <div className="v6-hero-cta v6-animate-up v6-d3">
                                <Link href="/register" className="v6-btn-glow">
                                    Start Learning Free
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </Link>
                                <Link href="#features" className="v6-btn-ghost">See How It Works</Link>
                            </div>
                        </div>
                        <div className="v6-hero-visual">
                            <div className="v6-editor-wrap">
                                <div className="v6-editor-bar">
                                    <div className="v6-dot" style={{ background: "#FF5F56" }} />
                                    <div className="v6-dot" style={{ background: "#FFBD2E" }} />
                                    <div className="v6-dot" style={{ background: "#27C93F" }} />
                                    <div className="v6-editor-tabs">
                                        <div className="v6-tab active">solution.py</div>
                                        <div className="v6-tab">test_cases.py</div>
                                    </div>
                                </div>
                                <div className="v6-editor-code">
                                    <div><span className="v6-ln">1</span><span className="v6-kw">def</span> <span className="v6-fn">two_sum</span><span className="v6-op">(nums, target):</span></div>
                                    <div><span className="v6-ln">2</span><span className="v6-cm">    # Find two indices that sum to target</span></div>
                                    <div><span className="v6-ln">3</span><span className="v6-op">    seen = {'{}'}</span></div>
                                    <div><span className="v6-ln">4</span><span className="v6-kw">    for</span> <span className="v6-op">i, n</span> <span className="v6-kw">in</span> <span className="v6-fn">enumerate</span><span className="v6-op">(nums):</span></div>
                                    <div><span className="v6-ln">5</span><span className="v6-op">        diff = target - n</span></div>
                                    <div><span className="v6-ln">6</span><span className="v6-kw">        if</span> <span className="v6-op">diff</span> <span className="v6-kw">in</span> <span className="v6-op">seen:</span></div>
                                    <div><span className="v6-ln">7</span><span className="v6-str">            return [seen[diff], i]</span></div>
                                    <div><span className="v6-ln">8</span><span className="v6-op">        seen[n] = i</span></div>
                                </div>
                                <div className="v6-editor-status">
                                    <div className="v6-status-pass">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                        All 5 test cases passed
                                    </div>
                                    <span className="v6-status-lang">Python 3.11</span>
                                </div>
                            </div>
                            <div className="v6-float-hint">
                                <div className="v6-float-hint-label">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    Socratic Hint
                                </div>
                                <p className="v6-float-hint-text">&ldquo;What data structure gives O(1) lookups?&rdquo;</p>
                            </div>
                            <div className="v6-float-streak">
                                <div className="v6-streak-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                </div>
                                <div>
                                    <div className="v6-streak-num">7 Day Streak</div>
                                    <div className="v6-streak-label">Keep solving!</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Bar */}
                <section className="v6-stats">
                    <div className="v6-stats-inner">
                        <div className="v6-stat"><div className="v6-stat-val">{count1.toLocaleString()}+</div><div className="v6-stat-label">Problems Solved</div></div>
                        <div className="v6-stat"><div className="v6-stat-val">{count2}%</div><div className="v6-stat-label">Completion Rate</div></div>
                        <div className="v6-stat"><div className="v6-stat-val">{count3}+</div><div className="v6-stat-label">Universities</div></div>
                        <div className="v6-stat"><div className="v6-stat-val">4.9★</div><div className="v6-stat-label">Student Rating</div></div>
                    </div>
                </section>

                {/* Features */}
                <section className="v6-features" id="features">
                    <div className="v6-section-overline">Platform Features</div>
                    <h2 className="v6-section-h2">Built to make you <span className="grad">think harder,</span><br />not just faster.</h2>
                    <p className="v6-section-sub">Every feature exists to deepen understanding — from AI hints that ask the right question to analytics that reveal where students truly struggle.</p>
                    <div className="v6-feat-grid">
                        <div className="v6-feat-card span2">
                            <div className="v6-feat-icon blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F7DF5" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                            <h3 className="v6-feat-title">Socratic AI Hints</h3>
                            <p className="v6-feat-desc">The AI never reveals answers directly. Instead, it asks precisely the question that exposes the gap in understanding. Students build the reasoning — not just the code.</p>
                            <div className="v6-feat-checklist">
                                <div className="v6-feat-check"><span className="v6-feat-check-dot" />Never reveals the answer directly</div>
                                <div className="v6-feat-check"><span className="v6-feat-check-dot" />Asks questions that expose blind spots</div>
                                <div className="v6-feat-check"><span className="v6-feat-check-dot" />Forces genuine reasoning through problems</div>
                            </div>
                        </div>
                        <div className="v6-feat-card">
                            <div className="v6-feat-icon purple"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
                            <h3 className="v6-feat-title">Live Code Execution</h3>
                            <p className="v6-feat-desc">Write and run solutions in-browser. Instant test case feedback, zero setup. Supports Python, JavaScript, C++, and Java.</p>
                        </div>
                        <div className="v6-feat-card">
                            <div className="v6-feat-icon cyan"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
                            <h3 className="v6-feat-title">Classroom Analytics</h3>
                            <p className="v6-feat-desc">See exactly where students struggle. Track submissions, completion rates, and time-to-solve across your entire classroom.</p>
                        </div>
                        <div className="v6-feat-card">
                            <div className="v6-feat-icon gold"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5C842" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
                            <h3 className="v6-feat-title">AI Problem Generation</h3>
                            <p className="v6-feat-desc">Create unique coding challenges in minutes. Set difficulty, topic, and constraints — the AI generates complete problems with test cases.</p>
                        </div>
                        <div className="v6-feat-card span2">
                            <div className="v6-feat-icon blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F7DF5" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                            <h3 className="v6-feat-title">Classroom Management</h3>
                            <p className="v6-feat-desc">Create classrooms, assign problem sets, set deadlines, and manage enrolled students. Built for how university courses actually work — with sections, TAs, and cohort-level tracking.</p>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="v6-how">
                    <div className="v6-section-overline">How It Works</div>
                    <h2 className="v6-section-h2">Four steps to <span className="grad">deeper learning.</span></h2>
                    <div className="v6-steps">
                        <div className="v6-step">
                            <div className="v6-step-num">1</div>
                            <div className="v6-step-line" />
                            <h3 className="v6-step-title">Pick a Problem</h3>
                            <p className="v6-step-desc">Browse curated or AI-generated coding challenges across difficulty levels.</p>
                        </div>
                        <div className="v6-step">
                            <div className="v6-step-num">2</div>
                            <div className="v6-step-line" />
                            <h3 className="v6-step-title">Write Code</h3>
                            <p className="v6-step-desc">Solve it in our in-browser editor with syntax highlighting and auto-completion.</p>
                        </div>
                        <div className="v6-step">
                            <div className="v6-step-num">3</div>
                            <div className="v6-step-line" />
                            <h3 className="v6-step-title">Get Hints</h3>
                            <p className="v6-step-desc">Stuck? The AI asks Socratic questions to guide you — without giving the answer.</p>
                        </div>
                        <div className="v6-step">
                            <div className="v6-step-num">4</div>
                            <h3 className="v6-step-title">Track Progress</h3>
                            <p className="v6-step-desc">See your growth over time. Instructors see your classroom&apos;s analytics in real time.</p>
                        </div>
                    </div>
                </section>

                {/* Philosophy */}
                <section className="v6-phil">
                    <div className="v6-phil-mesh" />
                    <div className="v6-phil-inner">
                        <div>
                            <div className="v6-section-overline">Our Philosophy</div>
                            <h2 className="v6-phil-h2">We don&apos;t give you the answer.<br /><span className="dim">We give you the question that leads to it.</span></h2>
                        </div>
                        <div className="v6-phil-cards">
                            <div className="v6-phil-card">
                                <div className="v6-phil-card-label student">For Students</div>
                                <p className="v6-phil-card-text">Struggle through problems with intelligent guidance. The productive struggle is where learning happens — we ensure you&apos;re never fully stuck, but never handed the answer.</p>
                            </div>
                            <div className="v6-phil-card">
                                <div className="v6-phil-card-label instructor">For Instructors</div>
                                <p className="v6-phil-card-text">Create AI-powered problem sets in minutes. Assign to classrooms, track every submission, and see precisely where your students need help.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="v6-cta">
                    <div className="v6-cta-inner">
                        <div className="v6-cta-mesh" />
                        <div className="v6-cta-content">
                            <h2 className="v6-cta-h2">Start learning the right way.</h2>
                            <p className="v6-cta-sub">Join CodeGuruAI — free for students, powerful for instructors.</p>
                            <div className="v6-cta-buttons">
                                <Link href="/register" className="v6-btn-glow">Create Free Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></Link>
                                <Link href="/login" className="v6-btn-ghost">Sign In</Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="v6-footer">
                    <div className="v6-footer-inner">
                        <div className="v6-footer-brand">
                            <div className="v6-brand"><Image src="/favicon.png" alt="" width={28} height={28} style={{ objectFit: "contain" }} /><span className="v6-brand-text" style={{ fontSize: "1rem" }}>CodeGuru<span className="a">AI</span></span></div>
                            <p>AI-powered coding education for university classrooms.</p>
                        </div>
                        <div className="v6-footer-cols">
                            <div className="v6-footer-col"><div className="v6-footer-col-title">Platform</div><ul><li><Link href="/register">Get Started</Link></li><li><Link href="/login">Sign In</Link></li><li><Link href="/register?role=instructor">For Instructors</Link></li></ul></div>
                            <div className="v6-footer-col"><div className="v6-footer-col-title">Legal</div><ul><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Use</a></li><li><a href="#">Contact</a></li></ul></div>
                        </div>
                    </div>
                    <div className="v6-footer-bottom"><span>&copy; 2026 CodeGuruAI. All rights reserved.</span><span>Built for learners who want to actually understand code.</span></div>
                </footer>
            </div>
        </>
    )
}
