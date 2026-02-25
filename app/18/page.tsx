"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V18 — Vintage Bauhaus Poster
   Bold geometric shapes, primary colors (red, blue, yellow, black),
   constructivist typography, asymmetric layouts, circles, squares,
   diagonal lines. Feels like a museum art poster.
   Font: Bebas Neue + Montserrat
   ================================================================ */

export default function LandingV18() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600;700;900&display=swap');

                .v18 {
                    --red: #D12B2B;
                    --blue: #1A3A8A;
                    --yellow: #F2C12E;
                    --black: #111111;
                    --cream: #F5F0E0;
                    --gray: #888;
                    font-family: 'Montserrat', sans-serif;
                    background: var(--cream);
                    color: var(--black);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                /* Hero — giant poster layout */
                .v18-hero {
                    min-height: 100vh; display: grid;
                    grid-template-columns: 1fr 1fr;
                    position: relative; overflow: hidden;
                }
                .v18-hero-left {
                    background: var(--black); color: var(--cream);
                    padding: 4rem 3rem; display: flex; flex-direction: column;
                    justify-content: center; position: relative; z-index: 1;
                }
                .v18-hero-right {
                    background: var(--red); position: relative;
                    display: flex; align-items: center; justify-content: center;
                }

                /* Geometric shapes */
                .v18-circle {
                    position: absolute; border-radius: 50%;
                }
                .v18-circle.c1 { width: 400px; height: 400px; background: var(--yellow); top: -80px; right: -100px; opacity: 0.9; }
                .v18-circle.c2 { width: 200px; height: 200px; background: var(--blue); bottom: 60px; left: -40px; }
                .v18-circle.c3 { width: 120px; height: 120px; border: 8px solid var(--cream); bottom: 200px; right: 60px; background: transparent; }
                .v18-square { position: absolute; width: 80px; height: 80px; background: var(--cream); top: 40%; left: 30%; transform: rotate(15deg); }

                /* Diagonal stripe */
                .v18-stripe {
                    position: absolute; top: 0; left: -10%;
                    width: 120%; height: 80px; background: var(--yellow);
                    transform: rotate(-5deg); z-index: 0;
                    top: 65%;
                }

                .v18-brand {
                    font-family: 'Bebas Neue', cursive; font-size: 1.5rem;
                    letter-spacing: 0.3em; margin-bottom: 3rem; color: var(--yellow);
                }
                .v18-h1 {
                    font-family: 'Bebas Neue', cursive; font-size: 7rem;
                    line-height: 0.95; letter-spacing: 0.02em;
                    margin-bottom: 1.5rem;
                }
                .v18-h1 .red { color: var(--red); }
                .v18-h1 .yellow { color: var(--yellow); }
                .v18-hero-sub {
                    font-size: 0.95rem; line-height: 1.75; color: #aaa;
                    max-width: 400px; margin-bottom: 2.5rem;
                }
                .v18-hero-cta { display: flex; gap: 0.75rem; }
                .v18-btn {
                    font-family: 'Bebas Neue', cursive; font-size: 1.2rem;
                    padding: 0.75rem 2.25rem; letter-spacing: 0.15em;
                    text-decoration: none; transition: all 0.2s;
                    display: inline-block;
                }
                .v18-btn.red { background: var(--red); color: var(--cream); }
                .v18-btn.red:hover { background: #b51f1f; }
                .v18-btn.outline { background: transparent; color: var(--cream); border: 2px solid var(--cream); }
                .v18-btn.outline:hover { background: var(--cream); color: var(--black); }

                /* Right panel text */
                .v18-poster-text {
                    position: relative; z-index: 2; text-align: center; padding: 2rem;
                }
                .v18-poster-big {
                    font-family: 'Bebas Neue', cursive; font-size: 5rem;
                    color: var(--cream); line-height: 1;
                    text-shadow: 3px 3px 0 rgba(0,0,0,0.2);
                }
                .v18-poster-sub { font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 1rem; font-weight: 600; letter-spacing: 0.05em; }

                /* Features section */
                .v18-features { padding: 5rem 3rem; max-width: 1200px; margin: 0 auto; }
                .v18-feat-header { display: flex; align-items: flex-end; gap: 2rem; margin-bottom: 3rem; }
                .v18-feat-dot { width: 80px; height: 80px; border-radius: 50%; background: var(--red); flex-shrink: 0; }
                .v18-feat-h2 { font-family: 'Bebas Neue', cursive; font-size: 4rem; line-height: 0.95; }

                .v18-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
                .v18-feat-card { padding: 2rem; border: 2px solid var(--black); position: relative; }
                .v18-feat-card:nth-child(odd) { background: var(--cream); }
                .v18-feat-card:nth-child(even) { background: var(--black); color: var(--cream); }
                .v18-feat-num { font-family: 'Bebas Neue', cursive; font-size: 3rem; color: var(--red); line-height: 1; margin-bottom: 0.75rem; }
                .v18-feat-card:nth-child(even) .v18-feat-num { color: var(--yellow); }
                .v18-feat-name { font-family: 'Bebas Neue', cursive; font-size: 1.4rem; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
                .v18-feat-desc { font-size: 0.82rem; line-height: 1.6; opacity: 0.7; }

                /* Stats bar */
                .v18-stats { display: flex; background: var(--blue); }
                .v18-stat {
                    flex: 1; padding: 2.5rem; text-align: center; color: var(--cream);
                    border-right: 2px solid rgba(255,255,255,0.1);
                }
                .v18-stat:last-child { border-right: none; }
                .v18-stat-val { font-family: 'Bebas Neue', cursive; font-size: 3rem; }
                .v18-stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.7; margin-top: 0.25rem; }

                /* CTA poster */
                .v18-cta { display: grid; grid-template-columns: 1fr 1fr; min-height: 400px; }
                .v18-cta-left {
                    background: var(--yellow); display: flex; align-items: center;
                    justify-content: center; padding: 3rem; position: relative;
                }
                .v18-cta-geo { width: 200px; height: 200px; background: var(--red); transform: rotate(45deg); }
                .v18-cta-right {
                    background: var(--black); color: var(--cream); display: flex;
                    flex-direction: column; align-items: center; justify-content: center;
                    padding: 3rem; text-align: center;
                }
                .v18-cta-h2 { font-family: 'Bebas Neue', cursive; font-size: 3.5rem; margin-bottom: 1rem; line-height: 0.95; }
                .v18-cta-sub { font-size: 0.85rem; color: #aaa; margin-bottom: 2rem; }

                /* Footer */
                .v18-footer { padding: 1.5rem 3rem; display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--gray); border-top: 2px solid var(--black); }

                @media (max-width: 800px) {
                    .v18-hero { grid-template-columns: 1fr; }
                    .v18-h1 { font-size: 4rem; }
                    .v18-feat-grid { grid-template-columns: 1fr; }
                    .v18-cta { grid-template-columns: 1fr; }
                    .v18-stats { flex-direction: column; }
                }
            `}</style>

            <div className="v18">
                {/* Hero */}
                <section className="v18-hero">
                    <div className="v18-hero-left">
                        <div className="v18-brand">CODEGURUAI</div>
                        <h1 className="v18-h1">THE AI<br/>THAT<br/><span className="red">ASKS</span><br/><span className="yellow">NOT</span><br/>TELLS</h1>
                        <p className="v18-hero-sub">Socratic AI coding tutor for university classrooms. Questions that build understanding. Never the answer.</p>
                        <div className="v18-hero-cta">
                            {user ? (
                                <Link href={dashboardHref} className="v18-btn red">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/register" className="v18-btn red">Begin</Link>
                                    <Link href="/login" className="v18-btn outline">Sign In</Link>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="v18-hero-right">
                        <div className="v18-circle c1" />
                        <div className="v18-circle c2" />
                        <div className="v18-circle c3" />
                        <div className="v18-square" />
                        <div className="v18-stripe" />
                        <div className="v18-poster-text">
                            <div className="v18-poster-big">THINK<br/>DON&apos;T<br/>COPY</div>
                            <div className="v18-poster-sub">SOCRATIC METHOD · EST. 470 BCE</div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="v18-features">
                    <div className="v18-feat-header">
                        <div className="v18-feat-dot" />
                        <h2 className="v18-feat-h2">PLATFORM<br/>MODULES</h2>
                    </div>
                    <div className="v18-feat-grid">
                        <div className="v18-feat-card"><div className="v18-feat-num">01</div><div className="v18-feat-name">SOCRATIC AI</div><div className="v18-feat-desc">Questions that target misconceptions. Never gives the answer. Builds genuine reasoning.</div></div>
                        <div className="v18-feat-card"><div className="v18-feat-num">02</div><div className="v18-feat-name">LIVE CODE</div><div className="v18-feat-desc">In-browser editor. Write, run, test. Instant feedback. Python, JS, C++, Java.</div></div>
                        <div className="v18-feat-card"><div className="v18-feat-num">03</div><div className="v18-feat-name">AI GENERATOR</div><div className="v18-feat-desc">Unique problems every semester. Set params, get complete challenges with test cases.</div></div>
                        <div className="v18-feat-card"><div className="v18-feat-num">04</div><div className="v18-feat-name">ANALYTICS</div><div className="v18-feat-desc">Real-time dashboards. Submissions, time, hints, completion — all tracked.</div></div>
                        <div className="v18-feat-card"><div className="v18-feat-num">05</div><div className="v18-feat-name">CLASSROOMS</div><div className="v18-feat-desc">Create courses. Assign sets. Manage students. Track deadlines.</div></div>
                        <div className="v18-feat-card"><div className="v18-feat-num">06</div><div className="v18-feat-name">INTEGRITY</div><div className="v18-feat-desc">AI-unique problems — no answer pools. Every student proves their own understanding.</div></div>
                    </div>
                </section>

                {/* Stats */}
                <div className="v18-stats">
                    <div className="v18-stat"><div className="v18-stat-val">15,000+</div><div className="v18-stat-label">Students</div></div>
                    <div className="v18-stat"><div className="v18-stat-val">94%</div><div className="v18-stat-label">Completion</div></div>
                    <div className="v18-stat"><div className="v18-stat-val">250+</div><div className="v18-stat-label">Universities</div></div>
                    <div className="v18-stat"><div className="v18-stat-val">4.9★</div><div className="v18-stat-label">Rating</div></div>
                </div>

                {/* CTA */}
                <section className="v18-cta">
                    <div className="v18-cta-left"><div className="v18-cta-geo" /></div>
                    <div className="v18-cta-right">
                        <h2 className="v18-cta-h2">START<br/>THINKING<br/>TODAY</h2>
                        <p className="v18-cta-sub">Free for students. Full-featured for instructors.</p>
                        <Link href="/register" className="v18-btn red">Create Account →</Link>
                    </div>
                </section>

                <footer className="v18-footer">
                    <span>© 2026 CodeGuruAI</span>
                    <span>BAUHAUS INSPIRED · SOCRATES APPROVED</span>
                </footer>
            </div>
        </>
    )
}
