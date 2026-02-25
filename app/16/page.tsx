"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useEffect, useState } from "react"

/* ================================================================
   V16 — Neon Cyberpunk
   Glitch text effects, neon glow, rain overlay, scanlines,
   Japanese-style corner decorations, flickering neon signs,
   CRT distortion, dark alleyway aesthetic.
   Font: Orbitron + Share Tech Mono
   ================================================================ */

export default function LandingV16() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [glitch, setGlitch] = useState(false)

    useEffect(() => {
        const t = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 150) }, 3000)
        return () => clearInterval(t)
    }, [])

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Noto+Sans+JP:wght@400;700;900&display=swap');

                .v16 {
                    --bg: #0a0a0f;
                    --neon-pink: #FF1493;
                    --neon-cyan: #00FFFF;
                    --neon-yellow: #FFD700;
                    --neon-green: #39FF14;
                    --dim: #4a4a5a;
                    --white: #e0e0e8;
                    font-family: 'Share Tech Mono', monospace;
                    background: var(--bg);
                    color: var(--white);
                    min-height: 100vh;
                    overflow-x: hidden;
                    position: relative;
                }

                /* Rain overlay */
                .v16-rain {
                    position: fixed; inset: 0; z-index: 1; pointer-events: none;
                    background-image:
                        linear-gradient(180deg, transparent 95%, rgba(0,255,255,0.03) 100%);
                    background-size: 3px 20px;
                    animation: v16rain 0.3s linear infinite;
                    opacity: 0.4;
                }
                @keyframes v16rain { 0% { background-position: 0 0; } 100% { background-position: 3px 20px; } }

                /* Scanlines */
                .v16::before {
                    content: ''; position: fixed; inset: 0; z-index: 2; pointer-events: none;
                    background: repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, transparent 1px, transparent 3px);
                }

                .v16-content { position: relative; z-index: 3; }

                /* Glitch text */
                @keyframes v16glitch1 { 0%,100% { clip-path: inset(0); transform: none; } 20% { clip-path: inset(5% 0 80% 0); transform: translateX(-5px); } 40% { clip-path: inset(60% 0 5% 0); transform: translateX(5px); } }
                @keyframes v16glitch2 { 0%,100% { clip-path: inset(0); transform: none; } 30% { clip-path: inset(20% 0 50% 0); transform: translateX(3px); } 60% { clip-path: inset(70% 0 10% 0); transform: translateX(-3px); } }
                .v16-glitch { position: relative; }
                .v16-glitch.active::before, .v16-glitch.active::after {
                    content: attr(data-text); position: absolute; top: 0; left: 0; right: 0;
                }
                .v16-glitch.active::before { color: var(--neon-cyan); animation: v16glitch1 0.15s linear; }
                .v16-glitch.active::after { color: var(--neon-pink); animation: v16glitch2 0.15s linear; }

                /* Neon glow */
                .v16-neon-pink { color: var(--neon-pink); text-shadow: 0 0 10px var(--neon-pink), 0 0 30px var(--neon-pink), 0 0 60px rgba(255,20,147,0.3); }
                .v16-neon-cyan { color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan), 0 0 30px var(--neon-cyan), 0 0 60px rgba(0,255,255,0.3); }
                .v16-neon-yellow { color: var(--neon-yellow); text-shadow: 0 0 10px var(--neon-yellow), 0 0 30px rgba(255,215,0,0.5); }

                @keyframes v16flicker { 0%,100% { opacity: 1; } 8% { opacity: 0.8; } 10% { opacity: 1; } 50% { opacity: 1; } 52% { opacity: 0.6; } 54% { opacity: 1; } }
                .v16-flicker { animation: v16flicker 3s ease-in-out infinite; }

                /* Nav */
                .v16-nav { padding: 1rem 2.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,255,255,0.15); }
                .v16-nav-brand { font-family: 'Orbitron', sans-serif; font-size: 1.3rem; font-weight: 900; }
                .v16-nav-brand .p { color: var(--neon-pink); text-shadow: 0 0 10px var(--neon-pink); }
                .v16-nav-brand .c { color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }
                .v16-nav-links { display: flex; gap: 0.5rem; }
                .v16-nav-btn {
                    font-family: 'Orbitron', sans-serif; font-size: 0.7rem;
                    padding: 0.5rem 1.25rem; border: 1px solid var(--neon-cyan);
                    color: var(--neon-cyan); text-decoration: none;
                    text-transform: uppercase; letter-spacing: 0.15em;
                    transition: all 0.2s;
                }
                .v16-nav-btn:hover { background: rgba(0,255,255,0.1); box-shadow: 0 0 20px rgba(0,255,255,0.2); }
                .v16-nav-btn.hot { border-color: var(--neon-pink); color: var(--neon-pink); }
                .v16-nav-btn.hot:hover { background: rgba(255,20,147,0.1); box-shadow: 0 0 20px rgba(255,20,147,0.2); }

                /* Hero */
                .v16-hero { padding: 6rem 2.5rem 4rem; text-align: center; position: relative; }
                .v16-jp { font-family: 'Noto Sans JP', sans-serif; font-size: 0.75rem; color: var(--dim); margin-bottom: 1rem; letter-spacing: 0.5em; }
                .v16-h1 {
                    font-family: 'Orbitron', sans-serif; font-size: 5rem; font-weight: 900;
                    line-height: 1.1; letter-spacing: 0.05em; margin-bottom: 1.5rem;
                }
                .v16-hero-sub { font-size: 1.1rem; color: var(--dim); max-width: 600px; margin: 0 auto 3rem; line-height: 1.7; }
                .v16-hero-cta { display: flex; justify-content: center; gap: 1rem; }
                .v16-btn-neon {
                    font-family: 'Orbitron', sans-serif; font-size: 0.8rem; font-weight: 700;
                    padding: 0.85rem 2.5rem; text-decoration: none;
                    text-transform: uppercase; letter-spacing: 0.15em; transition: all 0.25s;
                }
                .v16-btn-neon.pink { border: 2px solid var(--neon-pink); color: var(--neon-pink); }
                .v16-btn-neon.pink:hover { background: var(--neon-pink); color: var(--bg); box-shadow: 0 0 30px rgba(255,20,147,0.4); }
                .v16-btn-neon.cyan { border: 2px solid var(--neon-cyan); color: var(--neon-cyan); }
                .v16-btn-neon.cyan:hover { background: var(--neon-cyan); color: var(--bg); box-shadow: 0 0 30px rgba(0,255,255,0.4); }

                /* Corner decorations */
                .v16-corner { position: absolute; width: 60px; height: 60px; border-color: var(--neon-cyan); border-style: solid; opacity: 0.3; }
                .v16-corner.tl { top: 1rem; left: 2rem; border-width: 2px 0 0 2px; }
                .v16-corner.tr { top: 1rem; right: 2rem; border-width: 2px 2px 0 0; }
                .v16-corner.bl { bottom: 1rem; left: 2rem; border-width: 0 0 2px 2px; }
                .v16-corner.br { bottom: 1rem; right: 2rem; border-width: 0 2px 2px 0; }

                /* Neon sign feature boxes */
                .v16-features { max-width: 1100px; margin: 0 auto; padding: 0 2.5rem 5rem; }
                .v16-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
                .v16-feat-card {
                    border: 1px solid rgba(0,255,255,0.15); padding: 2rem;
                    position: relative; overflow: hidden; transition: all 0.3s;
                }
                .v16-feat-card:hover { border-color: var(--neon-pink); box-shadow: 0 0 30px rgba(255,20,147,0.1), inset 0 0 30px rgba(255,20,147,0.03); }
                .v16-feat-card::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent, var(--neon-pink), transparent);
                    opacity: 0; transition: opacity 0.3s;
                }
                .v16-feat-card:hover::before { opacity: 1; }
                .v16-feat-icon { font-size: 2rem; margin-bottom: 1rem; }
                .v16-feat-title { font-family: 'Orbitron', sans-serif; font-size: 0.85rem; font-weight: 700; color: var(--neon-cyan); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; }
                .v16-feat-desc { font-size: 0.82rem; color: var(--dim); line-height: 1.65; }

                /* Code panel */
                .v16-code-section { max-width: 1100px; margin: 0 auto; padding: 0 2.5rem 5rem; }
                .v16-code-wrap { border: 1px solid rgba(255,20,147,0.2); position: relative; overflow: hidden; }
                .v16-code-label { position: absolute; top: 0; right: 0; font-family: 'Orbitron', sans-serif; font-size: 0.6rem; padding: 0.3rem 0.75rem; background: var(--neon-pink); color: var(--bg); letter-spacing: 0.1em; }
                .v16-code-body { padding: 2rem; font-size: 0.82rem; line-height: 2; }
                .v16-code-body .kw { color: var(--neon-pink); }
                .v16-code-body .fn { color: var(--neon-cyan); }
                .v16-code-body .str { color: var(--neon-green); }
                .v16-code-body .cm { color: #3a3a4a; }
                .v16-code-hint { margin-top: 1rem; padding: 1rem; border-left: 2px solid var(--neon-yellow); }
                .v16-code-hint-label { font-family: 'Orbitron', sans-serif; font-size: 0.65rem; color: var(--neon-yellow); letter-spacing: 0.15em; margin-bottom: 0.3rem; }
                .v16-code-hint-text { font-style: italic; color: var(--dim); font-size: 0.85rem; }

                /* CTA */
                .v16-cta { max-width: 1100px; margin: 0 auto; padding: 0 2.5rem 5rem; text-align: center; }
                .v16-cta-h2 { font-family: 'Orbitron', sans-serif; font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; }
                .v16-cta-sub { font-size: 0.95rem; color: var(--dim); margin-bottom: 2rem; }

                /* Footer */
                .v16-footer { border-top: 1px solid rgba(0,255,255,0.1); }
                .v16-footer-inner { max-width: 1100px; margin: 0 auto; padding: 2rem 2.5rem; display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--dim); }

                @media (max-width: 800px) {
                    .v16-h1 { font-size: 2.5rem; }
                    .v16-feat-grid { grid-template-columns: 1fr; }
                    .v16-hero-cta { flex-direction: column; align-items: center; }
                }
            `}</style>

            <div className="v16">
                <div className="v16-rain" />
                <div className="v16-content">
                    <nav className="v16-nav">
                        <div className="v16-nav-brand"><span className="p">CODE</span><span className="c">GURU</span>AI</div>
                        <div className="v16-nav-links">
                            {user ? (
                                <Link href={dashboardHref} className="v16-nav-btn cyan">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v16-nav-btn cyan">Login</Link>
                                    <Link href="/register" className="v16-nav-btn hot">Jack In</Link>
                                </>
                            )}
                        </div>
                    </nav>

                    <section className="v16-hero">
                        <div className="v16-corner tl" /><div className="v16-corner tr" /><div className="v16-corner bl" /><div className="v16-corner br" />
                        <div className="v16-jp">コード・グル・エーアイ — ソクラテス式人工知能</div>
                        <h1 className={`v16-h1 v16-glitch ${glitch ? "active" : ""}`} data-text="THE AI THAT QUESTIONS">
                            <span className="v16-neon-cyan v16-flicker">THE AI </span><br />
                            <span className="v16-neon-pink">THAT<br />QUESTIONS</span>
                        </h1>
                        <p className="v16-hero-sub">CodeGuruAI — Socratic AI coding tutor. Never gives the answer. Asks the question that leads to it. Built for university CS.</p>
                        <div className="v16-hero-cta">
                            <Link href="/register" className="v16-btn-neon pink">Jack In →</Link>
                            <Link href="#features" className="v16-btn-neon cyan">Explore</Link>
                        </div>
                    </section>

                    <section className="v16-features" id="features">
                        <div className="v16-feat-grid">
                            <div className="v16-feat-card"><div className="v16-feat-icon">🧠</div><div className="v16-feat-title">Socratic AI</div><div className="v16-feat-desc">Identifies your misconception. Asks the precise question. Never reveals the answer. Builds real thinking.</div></div>
                            <div className="v16-feat-card"><div className="v16-feat-icon">⚡</div><div className="v16-feat-title">Code Runner</div><div className="v16-feat-desc">In-browser editor. Write, execute, test. Instant feedback. Zero setup. Python, JS, C++, Java.</div></div>
                            <div className="v16-feat-card"><div className="v16-feat-icon">🎯</div><div className="v16-feat-title">AI Generator</div><div className="v16-feat-desc">Create unique problems in seconds. Set params, get complete challenges. No recycled sets.</div></div>
                            <div className="v16-feat-card"><div className="v16-feat-icon">📊</div><div className="v16-feat-title">Analytics</div><div className="v16-feat-desc">Real-time classroom data. Submissions, completion, time-to-solve, hint patterns.</div></div>
                            <div className="v16-feat-card"><div className="v16-feat-icon">👥</div><div className="v16-feat-title">Classrooms</div><div className="v16-feat-desc">Create courses. Assign sets. Track students. Manage deadlines. Built for universities.</div></div>
                            <div className="v16-feat-card"><div className="v16-feat-icon">🔒</div><div className="v16-feat-title">Integrity</div><div className="v16-feat-desc">AI-unique problems = no answer pools. Every student proves their own understanding.</div></div>
                        </div>
                    </section>

                    <section className="v16-code-section">
                        <div className="v16-code-wrap">
                            <div className="v16-code-label">LIVE PREVIEW</div>
                            <div className="v16-code-body">
                                <div><span className="kw">def</span> <span className="fn">two_sum</span>(nums, target):</div>
                                <div>    <span className="cm"># Student&#39;s optimized solution</span></div>
                                <div>    seen = {'{}'}</div>
                                <div>    <span className="kw">for</span> i, n <span className="kw">in</span> <span className="fn">enumerate</span>(nums):</div>
                                <div>        <span className="kw">if</span> target - n <span className="kw">in</span> seen:</div>
                                <div>            <span className="str">return [seen[target-n], i]</span></div>
                                <div>        seen[n] = i</div>
                                <div style={{ marginTop: "1rem" }}><span className="str">✓ All test cases passed</span></div>
                                <div className="v16-code-hint">
                                    <div className="v16-code-hint-label">{"// SOCRATIC HINT"}</div>
                                    <div className="v16-code-hint-text">&ldquo;What data structure gives O(1) lookups?&rdquo;</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="v16-cta">
                        <h2 className="v16-cta-h2"><span className="v16-neon-cyan">READY TO</span> <span className="v16-neon-pink">JACK IN</span><span className="v16-neon-yellow">?</span></h2>
                        <p className="v16-cta-sub">Free for students. Full-featured for instructors. Join 15,000+ learners.</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
                            <Link href="/register" className="v16-btn-neon pink">Create Account →</Link>
                            <Link href="/login" className="v16-btn-neon cyan">Sign In</Link>
                        </div>
                    </section>

                    <footer className="v16-footer"><div className="v16-footer-inner"><span>© 2026 CodeGuruAI — ネオン・アカデミー</span><span>Built for learners who want to understand.</span></div></footer>
                </div>
            </div>
        </>
    )
}
