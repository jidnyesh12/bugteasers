"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V5 — Asymmetric Magazine
   Broken grid, alternating widths, overlapping elements,
   academic journal aesthetic. Off-white + forest + terracotta.
   Fonts: Fraunces (display) + Work Sans (body)
   ================================================================ */

export default function LandingV5() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Work+Sans:wght@400;500;600;700;800&display=swap');

                .v5-root {
                    --v5-bg: #F0EDE8;
                    --v5-bg-warm: #E8E3DB;
                    --v5-forest: #2D4A3E;
                    --v5-forest-deep: #1B3229;
                    --v5-forest-light: #3E6353;
                    --v5-terracotta: #C45E3B;
                    --v5-terracotta-dim: #A04E30;
                    --v5-ink: #1D1D1B;
                    --v5-ink-mid: #4A473F;
                    --v5-ink-light: #7A7768;
                    --v5-border: #D1CBBF;
                    --v5-border-dark: #B8B0A2;
                    font-family: 'Work Sans', sans-serif;
                    background: var(--v5-bg);
                    color: var(--v5-ink);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                .v5-display {
                    font-family: 'Fraunces', serif;
                }

                /* Navbar */
                .v5-nav {
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    background: rgba(240, 237, 232, 0.9);
                    backdrop-filter: blur(16px);
                    border-bottom: 1px solid var(--v5-border);
                }

                .v5-nav-inner {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 3rem;
                    height: 4rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .v5-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .v5-nav-brand-text {
                    font-family: 'Fraunces', serif;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--v5-forest-deep);
                }
                .v5-nav-brand-text .accent { color: var(--v5-terracotta); }

                .v5-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .v5-nav-link {
                    padding: 0.45rem 1rem;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--v5-ink-light);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .v5-nav-link:hover { color: var(--v5-ink); }

                .v5-nav-btn {
                    padding: 0.5rem 1.4rem;
                    font-size: 0.82rem;
                    font-weight: 700;
                    background: var(--v5-forest);
                    color: #F0EDE8;
                    border-radius: 6px;
                    text-decoration: none;
                    transition: background 0.2s;
                }
                .v5-nav-btn:hover { background: var(--v5-forest-light); }

                /* Hero — asymmetric */
                .v5-hero {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 5rem 3rem 4rem;
                    display: grid;
                    grid-template-columns: 58% 1fr;
                    gap: 3rem;
                    align-items: end;
                }

                .v5-hero-overline {
                    font-size: 0.68rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                    color: var(--v5-terracotta);
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .v5-hero-overline::before {
                    content: '';
                    width: 2.5rem;
                    height: 2px;
                    background: var(--v5-terracotta);
                }

                .v5-hero-heading {
                    font-family: 'Fraunces', serif;
                    font-size: 4.25rem;
                    font-weight: 900;
                    line-height: 1.05;
                    color: var(--v5-forest-deep);
                    margin-bottom: 2rem;
                    letter-spacing: -0.03em;
                }

                .v5-hero-heading em {
                    font-style: italic;
                    color: var(--v5-terracotta);
                }

                .v5-hero-body {
                    font-size: 1.1rem;
                    line-height: 1.7;
                    color: var(--v5-ink-mid);
                    max-width: 500px;
                    margin-bottom: 2rem;
                }

                .v5-hero-cta {
                    display: flex;
                    gap: 1rem;
                }

                .v5-btn-fill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.85rem 2rem;
                    font-size: 0.9rem;
                    font-weight: 700;
                    background: var(--v5-forest);
                    color: var(--v5-bg);
                    border-radius: 6px;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .v5-btn-fill:hover { background: var(--v5-forest-light); transform: translateY(-1px); }

                .v5-btn-outline {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.85rem 2rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--v5-ink-mid);
                    border: 1.5px solid var(--v5-border-dark);
                    border-radius: 6px;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .v5-btn-outline:hover { border-color: var(--v5-ink-mid); color: var(--v5-ink); }

                /* Hero decorative right */
                .v5-hero-deco {
                    position: relative;
                }

                .v5-hero-code {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--v5-border);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.06);
                }

                .v5-hero-code-bar {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0.65rem 1rem;
                    background: var(--v5-bg-warm);
                    border-bottom: 1px solid var(--v5-border);
                }

                .v5-hero-code-dot {
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                }

                .v5-hero-code-body {
                    padding: 1.25rem;
                    background: var(--v5-forest-deep);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.75rem;
                    line-height: 1.85;
                    color: #9BAFA5;
                }

                .v5-hero-code-body .kw { color: #C45E3B; }
                .v5-hero-code-body .fn { color: #7EB8A0; }
                .v5-hero-code-body .str { color: #D4A84B; }
                .v5-hero-code-body .cm { color: #4A6358; }

                .v5-hero-hint {
                    margin-top: -1.5rem;
                    margin-left: 2rem;
                    padding: 1rem 1.25rem;
                    background: white;
                    border: 1px solid var(--v5-border);
                    border-radius: 10px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.04);
                    position: relative;
                    z-index: 2;
                }

                .v5-hero-hint-label {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--v5-terracotta);
                    margin-bottom: 0.4rem;
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                }

                .v5-hero-hint-text {
                    font-size: 0.82rem;
                    color: var(--v5-ink-mid);
                    line-height: 1.55;
                    font-style: italic;
                }

                /* Pull Quote — right-aligned */
                .v5-pullquote {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 3rem 3rem 4rem;
                    display: flex;
                    justify-content: flex-end;
                }

                .v5-pullquote-inner {
                    max-width: 55%;
                    padding: 2.5rem 3rem;
                    background: var(--v5-forest);
                    color: var(--v5-bg);
                    border-radius: 14px;
                    position: relative;
                }

                .v5-pullquote-inner::before {
                    content: '"';
                    font-family: 'Fraunces', serif;
                    font-size: 7rem;
                    color: var(--v5-forest-light);
                    position: absolute;
                    top: -0.5rem;
                    left: 1.5rem;
                    line-height: 1;
                    opacity: 0.3;
                }

                .v5-pullquote-text {
                    font-family: 'Fraunces', serif;
                    font-size: 1.65rem;
                    font-weight: 700;
                    font-style: italic;
                    line-height: 1.35;
                    position: relative;
                    z-index: 1;
                }

                .v5-pullquote-text .dim { opacity: 0.5; }

                /* Features — staggered grid */
                .v5-features {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 3rem 5rem;
                }

                .v5-features-label {
                    font-size: 0.68rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                    color: var(--v5-terracotta);
                    margin-bottom: 2.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .v5-features-label::before {
                    content: '';
                    width: 2.5rem;
                    height: 2px;
                    background: var(--v5-terracotta);
                }

                .v5-features-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 1.5rem;
                }

                .v5-feat-card {
                    padding: 2rem;
                    border: 1px solid var(--v5-border);
                    border-radius: 12px;
                    background: white;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .v5-feat-card:hover {
                    border-color: var(--v5-border-dark);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                }

                .v5-feat-num {
                    font-family: 'Fraunces', serif;
                    font-size: 2rem;
                    font-weight: 900;
                    color: var(--v5-border);
                    line-height: 1;
                    margin-bottom: 1rem;
                }

                .v5-feat-title {
                    font-family: 'Fraunces', serif;
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: var(--v5-forest-deep);
                    margin-bottom: 0.65rem;
                }

                .v5-feat-desc {
                    font-size: 0.85rem;
                    color: var(--v5-ink-light);
                    line-height: 1.6;
                }

                /* Philosophy — overlapping left */
                .v5-philosophy {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 3rem 5rem;
                    display: grid;
                    grid-template-columns: 65% 1fr;
                    gap: 3rem;
                    align-items: start;
                }

                .v5-phil-main {
                    padding: 3.5rem;
                    background: var(--v5-bg-warm);
                    border-radius: 16px;
                    border: 1px solid var(--v5-border);
                    position: relative;
                    z-index: 1;
                }

                .v5-phil-heading {
                    font-family: 'Fraunces', serif;
                    font-size: 2.5rem;
                    font-weight: 900;
                    line-height: 1.15;
                    color: var(--v5-forest-deep);
                    margin-bottom: 1.5rem;
                    letter-spacing: -0.02em;
                }

                .v5-phil-heading em {
                    font-style: italic;
                    color: var(--v5-terracotta);
                }

                .v5-phil-body {
                    font-size: 1rem;
                    color: var(--v5-ink-mid);
                    line-height: 1.7;
                    max-width: 48ch;
                }

                .v5-phil-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    padding-top: 2rem;
                }

                .v5-phil-card {
                    padding: 1.5rem;
                    border-radius: 10px;
                    border: 1px solid var(--v5-border);
                    background: white;
                    transition: border-color 0.2s;
                }
                .v5-phil-card:hover { border-color: var(--v5-border-dark); }

                .v5-phil-card-label {
                    font-size: 0.68rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: var(--v5-terracotta);
                    margin-bottom: 0.5rem;
                }

                .v5-phil-card-text {
                    font-size: 0.85rem;
                    color: var(--v5-ink-mid);
                    line-height: 1.6;
                }

                /* CTA */
                .v5-cta {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 3rem 5rem;
                }

                .v5-cta-inner {
                    padding: 4rem;
                    border-radius: 16px;
                    background: var(--v5-forest-deep);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .v5-cta-inner::after {
                    content: '';
                    position: absolute;
                    top: -40%;
                    right: -20%;
                    width: 60%;
                    height: 120%;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(196,94,59,0.08), transparent 60%);
                }

                .v5-cta-heading {
                    font-family: 'Fraunces', serif;
                    font-size: 2.75rem;
                    font-weight: 900;
                    color: var(--v5-bg);
                    margin-bottom: 1rem;
                    letter-spacing: -0.02em;
                    position: relative;
                    z-index: 1;
                }

                .v5-cta-sub {
                    font-size: 1.05rem;
                    color: #9BAFA5;
                    margin-bottom: 2.5rem;
                    line-height: 1.6;
                    position: relative;
                    z-index: 1;
                }

                .v5-cta-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    position: relative;
                    z-index: 1;
                }

                .v5-btn-amber {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.85rem 2rem;
                    font-size: 0.9rem;
                    font-weight: 700;
                    background: var(--v5-terracotta);
                    color: white;
                    border-radius: 6px;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .v5-btn-amber:hover { background: var(--v5-terracotta-dim); transform: translateY(-1px); }

                .v5-btn-ghost {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.85rem 2rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #9BAFA5;
                    border: 1px solid rgba(155,175,165,0.3);
                    border-radius: 6px;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .v5-btn-ghost:hover { border-color: #9BAFA5; color: var(--v5-bg); }

                /* Footer */
                .v5-footer {
                    border-top: 1px solid var(--v5-border);
                }

                .v5-footer-inner {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 3rem 3rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 2rem;
                }

                .v5-footer-brand p {
                    font-size: 0.78rem;
                    color: var(--v5-ink-light);
                    margin-top: 0.75rem;
                    max-width: 280px;
                    line-height: 1.6;
                }

                .v5-footer-cols {
                    display: flex;
                    gap: 4rem;
                }

                .v5-footer-col-title {
                    font-size: 0.62rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: var(--v5-ink-light);
                    margin-bottom: 1rem;
                }

                .v5-footer-col ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .v5-footer-col li { margin-bottom: 0.5rem; }

                .v5-footer-col a {
                    font-size: 0.78rem;
                    color: var(--v5-ink-mid);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .v5-footer-col a:hover { color: var(--v5-ink); }

                .v5-footer-bottom {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 1.25rem 3rem;
                    border-top: 1px solid var(--v5-border);
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.72rem;
                    color: var(--v5-ink-light);
                }

                @media (max-width: 768px) {
                    .v5-hero { grid-template-columns: 1fr; padding: 3rem 1.5rem; }
                    .v5-hero-heading { font-size: 2.75rem; }
                    .v5-pullquote { padding: 2rem 1.5rem; }
                    .v5-pullquote-inner { max-width: 100%; }
                    .v5-features { padding: 0 1.5rem 3rem; }
                    .v5-features-grid { grid-template-columns: 1fr; }
                    .v5-philosophy { grid-template-columns: 1fr; padding: 0 1.5rem 3rem; }
                    .v5-phil-main { padding: 2rem; }
                    .v5-phil-heading { font-size: 1.75rem; }
                    .v5-cta { padding: 0 1.5rem 3rem; }
                    .v5-cta-inner { padding: 2.5rem 1.5rem; }
                    .v5-cta-heading { font-size: 2rem; }
                    .v5-nav-inner { padding: 0 1.5rem; }
                    .v5-footer-inner { padding: 2rem 1.5rem; }
                    .v5-footer-bottom { padding: 1rem 1.5rem; }
                    .v5-hero-cta { flex-direction: column; }
                }
            `}</style>

            <div className="v5-root">
                {/* Navbar */}
                <nav className="v5-nav">
                    <div className="v5-nav-inner">
                        <div className="v5-nav-brand">
                            <Image src="/favicon.png" alt="CodeGuruAI" width={34} height={34} style={{ objectFit: "contain" }} />
                            <span className="v5-nav-brand-text">CodeGuru<span className="accent">AI</span></span>
                        </div>
                        <div className="v5-nav-links">
                            {user ? (
                                <Link href={dashboardHref} className="v5-nav-btn">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v5-nav-link">Sign In</Link>
                                    <Link href="/register" className="v5-nav-btn">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero — asymmetric 60/40 */}
                <section className="v5-hero">
                    <div>
                        <div className="v5-hero-overline">AI-Powered Education</div>
                        <h1 className="v5-hero-heading">
                            Learn to code through <em>guided inquiry,</em> not imitation.
                        </h1>
                        <p className="v5-hero-body">
                            CodeGuruAI teaches with Socratic questioning — guiding students to their own breakthroughs. Built for university classrooms where genuine understanding matters.
                        </p>
                        <div className="v5-hero-cta">
                            <Link href="/register" className="v5-btn-fill">
                                Start Learning Free
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                            <Link href="#features" className="v5-btn-outline">Explore Features</Link>
                        </div>
                    </div>
                    <div className="v5-hero-deco">
                        <div className="v5-hero-code">
                            <div className="v5-hero-code-bar">
                                <div className="v5-hero-code-dot" style={{ background: "#C45E3B" }} />
                                <div className="v5-hero-code-dot" style={{ background: "#D4A84B" }} />
                                <div className="v5-hero-code-dot" style={{ background: "#3E6353" }} />
                                <span style={{ color: "#4A6358", fontSize: "0.7rem", marginLeft: "0.5rem", fontFamily: "monospace" }}>solution.py</span>
                            </div>
                            <div className="v5-hero-code-body">
                                <div><span className="kw">def</span> <span className="fn">two_sum</span>(nums, target):</div>
                                <div><span className="cm">    # Find indices summing to target</span></div>
                                <div>    seen = {'{}'}</div>
                                <div><span className="kw">    for</span> i, n <span className="kw">in</span> <span className="fn">enumerate</span>(nums):</div>
                                <div>        diff = target - n</div>
                                <div><span className="kw">        if</span> diff <span className="kw">in</span> seen:</div>
                                <div><span className="str">            return [seen[diff], i]</span></div>
                                <div>        seen[n] = i</div>
                            </div>
                        </div>
                        <div className="v5-hero-hint">
                            <div className="v5-hero-hint-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                Socratic Hint
                            </div>
                            <p className="v5-hero-hint-text">
                                &ldquo;What data structure gives O(1) lookups? How would that help?&rdquo;
                            </p>
                        </div>
                    </div>
                </section>

                {/* Pull Quote — right-aligned */}
                <section className="v5-pullquote">
                    <div className="v5-pullquote-inner">
                        <p className="v5-pullquote-text">
                            We don&apos;t give you the answer. <span className="dim">We give you the question that leads to it.</span>
                        </p>
                    </div>
                </section>

                {/* Features — staggered 3-col */}
                <section className="v5-features" id="features">
                    <div className="v5-features-label">Capabilities</div>
                    <div className="v5-features-grid">
                        <div className="v5-feat-card">
                            <div className="v5-feat-num">01</div>
                            <h3 className="v5-feat-title">Socratic AI Hints</h3>
                            <p className="v5-feat-desc">
                                Never reveals the answer. Asks the question that exposes blind spots and forces students to reason through every problem.
                            </p>
                        </div>
                        <div className="v5-feat-card">
                            <div className="v5-feat-num">02</div>
                            <h3 className="v5-feat-title">Live Code Execution</h3>
                            <p className="v5-feat-desc">
                                Write and run solutions in-browser. Instant test case feedback, zero setup required. Rapid iteration.
                            </p>
                        </div>
                        <div className="v5-feat-card">
                            <div className="v5-feat-num">03</div>
                            <h3 className="v5-feat-title">Classroom Analytics</h3>
                            <p className="v5-feat-desc">
                                Create problem sets, assign to classrooms, track submissions. See exactly where students get stuck.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Philosophy — overlapping layout */}
                <section className="v5-philosophy">
                    <div className="v5-phil-main">
                        <h2 className="v5-phil-heading">
                            Built to make students <em>think harder,</em> not just work faster.
                        </h2>
                        <p className="v5-phil-body">
                            Every feature exists to deepen understanding — from AI hints that ask the right question, to live execution with instant feedback, to analytics that reveal where students truly struggle.
                        </p>
                    </div>
                    <div className="v5-phil-cards">
                        <div className="v5-phil-card">
                            <div className="v5-phil-card-label">For Students</div>
                            <p className="v5-phil-card-text">
                                Struggle with intelligent guidance. The productive struggle is where learning happens — we ensure you&apos;re never fully stuck, but never handed the answer.
                            </p>
                        </div>
                        <div className="v5-phil-card">
                            <div className="v5-phil-card-label">For Instructors</div>
                            <p className="v5-phil-card-text">
                                Create AI-powered problem sets in minutes. Assign to classrooms, track every submission, see where students need help.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="v5-cta">
                    <div className="v5-cta-inner">
                        <h2 className="v5-cta-heading">Begin the pursuit of understanding.</h2>
                        <p className="v5-cta-sub">
                            Free for students. Powerful for instructors. Join CodeGuruAI today.
                        </p>
                        <div className="v5-cta-buttons">
                            <Link href="/register" className="v5-btn-amber">
                                Create Free Account
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                            <Link href="/login" className="v5-btn-ghost">Sign In</Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="v5-footer">
                    <div className="v5-footer-inner">
                        <div className="v5-footer-brand">
                            <div className="v5-nav-brand">
                                <Image src="/favicon.png" alt="CodeGuruAI" width={28} height={28} style={{ objectFit: "contain" }} />
                                <span className="v5-nav-brand-text" style={{ fontSize: "1rem" }}>CodeGuru<span className="accent">AI</span></span>
                            </div>
                            <p>AI-powered coding education for university classrooms.</p>
                        </div>
                        <div className="v5-footer-cols">
                            <div className="v5-footer-col">
                                <div className="v5-footer-col-title">Platform</div>
                                <ul>
                                    <li><Link href="/register">Get Started</Link></li>
                                    <li><Link href="/login">Sign In</Link></li>
                                    <li><Link href="/register?role=instructor">For Instructors</Link></li>
                                </ul>
                            </div>
                            <div className="v5-footer-col">
                                <div className="v5-footer-col-title">Legal</div>
                                <ul>
                                    <li><a href="#">Privacy Policy</a></li>
                                    <li><a href="#">Terms of Use</a></li>
                                    <li><a href="#">Contact</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="v5-footer-bottom">
                        <span>&copy; 2026 CodeGuruAI. All rights reserved.</span>
                        <span>Built for learners who want to actually understand code.</span>
                    </div>
                </footer>
            </div>
        </>
    )
}
