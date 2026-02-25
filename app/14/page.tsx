"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V14 — Comic Book Panels
   The landing page IS a comic strip. Speech bubbles, thought
   bubbles, action panels, halftone dot BG, POW/ZAP effects,
   thick black outlines, panel gutters, bold lettering.
   Font: Bangers + Comic Neue
   ================================================================ */

export default function LandingV14() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:ital,wght@0,400;0,700;1,400&display=swap');

                .v14 {
                    --yellow: #FFD700;
                    --red: #E63946;
                    --blue: #1D3557;
                    --sky: #A8DADC;
                    --white: #FFF9E6;
                    --black: #111;
                    --gutter: 8px;
                    font-family: 'Comic Neue', cursive;
                    background: var(--white);
                    min-height: 100vh;
                    overflow-x: hidden;
                    background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
                    background-size: 4px 4px;
                }

                /* Nav strip */
                .v14-nav {
                    background: var(--red); border-bottom: 4px solid var(--black);
                    padding: 0.5rem 2rem; display: flex; justify-content: space-between;
                    align-items: center;
                }
                .v14-nav-logo { font-family: 'Bangers', cursive; font-size: 1.8rem; color: var(--yellow); letter-spacing: 0.05em; text-shadow: 2px 2px 0 var(--black); }
                .v14-nav-links { display: flex; gap: 0.5rem; }
                .v14-nav-link {
                    font-family: 'Bangers', cursive; font-size: 1rem;
                    padding: 0.35rem 1rem; background: var(--yellow); color: var(--black);
                    border: 3px solid var(--black); text-decoration: none;
                    transform: rotate(-1deg); display: inline-block;
                    transition: transform 0.15s;
                }
                .v14-nav-link:hover { transform: rotate(1deg) scale(1.05); }

                /* Comic grid */
                .v14-grid {
                    max-width: 1200px; margin: var(--gutter) auto;
                    padding: 0 var(--gutter);
                    display: grid; gap: var(--gutter);
                }

                /* Panel base */
                .v14-panel {
                    border: 4px solid var(--black);
                    position: relative; overflow: hidden;
                    box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
                }

                /* Row 1 — hero spanning full width */
                .v14-row1 { grid-template-columns: 1fr; }
                .v14-hero-panel {
                    background: linear-gradient(135deg, var(--blue) 0%, #457B9D 100%);
                    padding: 4rem; text-align: center; min-height: 450px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                }
                .v14-hero-panel::before {
                    content: ''; position: absolute; inset: 0;
                    background-image: radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px);
                    background-size: 6px 6px;
                }
                .v14-pow {
                    position: absolute; top: 1.5rem; right: 2rem;
                    font-family: 'Bangers', cursive; font-size: 3.5rem;
                    color: var(--yellow); text-shadow: 3px 3px 0 var(--red), 6px 6px 0 var(--black);
                    transform: rotate(12deg);
                    animation: v14shake 0.5s ease-in-out infinite alternate;
                }
                @keyframes v14shake { 0% { transform: rotate(10deg) scale(1); } 100% { transform: rotate(14deg) scale(1.05); } }

                .v14-zap {
                    position: absolute; bottom: 2rem; left: 2rem;
                    font-family: 'Bangers', cursive; font-size: 2.5rem;
                    color: var(--white); text-shadow: 2px 2px 0 var(--red), 4px 4px 0 var(--black);
                    transform: rotate(-8deg);
                }
                .v14-hero-title {
                    font-family: 'Bangers', cursive; font-size: 5rem; color: var(--yellow);
                    text-shadow: 4px 4px 0 var(--black); line-height: 1.1;
                    letter-spacing: 0.04em; position: relative; z-index: 1;
                    margin-bottom: 1rem;
                }
                .v14-hero-sub {
                    font-size: 1.3rem; color: var(--white); max-width: 600px;
                    position: relative; z-index: 1; line-height: 1.6;
                    font-weight: 700;
                }

                /* Speech bubble */
                .v14-bubble {
                    background: white; border: 3px solid var(--black);
                    border-radius: 20px; padding: 1.25rem 1.5rem;
                    position: relative; max-width: 400px;
                    font-size: 0.95rem; line-height: 1.6;
                    margin: 1rem auto;
                }
                .v14-bubble::after {
                    content: ''; position: absolute; bottom: -20px; left: 50%;
                    border: 10px solid transparent; border-top-color: var(--black);
                    transform: translateX(-50%);
                }
                .v14-bubble.left::after { left: 25%; }
                .v14-bubble.right::after { left: 75%; }

                /* Thought bubble */
                .v14-thought {
                    background: white; border: 3px solid var(--black);
                    border-radius: 50%; padding: 2rem; text-align: center;
                    position: relative; font-style: italic;
                }
                .v14-thought::after {
                    content: '💭'; position: absolute; bottom: -24px; left: 40%;
                    font-size: 1.5rem;
                }

                /* Row 2 — triple panels */
                .v14-row2 { grid-template-columns: 1fr 1fr 1fr; }
                .v14-feat-panel {
                    padding: 2rem 1.5rem; text-align: center;
                    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
                    min-height: 280px; justify-content: center;
                }
                .v14-feat-panel:nth-child(1) { background: var(--yellow); }
                .v14-feat-panel:nth-child(2) { background: var(--sky); }
                .v14-feat-panel:nth-child(3) { background: #F4A261; }
                .v14-feat-emoji { font-size: 3rem; }
                .v14-feat-title { font-family: 'Bangers', cursive; font-size: 1.75rem; text-shadow: 1px 1px 0 rgba(0,0,0,0.15); }
                .v14-feat-desc { font-size: 0.85rem; color: var(--black); max-width: 260px; line-height: 1.5; font-weight: 700; }

                /* Row 3 — code demo panel */
                .v14-row3 { grid-template-columns: 1.2fr 0.8fr; }
                .v14-code-panel {
                    background: #1a1a2e; padding: 0; display: flex; flex-direction: column;
                }
                .v14-code-caption {
                    font-family: 'Bangers', cursive; font-size: 1.1rem;
                    background: var(--yellow); border-bottom: 3px solid var(--black);
                    padding: 0.5rem 1rem; color: var(--black);
                }
                .v14-code-body {
                    font-family: 'Courier New', monospace; font-size: 0.8rem;
                    padding: 1.25rem; color: #a6e3a1; line-height: 2; flex: 1;
                }
                .v14-kw { color: #cba6f7; } .v14-fn { color: #89b4fa; } .v14-str { color: #a6e3a1; }

                .v14-hint-panel {
                    background: #FFF3CD; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; padding: 2rem; text-align: center;
                }
                .v14-hint-star {
                    font-family: 'Bangers', cursive; font-size: 3rem; color: var(--red);
                    background: var(--yellow); width: 120px; height: 120px;
                    display: flex; align-items: center; justify-content: center;
                    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                    margin-bottom: 1rem;
                }
                .v14-hint-text { font-style: italic; font-weight: 700; font-size: 1rem; max-width: 250px; line-height: 1.55; }

                /* Row 4 — more features */
                .v14-row4 { grid-template-columns: 1fr 1fr; }
                .v14-stats-panel {
                    background: var(--blue); color: var(--yellow); padding: 2.5rem;
                    display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; align-items: center;
                }
                .v14-stat { text-align: center; }
                .v14-stat-val { font-family: 'Bangers', cursive; font-size: 3rem; text-shadow: 2px 2px 0 var(--black); }
                .v14-stat-label { font-size: 0.75rem; color: var(--sky); font-weight: 700; }

                .v14-cta-panel {
                    background: var(--red); display: flex; flex-direction: column;
                    align-items: center; justify-content: center; padding: 2.5rem; text-align: center;
                }
                .v14-cta-title { font-family: 'Bangers', cursive; font-size: 2.5rem; color: var(--yellow); text-shadow: 3px 3px 0 var(--black); margin-bottom: 1rem; }
                .v14-cta-btn {
                    font-family: 'Bangers', cursive; font-size: 1.5rem;
                    padding: 0.8rem 2.5rem; background: var(--yellow); color: var(--black);
                    border: 4px solid var(--black); text-decoration: none;
                    transform: rotate(-2deg); display: inline-block;
                    transition: all 0.15s; box-shadow: 4px 4px 0 var(--black);
                }
                .v14-cta-btn:hover { transform: rotate(1deg) scale(1.05); box-shadow: 6px 6px 0 var(--black); }

                /* Caption box */
                .v14-caption {
                    position: absolute; top: 0; left: 0;
                    background: var(--yellow); border-right: 3px solid var(--black);
                    border-bottom: 3px solid var(--black);
                    padding: 0.3rem 0.75rem; font-size: 0.7rem; font-weight: 700;
                    color: var(--black); z-index: 2;
                }

                @media (max-width: 800px) {
                    .v14-row2, .v14-row3, .v14-row4 { grid-template-columns: 1fr; }
                    .v14-hero-title { font-size: 2.5rem; }
                }
            `}</style>

            <div className="v14">
                <nav className="v14-nav">
                    <div className="v14-nav-logo">CodeGuruAI</div>
                    <div className="v14-nav-links">
                        {user ? (
                            <Link href={dashboardHref} className="v14-nav-link">DASHBOARD!</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v14-nav-link">SIGN IN!</Link>
                                <Link href="/register" className="v14-nav-link" style={{ background: "#E63946", color: "#FFD700" }}>JOIN FREE!</Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Row 1: Hero */}
                <div className="v14-grid v14-row1">
                    <div className="v14-panel v14-hero-panel">
                        <div className="v14-caption">ISSUE #1 — THE ORIGIN STORY</div>
                        <div className="v14-pow">POW!</div>
                        <div className="v14-zap">ZAP!</div>
                        <h1 className="v14-hero-title">THE AI TUTOR<br />THAT NEVER<br />GIVES THE ANSWER!</h1>
                        <p className="v14-hero-sub">In a world of instant solutions, one AI dared to ask questions instead...</p>
                        <div className="v14-bubble" style={{ marginTop: "2rem" }}>
                            <strong>&ldquo;But professor... can&apos;t you just TELL me the answer?&rdquo;</strong>
                        </div>
                    </div>
                </div>

                {/* Row 2: Features as panels */}
                <div className="v14-grid v14-row2" style={{ marginTop: "var(--gutter)" }}>
                    <div className="v14-panel v14-feat-panel">
                        <div className="v14-caption">PANEL 2-A</div>
                        <div className="v14-feat-emoji">🧠</div>
                        <h3 className="v14-feat-title">SOCRATIC AI!</h3>
                        <p className="v14-feat-desc">The AI asks the RIGHT question — never spills the answer! Builds real thinking power!</p>
                    </div>
                    <div className="v14-panel v14-feat-panel">
                        <div className="v14-caption">PANEL 2-B</div>
                        <div className="v14-feat-emoji">⚡</div>
                        <h3 className="v14-feat-title">LIVE CODE!</h3>
                        <p className="v14-feat-desc">Write & run code IN YOUR BROWSER! Instant test feedback! Python, JS, C++, Java!</p>
                    </div>
                    <div className="v14-panel v14-feat-panel">
                        <div className="v14-caption">PANEL 2-C</div>
                        <div className="v14-feat-emoji">🎯</div>
                        <h3 className="v14-feat-title">AI PROBLEMS!</h3>
                        <p className="v14-feat-desc">Generate UNIQUE coding challenges with AI! No more recycled problem sets!</p>
                    </div>
                </div>

                {/* Row 3: Code + Hint */}
                <div className="v14-grid v14-row3" style={{ marginTop: "var(--gutter)" }}>
                    <div className="v14-panel v14-code-panel">
                        <div className="v14-code-caption">📝 MEANWHILE, IN THE CODE EDITOR...</div>
                        <div className="v14-code-body">
                            <div><span className="v14-kw">def</span> <span className="v14-fn">two_sum</span>(nums, target):</div>
                            <div>    seen = {'{}'}</div>
                            <div><span className="v14-kw">    for</span> i, n <span className="v14-kw">in</span> <span className="v14-fn">enumerate</span>(nums):</div>
                            <div>        diff = target - n</div>
                            <div><span className="v14-kw">        if</span> diff <span className="v14-kw">in</span> seen:</div>
                            <div><span className="v14-str">            return [seen[diff], i]</span></div>
                            <div>        seen[n] = i</div>
                            <div style={{ marginTop: "1rem", color: "#a6e3a1" }}>✓ ALL TESTS PASSED!</div>
                        </div>
                    </div>
                    <div className="v14-panel v14-hint-panel">
                        <div className="v14-caption">THE MOMENT OF TRUTH!</div>
                        <div className="v14-hint-star">HINT!</div>
                        <p className="v14-hint-text">&ldquo;What data structure gives O(1) lookups? Think about it...&rdquo;</p>
                        <p style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.75rem" }}>— The AI never tells. It only asks.</p>
                    </div>
                </div>

                {/* Row 4: Stats + CTA */}
                <div className="v14-grid v14-row4" style={{ marginTop: "var(--gutter)", marginBottom: "2rem" }}>
                    <div className="v14-panel v14-stats-panel">
                        <div className="v14-caption" style={{ color: "#FFD700" }}>BY THE NUMBERS!</div>
                        <div className="v14-stat"><div className="v14-stat-val">15K+</div><div className="v14-stat-label">STUDENTS</div></div>
                        <div className="v14-stat"><div className="v14-stat-val">94%</div><div className="v14-stat-label">COMPLETION</div></div>
                        <div className="v14-stat"><div className="v14-stat-val">250+</div><div className="v14-stat-label">UNIVERSITIES</div></div>
                        <div className="v14-stat"><div className="v14-stat-val">4.9★</div><div className="v14-stat-label">RATING</div></div>
                    </div>
                    <div className="v14-panel v14-cta-panel">
                        <div className="v14-caption">TO BE CONTINUED...</div>
                        <h2 className="v14-cta-title">YOUR TURN,<br />HERO!</h2>
                        <Link href="/register" className="v14-cta-btn">START FREE! →</Link>
                    </div>
                </div>
            </div>
        </>
    )
}
