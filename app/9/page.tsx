"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"
import { useState } from "react"

/* ================================================================
   V9 — Warm Gradient SaaS
   Warm peach-coral-purple gradient hero, morphing blob bg,
   accordion feature section, pricing-style comparison,
   social proof avatars, animated gradient borders,
   before/after interactive slider concept, rich sections.
   Fonts: Cabinet Grotesk (DM Sans fallback) + Bricolage Grotesque
   ================================================================ */

export default function LandingV9() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [openFaq, setOpenFaq] = useState(0)

    const faqs = [
        { q: "How does the Socratic AI work?", a: "When a student requests a hint, the AI analyzes their code, identifies the specific misconception, and generates a targeted question — never revealing the answer directly. It models the Socratic method used by the best professors." },
        { q: "What languages are supported?", a: "Python, JavaScript, C++, and Java are fully supported with syntax highlighting, auto-indentation, and instant test case validation. More languages are on the roadmap." },
        { q: "Can I create my own problems?", a: "Absolutely. You can write problems manually, or use the AI problem generator to create unique challenges. Set the topic, difficulty, constraints, and the AI generates complete problems with test cases." },
        { q: "How does classroom management work?", a: "Create a classroom, invite students, assign problem sets with deadlines, and track every submission in real time. You get cohort-level analytics showing where students succeed and struggle." },
        { q: "Is it really free for students?", a: "Yes. Students get unlimited access to problem solving, hints, and code execution at no cost. Instructor features for classroom management and analytics are included." },
    ]

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&family=Bricolage+Grotesque:wght@400;600;700;800&display=swap');

                .v9 {
                    --bg: #FAFAFA;
                    --bg2: #FFFFFF;
                    --dark: #111111;
                    --dark2: #1A1A1A;
                    --dark-mid: #333333;
                    --dim: #666666;
                    --muted: #999999;
                    --coral: #FF6B6B;
                    --coral2: #FF8A80;
                    --purple: #7C3AED;
                    --purple2: #8B5CF6;
                    --orange: #FF9A3C;
                    --border: #E5E5E5;
                    --border2: #D4D4D4;
                    font-family: 'DM Sans', sans-serif;
                    background: var(--bg);
                    color: var(--dark);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                @keyframes v9morph { 0%,100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; } 25% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; } 50% { border-radius: 50% 50% 30% 70% / 60% 40% 60% 40%; } 75% { border-radius: 30% 70% 70% 30% / 50% 60% 40% 50%; } }
                @keyframes v9float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                @keyframes v9fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes v9gradientBorder { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes v9shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

                .v9-up { animation: v9fadeUp 0.6s ease-out both; }
                .v9-d1 { animation-delay: 0.1s; } .v9-d2 { animation-delay: 0.2s; } .v9-d3 { animation-delay: 0.3s; } .v9-d4 { animation-delay: 0.4s; } .v9-d5 { animation-delay: 0.5s; }

                /* Nav */
                .v9-nav { position: sticky; top: 0; z-index: 50; background: rgba(250,250,250,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
                .v9-nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 2.5rem; height: 4rem; display: flex; align-items: center; justify-content: space-between; }
                .v9-brand { display: flex; align-items: center; gap: 0.7rem; }
                .v9-brand-text { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.2rem; font-weight: 800; }
                .v9-brand-text .a { background: linear-gradient(135deg, var(--coral), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .v9-nav-right { display: flex; align-items: center; gap: 0.5rem; }
                .v9-nav-link { padding: 0.4rem 0.9rem; font-size: 0.82rem; font-weight: 500; color: var(--dim); text-decoration: none; transition: color 0.2s; }
                .v9-nav-link:hover { color: var(--dark); }
                .v9-nav-btn { padding: 0.5rem 1.4rem; font-size: 0.82rem; font-weight: 700; background: var(--dark); color: white; border-radius: 100px; text-decoration: none; transition: all 0.2s; }
                .v9-nav-btn:hover { background: var(--dark2); transform: translateY(-1px); }

                /* Hero */
                .v9-hero { position: relative; overflow: hidden; padding: 6rem 0 5rem; background: linear-gradient(160deg, #FFF5F5 0%, #FEF3E2 30%, #F5F0FF 60%, #F0F0FF 100%); }
                .v9-hero-blob {
                    position: absolute; top: -30%; right: -15%; width: 700px; height: 700px;
                    background: linear-gradient(135deg, rgba(255,107,107,0.2), rgba(124,58,237,0.15), rgba(255,154,60,0.1));
                    animation: v9morph 15s ease-in-out infinite;
                    filter: blur(60px);
                }
                .v9-hero-blob2 {
                    position: absolute; bottom: -40%; left: -10%; width: 500px; height: 500px;
                    background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(255,107,107,0.08));
                    animation: v9morph 20s ease-in-out infinite reverse;
                    filter: blur(50px);
                }
                .v9-hero-inner { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 0 2.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
                .v9-hero-badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.4rem 1rem; border-radius: 100px;
                    background: white; border: 1px solid var(--border);
                    font-size: 0.72rem; font-weight: 700; color: var(--purple);
                    margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .v9-h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 4.25rem; font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 1.5rem; }
                .v9-h1 .grad { background: linear-gradient(135deg, var(--coral), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .v9-hero-p { font-size: 1.1rem; line-height: 1.7; color: var(--dim); max-width: 480px; margin-bottom: 2rem; }
                .v9-hero-cta { display: flex; gap: 1rem; align-items: center; }
                .v9-btn-grad {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.9rem 2.25rem; font-size: 0.92rem; font-weight: 700;
                    background: linear-gradient(135deg, var(--coral), var(--purple));
                    color: white; border-radius: 100px; text-decoration: none;
                    transition: all 0.25s; position: relative; overflow: hidden;
                }
                .v9-btn-grad::after { content: ''; position: absolute; top: 0; width: 60%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: v9shimmer 3s ease-in-out infinite; }
                .v9-btn-grad:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,107,107,0.25); }
                .v9-btn-simple { font-size: 0.9rem; font-weight: 600; color: var(--dim); text-decoration: none; display: flex; align-items: center; gap: 0.4rem; transition: color 0.2s; }
                .v9-btn-simple:hover { color: var(--dark); }

                /* Hero visual — animated gradient-border card */
                .v9-hero-visual { position: relative; }
                .v9-hero-card-wrap {
                    padding: 2px; border-radius: 18px;
                    background: linear-gradient(135deg, var(--coral), var(--purple), var(--orange), var(--coral));
                    background-size: 300% 300%; animation: v9gradientBorder 4s ease infinite;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.08);
                }
                .v9-hero-card {
                    background: white; border-radius: 16px; overflow: hidden;
                }
                .v9-hero-card-bar { padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 6px; }
                .v9-dot { width: 9px; height: 9px; border-radius: 50%; }
                .v9-hero-card-body { padding: 1.5rem; }
                .v9-hero-card-body h4 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1rem; font-weight: 700; margin-bottom: 1rem; }
                .v9-mini-code {
                    padding: 1.25rem; border-radius: 12px; background: #1a1a2e;
                    font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; line-height: 1.85;
                    color: #8DA2C0; margin-bottom: 1rem;
                }
                .v9-mini-code .kw { color: var(--coral2); }
                .v9-mini-code .fn { color: var(--purple2); }
                .v9-mini-code .str { color: #4ADE80; }
                .v9-hint-card {
                    padding: 1rem 1.25rem; border-radius: 12px;
                    background: linear-gradient(135deg, #FFF5F5, #F5F0FF);
                    border: 1px solid var(--border);
                }
                .v9-hint-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--purple); margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.35rem; }
                .v9-hint-text { font-size: 0.82rem; color: var(--dim); line-height: 1.55; font-style: italic; }

                /* Floating avatar stack */
                .v9-float-avatars {
                    position: absolute; bottom: -1rem; left: -2rem; z-index: 2;
                    padding: 0.85rem 1.25rem; background: white; border-radius: 12px;
                    border: 1px solid var(--border); box-shadow: 0 8px 24px rgba(0,0,0,0.06);
                    display: flex; align-items: center; gap: 0.75rem;
                    animation: v9float 3.5s ease-in-out infinite;
                }
                .v9-avatar-stack { display: flex; }
                .v9-avatar {
                    width: 28px; height: 28px; border-radius: 50%;
                    border: 2px solid white; margin-left: -8px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.6rem; font-weight: 700; color: white;
                }
                .v9-avatar:first-child { margin-left: 0; }
                .v9-float-text { font-size: 0.78rem; font-weight: 600; }
                .v9-float-sub { font-size: 0.65rem; color: var(--muted); }

                /* Social proof bar */
                .v9-social { border-bottom: 1px solid var(--border); }
                .v9-social-inner { max-width: 1280px; margin: 0 auto; padding: 2.5rem; display: flex; align-items: center; justify-content: center; gap: 3rem; flex-wrap: wrap; }
                .v9-social-stat { text-align: center; }
                .v9-social-val { font-family: 'Bricolage Grotesque', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, var(--coral), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .v9-social-label { font-size: 0.75rem; color: var(--muted); margin-top: 0.2rem; font-weight: 500; }

                /* Features as cards with gradient hover */
                .v9-features { max-width: 1280px; margin: 0 auto; padding: 5rem 2.5rem; }
                .v9-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--purple); margin-bottom: 1rem; }
                .v9-h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 3rem; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 1rem; }
                .v9-h2 .grad { background: linear-gradient(135deg, var(--coral), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .v9-sub { font-size: 1.05rem; color: var(--dim); line-height: 1.65; max-width: 540px; margin-bottom: 3.5rem; }
                .v9-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
                .v9-feat-card {
                    padding: 2.25rem; border-radius: 16px; background: white;
                    border: 1px solid var(--border); transition: all 0.3s;
                    position: relative; overflow: hidden;
                }
                .v9-feat-card::before {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(160deg, rgba(255,107,107,0.04), rgba(124,58,237,0.04));
                    opacity: 0; transition: opacity 0.3s;
                }
                .v9-feat-card:hover { border-color: var(--border2); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.06); }
                .v9-feat-card:hover::before { opacity: 1; }
                .v9-feat-emoji { font-size: 2rem; margin-bottom: 1.25rem; display: block; }
                .v9-feat-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.6rem; position: relative; z-index: 1; }
                .v9-feat-desc { font-size: 0.85rem; color: var(--dim); line-height: 1.65; position: relative; z-index: 1; }

                /* FAQ accordion */
                .v9-faq { max-width: 1280px; margin: 0 auto; padding: 0 2.5rem 5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: start; }
                .v9-faq-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .v9-faq-item { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: white; transition: border-color 0.2s; }
                .v9-faq-item.open { border-color: var(--border2); }
                .v9-faq-q {
                    padding: 1.15rem 1.5rem; font-size: 0.92rem; font-weight: 600;
                    cursor: pointer; display: flex; justify-content: space-between; align-items: center;
                    transition: background 0.2s; user-select: none;
                }
                .v9-faq-q:hover { background: rgba(0,0,0,0.01); }
                .v9-faq-chevron { width: 20px; height: 20px; transition: transform 0.3s; flex-shrink: 0; color: var(--muted); }
                .v9-faq-item.open .v9-faq-chevron { transform: rotate(180deg); }
                .v9-faq-a { padding: 0 1.5rem 1.25rem; font-size: 0.85rem; color: var(--dim); line-height: 1.65; }

                /* CTA */
                .v9-cta { max-width: 1280px; margin: 0 auto; padding: 0 2.5rem 5rem; }
                .v9-cta-inner {
                    padding: 4.5rem; border-radius: 24px; text-align: center;
                    background: linear-gradient(160deg, #1A1A2E, #16213E, #0F3460);
                    position: relative; overflow: hidden; color: white;
                }
                .v9-cta-blob {
                    position: absolute; width: 400px; height: 400px; filter: blur(80px); opacity: 0.15;
                    border-radius: 50%;
                }
                .v9-cta-blob.r { background: var(--coral); top: -30%; left: 10%; animation: v9morph 12s ease-in-out infinite; }
                .v9-cta-blob.p { background: var(--purple); bottom: -30%; right: 10%; animation: v9morph 15s ease-in-out infinite reverse; }
                .v9-cta-content { position: relative; z-index: 1; }
                .v9-cta-h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 3.25rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -0.02em; }
                .v9-cta-sub { font-size: 1.1rem; color: #8DA2C0; margin-bottom: 2.5rem; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto; }
                .v9-cta-btns { display: flex; justify-content: center; gap: 1rem; }
                .v9-btn-white { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.9rem 2.25rem; font-size: 0.92rem; font-weight: 700; background: white; color: var(--dark); border-radius: 100px; text-decoration: none; transition: all 0.2s; }
                .v9-btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,255,255,0.15); }
                .v9-btn-outline-w { display: inline-flex; align-items: center; padding: 0.9rem 2.25rem; font-size: 0.92rem; font-weight: 600; color: #8DA2C0; border: 1px solid rgba(255,255,255,0.15); border-radius: 100px; text-decoration: none; transition: all 0.2s; }
                .v9-btn-outline-w:hover { border-color: rgba(255,255,255,0.3); color: white; }

                /* Footer */
                .v9-footer { border-top: 1px solid var(--border); }
                .v9-footer-inner { max-width: 1280px; margin: 0 auto; padding: 3rem 2.5rem 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 2rem; }
                .v9-footer-brand p { font-size: 0.78rem; color: var(--muted); margin-top: 0.5rem; max-width: 260px; line-height: 1.55; }
                .v9-footer-cols { display: flex; gap: 4rem; }
                .v9-footer-col-title { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 0.85rem; }
                .v9-footer-col ul { list-style: none; padding: 0; margin: 0; }
                .v9-footer-col li { margin-bottom: 0.5rem; }
                .v9-footer-col a { font-size: 0.78rem; color: var(--dim); text-decoration: none; transition: color 0.2s; }
                .v9-footer-col a:hover { color: var(--dark); }
                .v9-footer-bottom { max-width: 1280px; margin: 0 auto; padding: 1.5rem 2.5rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); }

                @media (max-width: 900px) {
                    .v9-hero-inner { grid-template-columns: 1fr; }
                    .v9-h1 { font-size: 2.75rem; }
                    .v9-feat-grid { grid-template-columns: 1fr; }
                    .v9-faq { grid-template-columns: 1fr; gap: 2rem; }
                    .v9-hero-cta { flex-direction: column; align-items: flex-start; }
                    .v9-float-avatars { display: none; }
                    .v9-social-inner { gap: 2rem; }
                }
            `}</style>

            <div className="v9">
                <nav className="v9-nav">
                    <div className="v9-nav-inner">
                        <div className="v9-brand">
                            <Image src="/favicon.png" alt="" width={34} height={34} style={{ objectFit: "contain" }} />
                            <span className="v9-brand-text">CodeGuru<span className="a">AI</span></span>
                        </div>
                        <div className="v9-nav-right">
                            {user ? (
                                <Link href={dashboardHref} className="v9-nav-btn">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v9-nav-link">Sign In</Link>
                                    <Link href="/register" className="v9-nav-btn">Get Started →</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="v9-hero">
                    <div className="v9-hero-blob" />
                    <div className="v9-hero-blob2" />
                    <div className="v9-hero-inner">
                        <div>
                            <div className="v9-hero-badge v9-up">🚀 AI-Powered Education Platform</div>
                            <h1 className="v9-h1 v9-up v9-d1">Master coding through <span className="grad">inquiry.</span></h1>
                            <p className="v9-hero-p v9-up v9-d2">CodeGuruAI uses Socratic AI to guide students — asking the right questions, never giving the answers. Built for university CS classrooms.</p>
                            <div className="v9-hero-cta v9-up v9-d3">
                                <Link href="/register" className="v9-btn-grad">
                                    Start Free
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </Link>
                                <Link href="#features" className="v9-btn-simple">
                                    Learn more
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                </Link>
                            </div>
                        </div>
                        <div className="v9-hero-visual v9-up v9-d4">
                            <div className="v9-hero-card-wrap">
                                <div className="v9-hero-card">
                                    <div className="v9-hero-card-bar">
                                        <div className="v9-dot" style={{ background: "#FF5F56" }} />
                                        <div className="v9-dot" style={{ background: "#FFBD2E" }} />
                                        <div className="v9-dot" style={{ background: "#27C93F" }} />
                                    </div>
                                    <div className="v9-hero-card-body">
                                        <h4>Two Sum — Medium</h4>
                                        <div className="v9-mini-code">
                                            <div><span className="kw">def</span> <span className="fn">two_sum</span>(nums, target):</div>
                                            <div>    seen = {'{}'}</div>
                                            <div><span className="kw">    for</span> i, n <span className="kw">in</span> <span className="fn">enumerate</span>(nums):</div>
                                            <div>        diff = target - n</div>
                                            <div><span className="kw">        if</span> diff <span className="kw">in</span> seen:</div>
                                            <div><span className="str">            return [seen[diff], i]</span></div>
                                            <div>        seen[n] = i</div>
                                        </div>
                                        <div className="v9-hint-card">
                                            <div className="v9-hint-label">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                                Socratic Hint
                                            </div>
                                            <p className="v9-hint-text">&ldquo;What data structure gives O(1) lookups? How would that reduce your time complexity here?&rdquo;</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="v9-float-avatars">
                                <div className="v9-avatar-stack">
                                    <div className="v9-avatar" style={{ background: "#FF6B6B" }}>AJ</div>
                                    <div className="v9-avatar" style={{ background: "#7C3AED" }}>PK</div>
                                    <div className="v9-avatar" style={{ background: "#FF9A3C" }}>DR</div>
                                    <div className="v9-avatar" style={{ background: "#2196F3" }}>+5</div>
                                </div>
                                <div>
                                    <div className="v9-float-text">15k+ students</div>
                                    <div className="v9-float-sub">learning right now</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Social proof */}
                <section className="v9-social">
                    <div className="v9-social-inner">
                        <div className="v9-social-stat"><div className="v9-social-val">15,000+</div><div className="v9-social-label">Students</div></div>
                        <div className="v9-social-stat"><div className="v9-social-val">250+</div><div className="v9-social-label">Universities</div></div>
                        <div className="v9-social-stat"><div className="v9-social-val">94%</div><div className="v9-social-label">Completion Rate</div></div>
                        <div className="v9-social-stat"><div className="v9-social-val">4.9/5</div><div className="v9-social-label">Student Rating</div></div>
                    </div>
                </section>

                {/* Features */}
                <section className="v9-features" id="features">
                    <div className="v9-label">Features</div>
                    <h2 className="v9-h2">Everything you need for <span className="grad">smarter CS education.</span></h2>
                    <p className="v9-sub">From Socratic questioning to instant code execution — every feature is designed to deepen understanding.</p>
                    <div className="v9-feat-grid">
                        <div className="v9-feat-card"><span className="v9-feat-emoji">🧠</span><h3 className="v9-feat-title">Socratic AI Hints</h3><p className="v9-feat-desc">When students get stuck, the AI asks the precise question that exposes their blind spot. It never reveals the answer — it reveals the thinking.</p></div>
                        <div className="v9-feat-card"><span className="v9-feat-emoji">⚡</span><h3 className="v9-feat-title">Live Code Execution</h3><p className="v9-feat-desc">Full in-browser code editor. Write, run, test — with instant feedback. Supports Python, JavaScript, C++, and Java.</p></div>
                        <div className="v9-feat-card"><span className="v9-feat-emoji">📊</span><h3 className="v9-feat-title">Classroom Analytics</h3><p className="v9-feat-desc">See where students succeed and where they struggle. Track submissions, time-to-solve, hint usage, and completion rates.</p></div>
                        <div className="v9-feat-card"><span className="v9-feat-emoji">🎯</span><h3 className="v9-feat-title">AI Problem Generation</h3><p className="v9-feat-desc">Generate unique coding challenges with AI. Set topic, difficulty, and constraints — complete problems with test cases in minutes.</p></div>
                        <div className="v9-feat-card"><span className="v9-feat-emoji">👥</span><h3 className="v9-feat-title">Classroom Management</h3><p className="v9-feat-desc">Create classrooms, assign problem sets, set deadlines, track submissions. Built for how university courses actually work.</p></div>
                        <div className="v9-feat-card"><span className="v9-feat-emoji">🔒</span><h3 className="v9-feat-title">Academic Integrity</h3><p className="v9-feat-desc">AI-generated problems mean every student gets unique challenges. No more answer-sharing across semesters.</p></div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="v9-faq">
                    <div>
                        <div className="v9-label">FAQ</div>
                        <h2 className="v9-h2">Frequently asked <span className="grad">questions.</span></h2>
                        <p className="v9-sub">Everything you need to know about CodeGuruAI.</p>
                    </div>
                    <div className="v9-faq-list">
                        {faqs.map((f, i) => (
                            <div key={i} className={`v9-faq-item ${openFaq === i ? "open" : ""}`}>
                                <div className="v9-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                                    {f.q}
                                    <svg className="v9-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                </div>
                                {openFaq === i && <div className="v9-faq-a">{f.a}</div>}
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="v9-cta">
                    <div className="v9-cta-inner">
                        <div className="v9-cta-blob r" /><div className="v9-cta-blob p" />
                        <div className="v9-cta-content">
                            <h2 className="v9-cta-h2">Ready to transform your classroom?</h2>
                            <p className="v9-cta-sub">Free for students. Powerful for instructors. Join thousands of educators already using CodeGuruAI.</p>
                            <div className="v9-cta-btns">
                                <Link href="/register" className="v9-btn-white">Create Free Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></Link>
                                <Link href="/login" className="v9-btn-outline-w">Sign In</Link>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="v9-footer">
                    <div className="v9-footer-inner">
                        <div className="v9-footer-brand"><div className="v9-brand"><Image src="/favicon.png" alt="" width={28} height={28} style={{ objectFit: "contain" }} /><span className="v9-brand-text" style={{ fontSize: "1rem" }}>CodeGuru<span className="a">AI</span></span></div><p>AI-powered coding education for university classrooms.</p></div>
                        <div className="v9-footer-cols">
                            <div className="v9-footer-col"><div className="v9-footer-col-title">Platform</div><ul><li><Link href="/register">Get Started</Link></li><li><Link href="/login">Sign In</Link></li><li><Link href="/register?role=instructor">For Instructors</Link></li></ul></div>
                            <div className="v9-footer-col"><div className="v9-footer-col-title">Legal</div><ul><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Use</a></li><li><a href="#">Contact</a></li></ul></div>
                        </div>
                    </div>
                    <div className="v9-footer-bottom"><span>&copy; 2026 CodeGuruAI. All rights reserved.</span><span>Built for learners who want to actually understand code.</span></div>
                </footer>
            </div>
        </>
    )
}
