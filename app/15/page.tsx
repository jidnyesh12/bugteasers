"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V15 — Blueprint / Technical Drawing
   Entire page styled as an architect's blueprint.
   Cyan lines on dark navy, grid paper background,
   dimension lines, annotation callouts, technical font,
   schematic-style diagrams, fold marks, title block.
   Font: Share Tech Mono + Orbitron
   ================================================================ */

export default function LandingV15() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;700;900&display=swap');

                .v15 {
                    --bg: #0A1628;
                    --line: #1B6B93;
                    --line2: #2E9BC5;
                    --bright: #5BC0DE;
                    --white: #B8DBE8;
                    --dim: #4A7A8C;
                    --grid: rgba(27,107,147,0.12);
                    font-family: 'Share Tech Mono', monospace;
                    background: var(--bg);
                    color: var(--white);
                    min-height: 100vh;
                    background-image:
                        linear-gradient(var(--grid) 1px, transparent 1px),
                        linear-gradient(90deg, var(--grid) 1px, transparent 1px);
                    background-size: 24px 24px;
                    position: relative;
                    padding: 2rem;
                }

                /* Fold marks */
                .v15::before, .v15::after {
                    content: '+'; position: fixed; color: var(--dim); font-size: 20px;
                    opacity: 0.3;
                }
                .v15::before { top: 10px; left: 10px; }
                .v15::after { bottom: 10px; right: 10px; }

                .v15-sheet {
                    max-width: 1200px; margin: 0 auto;
                    border: 1px solid var(--line); padding: 2rem;
                }

                /* Title block */
                .v15-titleblock {
                    border: 2px solid var(--line); display: grid;
                    grid-template-columns: 1fr auto; margin-bottom: 2rem;
                }
                .v15-tb-main { padding: 1.25rem 1.5rem; border-right: 1px solid var(--line); }
                .v15-tb-title { font-family: 'Orbitron', sans-serif; font-size: 2rem; font-weight: 900; color: var(--bright); letter-spacing: 0.1em; }
                .v15-tb-sub { font-size: 0.8rem; color: var(--dim); margin-top: 0.3rem; }
                .v15-tb-info { padding: 0.75rem 1.25rem; font-size: 0.7rem; color: var(--dim); min-width: 200px; display: flex; flex-direction: column; gap: 0.35rem; }
                .v15-tb-row { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(27,107,147,0.3); padding-bottom: 0.25rem; }
                .v15-tb-label { text-transform: uppercase; letter-spacing: 0.1em; }
                .v15-tb-val { color: var(--white); }

                /* Nav */
                .v15-nav { display: flex; justify-content: flex-end; gap: 1rem; margin-bottom: 2rem; }
                .v15-nav-link {
                    font-family: 'Orbitron', sans-serif; font-size: 0.7rem;
                    padding: 0.5rem 1.25rem; border: 1px solid var(--line);
                    color: var(--bright); text-decoration: none; text-transform: uppercase;
                    letter-spacing: 0.15em; transition: all 0.2s;
                }
                .v15-nav-link:hover { background: rgba(91,192,222,0.1); border-color: var(--bright); }
                .v15-nav-link.primary { background: rgba(91,192,222,0.15); border-color: var(--bright); }

                /* Section headers */
                .v15-section { margin-bottom: 2.5rem; position: relative; }
                .v15-section-header {
                    font-family: 'Orbitron', sans-serif; font-size: 0.7rem;
                    text-transform: uppercase; letter-spacing: 0.25em; color: var(--bright);
                    border-bottom: 1px solid var(--line); padding-bottom: 0.5rem;
                    margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;
                }
                .v15-section-num { color: var(--dim); }

                /* Hero description */
                .v15-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 0.5rem; }
                .v15-hero-desc { font-size: 0.88rem; line-height: 1.85; color: var(--white); }
                .v15-hero-desc strong { color: var(--bright); }

                /* Schematic diagram */
                .v15-schematic {
                    border: 1px dashed var(--line); padding: 1.5rem;
                    position: relative;
                }
                .v15-schematic-label {
                    position: absolute; top: -0.6rem; left: 1rem;
                    background: var(--bg); padding: 0 0.5rem;
                    font-size: 0.65rem; color: var(--dim); text-transform: uppercase;
                    letter-spacing: 0.15em;
                }
                .v15-flow { display: flex; align-items: center; justify-content: center; gap: 0; flex-wrap: wrap; }
                .v15-flow-box {
                    border: 1px solid var(--line2); padding: 0.75rem 1rem;
                    font-size: 0.75rem; text-align: center; min-width: 120px;
                    color: var(--bright); position: relative;
                }
                .v15-flow-arrow { color: var(--dim); font-size: 1.25rem; padding: 0 0.5rem; }

                /* Annotation callout */
                .v15-callout {
                    display: flex; align-items: flex-start; gap: 0.75rem;
                    padding: 1rem 1.25rem; border-left: 2px solid var(--bright);
                    margin: 1rem 0;
                }
                .v15-callout-num {
                    font-family: 'Orbitron', sans-serif; font-size: 0.65rem;
                    color: var(--bright); flex-shrink: 0; padding-top: 0.1rem;
                }
                .v15-callout-text { font-size: 0.82rem; line-height: 1.7; color: var(--white); }
                .v15-callout-text strong { color: var(--bright); }

                /* Features grid */
                .v15-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); }
                .v15-feat-cell { background: var(--bg); padding: 1.5rem; }
                .v15-feat-id { font-family: 'Orbitron', sans-serif; font-size: 0.6rem; color: var(--dim); margin-bottom: 0.5rem; letter-spacing: 0.15em; }
                .v15-feat-name { font-family: 'Orbitron', sans-serif; font-size: 0.85rem; color: var(--bright); margin-bottom: 0.4rem; }
                .v15-feat-spec { font-size: 0.78rem; color: var(--dim); line-height: 1.6; }

                /* Dimension line */
                .v15-dim { display: flex; align-items: center; gap: 0.5rem; margin: 1.5rem 0; color: var(--dim); font-size: 0.7rem; }
                .v15-dim-line { flex: 1; border-top: 1px solid var(--dim); position: relative; }
                .v15-dim-line::before, .v15-dim-line::after {
                    content: ''; position: absolute; top: -4px;
                    border: 4px solid transparent; border-bottom-color: var(--dim);
                }
                .v15-dim-line::before { left: 0; }
                .v15-dim-line::after { right: 0; }

                /* Specs table */
                .v15-specs { border: 1px solid var(--line); font-size: 0.78rem; width: 100%; border-collapse: collapse; }
                .v15-specs th { text-align: left; padding: 0.6rem 1rem; background: rgba(27,107,147,0.15); border: 1px solid var(--line); font-family: 'Orbitron', sans-serif; font-size: 0.65rem; color: var(--bright); text-transform: uppercase; letter-spacing: 0.1em; }
                .v15-specs td { padding: 0.6rem 1rem; border: 1px solid var(--line); color: var(--white); }

                /* CTA */
                .v15-cta { border: 2px solid var(--bright); padding: 2rem; text-align: center; margin-top: 2rem; }
                .v15-cta-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--bright); margin-bottom: 0.75rem; letter-spacing: 0.05em; }
                .v15-cta-sub { font-size: 0.85rem; color: var(--dim); margin-bottom: 1.5rem; }
                .v15-cta-btn {
                    display: inline-block; font-family: 'Orbitron', sans-serif;
                    font-size: 0.75rem; padding: 0.75rem 2.5rem;
                    border: 2px solid var(--bright); color: var(--bright);
                    text-decoration: none; text-transform: uppercase;
                    letter-spacing: 0.2em; transition: all 0.2s;
                }
                .v15-cta-btn:hover { background: rgba(91,192,222,0.15); }

                /* Footer */
                .v15-footer {
                    margin-top: 2rem; border-top: 1px solid var(--line);
                    padding-top: 0.75rem; display: flex; justify-content: space-between;
                    font-size: 0.65rem; color: var(--dim);
                }

                @media (max-width: 800px) {
                    .v15-hero-grid { grid-template-columns: 1fr; }
                    .v15-feat-grid { grid-template-columns: 1fr; }
                    .v15-titleblock { grid-template-columns: 1fr; }
                    .v15-flow { flex-direction: column; }
                    .v15-flow-arrow { transform: rotate(90deg); }
                }
            `}</style>

            <div className="v15">
                <div className="v15-sheet">
                    {/* Title block */}
                    <div className="v15-titleblock">
                        <div className="v15-tb-main">
                            <div className="v15-tb-title">CODEGURUAI</div>
                            <div className="v15-tb-sub">AI-Powered Coding Education Platform — System Architecture Overview</div>
                        </div>
                        <div className="v15-tb-info">
                            <div className="v15-tb-row"><span className="v15-tb-label">Drawing No.</span><span className="v15-tb-val">CG-2026-001</span></div>
                            <div className="v15-tb-row"><span className="v15-tb-label">Scale</span><span className="v15-tb-val">NTS</span></div>
                            <div className="v15-tb-row"><span className="v15-tb-label">Revision</span><span className="v15-tb-val">R2.0</span></div>
                            <div className="v15-tb-row"><span className="v15-tb-label">Status</span><span className="v15-tb-val" style={{ color: "#5BC0DE" }}>PRODUCTION</span></div>
                        </div>
                    </div>

                    <div className="v15-nav">
                        {user ? (
                            <Link href={dashboardHref} className="v15-nav-link primary">Dashboard →</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v15-nav-link">Sign In</Link>
                                <Link href="/register" className="v15-nav-link primary">Initialize Account →</Link>
                            </>
                        )}
                    </div>

                    {/* Section 1: Overview */}
                    <div className="v15-section">
                        <div className="v15-section-header"><span className="v15-section-num">§1.0</span> SYSTEM OVERVIEW</div>
                        <div className="v15-hero-grid">
                            <div className="v15-hero-desc">
                                <strong>CodeGuruAI</strong> is an AI-powered coding education platform built for university CS classrooms. The system implements the Socratic method: when students request help, the AI identifies the specific misconception and generates a <strong>targeted question</strong> — never the answer.<br /><br />
                                The platform supports <strong>live code execution</strong> (Python, JS, C++, Java), <strong>AI problem generation</strong>, <strong>classroom management</strong>, and <strong>real-time analytics</strong>.
                            </div>
                            <div className="v15-schematic">
                                <div className="v15-schematic-label">Fig 1.1 — System Flow Diagram</div>
                                <div className="v15-flow">
                                    <div className="v15-flow-box">STUDENT<br /><span style={{ fontSize: "0.65rem", color: "var(--dim)" }}>writes code</span></div>
                                    <div className="v15-flow-arrow">→</div>
                                    <div className="v15-flow-box">EXECUTION<br /><span style={{ fontSize: "0.65rem", color: "var(--dim)" }}>runs tests</span></div>
                                    <div className="v15-flow-arrow">→</div>
                                    <div className="v15-flow-box">AI ENGINE<br /><span style={{ fontSize: "0.65rem", color: "var(--dim)" }}>analyzes gaps</span></div>
                                    <div className="v15-flow-arrow">→</div>
                                    <div className="v15-flow-box">SOCRATIC HINT<br /><span style={{ fontSize: "0.65rem", color: "var(--dim)" }}>asks question</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Features */}
                    <div className="v15-section">
                        <div className="v15-section-header"><span className="v15-section-num">§2.0</span> MODULE SPECIFICATIONS</div>
                        <div className="v15-feat-grid">
                            <div className="v15-feat-cell"><div className="v15-feat-id">MOD-001</div><div className="v15-feat-name">SOCRATIC AI</div><div className="v15-feat-spec">Identifies misconceptions. Generates targeted questions. Never reveals answers directly.</div></div>
                            <div className="v15-feat-cell"><div className="v15-feat-id">MOD-002</div><div className="v15-feat-name">CODE EDITOR</div><div className="v15-feat-spec">In-browser IDE. Syntax highlighting, test validation, 4 language support.</div></div>
                            <div className="v15-feat-cell"><div className="v15-feat-id">MOD-003</div><div className="v15-feat-name">AI GENERATOR</div><div className="v15-feat-spec">Automated problem creation. Topic, difficulty, constraint parameters. Complete test suites.</div></div>
                            <div className="v15-feat-cell"><div className="v15-feat-id">MOD-004</div><div className="v15-feat-name">ANALYTICS</div><div className="v15-feat-spec">Real-time dashboards. Submissions, time-to-solve, hint dependency, completion rates.</div></div>
                            <div className="v15-feat-cell"><div className="v15-feat-id">MOD-005</div><div className="v15-feat-name">CLASSROOMS</div><div className="v15-feat-spec">Course mgmt. Problem set assignment, deadlines, student enrollment, cohort tracking.</div></div>
                            <div className="v15-feat-cell"><div className="v15-feat-id">MOD-006</div><div className="v15-feat-name">INTEGRITY</div><div className="v15-feat-spec">AI-unique problems per semester. No answer pools. Prevents cross-student copying.</div></div>
                        </div>
                    </div>

                    {/* Dimension */}
                    <div className="v15-dim">
                        <span>▸</span><div className="v15-dim-line"></div><span>15,000+ STUDENTS — 250+ UNIVERSITIES — 94% COMPLETION</span><div className="v15-dim-line"></div><span>◂</span>
                    </div>

                    {/* Section 3: Specs table */}
                    <div className="v15-section">
                        <div className="v15-section-header"><span className="v15-section-num">§3.0</span> TECHNICAL SPECIFICATIONS</div>
                        <table className="v15-specs">
                            <thead><tr><th>Parameter</th><th>Specification</th><th>Notes</th></tr></thead>
                            <tbody>
                                <tr><td>Languages</td><td>Python, JavaScript, C++, Java</td><td>Server-side sandboxed execution</td></tr>
                                <tr><td>AI Hint Method</td><td>Socratic questioning</td><td>Never reveals direct answers</td></tr>
                                <tr><td>Editor</td><td>CodeMirror 6</td><td>Full LSP-grade functionality</td></tr>
                                <tr><td>LLM Provider</td><td>Google Generative AI</td><td>Gemini model family</td></tr>
                                <tr><td>Student Cost</td><td>$0.00</td><td>Free for all students</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="v15-cta">
                        <div className="v15-cta-title">DEPLOY // ENGAGE // LEARN</div>
                        <div className="v15-cta-sub">Initialize your CodeGuruAI instance — free for students, full-featured for instructors.</div>
                        <Link href="/register" className="v15-cta-btn">Initialize Account →</Link>
                    </div>

                    <div className="v15-footer">
                        <span>© 2026 CodeGuruAI Systems — Drawing CG-2026-001 Rev 2.0</span>
                        <span>CONFIDENTIAL — FOR EDUCATIONAL USE ONLY</span>
                    </div>
                </div>
            </div>
        </>
    )
}
