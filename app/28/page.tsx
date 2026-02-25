"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useEffect, useState } from "react"

/* ================================================================
   V28 — Film Noir / Cinematic Credits
   The page scrolls like movie end credits. Letterbox bars,
   film grain overlay, dramatic spotlight, noir typography,
   fade-in reveals, cinematic quotes, title cards.
   Font: Playfair Display + Cormorant + Source Code Pro
   ================================================================ */

export default function LandingV28() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [visible, setVisible] = useState<number[]>([])

    useEffect(() => {
        const timers = Array.from({ length: 12 }, (_, i) =>
            setTimeout(() => setVisible(v => [...v, i]), 800 + i * 600)
        )
        return () => timers.forEach(clearTimeout)
    }, [])

    const vis = (i: number) => visible.includes(i) ? "v28-visible" : ""

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Cormorant:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Source+Code+Pro:wght@400;600&display=swap');

                .v28 {
                    --bg: #0A0A0A; --text: #E8E6E0; --gold: #C9A84C;
                    --dim: #666; --faint: #333;
                    font-family: 'Cormorant', 'Georgia', serif;
                    background: var(--bg); color: var(--text);
                    min-height: 100vh; position: relative;
                    overflow-x: hidden;
                }

                /* Film grain */
                .v28::before {
                    content: ''; position: fixed; inset: 0; z-index: 100;
                    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
                    pointer-events: none; mix-blend-mode: overlay;
                }

                /* Letterbox */
                .v28-letterbox-top, .v28-letterbox-bottom {
                    position: fixed; left: 0; right: 0; height: 60px;
                    background: black; z-index: 90;
                }
                .v28-letterbox-top { top: 0; }
                .v28-letterbox-bottom { bottom: 0; }

                /* Spotlight vignette */
                .v28-vignette {
                    position: fixed; inset: 0; z-index: 5;
                    background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%);
                    pointer-events: none;
                }

                /* Content */
                .v28-content {
                    max-width: 700px; margin: 0 auto;
                    padding: 120px 2rem 120px;
                    text-align: center; position: relative; z-index: 10;
                }

                /* Fade-in */
                .v28-block {
                    opacity: 0; transform: translateY(30px);
                    transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
                    margin-bottom: 4rem;
                }
                .v28-block.v28-visible { opacity: 1; transform: translateY(0); }

                /* Nav */
                .v28-nav {
                    position: fixed; top: 60px; left: 0; right: 0;
                    display: flex; justify-content: space-between;
                    align-items: center; padding: 0.75rem 2rem;
                    z-index: 80; background: rgba(10,10,10,0.8);
                    backdrop-filter: blur(8px);
                }
                .v28-logo {
                    font-family: 'Playfair Display', serif; font-size: 1rem;
                    font-weight: 700; letter-spacing: 0.15em; color: var(--gold);
                }
                .v28-nav-links { display: flex; gap: 0.75rem; }
                .v28-nav-link {
                    font-family: 'Cormorant', serif; font-size: 0.85rem;
                    color: var(--text); text-decoration: none;
                    padding: 0.3rem 1rem; letter-spacing: 0.1em;
                    border: 1px solid transparent; transition: all 0.3s;
                }
                .v28-nav-link:hover { border-color: var(--gold); color: var(--gold); }
                .v28-nav-link.gold { border-color: var(--gold); color: var(--gold); }

                /* Title card */
                .v28-studio { font-size: 0.85rem; letter-spacing: 0.4em; text-transform: uppercase; color: var(--dim); margin-bottom: 3rem; }
                .v28-title {
                    font-family: 'Playfair Display', serif; font-size: 5rem;
                    font-weight: 900; line-height: 1.1; margin-bottom: 1.5rem;
                    letter-spacing: -0.02em;
                }
                .v28-title .italic { font-style: italic; font-weight: 400; color: var(--gold); }
                .v28-tagline {
                    font-size: 1.3rem; font-style: italic; font-weight: 300;
                    color: var(--dim); letter-spacing: 0.05em; line-height: 1.6;
                }

                /* Divider */
                .v28-divider { display: flex; align-items: center; justify-content: center; gap: 1rem; }
                .v28-divider-line { width: 80px; height: 1px; background: var(--faint); }
                .v28-divider-star { color: var(--gold); font-size: 0.8rem; }

                /* Quote card */
                .v28-quote-card { position: relative; padding: 2rem 0; }
                .v28-quote-marks { font-family: 'Playfair Display', serif; font-size: 5rem; color: var(--gold); opacity: 0.3; line-height: 0.5; }
                .v28-quote-text {
                    font-family: 'Playfair Display', serif; font-size: 1.6rem;
                    font-style: italic; line-height: 1.6; margin: 1rem 0;
                }
                .v28-quote-attr { font-size: 0.85rem; color: var(--gold); letter-spacing: 0.2em; text-transform: uppercase; }

                /* Credits block */
                .v28-credit-section { margin-bottom: 1.5rem; }
                .v28-credit-role {
                    font-size: 0.75rem; letter-spacing: 0.3em; text-transform: uppercase;
                    color: var(--dim); margin-bottom: 0.5rem;
                }
                .v28-credit-name {
                    font-family: 'Playfair Display', serif; font-size: 1.8rem;
                    font-weight: 700; color: var(--text);
                }
                .v28-credit-desc {
                    font-size: 1rem; color: var(--dim); font-style: italic;
                    margin-top: 0.3rem; line-height: 1.6;
                }

                /* Stats */
                .v28-stats { display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap; }
                .v28-stat { text-align: center; }
                .v28-stat-val { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 900; color: var(--gold); }
                .v28-stat-label { font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--dim); margin-top: 0.25rem; }

                /* Code in noir */
                .v28-code {
                    font-family: 'Source Code Pro', monospace; font-size: 0.8rem;
                    background: rgba(255,255,255,0.03); border: 1px solid var(--faint);
                    padding: 1.25rem; text-align: left; line-height: 1.8;
                    color: var(--dim); margin: 1.5rem 0;
                }
                .v28-code .highlight { color: var(--gold); }
                .v28-code .green { color: #6A9955; }

                /* CTA */
                .v28-cta-btn {
                    font-family: 'Playfair Display', serif; font-size: 1.1rem;
                    font-weight: 700; letter-spacing: 0.15em;
                    padding: 1rem 3rem; border: 2px solid var(--gold);
                    color: var(--gold); text-decoration: none;
                    display: inline-block; transition: all 0.3s;
                }
                .v28-cta-btn:hover { background: var(--gold); color: var(--bg); }

                .v28-fin { font-family: 'Playfair Display', serif; font-size: 2rem; font-style: italic; color: var(--gold); margin-top: 4rem; }
                .v28-footer { font-size: 0.7rem; color: var(--faint); letter-spacing: 0.15em; margin-top: 2rem; }

                @media (max-width: 600px) { .v28-title { font-size: 2.5rem; } }
            `}</style>

            <div className="v28">
                <div className="v28-letterbox-top" />
                <div className="v28-letterbox-bottom" />
                <div className="v28-vignette" />

                <nav className="v28-nav">
                    <div className="v28-logo">CODEGURUAI</div>
                    <div className="v28-nav-links">
                        {user ? (
                            <Link href={dashboardHref} className="v28-nav-link gold">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v28-nav-link">Enter</Link>
                                <Link href="/register" className="v28-nav-link gold">Begin</Link>
                            </>
                        )}
                    </div>
                </nav>

                <div className="v28-content">
                    <div className={`v28-block ${vis(0)}`}>
                        <div className="v28-studio">A CODEGURUAI PRODUCTION</div>
                    </div>

                    <div className={`v28-block ${vis(1)}`}>
                        <h1 className="v28-title">The AI That<br/><span className="italic">Questions</span></h1>
                        <p className="v28-tagline">A Socratic AI coding tutor that never gives the answer — only the question that leads to understanding.</p>
                    </div>

                    <div className={`v28-block ${vis(2)}`}>
                        <div className="v28-divider"><div className="v28-divider-line" /><div className="v28-divider-star">✦</div><div className="v28-divider-line" /></div>
                    </div>

                    <div className={`v28-block ${vis(3)}`}>
                        <div className="v28-quote-card">
                            <div className="v28-quote-marks">&ldquo;</div>
                            <div className="v28-quote-text">The productive struggle is where learning happens. Our AI protects that struggle.</div>
                            <div className="v28-quote-attr">— The CodeGuruAI Manifesto</div>
                        </div>
                    </div>

                    <div className={`v28-block ${vis(4)}`}>
                        <div className="v28-credit-section"><div className="v28-credit-role">Starring</div><div className="v28-credit-name">The Socratic Engine</div><div className="v28-credit-desc">Analyzes code, identifies misconceptions, generates targeted questions — never answers</div></div>
                    </div>

                    <div className={`v28-block ${vis(5)}`}>
                        <div className="v28-credit-section"><div className="v28-credit-role">Co-Starring</div><div className="v28-credit-name">The Code Arena</div><div className="v28-credit-desc">In-browser IDE — Python, JavaScript, C++, Java — instant test feedback, zero setup</div></div>
                    </div>

                    <div className={`v28-block ${vis(6)}`}>
                        <div className="v28-credit-section"><div className="v28-credit-role">Featuring</div><div className="v28-credit-name">The Artificer</div><div className="v28-credit-desc">AI-powered problem generation — unique challenges with complete test suites, every semester</div></div>
                    </div>

                    <div className={`v28-block ${vis(7)}`}>
                        <div className="v28-code">
                            <div><span className="green"># The scene unfolds...</span></div>
                            <div>student.submit(two_sum, approach=<span className="highlight">&quot;brute_force&quot;</span>)</div>
                            <div><span className="green"># Result: Time Limit Exceeded</span></div>
                            <div></div>
                            <div>hint = socratic_ai.ask()</div>
                            <div><span className="green"># &quot;What data structure gives O(1) lookups?&quot;</span></div>
                            <div></div>
                            <div>student.realize(<span className="highlight">&quot;hash_map&quot;</span>)</div>
                            <div>student.submit(two_sum, approach=<span className="highlight">&quot;optimal&quot;</span>)</div>
                            <div><span className="green"># ✓ All tests passed. Understanding: ACHIEVED.</span></div>
                        </div>
                    </div>

                    <div className={`v28-block ${vis(8)}`}>
                        <div className="v28-stats">
                            <div className="v28-stat"><div className="v28-stat-val">15K+</div><div className="v28-stat-label">Students</div></div>
                            <div className="v28-stat"><div className="v28-stat-val">94%</div><div className="v28-stat-label">Completion</div></div>
                            <div className="v28-stat"><div className="v28-stat-val">250+</div><div className="v28-stat-label">Universities</div></div>
                            <div className="v28-stat"><div className="v28-stat-val">4.9★</div><div className="v28-stat-label">Rating</div></div>
                        </div>
                    </div>

                    <div className={`v28-block ${vis(9)}`}>
                        <div className="v28-divider"><div className="v28-divider-line" /><div className="v28-divider-star">✦</div><div className="v28-divider-line" /></div>
                    </div>

                    <div className={`v28-block ${vis(10)}`}>
                        <p style={{ fontSize: "1.1rem", fontStyle: "italic", color: "var(--dim)", marginBottom: "2rem" }}>Free for every student who seeks to understand.<br/>Full instruments for instructors who kindle the flame.</p>
                        <Link href="/register" className="v28-cta-btn">Enter the Story →</Link>
                    </div>

                    <div className={`v28-block ${vis(11)}`}>
                        <div className="v28-fin">Fin.</div>
                        <div className="v28-footer">© MMXXVI CODEGURUAI · ALL RIGHTS RESERVED</div>
                    </div>
                </div>
            </div>
        </>
    )
}
