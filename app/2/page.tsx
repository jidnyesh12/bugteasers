"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V2 — Single-Column Editorial
   Cream + deep ink. Narrow centered column (~680px), long-scroll.
   Fonts: Libre Baskerville (display) + Manrope (body)
   Layout: Single column, editorial prose flow, no card grids
   ================================================================ */

export default function LandingV2() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Manrope:wght@400;500;600;700;800&display=swap');

                .v2-root {
                    --v2-cream: #FAF8F5;
                    --v2-cream-dark: #EDE8E0;
                    --v2-ink: #1a1a2e;
                    --v2-ink-light: #3d3d56;
                    --v2-ink-muted: #7a7a8e;
                    --v2-accent: #8B4513;
                    --v2-accent-light: #A0522D;
                    --v2-rule: #D5CFC5;
                    font-family: 'Manrope', sans-serif;
                    background: var(--v2-cream);
                    color: var(--v2-ink);
                    min-height: 100vh;
                }

                .v2-serif {
                    font-family: 'Libre Baskerville', serif;
                }

                /* Navbar */
                .v2-nav {
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    background: rgba(250, 248, 245, 0.92);
                    backdrop-filter: blur(16px);
                    border-bottom: 1px solid var(--v2-rule);
                }

                .v2-nav-inner {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    height: 4rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .v2-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .v2-nav-brand-text {
                    font-family: 'Libre Baskerville', serif;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--v2-ink);
                }

                .v2-nav-brand-text .accent { color: var(--v2-accent); }

                .v2-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .v2-nav-link {
                    padding: 0.45rem 1rem;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--v2-ink-muted);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .v2-nav-link:hover { color: var(--v2-ink); }

                .v2-nav-btn {
                    padding: 0.5rem 1.4rem;
                    font-size: 0.82rem;
                    font-weight: 700;
                    background: var(--v2-ink);
                    color: var(--v2-cream);
                    border-radius: 6px;
                    text-decoration: none;
                    transition: background 0.2s;
                }
                .v2-nav-btn:hover { background: var(--v2-ink-light); }

                /* Editorial column */
                .v2-column {
                    max-width: 680px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }

                /* Hero */
                .v2-hero {
                    padding: 6rem 0 4rem;
                    text-align: center;
                }

                .v2-hero-overline {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                    color: var(--v2-accent);
                    margin-bottom: 2rem;
                }

                .v2-hero-heading {
                    font-family: 'Libre Baskerville', serif;
                    font-size: 3.25rem;
                    font-weight: 700;
                    line-height: 1.2;
                    color: var(--v2-ink);
                    margin-bottom: 2rem;
                    letter-spacing: -0.01em;
                }

                .v2-hero-heading em {
                    font-style: italic;
                    color: var(--v2-accent);
                }

                .v2-hero-lede {
                    font-size: 1.15rem;
                    line-height: 1.75;
                    color: var(--v2-ink-light);
                    margin-bottom: 2.5rem;
                    max-width: 540px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .v2-hero-cta {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 3rem;
                }

                .v2-btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.85rem 2rem;
                    font-size: 0.9rem;
                    font-weight: 700;
                    background: var(--v2-ink);
                    color: var(--v2-cream);
                    border-radius: 6px;
                    text-decoration: none;
                    transition: background 0.2s, transform 0.15s;
                }
                .v2-btn-primary:hover { background: var(--v2-ink-light); transform: translateY(-1px); }

                .v2-btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.85rem 2rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--v2-ink-muted);
                    border: 1.5px solid var(--v2-rule);
                    border-radius: 6px;
                    text-decoration: none;
                    transition: border-color 0.2s, color 0.2s;
                }
                .v2-btn-secondary:hover { border-color: var(--v2-ink-muted); color: var(--v2-ink); }

                /* Horizontal rule */
                .v2-hr {
                    border: none;
                    height: 1px;
                    background: var(--v2-rule);
                    margin: 0;
                }

                .v2-hr-ornament {
                    border: none;
                    height: 0;
                    margin: 3.5rem auto;
                    text-align: center;
                    position: relative;
                }

                .v2-hr-ornament::before {
                    content: '◆    ◆    ◆';
                    font-size: 0.5rem;
                    letter-spacing: 0.5em;
                    color: var(--v2-rule);
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                }

                /* Code block inline */
                .v2-code-block {
                    margin: 2.5rem 0;
                    border-radius: 10px;
                    overflow: hidden;
                    border: 1px solid var(--v2-rule);
                }

                .v2-code-bar {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1rem;
                    background: var(--v2-cream-dark);
                    border-bottom: 1px solid var(--v2-rule);
                }

                .v2-code-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .v2-code-body {
                    padding: 1.25rem 1.5rem;
                    background: #1a1a2e;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 0.8rem;
                    line-height: 1.85;
                    color: #c9c5be;
                }

                .v2-code-body .kw { color: #C4A265; }
                .v2-code-body .fn { color: #7EB8DA; }
                .v2-code-body .cm { color: #5C5A56; }
                .v2-code-body .str { color: #8BAA7A; }

                /* Feature prose sections */
                .v2-section {
                    padding: 4rem 0;
                }

                .v2-section-num {
                    font-family: 'Libre Baskerville', serif;
                    font-size: 3rem;
                    font-weight: 700;
                    color: var(--v2-cream-dark);
                    line-height: 1;
                    margin-bottom: 1rem;
                }

                .v2-section-heading {
                    font-family: 'Libre Baskerville', serif;
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--v2-ink);
                    margin-bottom: 1.25rem;
                    line-height: 1.3;
                }

                .v2-section-body {
                    font-size: 1rem;
                    line-height: 1.8;
                    color: var(--v2-ink-light);
                }

                /* Blockquote */
                .v2-blockquote {
                    margin: 4rem 0;
                    padding: 3rem 2.5rem;
                    background: var(--v2-ink);
                    color: var(--v2-cream);
                    border-radius: 12px;
                    position: relative;
                }

                .v2-blockquote::before {
                    content: '"';
                    font-family: 'Libre Baskerville', serif;
                    font-size: 6rem;
                    color: var(--v2-accent);
                    position: absolute;
                    top: -0.25rem;
                    left: 1.5rem;
                    line-height: 1;
                    opacity: 0.5;
                }

                .v2-blockquote-text {
                    font-family: 'Libre Baskerville', serif;
                    font-size: 1.5rem;
                    font-style: italic;
                    line-height: 1.5;
                    position: relative;
                    z-index: 1;
                }

                .v2-blockquote-text span {
                    opacity: 0.5;
                }

                /* Audience cards */
                .v2-audience {
                    margin: 3rem 0;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .v2-audience-card {
                    padding: 2rem;
                    border: 1.5px solid var(--v2-rule);
                    border-radius: 10px;
                    transition: border-color 0.2s;
                }
                .v2-audience-card:hover { border-color: var(--v2-ink-muted); }

                .v2-audience-label {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--v2-accent);
                    margin-bottom: 0.75rem;
                }

                .v2-audience-title {
                    font-family: 'Libre Baskerville', serif;
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                    color: var(--v2-ink);
                }

                .v2-audience-desc {
                    font-size: 0.88rem;
                    line-height: 1.65;
                    color: var(--v2-ink-muted);
                }

                /* CTA */
                .v2-cta {
                    padding: 5rem 0;
                    text-align: center;
                }

                .v2-cta-heading {
                    font-family: 'Libre Baskerville', serif;
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: var(--v2-ink);
                    margin-bottom: 1rem;
                    line-height: 1.2;
                }

                .v2-cta-sub {
                    font-size: 1rem;
                    color: var(--v2-ink-muted);
                    margin-bottom: 2.5rem;
                    line-height: 1.7;
                }

                .v2-cta-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                }

                /* Footer */
                .v2-footer {
                    border-top: 1px solid var(--v2-rule);
                    background: var(--v2-cream);
                }

                .v2-footer-inner {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 3rem 2rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 2rem;
                }

                .v2-footer-brand p {
                    font-size: 0.8rem;
                    color: var(--v2-ink-muted);
                    margin-top: 0.75rem;
                    max-width: 280px;
                    line-height: 1.6;
                }

                .v2-footer-cols {
                    display: flex;
                    gap: 4rem;
                }

                .v2-footer-col-title {
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: var(--v2-ink-muted);
                    margin-bottom: 1rem;
                }

                .v2-footer-col ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .v2-footer-col li { margin-bottom: 0.6rem; }

                .v2-footer-col a {
                    font-size: 0.8rem;
                    color: var(--v2-ink-muted);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .v2-footer-col a:hover { color: var(--v2-ink); }

                .v2-footer-bottom {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 1.5rem 2rem;
                    border-top: 1px solid var(--v2-rule);
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--v2-ink-muted);
                    opacity: 0.6;
                }

                @media (max-width: 768px) {
                    .v2-hero-heading { font-size: 2.25rem; }
                    .v2-column { padding: 0 1.25rem; }
                    .v2-audience { grid-template-columns: 1fr; }
                    .v2-blockquote { padding: 2rem 1.5rem; }
                    .v2-blockquote-text { font-size: 1.15rem; }
                    .v2-hero-cta { flex-direction: column; align-items: center; }
                }
            `}</style>

            <div className="v2-root">
                {/* Navbar */}
                <nav className="v2-nav">
                    <div className="v2-nav-inner">
                        <div className="v2-nav-brand">
                            <Image src="/favicon.png" alt="CodeGuruAI" width={34} height={34} style={{ objectFit: "contain" }} />
                            <span className="v2-nav-brand-text">CodeGuru<span className="accent">AI</span></span>
                        </div>
                        <div className="v2-nav-links">
                            {user ? (
                                <Link href={dashboardHref} className="v2-nav-btn">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v2-nav-link">Sign In</Link>
                                    <Link href="/register" className="v2-nav-btn">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <div className="v2-column">
                    {/* Hero */}
                    <section className="v2-hero">
                        <div className="v2-hero-overline">AI-Powered Coding Education</div>
                        <h1 className="v2-hero-heading">
                            The tutor that teaches<br />through <em>questions,</em><br />not answers.
                        </h1>
                        <p className="v2-hero-lede">
                            CodeGuruAI uses Socratic questioning to guide students through coding problems. It never reveals the answer — it reveals the thinking that leads to it.
                        </p>
                        <div className="v2-hero-cta">
                            <Link href="/register" className="v2-btn-primary">
                                Start Learning Free
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                            <Link href="#features" className="v2-btn-secondary">Learn More</Link>
                        </div>
                    </section>

                    <hr className="v2-hr" />

                    {/* Inline code example */}
                    <div className="v2-code-block">
                        <div className="v2-code-bar">
                            <div className="v2-code-dot" style={{ background: "#E5534B" }} />
                            <div className="v2-code-dot" style={{ background: "#C4A265" }} />
                            <div className="v2-code-dot" style={{ background: "#56A855" }} />
                            <span style={{ color: "var(--v2-ink-muted)", fontSize: "0.72rem", marginLeft: "0.5rem", fontFamily: "monospace" }}>solution.py</span>
                        </div>
                        <div className="v2-code-body">
                            <div><span className="kw">def</span> <span className="fn">two_sum</span>(nums, target):</div>
                            <div><span className="cm">    # Find two indices that sum to target</span></div>
                            <div>    seen = {'{}'}</div>
                            <div><span className="kw">    for</span> i, n <span className="kw">in</span> <span className="fn">enumerate</span>(nums):</div>
                            <div>        diff = target - n</div>
                            <div><span className="kw">        if</span> diff <span className="kw">in</span> seen:</div>
                            <div><span className="str">            return [seen[diff], i]</span></div>
                            <div>        seen[n] = i</div>
                        </div>
                    </div>

                    <div className="v2-hr-ornament" />

                    {/* Features as prose sections */}
                    <section className="v2-section" id="features">
                        <div className="v2-section-num">01</div>
                        <h2 className="v2-section-heading">Socratic AI Hints</h2>
                        <p className="v2-section-body">
                            When a student is stuck, most tools offer the answer. CodeGuruAI offers a question — one that illuminates the gap in understanding and nudges the student toward their own breakthrough. The AI never reveals solutions directly. Instead, it asks precisely the question the student needs to hear, exposing blind spots and forcing genuine reasoning.
                        </p>
                    </section>

                    <hr className="v2-hr" />

                    <section className="v2-section">
                        <div className="v2-section-num">02</div>
                        <h2 className="v2-section-heading">Live Code Execution</h2>
                        <p className="v2-section-body">
                            Students write and run their solutions directly in the browser. No environment setup, no configuration — just code, execute, and see immediate test case results. The feedback loop is instant, allowing rapid iteration on problems without leaving the platform.
                        </p>
                    </section>

                    <hr className="v2-hr" />

                    <section className="v2-section">
                        <div className="v2-section-num">03</div>
                        <h2 className="v2-section-heading">Classroom Analytics</h2>
                        <p className="v2-section-body">
                            Instructors can create AI-powered problem sets in minutes, assign them to classrooms, and track every submission in real time. The analytics dashboard reveals exactly where students struggle — not just who passed, but how they got there and where they got stuck along the way.
                        </p>
                    </section>

                    <div className="v2-hr-ornament" />

                    {/* Philosophy as blockquote */}
                    <div className="v2-blockquote">
                        <p className="v2-blockquote-text">
                            We don&apos;t give you the answer. <span>We give you the question that leads to it.</span>
                        </p>
                    </div>

                    {/* Audience */}
                    <div className="v2-audience">
                        <div className="v2-audience-card">
                            <div className="v2-audience-label">For Students</div>
                            <h3 className="v2-audience-title">Guided struggle</h3>
                            <p className="v2-audience-desc">
                                Work through problems with intelligent guidance. The productive struggle is where learning happens — we make sure you&apos;re never stuck, but never handed the answer either.
                            </p>
                        </div>
                        <div className="v2-audience-card">
                            <div className="v2-audience-label">For Instructors</div>
                            <h3 className="v2-audience-title">Effortless oversight</h3>
                            <p className="v2-audience-desc">
                                Generate problem sets with AI, assign to classrooms, and see precisely where your students need help — all in one platform built for academic workflows.
                            </p>
                        </div>
                    </div>

                    <div className="v2-hr-ornament" />

                    {/* CTA */}
                    <section className="v2-cta">
                        <h2 className="v2-cta-heading">Start learning the right way.</h2>
                        <p className="v2-cta-sub">
                            Join CodeGuruAI and learn to solve problems — not copy solutions.<br />Free for students. Powerful for instructors.
                        </p>
                        <div className="v2-cta-buttons">
                            <Link href="/register" className="v2-btn-primary">
                                Create Free Account
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                            <Link href="/login" className="v2-btn-secondary">Sign In</Link>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <footer className="v2-footer">
                    <div className="v2-footer-inner">
                        <div className="v2-footer-brand">
                            <div className="v2-nav-brand">
                                <Image src="/favicon.png" alt="CodeGuruAI" width={28} height={28} style={{ objectFit: "contain" }} />
                                <span className="v2-nav-brand-text" style={{ fontSize: "1rem" }}>CodeGuru<span className="accent">AI</span></span>
                            </div>
                            <p>AI-powered coding education built for university classrooms.</p>
                        </div>
                        <div className="v2-footer-cols">
                            <div className="v2-footer-col">
                                <div className="v2-footer-col-title">Platform</div>
                                <ul>
                                    <li><Link href="/register">Get Started</Link></li>
                                    <li><Link href="/login">Sign In</Link></li>
                                    <li><Link href="/register?role=instructor">For Instructors</Link></li>
                                </ul>
                            </div>
                            <div className="v2-footer-col">
                                <div className="v2-footer-col-title">Legal</div>
                                <ul>
                                    <li><a href="#">Privacy Policy</a></li>
                                    <li><a href="#">Terms of Use</a></li>
                                    <li><a href="#">Contact</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="v2-footer-bottom">
                        <span>&copy; 2026 CodeGuruAI. All rights reserved.</span>
                        <span>Built for learners who want to actually understand code.</span>
                    </div>
                </footer>
            </div>
        </>
    )
}
