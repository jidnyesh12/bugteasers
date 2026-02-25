"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V4 — Full-Bleed Cinematic
   Full-viewport sections. Charcoal + warm amber + ivory.
   Fonts: Outfit (sans) + Source Serif 4 (display)
   Layout: Each section = 100vh, dramatically centered
   ================================================================ */

export default function LandingV4() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;0,900;1,400&display=swap');

                .v4-root {
                    --v4-charcoal: #1C1C1E;
                    --v4-charcoal-light: #2C2C2E;
                    --v4-charcoal-mid: #3A3A3C;
                    --v4-ivory: #FAF9F6;
                    --v4-ivory-dim: #B8B5AE;
                    --v4-ivory-muted: #7A7872;
                    --v4-amber: #E8A849;
                    --v4-amber-dim: #C48A36;
                    --v4-border: #3A3A3C;
                    font-family: 'Outfit', sans-serif;
                    background: var(--v4-charcoal);
                    color: var(--v4-ivory);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                .v4-serif {
                    font-family: 'Source Serif 4', serif;
                }

                /* Navbar — transparent overlay */
                .v4-nav {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 50;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 3rem;
                    height: 4.5rem;
                    background: rgba(28, 28, 30, 0.7);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .v4-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .v4-nav-brand-text {
                    font-family: 'Source Serif 4', serif;
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: var(--v4-ivory);
                }
                .v4-nav-brand-text .accent { color: var(--v4-amber); }

                .v4-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .v4-nav-link {
                    padding: 0.45rem 1rem;
                    font-size: 0.82rem;
                    font-weight: 500;
                    color: var(--v4-ivory-dim);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .v4-nav-link:hover { color: var(--v4-ivory); }

                .v4-nav-btn {
                    padding: 0.5rem 1.5rem;
                    font-size: 0.82rem;
                    font-weight: 700;
                    background: var(--v4-amber);
                    color: var(--v4-charcoal);
                    border-radius: 8px;
                    text-decoration: none;
                    transition: background 0.2s;
                }
                .v4-nav-btn:hover { background: var(--v4-amber-dim); }

                /* Full-viewport sections */
                .v4-section {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .v4-section-inner {
                    max-width: 1100px;
                    width: 100%;
                    padding: 6rem 3rem;
                }

                /* Section 1: Hero */
                .v4-hero-bg {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse at 30% 50%, rgba(232,168,73,0.06) 0%, transparent 60%),
                        radial-gradient(ellipse at 70% 80%, rgba(232,168,73,0.04) 0%, transparent 50%);
                }

                .v4-hero-content {
                    text-align: center;
                    position: relative;
                    z-index: 1;
                }

                .v4-hero-overline {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.3em;
                    color: var(--v4-amber);
                    margin-bottom: 2rem;
                }

                .v4-hero-heading {
                    font-family: 'Source Serif 4', serif;
                    font-size: 5rem;
                    font-weight: 900;
                    line-height: 1.05;
                    color: var(--v4-ivory);
                    margin-bottom: 2rem;
                    letter-spacing: -0.03em;
                }

                .v4-hero-heading em {
                    font-style: italic;
                    color: var(--v4-amber);
                }

                .v4-hero-sub {
                    font-size: 1.2rem;
                    color: var(--v4-ivory-dim);
                    line-height: 1.65;
                    max-width: 560px;
                    margin: 0 auto 3rem;
                }

                .v4-hero-cta {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                }

                .v4-btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 2.5rem;
                    font-size: 0.95rem;
                    font-weight: 700;
                    background: var(--v4-amber);
                    color: var(--v4-charcoal);
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .v4-btn-primary:hover { background: var(--v4-amber-dim); transform: translateY(-2px); }

                .v4-btn-ghost {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 2.5rem;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--v4-ivory-dim);
                    border: 1px solid var(--v4-border);
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .v4-btn-ghost:hover { border-color: var(--v4-ivory-dim); color: var(--v4-ivory); }

                .v4-scroll-indicator {
                    position: absolute;
                    bottom: 2.5rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--v4-ivory-muted);
                    font-size: 0.7rem;
                    font-weight: 600;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    animation: v4float 2s ease-in-out infinite;
                }

                @keyframes v4float {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(6px); }
                }

                /* Section 2: Features */
                .v4-features-bg {
                    background: var(--v4-charcoal-light);
                }

                .v4-features-heading {
                    font-family: 'Source Serif 4', serif;
                    font-size: 3rem;
                    font-weight: 900;
                    line-height: 1.15;
                    margin-bottom: 1rem;
                    letter-spacing: -0.02em;
                }

                .v4-features-heading em {
                    font-style: italic;
                    color: var(--v4-amber);
                }

                .v4-features-sub {
                    font-size: 1.05rem;
                    color: var(--v4-ivory-dim);
                    line-height: 1.65;
                    margin-bottom: 3.5rem;
                    max-width: 540px;
                }

                .v4-features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                }

                .v4-feat-card {
                    padding: 2.25rem;
                    border: 1px solid var(--v4-border);
                    border-radius: 14px;
                    background: rgba(255,255,255,0.02);
                    transition: border-color 0.2s, background 0.2s;
                }
                .v4-feat-card:hover {
                    border-color: rgba(232,168,73,0.3);
                    background: rgba(255,255,255,0.04);
                }

                .v4-feat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                    background: rgba(232,168,73,0.1);
                }

                .v4-feat-title {
                    font-size: 1.1rem;
                    font-weight: 800;
                    margin-bottom: 0.75rem;
                    letter-spacing: -0.02em;
                }

                .v4-feat-desc {
                    font-size: 0.88rem;
                    color: var(--v4-ivory-dim);
                    line-height: 1.6;
                }

                /* Section 3: Philosophy */
                .v4-phil-inner {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 5rem;
                    align-items: center;
                }

                .v4-phil-heading {
                    font-family: 'Source Serif 4', serif;
                    font-size: 3.25rem;
                    font-weight: 900;
                    line-height: 1.15;
                    letter-spacing: -0.02em;
                }

                .v4-phil-heading .dim {
                    color: var(--v4-ivory-muted);
                }

                .v4-phil-right {
                    display: flex;
                    flex-direction: column;
                    gap: 2.5rem;
                }

                .v4-phil-card {
                    padding-left: 1.5rem;
                    border-left: 3px solid var(--v4-amber);
                }

                .v4-phil-card-label {
                    font-size: 0.72rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--v4-amber);
                    margin-bottom: 0.6rem;
                }

                .v4-phil-card-text {
                    font-size: 0.95rem;
                    color: var(--v4-ivory-dim);
                    line-height: 1.65;
                }

                /* Section 4: CTA */
                .v4-cta-bg {
                    background: var(--v4-charcoal-light);
                    position: relative;
                }

                .v4-cta-bg::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(ellipse at 50% 30%, rgba(232,168,73,0.07), transparent 70%);
                }

                .v4-cta-content {
                    text-align: center;
                    position: relative;
                    z-index: 1;
                }

                .v4-cta-heading {
                    font-family: 'Source Serif 4', serif;
                    font-size: 3.5rem;
                    font-weight: 900;
                    margin-bottom: 1.25rem;
                    letter-spacing: -0.02em;
                    line-height: 1.1;
                }

                .v4-cta-sub {
                    font-size: 1.1rem;
                    color: var(--v4-ivory-dim);
                    margin-bottom: 2.5rem;
                    line-height: 1.6;
                    max-width: 480px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .v4-cta-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 6rem;
                }

                /* Footer */
                .v4-footer {
                    border-top: 1px solid var(--v4-border);
                    padding: 3rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 2rem;
                    max-width: 1100px;
                    margin: 0 auto;
                }

                .v4-footer-brand p {
                    font-size: 0.78rem;
                    color: var(--v4-ivory-muted);
                    margin-top: 0.75rem;
                    max-width: 260px;
                    line-height: 1.6;
                }

                .v4-footer-cols {
                    display: flex;
                    gap: 4rem;
                }

                .v4-footer-col-title {
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: var(--v4-ivory-muted);
                    margin-bottom: 1rem;
                }

                .v4-footer-col ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .v4-footer-col li { margin-bottom: 0.5rem; }

                .v4-footer-col a {
                    font-size: 0.78rem;
                    color: var(--v4-ivory-dim);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .v4-footer-col a:hover { color: var(--v4-ivory); }

                .v4-footer-bottom {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 1.5rem 3rem;
                    border-top: 1px solid var(--v4-border);
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.72rem;
                    color: var(--v4-ivory-muted);
                }

                @media (max-width: 768px) {
                    .v4-hero-heading { font-size: 2.75rem; }
                    .v4-features-grid { grid-template-columns: 1fr; }
                    .v4-phil-inner { grid-template-columns: 1fr; gap: 2.5rem; }
                    .v4-phil-heading { font-size: 2.25rem; }
                    .v4-nav { padding: 0 1.5rem; }
                    .v4-section-inner { padding: 5rem 1.5rem; }
                    .v4-hero-cta { flex-direction: column; align-items: center; }
                    .v4-cta-heading { font-size: 2.25rem; }
                }
            `}</style>

            <div className="v4-root">
                {/* Navbar */}
                <nav className="v4-nav">
                    <div className="v4-nav-brand">
                        <Image src="/favicon.png" alt="CodeGuruAI" width={34} height={34} style={{ objectFit: "contain" }} />
                        <span className="v4-nav-brand-text">CodeGuru<span className="accent">AI</span></span>
                    </div>
                    <div className="v4-nav-links">
                        {user ? (
                            <Link href={dashboardHref} className="v4-nav-btn">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v4-nav-link">Sign In</Link>
                                <Link href="/register" className="v4-nav-btn">Get Started</Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Section 1: Hero (100vh) */}
                <section className="v4-section">
                    <div className="v4-hero-bg" />
                    <div className="v4-section-inner">
                        <div className="v4-hero-content">
                            <div className="v4-hero-overline">AI-Powered Coding Education</div>
                            <h1 className="v4-hero-heading">
                                Learn through<br /><em>inquiry.</em>
                            </h1>
                            <p className="v4-hero-sub">
                                CodeGuruAI teaches coding with Socratic questioning — guiding students to their own breakthroughs, not handing them answers. Built for university classrooms.
                            </p>
                            <div className="v4-hero-cta">
                                <Link href="/register" className="v4-btn-primary">
                                    Start Learning Free
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </Link>
                                <Link href="#features" className="v4-btn-ghost">See Features</Link>
                            </div>
                        </div>
                    </div>
                    <div className="v4-scroll-indicator">
                        <span>Scroll</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                </section>

                {/* Section 2: Features (100vh) */}
                <section className="v4-section v4-features-bg" id="features">
                    <div className="v4-section-inner">
                        <h2 className="v4-features-heading">
                            Built to make students<br /><em>think harder,</em> not faster.
                        </h2>
                        <p className="v4-features-sub">
                            Every feature exists to deepen understanding — from AI hints that ask the right question, to live execution that gives instant feedback.
                        </p>
                        <div className="v4-features-grid">
                            <div className="v4-feat-card">
                                <div className="v4-feat-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8A849" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                </div>
                                <h3 className="v4-feat-title">Socratic AI Hints</h3>
                                <p className="v4-feat-desc">
                                    The AI never reveals answers. It asks the precise question that exposes blind spots and forces genuine reasoning through every problem.
                                </p>
                            </div>
                            <div className="v4-feat-card">
                                <div className="v4-feat-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8A849" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                                </div>
                                <h3 className="v4-feat-title">Live Code Execution</h3>
                                <p className="v4-feat-desc">
                                    Write and run solutions in the browser. Instant test case feedback, zero setup. Rapid iteration on every problem.
                                </p>
                            </div>
                            <div className="v4-feat-card">
                                <div className="v4-feat-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8A849" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                                </div>
                                <h3 className="v4-feat-title">Classroom Analytics</h3>
                                <p className="v4-feat-desc">
                                    Create problem sets, assign to classrooms, track submissions. See exactly where students struggle — in real time.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Philosophy (100vh) */}
                <section className="v4-section">
                    <div className="v4-section-inner">
                        <div className="v4-phil-inner">
                            <div>
                                <h2 className="v4-phil-heading">
                                    We don&apos;t give you the answer.
                                    <br />
                                    <span className="dim">We give you the question that leads to it.</span>
                                </h2>
                            </div>
                            <div className="v4-phil-right">
                                <div className="v4-phil-card">
                                    <div className="v4-phil-card-label">For Students</div>
                                    <p className="v4-phil-card-text">
                                        Struggle through problems with intelligent guidance. The productive struggle is where real learning happens — we make sure you&apos;re never fully stuck, but never handed the answer.
                                    </p>
                                </div>
                                <div className="v4-phil-card">
                                    <div className="v4-phil-card-label">For Instructors</div>
                                    <p className="v4-phil-card-text">
                                        Create AI-powered problem sets in minutes. Assign to classrooms, track every submission, and see precisely where your students struggle.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: CTA */}
                <section className="v4-section v4-cta-bg">
                    <div className="v4-section-inner">
                        <div className="v4-cta-content">
                            <h2 className="v4-cta-heading">Begin the pursuit of understanding.</h2>
                            <p className="v4-cta-sub">
                                Join CodeGuruAI and learn to solve problems — not copy solutions. Free for students, powerful for instructors.
                            </p>
                            <div className="v4-cta-buttons">
                                <Link href="/register" className="v4-btn-primary">
                                    Create Free Account
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </Link>
                                <Link href="/login" className="v4-btn-ghost">Sign In</Link>
                            </div>
                        </div>

                        {/* Footer inside last section */}
                        <div className="v4-footer">
                            <div className="v4-footer-brand">
                                <div className="v4-nav-brand">
                                    <Image src="/favicon.png" alt="CodeGuruAI" width={28} height={28} style={{ objectFit: "contain" }} />
                                    <span className="v4-nav-brand-text" style={{ fontSize: "1rem" }}>CodeGuru<span className="accent">AI</span></span>
                                </div>
                                <p>AI-powered coding education for university classrooms.</p>
                            </div>
                            <div className="v4-footer-cols">
                                <div className="v4-footer-col">
                                    <div className="v4-footer-col-title">Platform</div>
                                    <ul>
                                        <li><Link href="/register">Get Started</Link></li>
                                        <li><Link href="/login">Sign In</Link></li>
                                        <li><Link href="/register?role=instructor">For Instructors</Link></li>
                                    </ul>
                                </div>
                                <div className="v4-footer-col">
                                    <div className="v4-footer-col-title">Legal</div>
                                    <ul>
                                        <li><a href="#">Privacy Policy</a></li>
                                        <li><a href="#">Terms of Use</a></li>
                                        <li><a href="#">Contact</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="v4-footer-bottom">
                            <span>&copy; 2026 CodeGuruAI. All rights reserved.</span>
                            <span>Built for learners who want to actually understand code.</span>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}
