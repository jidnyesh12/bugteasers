"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V1 — Split-Screen Scholarly
   Dark academia palette: walnut, ivory, muted gold
   Fonts: Cormorant Garamond (display) + DM Sans (body)
   Layout: 50/50 vertical split — text left, visual right
   ================================================================ */

export default function LandingV1() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

                .v1-root {
                    --v1-bg: #1C1915;
                    --v1-bg-alt: #252119;
                    --v1-surface: #2C271F;
                    --v1-ivory: #F5F0E8;
                    --v1-ivory-dim: #C4BAA8;
                    --v1-gold: #C9A84C;
                    --v1-gold-dim: #8B7435;
                    --v1-walnut: #5C4A32;
                    --v1-border: #3D3529;
                    font-family: 'DM Sans', sans-serif;
                    background: var(--v1-bg);
                    color: var(--v1-ivory);
                    min-height: 100vh;
                }

                .v1-display {
                    font-family: 'Cormorant Garamond', serif;
                }

                /* Navbar */
                .v1-nav {
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 2.5rem;
                    height: 4rem;
                    background: rgba(28, 25, 21, 0.9);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid var(--v1-border);
                }

                .v1-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .v1-nav-brand span {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.35rem;
                    font-weight: 700;
                    color: var(--v1-ivory);
                    letter-spacing: -0.02em;
                }

                .v1-nav-brand .accent {
                    color: var(--v1-gold);
                }

                .v1-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .v1-nav-link {
                    padding: 0.5rem 1rem;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--v1-ivory-dim);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .v1-nav-link:hover { color: var(--v1-ivory); }

                .v1-nav-btn {
                    padding: 0.5rem 1.5rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    background: var(--v1-gold);
                    color: var(--v1-bg);
                    border-radius: 6px;
                    text-decoration: none;
                    transition: background 0.2s;
                }
                .v1-nav-btn:hover { background: #B8993F; }

                /* Split hero */
                .v1-split {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    min-height: calc(100vh - 4rem);
                }

                .v1-split-left {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 5rem 4rem 5rem 5rem;
                    border-right: 1px solid var(--v1-border);
                }

                .v1-split-right {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 4rem;
                    background: var(--v1-bg-alt);
                    position: relative;
                    overflow: hidden;
                }

                .v1-split-right::before {
                    content: '';
                    position: absolute;
                    top: -40%;
                    right: -40%;
                    width: 80%;
                    height: 80%;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
                }

                .v1-overline {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: var(--v1-gold);
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .v1-overline::before {
                    content: '';
                    width: 2rem;
                    height: 1px;
                    background: var(--v1-gold);
                }

                .v1-hero-heading {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 3.75rem;
                    font-weight: 700;
                    line-height: 1.1;
                    color: var(--v1-ivory);
                    margin-bottom: 1.75rem;
                    letter-spacing: -0.02em;
                }

                .v1-hero-heading em {
                    font-style: italic;
                    color: var(--v1-gold);
                }

                .v1-hero-body {
                    font-size: 1.05rem;
                    line-height: 1.7;
                    color: var(--v1-ivory-dim);
                    max-width: 480px;
                    margin-bottom: 2.5rem;
                }

                .v1-cta-group {
                    display: flex;
                    gap: 1rem;
                }

                .v1-cta-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.85rem 2rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    background: var(--v1-gold);
                    color: var(--v1-bg);
                    border-radius: 6px;
                    text-decoration: none;
                    transition: background 0.2s, transform 0.15s;
                }
                .v1-cta-primary:hover { background: #B8993F; transform: translateY(-1px); }

                .v1-cta-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.85rem 2rem;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--v1-ivory-dim);
                    border: 1px solid var(--v1-border);
                    border-radius: 6px;
                    text-decoration: none;
                    transition: border-color 0.2s, color 0.2s;
                }
                .v1-cta-secondary:hover { border-color: var(--v1-ivory-dim); color: var(--v1-ivory); }

                /* Code editor mockup */
                .v1-editor {
                    width: 100%;
                    max-width: 420px;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--v1-border);
                    position: relative;
                    z-index: 1;
                }

                .v1-editor-bar {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: var(--v1-surface);
                    border-bottom: 1px solid var(--v1-border);
                }

                .v1-editor-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .v1-editor-body {
                    padding: 1.25rem;
                    background: #151210;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 0.8rem;
                    line-height: 1.8;
                }

                .v1-editor-body .kw { color: #C9A84C; }
                .v1-editor-body .fn { color: #7EB8DA; }
                .v1-editor-body .cm { color: #5C5445; }
                .v1-editor-body .str { color: #8BAA7A; }
                .v1-editor-body .op { color: #A09888; }

                .v1-hint-card {
                    margin-top: 1.5rem;
                    padding: 1rem 1.25rem;
                    border-radius: 10px;
                    border: 1px solid var(--v1-border);
                    background: var(--v1-surface);
                    max-width: 420px;
                    width: 100%;
                    position: relative;
                    z-index: 1;
                }

                .v1-hint-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--v1-gold);
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .v1-hint-text {
                    font-size: 0.85rem;
                    line-height: 1.6;
                    color: var(--v1-ivory-dim);
                    font-style: italic;
                }

                /* Features */
                .v1-features {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    border-top: 1px solid var(--v1-border);
                }

                .v1-feat-left {
                    padding: 5rem;
                    border-right: 1px solid var(--v1-border);
                }

                .v1-feat-right {
                    display: flex;
                    flex-direction: column;
                }

                .v1-feat-item {
                    padding: 2.5rem 3rem;
                    border-bottom: 1px solid var(--v1-border);
                    transition: background 0.2s;
                }
                .v1-feat-item:last-child { border-bottom: none; }
                .v1-feat-item:hover { background: var(--v1-bg-alt); }

                .v1-feat-number {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: var(--v1-gold-dim);
                    line-height: 1;
                    margin-bottom: 1rem;
                }

                .v1-feat-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--v1-ivory);
                    margin-bottom: 0.75rem;
                }

                .v1-feat-desc {
                    font-size: 0.9rem;
                    line-height: 1.65;
                    color: var(--v1-ivory-dim);
                    max-width: 36ch;
                }

                .v1-section-heading {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 2.75rem;
                    font-weight: 700;
                    line-height: 1.15;
                    margin-bottom: 1.5rem;
                    color: var(--v1-ivory);
                }

                .v1-section-heading em {
                    color: var(--v1-gold);
                    font-style: italic;
                }

                .v1-section-body {
                    font-size: 1rem;
                    line-height: 1.7;
                    color: var(--v1-ivory-dim);
                    max-width: 44ch;
                }

                /* Philosophy */
                .v1-philosophy {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    border-top: 1px solid var(--v1-border);
                    background: var(--v1-bg-alt);
                }

                .v1-phil-left {
                    padding: 5rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    border-right: 1px solid var(--v1-border);
                }

                .v1-phil-right {
                    padding: 4rem 3.5rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 2rem;
                }

                .v1-phil-card {
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--v1-border);
                }

                .v1-phil-card-title {
                    font-weight: 700;
                    font-size: 0.85rem;
                    color: var(--v1-gold);
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .v1-phil-card-desc {
                    font-size: 0.9rem;
                    line-height: 1.65;
                    color: var(--v1-ivory-dim);
                }

                /* CTA */
                .v1-cta-section {
                    border-top: 1px solid var(--v1-border);
                    padding: 6rem 3rem;
                    text-align: center;
                }

                .v1-cta-heading {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 3rem;
                    font-weight: 700;
                    color: var(--v1-ivory);
                    margin-bottom: 1rem;
                }

                .v1-cta-sub {
                    font-size: 1rem;
                    color: var(--v1-ivory-dim);
                    margin-bottom: 2.5rem;
                    max-width: 480px;
                    margin-left: auto;
                    margin-right: auto;
                    line-height: 1.6;
                }

                .v1-cta-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                }

                /* Footer */
                .v1-footer {
                    border-top: 1px solid var(--v1-border);
                    padding: 3rem 4rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 2rem;
                }

                .v1-footer-brand p {
                    font-size: 0.8rem;
                    color: var(--v1-ivory-dim);
                    margin-top: 0.75rem;
                    max-width: 280px;
                    line-height: 1.6;
                    opacity: 0.7;
                }

                .v1-footer-cols {
                    display: flex;
                    gap: 4rem;
                }

                .v1-footer-col-title {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: var(--v1-ivory-dim);
                    opacity: 0.5;
                    margin-bottom: 1rem;
                }

                .v1-footer-col ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .v1-footer-col li { margin-bottom: 0.6rem; }

                .v1-footer-col a {
                    font-size: 0.8rem;
                    color: var(--v1-ivory-dim);
                    text-decoration: none;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .v1-footer-col a:hover { opacity: 1; }

                .v1-footer-bottom {
                    border-top: 1px solid var(--v1-border);
                    padding: 1.5rem 4rem;
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--v1-ivory-dim);
                    opacity: 0.4;
                }

                @media (max-width: 768px) {
                    .v1-split { grid-template-columns: 1fr; }
                    .v1-split-left { padding: 3rem 1.5rem; }
                    .v1-split-right { padding: 2rem 1.5rem; }
                    .v1-hero-heading { font-size: 2.5rem; }
                    .v1-features { grid-template-columns: 1fr; }
                    .v1-feat-left { padding: 3rem 1.5rem; border-right: none; border-bottom: 1px solid var(--v1-border); }
                    .v1-philosophy { grid-template-columns: 1fr; }
                    .v1-phil-left { border-right: none; border-bottom: 1px solid var(--v1-border); padding: 3rem 1.5rem; }
                    .v1-phil-right { padding: 2rem 1.5rem; }
                    .v1-nav { padding: 0 1.25rem; }
                    .v1-footer { padding: 2rem 1.5rem; }
                    .v1-footer-bottom { padding: 1rem 1.5rem; }
                }
            `}</style>

            <div className="v1-root">
                {/* Navbar */}
                <nav className="v1-nav">
                    <div className="v1-nav-brand">
                        <Image src="/favicon.png" alt="CodeGuruAI" width={36} height={36} style={{ objectFit: "contain" }} />
                        <span>CodeGuru<span className="accent">AI</span></span>
                    </div>
                    <div className="v1-nav-links">
                        {user ? (
                            <Link href={dashboardHref} className="v1-nav-btn">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v1-nav-link">Sign In</Link>
                                <Link href="/register" className="v1-nav-btn">Get Started</Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Hero — Split Screen */}
                <section className="v1-split">
                    <div className="v1-split-left">
                        <div className="v1-overline">AI-Powered Education</div>
                        <h1 className="v1-hero-heading">
                            Learn to code<br />through <em>inquiry,</em><br />not imitation.
                        </h1>
                        <p className="v1-hero-body">
                            CodeGuruAI guides students with Socratic hints that provoke genuine understanding — never handing out solutions. Built for university classrooms where real learning matters.
                        </p>
                        <div className="v1-cta-group">
                            <Link href="/register" className="v1-cta-primary">
                                Start Learning
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                            <Link href="#features" className="v1-cta-secondary">Explore Features</Link>
                        </div>
                    </div>

                    <div className="v1-split-right">
                        <div className="v1-editor">
                            <div className="v1-editor-bar">
                                <div className="v1-editor-dot" style={{ background: "#E5534B" }} />
                                <div className="v1-editor-dot" style={{ background: "#C9A84C" }} />
                                <div className="v1-editor-dot" style={{ background: "#56A855" }} />
                                <span style={{ color: "#5C5445", fontSize: "0.75rem", marginLeft: "0.5rem", fontFamily: "monospace" }}>solution.py</span>
                            </div>
                            <div className="v1-editor-body">
                                <div><span className="kw">def</span> <span className="fn">two_sum</span><span className="op">(nums, target):</span></div>
                                <div><span className="cm">    # Find two indices that sum to target</span></div>
                                <div><span className="op">    seen = {'{}'}</span></div>
                                <div><span className="kw">    for</span> <span className="op">i, n</span> <span className="kw">in</span> <span className="fn">enumerate</span><span className="op">(nums):</span></div>
                                <div><span className="op">        diff = target - n</span></div>
                                <div><span className="kw">        if</span> <span className="op">diff</span> <span className="kw">in</span> <span className="op">seen:</span></div>
                                <div><span className="str">            return [seen[diff], i]</span></div>
                                <div><span className="op">        seen[n] = i</span></div>
                            </div>
                        </div>

                        <div className="v1-hint-card">
                            <div className="v1-hint-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                Socratic Hint
                            </div>
                            <p className="v1-hint-text">
                                &ldquo;What data structure allows you to check if a value exists in constant time? How would that help here?&rdquo;
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features — Split layout */}
                <section className="v1-features" id="features">
                    <div className="v1-feat-left">
                        <div className="v1-overline">Capabilities</div>
                        <h2 className="v1-section-heading">
                            Built to make students <em>think harder,</em> not work faster.
                        </h2>
                        <p className="v1-section-body">
                            Every feature exists to deepen understanding — from AI hints that ask the right question, to live code execution that gives immediate feedback, to progress analytics that reveal where students truly struggle.
                        </p>
                    </div>
                    <div className="v1-feat-right">
                        <div className="v1-feat-item">
                            <div className="v1-feat-number">01</div>
                            <h3 className="v1-feat-title">Socratic AI Hints</h3>
                            <p className="v1-feat-desc">
                                Never reveals the answer. Instead, asks questions that expose blind spots and force students to reason through the problem themselves.
                            </p>
                        </div>
                        <div className="v1-feat-item">
                            <div className="v1-feat-number">02</div>
                            <h3 className="v1-feat-title">Live Code Execution</h3>
                            <p className="v1-feat-desc">
                                Write and run solutions directly in the browser with instant test case feedback. Zero setup, immediate iteration.
                            </p>
                        </div>
                        <div className="v1-feat-item">
                            <div className="v1-feat-number">03</div>
                            <h3 className="v1-feat-title">Classroom Analytics</h3>
                            <p className="v1-feat-desc">
                                Instructors see exactly where students get stuck. Create AI-powered problem sets, assign to classrooms, and track progress in real time.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Philosophy */}
                <section className="v1-philosophy">
                    <div className="v1-phil-left">
                        <div className="v1-overline">Our Philosophy</div>
                        <h2 className="v1-section-heading">
                            We don&apos;t give you the answer.<br />
                            <em>We give you the question that leads to it.</em>
                        </h2>
                    </div>
                    <div className="v1-phil-right">
                        <div className="v1-phil-card">
                            <div className="v1-phil-card-title">For Students</div>
                            <p className="v1-phil-card-desc">
                                Struggle through problems with intelligent guidance. The struggle is where learning happens — we ensure you&apos;re never completely stuck, but never handed the solution.
                            </p>
                        </div>
                        <div className="v1-phil-card">
                            <div className="v1-phil-card-title">For Instructors</div>
                            <p className="v1-phil-card-desc">
                                Create AI-powered problem sets in minutes. Assign to your classrooms, track every submission, and see precisely where your students need help.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="v1-cta-section">
                    <h2 className="v1-cta-heading">Begin the pursuit of understanding.</h2>
                    <p className="v1-cta-sub">
                        Join CodeGuruAI and learn to solve problems — not copy solutions. Free for students, powerful for instructors.
                    </p>
                    <div className="v1-cta-buttons">
                        <Link href="/register" className="v1-cta-primary">
                            Create Free Account
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </Link>
                        <Link href="/login" className="v1-cta-secondary">Sign In</Link>
                    </div>
                </section>

                {/* Footer */}
                <div className="v1-footer">
                    <div className="v1-footer-brand">
                        <div className="v1-nav-brand">
                            <Image src="/favicon.png" alt="CodeGuruAI" width={28} height={28} style={{ objectFit: "contain" }} />
                            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 700 }}>CodeGuru<span style={{ color: "var(--v1-gold)" }}>AI</span></span>
                        </div>
                        <p>AI-powered coding education built for university classrooms.</p>
                    </div>
                    <div className="v1-footer-cols">
                        <div className="v1-footer-col">
                            <div className="v1-footer-col-title">Platform</div>
                            <ul>
                                <li><Link href="/register">Get Started</Link></li>
                                <li><Link href="/login">Sign In</Link></li>
                                <li><Link href="/register?role=instructor">For Instructors</Link></li>
                            </ul>
                        </div>
                        <div className="v1-footer-col">
                            <div className="v1-footer-col-title">Legal</div>
                            <ul>
                                <li><a href="#">Privacy Policy</a></li>
                                <li><a href="#">Terms of Use</a></li>
                                <li><a href="#">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="v1-footer-bottom">
                    <span>&copy; 2026 CodeGuruAI. All rights reserved.</span>
                    <span>Built for learners who want to actually understand code.</span>
                </div>
            </div>
        </>
    )
}
