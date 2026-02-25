"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useEffect, useState } from "react"

/* ================================================================
   V26 — Vaporwave / Retrowave
   Sunset gradient sky, perspective grid floor, glitch VHS
   noise, palm tree silhouettes, Greek bust reference,
   chrome text, 80s color palette (pink, cyan, purple, orange),
   scan lines, floating geometric shapes, synthwave music vibes.
   Font: Monoton + Press Start 2P + DotGothic16
   ================================================================ */

export default function LandingV26() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [glitch, setGlitch] = useState(false)

    useEffect(() => {
        const t = setInterval(() => {
            setGlitch(true)
            setTimeout(() => setGlitch(false), 150)
        }, 4000)
        return () => clearInterval(t)
    }, [])

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Monoton&family=Press+Start+2P&family=DotGothic16&display=swap');

                .v26 {
                    --pink: #FF71CE; --cyan: #01CDFE; --purple: #B967FF;
                    --yellow: #FFFB96; --orange: #FF9F43;
                    --bg-top: #0D0221; --bg-mid: #1A0536; --sunset1: #FF6B6B;
                    --sunset2: #FF8E53; --sunset3: #FFC371;
                    font-family: 'DotGothic16', sans-serif;
                    min-height: 100vh; overflow-x: hidden;
                    background: linear-gradient(180deg,
                        var(--bg-top) 0%, var(--bg-mid) 30%,
                        #2D1B69 50%, var(--sunset1) 65%,
                        var(--sunset2) 75%, var(--sunset3) 85%,
                        var(--bg-top) 85.1%);
                    color: white; position: relative;
                }

                /* Scan lines */
                .v26::before {
                    content: ''; position: fixed; inset: 0; z-index: 100;
                    background: repeating-linear-gradient(0deg,
                        rgba(0,0,0,0.1) 0px, transparent 1px, transparent 3px);
                    pointer-events: none;
                }

                /* VHS noise */
                .v26-vhs {
                    position: fixed; inset: 0; z-index: 99;
                    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
                    pointer-events: none; mix-blend-mode: overlay;
                }

                /* Sun */
                .v26-sun {
                    position: absolute; top: 28%; left: 50%; transform: translateX(-50%);
                    width: 250px; height: 250px; border-radius: 50%;
                    background: linear-gradient(180deg, #FF6B6B 0%, #FF8E53 40%, #FFC371 100%);
                    box-shadow: 0 0 80px rgba(255,107,107,0.4), 0 0 160px rgba(255,142,83,0.2);
                    overflow: hidden;
                }
                .v26-sun-line { position: absolute; width: 100%; height: 4px; background: var(--bg-top); }

                /* Grid floor */
                .v26-grid-floor {
                    position: absolute; top: 62%; left: 0; right: 0; bottom: 0;
                    background: var(--bg-top);
                    overflow: hidden;
                }
                .v26-grid-perspective {
                    position: absolute; inset: 0;
                    background:
                        repeating-linear-gradient(90deg,
                            rgba(255,113,206,0.15) 0px, rgba(255,113,206,0.15) 1px, transparent 1px, transparent 60px),
                        repeating-linear-gradient(0deg,
                            rgba(1,205,254,0.1) 0px, rgba(1,205,254,0.1) 1px, transparent 1px, transparent 60px);
                    transform: perspective(400px) rotateX(55deg);
                    transform-origin: top center;
                    animation: v26scroll 3s linear infinite;
                }
                @keyframes v26scroll { 0% { background-position: 0 0; } 100% { background-position: 0 60px; } }

                /* Palm silhouettes */
                .v26-palm { position: absolute; font-size: 5rem; opacity: 0.15; }

                /* Content wrapper */
                .v26-content { position: relative; z-index: 10; padding: 2rem 3rem; }

                /* Nav */
                .v26-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
                .v26-logo { font-family: 'Monoton', cursive; font-size: 1.2rem; color: var(--cyan); text-shadow: 0 0 20px rgba(1,205,254,0.5); }
                .v26-nav-links { display: flex; gap: 0.5rem; }
                .v26-nav-btn {
                    font-family: 'Press Start 2P', monospace; font-size: 0.55rem;
                    padding: 0.6rem 1.25rem; text-decoration: none;
                    border: 2px solid var(--pink); color: var(--pink);
                    transition: all 0.2s;
                }
                .v26-nav-btn:hover { background: var(--pink); color: var(--bg-top); box-shadow: 0 0 20px rgba(255,113,206,0.4); }
                .v26-nav-btn.solid { background: var(--pink); color: var(--bg-top); }

                /* Hero */
                .v26-hero { text-align: center; padding: 4rem 0 2rem; position: relative; }
                .v26-h1 {
                    font-family: 'Monoton', cursive; font-size: 5rem;
                    background: linear-gradient(180deg, var(--pink) 0%, var(--cyan) 50%, var(--purple) 100%);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    text-shadow: none; line-height: 1.2; margin-bottom: 1rem;
                }
                .v26-h1.glitch { animation: v26glitch 0.15s linear; }
                @keyframes v26glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-3px, 2px); filter: hue-rotate(90deg); }
                    40% { transform: translate(3px, -2px); }
                    60% { transform: translate(-2px, -1px); filter: hue-rotate(-90deg); }
                    80% { transform: translate(2px, 1px); }
                    100% { transform: translate(0); }
                }
                .v26-subtitle {
                    font-family: 'Press Start 2P', monospace; font-size: 0.7rem;
                    color: var(--cyan); text-shadow: 0 0 10px rgba(1,205,254,0.5);
                    line-height: 2; letter-spacing: 0.1em;
                }
                .v26-jp { font-size: 1rem; color: var(--purple); opacity: 0.6; margin-top: 0.5rem; letter-spacing: 0.3em; }

                .v26-cta-row { display: flex; justify-content: center; gap: 1rem; margin-top: 2rem; }
                .v26-cta-btn {
                    font-family: 'Press Start 2P', monospace; font-size: 0.6rem;
                    padding: 1rem 2rem; text-decoration: none; transition: all 0.2s;
                }
                .v26-cta-btn.pink { background: var(--pink); color: var(--bg-top); box-shadow: 0 0 30px rgba(255,113,206,0.3); }
                .v26-cta-btn.pink:hover { box-shadow: 0 0 50px rgba(255,113,206,0.6); transform: translateY(-2px); }
                .v26-cta-btn.outline { border: 2px solid var(--cyan); color: var(--cyan); }
                .v26-cta-btn.outline:hover { background: var(--cyan); color: var(--bg-top); }

                /* Features section */
                .v26-features {
                    position: relative; z-index: 10;
                    padding: 6rem 3rem 3rem;
                }
                .v26-feat-title {
                    font-family: 'Monoton', cursive; font-size: 2rem;
                    text-align: center; color: var(--pink);
                    text-shadow: 0 0 20px rgba(255,113,206,0.3);
                    margin-bottom: 2.5rem;
                }
                .v26-feat-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
                .v26-feat-card {
                    background: rgba(13,2,33,0.7);
                    border: 1px solid rgba(255,113,206,0.2);
                    padding: 1.5rem; text-align: center;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s;
                }
                .v26-feat-card:hover { border-color: var(--pink); box-shadow: 0 0 30px rgba(255,113,206,0.15); transform: translateY(-4px); }
                .v26-feat-emoji { font-size: 2.5rem; margin-bottom: 0.75rem; }
                .v26-feat-name { font-family: 'Press Start 2P', monospace; font-size: 0.6rem; color: var(--cyan); margin-bottom: 0.75rem; text-transform: uppercase; }
                .v26-feat-desc { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.6; }

                /* Stats bar */
                .v26-stats {
                    position: relative; z-index: 10;
                    max-width: 900px; margin: 2rem auto;
                    display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap;
                    padding: 2rem;
                    border-top: 1px solid rgba(255,113,206,0.2);
                    border-bottom: 1px solid rgba(255,113,206,0.2);
                }
                .v26-stat { text-align: center; }
                .v26-stat-val { font-family: 'Monoton', cursive; font-size: 2rem; color: var(--yellow); text-shadow: 0 0 15px rgba(255,251,150,0.3); }
                .v26-stat-label { font-family: 'Press Start 2P', monospace; font-size: 0.45rem; color: var(--purple); margin-top: 0.3rem; letter-spacing: 0.1em; }

                /* Footer */
                .v26-footer {
                    position: relative; z-index: 10;
                    text-align: center; padding: 3rem; font-size: 0.75rem;
                    color: rgba(255,255,255,0.3);
                }

                /* Floating shapes */
                .v26-shape { position: absolute; z-index: 5; animation: v26float 6s ease-in-out infinite; }
                @keyframes v26float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(10deg); } }
                .v26-triangle { width: 0; height: 0; border-left: 25px solid transparent; border-right: 25px solid transparent; border-bottom: 45px solid; opacity: 0.1; }
                .v26-circle { width: 40px; height: 40px; border-radius: 50%; border: 2px solid; opacity: 0.1; }

                @media (max-width: 800px) {
                    .v26-h1 { font-size: 2.5rem; }
                    .v26-feat-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="v26">
                <div className="v26-vhs" />

                {/* Sun */}
                <div className="v26-sun">
                    {[40, 48, 55, 61, 66, 70, 73, 76, 79, 82, 85, 88, 91, 94].map((p, i) => (
                        <div key={i} className="v26-sun-line" style={{ top: `${p}%` }} />
                    ))}
                </div>

                {/* Grid floor */}
                <div className="v26-grid-floor"><div className="v26-grid-perspective" /></div>

                {/* Palms */}
                <div className="v26-palm" style={{ left: "3%", top: "30%" }}>🌴</div>
                <div className="v26-palm" style={{ right: "5%", top: "28%", fontSize: "4rem" }}>🌴</div>

                {/* Floating shapes */}
                <div className="v26-shape" style={{ top: "15%", left: "8%" }}><div className="v26-triangle" style={{ borderBottomColor: "var(--pink)" }} /></div>
                <div className="v26-shape" style={{ top: "20%", right: "12%", animationDelay: "2s" }}><div className="v26-circle" style={{ borderColor: "var(--cyan)" }} /></div>
                <div className="v26-shape" style={{ top: "50%", left: "15%", animationDelay: "4s" }}><div className="v26-circle" style={{ borderColor: "var(--purple)" }} /></div>

                {/* Content */}
                <div className="v26-content">
                    <nav className="v26-nav">
                        <div className="v26-logo">C O D E G U R U</div>
                        <div className="v26-nav-links">
                            {user ? (
                                <Link href={dashboardHref} className="v26-nav-btn solid">DASHBOARD</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v26-nav-btn">LOGIN</Link>
                                    <Link href="/register" className="v26-nav-btn solid">JACK IN</Link>
                                </>
                            )}
                        </div>
                    </nav>

                    <section className="v26-hero">
                        <h1 className={`v26-h1 ${glitch ? "glitch" : ""}`}>CODE<br/>GURU</h1>
                        <div className="v26-subtitle">
                            SOCRATIC AI TUTOR ▓▓▓ NEVER GIVES ANSWERS<br/>
                            ASKS THE QUESTION THAT LEADS TO WISDOM
                        </div>
                        <div className="v26-jp">ソクラテス式 ▸ 人工知能 ▸ コーディング</div>
                        <div className="v26-cta-row">
                            <Link href="/register" className="v26-cta-btn pink">▶ START FREE</Link>
                            <Link href="#features" className="v26-cta-btn outline">EXPLORE ▸</Link>
                        </div>
                    </section>
                </div>

                <section className="v26-features" id="features">
                    <h2 className="v26-feat-title">S Y S T E M S</h2>
                    <div className="v26-feat-grid">
                        <div className="v26-feat-card"><div className="v26-feat-emoji">🧠</div><div className="v26-feat-name">Socratic AI</div><div className="v26-feat-desc">Identifies your misconception. Asks the perfect question. Never reveals answers.</div></div>
                        <div className="v26-feat-card"><div className="v26-feat-emoji">⚡</div><div className="v26-feat-name">Code Runner</div><div className="v26-feat-desc">In-browser IDE. Python, JS, C++, Java. Write, run, debug — zero setup.</div></div>
                        <div className="v26-feat-card"><div className="v26-feat-emoji">🎯</div><div className="v26-feat-name">AI Generator</div><div className="v26-feat-desc">Unique problems every semester. Complete test suites. No recycled sets.</div></div>
                        <div className="v26-feat-card"><div className="v26-feat-emoji">📊</div><div className="v26-feat-name">Analytics</div><div className="v26-feat-desc">Real-time data: submissions, completion, time, hint patterns.</div></div>
                        <div className="v26-feat-card"><div className="v26-feat-emoji">🏛️</div><div className="v26-feat-name">Classrooms</div><div className="v26-feat-desc">Courses, assignments, deadlines, enrollment, grade export.</div></div>
                        <div className="v26-feat-card"><div className="v26-feat-emoji">🛡️</div><div className="v26-feat-name">Integrity</div><div className="v26-feat-desc">AI-unique problems. No answer pools. Anti-cheat by design.</div></div>
                    </div>
                </section>

                <div className="v26-stats">
                    <div className="v26-stat"><div className="v26-stat-val">15K+</div><div className="v26-stat-label">STUDENTS</div></div>
                    <div className="v26-stat"><div className="v26-stat-val">94%</div><div className="v26-stat-label">COMPLETION</div></div>
                    <div className="v26-stat"><div className="v26-stat-val">250+</div><div className="v26-stat-label">UNIVERSITIES</div></div>
                    <div className="v26-stat"><div className="v26-stat-val">4.9★</div><div className="v26-stat-label">RATING</div></div>
                </div>

                <div className="v26-footer">© 2026 CODEGURUAI ░░░ VAPORWAVE EDITION ░░░ FREE FOR STUDENTS</div>
            </div>
        </>
    )
}
