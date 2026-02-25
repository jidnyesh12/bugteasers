"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V3 — Card-Grid Dashboard Preview
   Clean system-UI: white + slate blue + teal accents
   Fonts: Plus Jakarta Sans + JetBrains Mono
   Layout: Compact hero, then a dense bento-style card grid
   ================================================================ */

export default function LandingV3() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                .v3-root {
                    --v3-bg: #F8FAFB;
                    --v3-white: #FFFFFF;
                    --v3-slate: #0F172A;
                    --v3-slate-mid: #334155;
                    --v3-slate-light: #64748B;
                    --v3-slate-muted: #94A3B8;
                    --v3-teal: #0D9488;
                    --v3-teal-light: #14B8A6;
                    --v3-teal-bg: #F0FDFA;
                    --v3-border: #E2E8F0;
                    --v3-border-hover: #CBD5E1;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background: var(--v3-bg);
                    color: var(--v3-slate);
                    min-height: 100vh;
                }

                /* Navbar */
                .v3-nav {
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    background: rgba(255,255,255,0.85);
                    backdrop-filter: blur(16px);
                    border-bottom: 1px solid var(--v3-border);
                }

                .v3-nav-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    height: 3.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .v3-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.65rem;
                }

                .v3-nav-brand-text {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: var(--v3-slate);
                    letter-spacing: -0.02em;
                }
                .v3-nav-brand-text .accent { color: var(--v3-teal); }

                .v3-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .v3-nav-link {
                    padding: 0.4rem 0.85rem;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--v3-slate-light);
                    text-decoration: none;
                    transition: color 0.15s;
                }
                .v3-nav-link:hover { color: var(--v3-slate); }

                .v3-nav-btn {
                    padding: 0.45rem 1.25rem;
                    font-size: 0.82rem;
                    font-weight: 700;
                    background: var(--v3-teal);
                    color: white;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: background 0.15s;
                }
                .v3-nav-btn:hover { background: var(--v3-teal-light); }

                /* Compact hero */
                .v3-hero {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 3.5rem 2rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 3rem;
                    flex-wrap: wrap;
                }

                .v3-hero-left {
                    max-width: 580px;
                }

                .v3-hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.3rem 0.85rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    background: var(--v3-teal-bg);
                    color: var(--v3-teal);
                    border-radius: 100px;
                    margin-bottom: 1.25rem;
                    border: 1px solid rgba(13,148,136,0.15);
                }

                .v3-hero-heading {
                    font-size: 2.75rem;
                    font-weight: 800;
                    line-height: 1.15;
                    letter-spacing: -0.03em;
                    margin-bottom: 1rem;
                    color: var(--v3-slate);
                }

                .v3-hero-heading span { color: var(--v3-teal); }

                .v3-hero-sub {
                    font-size: 1.05rem;
                    color: var(--v3-slate-light);
                    line-height: 1.65;
                    max-width: 480px;
                }

                .v3-hero-right {
                    display: flex;
                    gap: 0.75rem;
                    flex-shrink: 0;
                }

                .v3-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.7rem 1.6rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.15s;
                }

                .v3-btn-fill {
                    background: var(--v3-teal);
                    color: white;
                }
                .v3-btn-fill:hover { background: var(--v3-teal-light); transform: translateY(-1px); }

                .v3-btn-outline {
                    background: white;
                    color: var(--v3-slate-mid);
                    border: 1.5px solid var(--v3-border);
                }
                .v3-btn-outline:hover { border-color: var(--v3-border-hover); color: var(--v3-slate); }

                /* Bento grid */
                .v3-grid {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem 2rem 4rem;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: auto;
                    gap: 1rem;
                }

                .v3-card {
                    background: var(--v3-white);
                    border: 1px solid var(--v3-border);
                    border-radius: 14px;
                    padding: 1.75rem;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    overflow: hidden;
                    position: relative;
                }
                .v3-card:hover {
                    border-color: var(--v3-border-hover);
                    box-shadow: 0 4px 24px rgba(15,23,42,0.04);
                }

                .v3-card-span2 {
                    grid-column: span 2;
                }

                .v3-card-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.25rem;
                }

                .v3-card-icon-teal { background: var(--v3-teal-bg); }
                .v3-card-icon-slate { background: #F1F5F9; }
                .v3-card-icon-amber { background: #FFFBEB; }

                .v3-card-title {
                    font-size: 1rem;
                    font-weight: 800;
                    color: var(--v3-slate);
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.02em;
                }

                .v3-card-desc {
                    font-size: 0.85rem;
                    color: var(--v3-slate-light);
                    line-height: 1.6;
                    max-width: 38ch;
                }

                /* Code preview card */
                .v3-code-preview {
                    margin-top: 1.25rem;
                    border-radius: 10px;
                    overflow: hidden;
                    border: 1px solid var(--v3-border);
                }

                .v3-code-bar {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0.5rem 0.75rem;
                    background: #F8FAFC;
                    border-bottom: 1px solid var(--v3-border);
                }

                .v3-code-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .v3-code-body {
                    padding: 1rem;
                    background: #0F172A;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.72rem;
                    line-height: 1.85;
                    color: #94A3B8;
                }

                .v3-code-body .kw { color: #38BDF8; }
                .v3-code-body .fn { color: #A78BFA; }
                .v3-code-body .str { color: #34D399; }
                .v3-code-body .cm { color: #475569; }

                /* Stat mini */
                .v3-stat-row {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.25rem;
                }

                .v3-stat {
                    flex: 1;
                    padding: 0.85rem;
                    border-radius: 10px;
                    background: #F8FAFC;
                    border: 1px solid var(--v3-border);
                }

                .v3-stat-val {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--v3-slate);
                    letter-spacing: -0.03em;
                }

                .v3-stat-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: var(--v3-slate-muted);
                    margin-top: 0.15rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Hint preview */
                .v3-hint-preview {
                    margin-top: 1.25rem;
                    padding: 1rem;
                    border-radius: 10px;
                    background: var(--v3-teal-bg);
                    border: 1px solid rgba(13,148,136,0.12);
                }

                .v3-hint-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--v3-teal);
                    margin-bottom: 0.4rem;
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                }

                .v3-hint-text {
                    font-size: 0.82rem;
                    line-height: 1.55;
                    color: var(--v3-slate-mid);
                    font-style: italic;
                }

                /* Banner */
                .v3-banner {
                    max-width: 1200px;
                    margin: 0 auto 3rem;
                    padding: 0 2rem;
                }

                .v3-banner-inner {
                    background: var(--v3-slate);
                    border-radius: 16px;
                    padding: 3.5rem;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                }

                .v3-banner-inner::after {
                    content: '';
                    position: absolute;
                    bottom: -30%;
                    right: -10%;
                    width: 300px;
                    height: 300px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(13,148,136,0.15), transparent 70%);
                }

                .v3-banner-heading {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: white;
                    line-height: 1.25;
                    letter-spacing: -0.02em;
                    margin-bottom: 0.75rem;
                }

                .v3-banner-heading span {
                    color: var(--v3-slate-muted);
                }

                .v3-banner-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    position: relative;
                    z-index: 1;
                }

                .v3-banner-card {
                    padding: 1rem 1.25rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.04);
                }

                .v3-banner-card-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--v3-teal-light);
                    margin-bottom: 0.25rem;
                }

                .v3-banner-card-desc {
                    font-size: 0.8rem;
                    color: var(--v3-slate-muted);
                    line-height: 1.55;
                }

                /* CTA */
                .v3-cta {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem 2rem 4rem;
                    text-align: center;
                }

                .v3-cta-heading {
                    font-size: 2.25rem;
                    font-weight: 800;
                    color: var(--v3-slate);
                    letter-spacing: -0.03em;
                    margin-bottom: 0.75rem;
                }

                .v3-cta-sub {
                    font-size: 1rem;
                    color: var(--v3-slate-light);
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }

                .v3-cta-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                }

                /* Footer */
                .v3-footer {
                    border-top: 1px solid var(--v3-border);
                    background: white;
                }

                .v3-footer-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2.5rem 2rem 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 2rem;
                }

                .v3-footer-brand p {
                    font-size: 0.78rem;
                    color: var(--v3-slate-muted);
                    margin-top: 0.5rem;
                    max-width: 280px;
                    line-height: 1.55;
                }

                .v3-footer-cols {
                    display: flex;
                    gap: 3.5rem;
                }

                .v3-footer-col-title {
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--v3-slate-muted);
                    margin-bottom: 0.85rem;
                }

                .v3-footer-col ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .v3-footer-col li { margin-bottom: 0.5rem; }

                .v3-footer-col a {
                    font-size: 0.78rem;
                    color: var(--v3-slate-light);
                    text-decoration: none;
                    transition: color 0.15s;
                }
                .v3-footer-col a:hover { color: var(--v3-slate); }

                .v3-footer-bottom {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem 2rem;
                    border-top: 1px solid var(--v3-border);
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.72rem;
                    color: var(--v3-slate-muted);
                }

                @media (max-width: 768px) {
                    .v3-hero { flex-direction: column; align-items: flex-start; }
                    .v3-hero-heading { font-size: 2rem; }
                    .v3-grid { grid-template-columns: 1fr; }
                    .v3-card-span2 { grid-column: span 1; }
                    .v3-banner-inner { grid-template-columns: 1fr; padding: 2rem; }
                    .v3-stat-row { flex-direction: column; }
                }
            `}</style>

            <div className="v3-root">
                {/* Navbar */}
                <nav className="v3-nav">
                    <div className="v3-nav-inner">
                        <div className="v3-nav-brand">
                            <Image src="/favicon.png" alt="CodeGuruAI" width={32} height={32} style={{ objectFit: "contain" }} />
                            <span className="v3-nav-brand-text">CodeGuru<span className="accent">AI</span></span>
                        </div>
                        <div className="v3-nav-links">
                            {user ? (
                                <Link href={dashboardHref} className="v3-nav-btn">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="v3-nav-link">Sign In</Link>
                                    <Link href="/register" className="v3-nav-btn">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Compact Hero */}
                <section className="v3-hero">
                    <div className="v3-hero-left">
                        <div className="v3-hero-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            AI-Powered Education Platform
                        </div>
                        <h1 className="v3-hero-heading">
                            The coding tutor that<br />teaches through <span>questions.</span>
                        </h1>
                        <p className="v3-hero-sub">
                            Socratic AI hints, live code execution, and classroom analytics — everything you need for hands-on CS education.
                        </p>
                    </div>
                    <div className="v3-hero-right">
                        <Link href="/register" className="v3-btn v3-btn-fill">
                            Start Free
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </Link>
                        <Link href="#grid" className="v3-btn v3-btn-outline">Explore</Link>
                    </div>
                </section>

                {/* Bento Card Grid */}
                <section className="v3-grid" id="grid">
                    {/* Socratic Hints — spans 2 */}
                    <div className="v3-card v3-card-span2">
                        <div className="v3-card-icon v3-card-icon-teal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </div>
                        <h3 className="v3-card-title">Socratic AI Hints</h3>
                        <p className="v3-card-desc">
                            When students are stuck, the AI asks the right question — never reveals the answer. It exposes blind spots and forces genuine reasoning through every problem.
                        </p>
                        <div className="v3-hint-preview">
                            <div className="v3-hint-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                AI Hint
                            </div>
                            <p className="v3-hint-text">&ldquo;What data structure gives you O(1) lookups? How would that reduce your time complexity here?&rdquo;</p>
                        </div>
                    </div>

                    {/* Live Code — single */}
                    <div className="v3-card">
                        <div className="v3-card-icon v3-card-icon-slate">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        </div>
                        <h3 className="v3-card-title">Live Code Execution</h3>
                        <p className="v3-card-desc">
                            Write, run, and test solutions directly in the browser. Instant feedback, zero setup.
                        </p>
                        <div className="v3-code-preview">
                            <div className="v3-code-bar">
                                <div className="v3-code-dot" style={{ background: "#EF4444" }} />
                                <div className="v3-code-dot" style={{ background: "#F59E0B" }} />
                                <div className="v3-code-dot" style={{ background: "#10B981" }} />
                            </div>
                            <div className="v3-code-body">
                                <div><span className="kw">def</span> <span className="fn">two_sum</span>(nums, target):</div>
                                <div>    seen = {'{}'}</div>
                                <div><span className="kw">    for</span> i, n <span className="kw">in</span> <span className="fn">enumerate</span>(nums):</div>
                                <div>        diff = target - n</div>
                                <div><span className="kw">        if</span> diff <span className="kw">in</span> seen:</div>
                                <div><span className="str">            return [seen[diff], i]</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Tracking */}
                    <div className="v3-card">
                        <div className="v3-card-icon v3-card-icon-amber">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </div>
                        <h3 className="v3-card-title">Progress Analytics</h3>
                        <p className="v3-card-desc">
                            Track where students excel and where they struggle. Real-time classroom insights.
                        </p>
                        <div className="v3-stat-row">
                            <div className="v3-stat">
                                <div className="v3-stat-val">94%</div>
                                <div className="v3-stat-label">Pass Rate</div>
                            </div>
                            <div className="v3-stat">
                                <div className="v3-stat-val">2.4k</div>
                                <div className="v3-stat-label">Submissions</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Problem Generation */}
                    <div className="v3-card">
                        <div className="v3-card-icon v3-card-icon-teal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        </div>
                        <h3 className="v3-card-title">AI Problem Generation</h3>
                        <p className="v3-card-desc">
                            Create unique coding challenges in minutes. Set difficulty levels, topics, and constraints — the AI handles the rest.
                        </p>
                    </div>

                    {/* Classroom Management — spans 2 */}
                    <div className="v3-card v3-card-span2">
                        <div className="v3-card-icon v3-card-icon-slate">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <h3 className="v3-card-title">Classroom Management</h3>
                        <p className="v3-card-desc">
                            Create classrooms, assign problem sets, track submissions, and see exactly where students need help. Built for how university courses actually work — assignments, deadlines, and cohort-level analytics all in one place.
                        </p>
                    </div>
                </section>

                {/* Philosophy Banner */}
                <section className="v3-banner">
                    <div className="v3-banner-inner">
                        <div>
                            <h2 className="v3-banner-heading">
                                We don&apos;t give you the answer.<br />
                                <span>We give you the question that leads to it.</span>
                            </h2>
                        </div>
                        <div className="v3-banner-cards">
                            <div className="v3-banner-card">
                                <div className="v3-banner-card-title">For Students</div>
                                <p className="v3-banner-card-desc">
                                    Struggle with intelligent guidance. The struggle is where learning happens — we ensure you&apos;re never fully stuck, never handed the answer.
                                </p>
                            </div>
                            <div className="v3-banner-card">
                                <div className="v3-banner-card-title">For Instructors</div>
                                <p className="v3-banner-card-desc">
                                    Create AI-powered problem sets, assign to classrooms, and track every submission in real time.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="v3-cta">
                    <h2 className="v3-cta-heading">Ready to elevate your classroom?</h2>
                    <p className="v3-cta-sub">
                        Free for students. Powerful for instructors. Join CodeGuruAI today.
                    </p>
                    <div className="v3-cta-buttons">
                        <Link href="/register" className="v3-btn v3-btn-fill">
                            Create Free Account
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </Link>
                        <Link href="/login" className="v3-btn v3-btn-outline">Sign In</Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="v3-footer">
                    <div className="v3-footer-inner">
                        <div className="v3-footer-brand">
                            <div className="v3-nav-brand">
                                <Image src="/favicon.png" alt="CodeGuruAI" width={28} height={28} style={{ objectFit: "contain" }} />
                                <span className="v3-nav-brand-text" style={{ fontSize: "1rem" }}>CodeGuru<span className="accent">AI</span></span>
                            </div>
                            <p>AI-powered coding education for university classrooms.</p>
                        </div>
                        <div className="v3-footer-cols">
                            <div className="v3-footer-col">
                                <div className="v3-footer-col-title">Platform</div>
                                <ul>
                                    <li><Link href="/register">Get Started</Link></li>
                                    <li><Link href="/login">Sign In</Link></li>
                                    <li><Link href="/register?role=instructor">For Instructors</Link></li>
                                </ul>
                            </div>
                            <div className="v3-footer-col">
                                <div className="v3-footer-col-title">Legal</div>
                                <ul>
                                    <li><a href="#">Privacy Policy</a></li>
                                    <li><a href="#">Terms of Use</a></li>
                                    <li><a href="#">Contact</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="v3-footer-bottom">
                        <span>&copy; 2026 CodeGuruAI. All rights reserved.</span>
                        <span>Built for learners who want to actually understand code.</span>
                    </div>
                </footer>
            </div>
        </>
    )
}
