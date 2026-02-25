"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V20 — Chalkboard Classroom
   The entire page looks like a classroom chalkboard.
   Chalk-drawn elements, handwritten feel, eraser smudge marks,
   chalk dust, ruled lines, doodles, math-style notations,
   green chalkboard background with wood frame.
   Font: Caveat + Patrick Hand
   ================================================================ */

export default function LandingV20() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Patrick+Hand&family=Rock+Salt&display=swap');

                .v20 {
                    --board: #2B4028;
                    --board2: #1E3019;
                    --chalk: rgba(255,255,255,0.88);
                    --chalk-dim: rgba(255,255,255,0.45);
                    --chalk-faint: rgba(255,255,255,0.18);
                    --yellow-chalk: #F3E5AB;
                    --pink-chalk: #F2A1A1;
                    --blue-chalk: #ADD8E6;
                    --orange-chalk: #F2C078;
                    --wood: #6B3A1F;
                    --wood2: #8B5A2B;
                    font-family: 'Patrick Hand', cursive;
                    min-height: 100vh;
                    background: var(--wood);
                    padding: 1.5rem;
                }

                .v20-frame {
                    border: 12px solid var(--wood2);
                    border-top-color: #7B4A2F;
                    border-left-color: #7B4A2F;
                    border-right-color: #5B2A0F;
                    border-bottom-color: #5B2A0F;
                    box-shadow: inset 0 0 30px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.4);
                    min-height: calc(100vh - 3rem);
                }

                .v20-board {
                    background: var(--board);
                    background-image:
                        radial-gradient(ellipse at 30% 20%, rgba(60,80,55,0.4) 0%, transparent 60%),
                        radial-gradient(ellipse at 70% 60%, rgba(50,70,45,0.3) 0%, transparent 50%),
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                    color: var(--chalk);
                    padding: 3rem 3.5rem;
                    position: relative;
                    min-height: calc(100vh - 3rem - 24px);
                }

                /* Chalk dust */
                .v20-board::before {
                    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
                    height: 40px;
                    background: linear-gradient(to top, rgba(255,255,255,0.03), transparent);
                }

                /* Eraser smudge */
                .v20-smudge {
                    position: absolute; width: 200px; height: 60px;
                    background: radial-gradient(ellipse, rgba(43,64,40,0.5) 30%, transparent 70%);
                    transform: rotate(-5deg);
                }
                .v20-smudge.s1 { top: 15%; right: 10%; }
                .v20-smudge.s2 { top: 55%; left: 5%; width: 150px; transform: rotate(3deg); }

                /* Tray */
                .v20-tray {
                    position: absolute; bottom: -6px; left: 10%; right: 10%;
                    height: 14px; background: var(--wood2);
                    border-radius: 0 0 4px 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .v20-tray-chalk {
                    position: absolute; top: -4px;
                    width: 40px; height: 8px; border-radius: 3px;
                }

                /* Nav */
                .v20-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                .v20-brand { font-family: 'Rock Salt', cursive; font-size: 1.2rem; color: var(--yellow-chalk); }
                .v20-nav-links { display: flex; gap: 0.75rem; }
                .v20-nav-link {
                    font-family: 'Patrick Hand'; font-size: 1.05rem;
                    color: var(--chalk); text-decoration: none;
                    padding: 0.25rem 0.75rem;
                    border-bottom: 2px dashed var(--chalk-faint);
                    transition: all 0.2s;
                }
                .v20-nav-link:hover { color: var(--yellow-chalk); border-color: var(--yellow-chalk); }
                .v20-nav-link.cta { border: 2px solid var(--yellow-chalk); color: var(--yellow-chalk); border-radius: 0; }

                /* Main title */
                .v20-title { text-align: center; margin-bottom: 3rem; }
                .v20-h1 {
                    font-family: 'Caveat', cursive; font-size: 4.5rem; font-weight: 700;
                    line-height: 1.1; color: var(--chalk); margin-bottom: 0.5rem;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
                }
                .v20-h1 .yellow { color: var(--yellow-chalk); }
                .v20-h1 .underline {
                    text-decoration: underline;
                    text-decoration-style: wavy;
                    text-decoration-color: var(--pink-chalk);
                    text-underline-offset: 6px;
                }
                .v20-subtitle {
                    font-size: 1.25rem; color: var(--chalk-dim); max-width: 550px;
                    margin: 0 auto; line-height: 1.55;
                }

                /* Ruled lines section */
                .v20-ruled {
                    background-image: repeating-linear-gradient(
                        to bottom,
                        transparent,
                        transparent 39px,
                        var(--chalk-faint) 39px,
                        var(--chalk-faint) 40px
                    );
                    padding: 0.5rem 0;
                    margin-bottom: 2rem;
                }

                /* Handwritten features */
                .v20-features { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-bottom: 3rem; }
                .v20-feat { position: relative; }
                .v20-feat-num {
                    font-family: 'Caveat', cursive; font-size: 2.5rem; font-weight: 700;
                    position: absolute; top: -0.5rem; left: -0.5rem;
                    opacity: 0.15;
                }
                .v20-feat-title {
                    font-family: 'Caveat', cursive; font-size: 1.75rem; font-weight: 700;
                    margin-bottom: 0.35rem;
                }
                .v20-feat-title.yellow { color: var(--yellow-chalk); }
                .v20-feat-title.pink { color: var(--pink-chalk); }
                .v20-feat-title.blue { color: var(--blue-chalk); }
                .v20-feat-title.orange { color: var(--orange-chalk); }
                .v20-feat-desc { font-size: 1.05rem; color: var(--chalk-dim); line-height: 1.55; }

                /* Arrow doodle */
                .v20-arrow {
                    font-family: 'Caveat', cursive; font-size: 1.5rem;
                    color: var(--pink-chalk); text-align: center;
                    margin: 2rem 0; transform: rotate(-3deg);
                }

                /* Box around code */
                .v20-code-box {
                    border: 2px solid var(--chalk-dim); padding: 1.5rem;
                    margin-bottom: 2rem; position: relative;
                    border-radius: 0;
                }
                .v20-code-box-label {
                    position: absolute; top: -0.85rem; left: 1rem;
                    background: var(--board); padding: 0 0.5rem;
                    font-family: 'Caveat', cursive; font-size: 1.05rem;
                    color: var(--yellow-chalk);
                }
                .v20-code {
                    font-family: 'Patrick Hand', cursive; font-size: 1.05rem;
                    line-height: 2; color: var(--chalk);
                }
                .v20-code .kw { color: var(--blue-chalk); }
                .v20-code .fn { color: var(--yellow-chalk); }
                .v20-code .str { color: var(--pink-chalk); }
                .v20-code .cm { color: var(--chalk-dim); font-style: italic; }
                .v20-code .ok { color: #90EE90; }

                /* Stars/doodles */
                .v20-star { position: absolute; color: var(--yellow-chalk); opacity: 0.2; }

                /* Stats chalk boxes */
                .v20-stats { display: flex; justify-content: center; gap: 3rem; margin: 2rem 0 3rem; flex-wrap: wrap; }
                .v20-stat { text-align: center; }
                .v20-stat-val { font-family: 'Caveat', cursive; font-size: 3rem; font-weight: 700; }
                .v20-stat-val.yellow { color: var(--yellow-chalk); }
                .v20-stat-val.pink { color: var(--pink-chalk); }
                .v20-stat-val.blue { color: var(--blue-chalk); }
                .v20-stat-val.orange { color: var(--orange-chalk); }
                .v20-stat-label { font-size: 0.9rem; color: var(--chalk-dim); }

                /* CTA */
                .v20-cta { text-align: center; padding: 2rem 0 1rem; }
                .v20-cta-title { font-family: 'Caveat', cursive; font-size: 3rem; font-weight: 700; margin-bottom: 0.5rem; }
                .v20-cta-sub { font-size: 1.1rem; color: var(--chalk-dim); margin-bottom: 1.5rem; }
                .v20-cta-btn {
                    display: inline-block; font-family: 'Caveat', cursive;
                    font-size: 1.5rem; font-weight: 700; padding: 0.6rem 2.5rem;
                    border: 3px solid var(--yellow-chalk); color: var(--yellow-chalk);
                    text-decoration: none; transition: all 0.2s;
                }
                .v20-cta-btn:hover { background: rgba(243,229,171,0.1); }

                .v20-footer { margin-top: 2rem; text-align: center; font-size: 0.85rem; color: var(--chalk-dim); }

                @media (max-width: 800px) {
                    .v20-board { padding: 2rem 1.5rem; }
                    .v20-h1 { font-size: 2.5rem; }
                    .v20-features { grid-template-columns: 1fr; }
                    .v20-stats { gap: 1.5rem; }
                }
            `}</style>

            <div className="v20">
                <div className="v20-frame">
                    <div className="v20-board">
                        <div className="v20-smudge s1" />
                        <div className="v20-smudge s2" />

                        {/* Doodle stars */}
                        <div className="v20-star" style={{ top: "8%", right: "15%", fontSize: "2rem" }}>✦</div>
                        <div className="v20-star" style={{ top: "30%", left: "3%", fontSize: "1.5rem" }}>★</div>
                        <div className="v20-star" style={{ bottom: "20%", right: "8%", fontSize: "1.8rem" }}>✶</div>

                        <nav className="v20-nav">
                            <div className="v20-brand">CodeGuruAI</div>
                            <div className="v20-nav-links">
                                {user ? (
                                    <Link href={dashboardHref} className="v20-nav-link cta">Dashboard →</Link>
                                ) : (
                                    <>
                                        <Link href="/login" className="v20-nav-link">Sign In</Link>
                                        <Link href="/register" className="v20-nav-link cta">Join Free →</Link>
                                    </>
                                )}
                            </div>
                        </nav>

                        <div className="v20-title">
                            <h1 className="v20-h1">The AI tutor that<br/><span className="underline">asks <span className="yellow">questions</span></span>,<br/>not gives answers.</h1>
                            <p className="v20-subtitle">Socratic AI coding guidance for university CS classrooms. Built to make you think — not copy.</p>
                        </div>

                        <div className="v20-arrow">↓ here&apos;s how it works ↓</div>

                        <div className="v20-ruled">
                            <div className="v20-features">
                                <div className="v20-feat">
                                    <div className="v20-feat-num">1</div>
                                    <div className="v20-feat-title yellow">🧠 Socratic Hints</div>
                                    <div className="v20-feat-desc">AI identifies your misconception and asks the RIGHT question. Never spills the answer.</div>
                                </div>
                                <div className="v20-feat">
                                    <div className="v20-feat-num">2</div>
                                    <div className="v20-feat-title pink">⚡ Live Code Editor</div>
                                    <div className="v20-feat-desc">Write & run code right in the browser. Instant test results. Python, JS, C++, Java.</div>
                                </div>
                                <div className="v20-feat">
                                    <div className="v20-feat-num">3</div>
                                    <div className="v20-feat-title blue">🎯 AI Problem Generator</div>
                                    <div className="v20-feat-desc">Instructors get unique problems every semester. No recycled assignments. No cheating.</div>
                                </div>
                                <div className="v20-feat">
                                    <div className="v20-feat-num">4</div>
                                    <div className="v20-feat-title orange">📊 Classroom Analytics</div>
                                    <div className="v20-feat-desc">See who&apos;s struggling, who&apos;s thriving, and exactly where students need help — in real time.</div>
                                </div>
                            </div>
                        </div>

                        <div className="v20-code-box">
                            <div className="v20-code-box-label">📝 Example</div>
                            <div className="v20-code">
                                <div><span className="kw">def</span> <span className="fn">two_sum</span>(nums, target):</div>
                                <div>    seen = {'{}'}  <span className="cm"># ← the hint helped!</span></div>
                                <div>    <span className="kw">for</span> i, n <span className="kw">in</span> <span className="fn">enumerate</span>(nums):</div>
                                <div>        <span className="kw">if</span> target - n <span className="kw">in</span> seen:</div>
                                <div>            <span className="str">return [seen[target-n], i]</span></div>
                                <div>        seen[n] = i</div>
                                <div style={{ marginTop: "0.75rem" }}><span className="ok">✓ All tests passed! (O(n) time)</span></div>
                            </div>
                        </div>

                        <div className="v20-stats">
                            <div className="v20-stat"><div className="v20-stat-val yellow">15k+</div><div className="v20-stat-label">students</div></div>
                            <div className="v20-stat"><div className="v20-stat-val pink">94%</div><div className="v20-stat-label">completion</div></div>
                            <div className="v20-stat"><div className="v20-stat-val blue">250+</div><div className="v20-stat-label">universities</div></div>
                            <div className="v20-stat"><div className="v20-stat-val orange">4.9★</div><div className="v20-stat-label">rating</div></div>
                        </div>

                        <div className="v20-cta">
                            <div className="v20-cta-title">Ready to actually <span style={{ color: "var(--yellow-chalk)" }}>understand</span> code?</div>
                            <div className="v20-cta-sub">Free for students. Full-featured for instructors.</div>
                            <Link href="/register" className="v20-cta-btn">Start Learning Free →</Link>
                        </div>

                        <div className="v20-footer">© 2026 CodeGuruAI · write code, ask questions, understand deeply.</div>

                        <div className="v20-tray">
                            <div className="v20-tray-chalk" style={{ left: "20%", background: "var(--chalk)" }} />
                            <div className="v20-tray-chalk" style={{ left: "35%", background: "var(--yellow-chalk)" }} />
                            <div className="v20-tray-chalk" style={{ left: "55%", background: "var(--pink-chalk)" }} />
                            <div className="v20-tray-chalk" style={{ left: "70%", background: "var(--blue-chalk)" }} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
