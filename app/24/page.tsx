"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect } from "react"

/* ================================================================
   V24 — Living Data Infographic
   One giant animated infographic. Animated bar charts, donut
   rings, flow diagrams, counting numbers, sparklines,
   trend arrows, data cards, progress bars — all in a cohesive
   infographic style with bold data viz colors.
   Font: DM Sans + Tabular Nums
   ================================================================ */

function AnimNum({ target, suffix = "", prefix = "", dur = 2000 }: { target: number; suffix?: string; prefix?: string; dur?: number }) {
    const [val, setVal] = useState(0)
    useEffect(() => {
        const start = Date.now()
        const tick = () => {
            const p = Math.min((Date.now() - start) / dur, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setVal(Math.round(target * eased))
            if (p < 1) requestAnimationFrame(tick)
        }
        const t = setTimeout(tick, 300)
        return () => clearTimeout(t)
    }, [target, dur])
    return <>{prefix}{val.toLocaleString()}{suffix}</>
}

function Bar({ label, pct, color, delay }: { label: string; pct: number; color: string; delay: number }) {
    const [w, setW] = useState(0)
    useEffect(() => { const t = setTimeout(() => setW(pct), delay); return () => clearTimeout(t) }, [pct, delay])
    return (
        <div className="v24-bar">
            <div className="v24-bar-label">{label}</div>
            <div className="v24-bar-track">
                <div className="v24-bar-fill" style={{ width: `${w}%`, background: color, transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)" }} />
            </div>
            <div className="v24-bar-val">{pct}%</div>
        </div>
    )
}

export default function LandingV24() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [ring, setRing] = useState(0)
    useEffect(() => { const t = setTimeout(() => setRing(94), 600); return () => clearTimeout(t) }, [])

    const circumference = 2 * Math.PI * 70
    const offset = circumference - (ring / 100) * circumference

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&display=swap');

                .v24 {
                    --bg: #0B0F19; --card: #111827; --border: #1F2937;
                    --text: #E5E7EB; --dim: #6B7280; --white: #F9FAFB;
                    --blue: #3B82F6; --green: #10B981; --purple: #8B5CF6;
                    --yellow: #F59E0B; --pink: #EC4899; --cyan: #06B6D4;
                    --red: #EF4444; --orange: #F97316;
                    font-family: 'DM Sans', sans-serif;
                    background: var(--bg); color: var(--text);
                    min-height: 100vh; padding: 2rem;
                }

                .v24-container { max-width: 1200px; margin: 0 auto; }

                /* Header */
                .v24-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .v24-logo { font-size: 1.4rem; font-weight: 900; }
                .v24-logo .accent { color: var(--blue); }
                .v24-nav { display: flex; gap: 0.5rem; }
                .v24-nav-btn {
                    font-size: 0.8rem; font-weight: 600; padding: 0.5rem 1.25rem;
                    border-radius: 8px; text-decoration: none; transition: all 0.2s;
                }
                .v24-nav-btn.ghost { color: var(--dim); }
                .v24-nav-btn.ghost:hover { color: var(--text); }
                .v24-nav-btn.solid { background: var(--blue); color: white; }

                /* Title */
                .v24-title { text-align: center; margin-bottom: 3rem; }
                .v24-title h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; }
                .v24-title h1 .blue { color: var(--blue); }
                .v24-title p { color: var(--dim); font-size: 1rem; }

                /* Grid */
                .v24-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1rem; }
                .v24-card {
                    background: var(--card); border: 1px solid var(--border);
                    border-radius: 12px; padding: 1.5rem; position: relative; overflow: hidden;
                }
                .v24-card-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--dim); margin-bottom: 1rem; }

                /* Big number stat */
                .v24-bignum { font-size: 3.5rem; font-weight: 900; line-height: 1; margin-bottom: 0.25rem; }
                .v24-bignum-sub { font-size: 0.85rem; color: var(--dim); }

                /* Bar chart */
                .v24-bar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.6rem; }
                .v24-bar-label { font-size: 0.75rem; color: var(--dim); width: 80px; text-align: right; }
                .v24-bar-track { flex: 1; height: 20px; background: rgba(255,255,255,0.03); border-radius: 4px; overflow: hidden; }
                .v24-bar-fill { height: 100%; border-radius: 4px; }
                .v24-bar-val { font-size: 0.75rem; font-weight: 700; width: 40px; }

                /* Donut */
                .v24-donut { display: flex; flex-direction: column; align-items: center; }
                .v24-donut svg { transform: rotate(-90deg); }
                .v24-donut-center { font-size: 2rem; font-weight: 900; }
                .v24-donut-label { font-size: 0.75rem; color: var(--dim); margin-top: 0.25rem; }

                /* Flow diagram */
                .v24-flow { display: flex; align-items: center; gap: 0; flex-wrap: wrap; justify-content: center; }
                .v24-flow-node {
                    padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.75rem;
                    font-weight: 700; text-align: center; min-width: 90px;
                }
                .v24-flow-arrow { padding: 0 0.4rem; font-size: 1rem; color: var(--dim); }

                /* Tag list */
                .v24-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .v24-tag {
                    padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.75rem;
                    font-weight: 600; border: 1px solid;
                }

                /* Sparkline */
                .v24-sparkline { display: flex; align-items: flex-end; gap: 3px; height: 50px; }
                .v24-spark-bar { width: 8px; border-radius: 2px; transition: height 0.5s ease-out; }

                /* Trend */
                .v24-trend { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 700; }
                .v24-trend.up { color: var(--green); }
                .v24-trend.down { color: var(--red); }

                /* Feature list */
                .v24-feat-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .v24-feat-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; }
                .v24-feat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .v24-feat-name { flex: 1; }
                .v24-feat-status { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 10px; }

                /* Heat cells */
                .v24-heat { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
                .v24-heat-cell { aspect-ratio: 1; border-radius: 3px; }

                /* CTA */
                .v24-cta-card { text-align: center; }
                .v24-cta-card h3 { font-size: 1.3rem; font-weight: 900; margin-bottom: 0.5rem; }
                .v24-cta-card p { color: var(--dim); font-size: 0.85rem; margin-bottom: 1rem; }
                .v24-cta-btn {
                    display: inline-block; padding: 0.7rem 2rem; background: var(--blue);
                    color: white; font-weight: 700; font-size: 0.85rem; border-radius: 8px;
                    text-decoration: none; transition: all 0.2s;
                }
                .v24-cta-btn:hover { background: #2563EB; transform: translateY(-1px); }

                @media (max-width: 900px) { .v24-grid { grid-template-columns: repeat(4, 1fr); } }
            `}</style>

            <div className="v24">
                <div className="v24-container">
                    <div className="v24-header">
                        <div className="v24-logo">CodeGuru<span className="accent">AI</span></div>
                        <div className="v24-nav">
                            {user ? <Link href={dashboardHref} className="v24-nav-btn solid">Dashboard</Link> : (
                                <><Link href="/login" className="v24-nav-btn ghost">Sign In</Link><Link href="/register" className="v24-nav-btn solid">Get Started</Link></>
                            )}
                        </div>
                    </div>

                    <div className="v24-title">
                        <h1>CodeGuruAI <span className="blue">by the Numbers</span></h1>
                        <p>A living infographic of what Socratic AI tutoring achieves</p>
                    </div>

                    <div className="v24-grid">
                        {/* Row 1 */}
                        <div className="v24-card" style={{ gridColumn: "span 3" }}>
                            <div className="v24-card-label">Active Students</div>
                            <div className="v24-bignum" style={{ color: "var(--blue)" }}><AnimNum target={15247} /></div>
                            <div className="v24-bignum-sub">learners using Socratic hints</div>
                            <div className="v24-trend up" style={{ marginTop: "0.5rem" }}>↑ 23% this semester</div>
                        </div>

                        <div className="v24-card" style={{ gridColumn: "span 3" }}>
                            <div className="v24-card-label">Completion Rate</div>
                            <div className="v24-donut">
                                <svg width="160" height="160">
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--green)" strokeWidth="14"
                                        strokeDasharray={circumference} strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)" }} />
                                </svg>
                                <div className="v24-donut-center" style={{ marginTop: "-105px", color: "var(--green)" }}>{ring}%</div>
                                <div className="v24-donut-label" style={{ marginTop: "55px" }}>task completion rate</div>
                            </div>
                        </div>

                        <div className="v24-card" style={{ gridColumn: "span 3" }}>
                            <div className="v24-card-label">Problems Solved</div>
                            <div className="v24-bignum" style={{ color: "var(--purple)" }}><AnimNum target={142893} /></div>
                            <div className="v24-bignum-sub">coding challenges completed</div>
                            <div className="v24-sparkline" style={{ marginTop: "0.75rem" }}>
                                {[30, 45, 35, 60, 50, 75, 65, 80, 70, 90, 85, 95].map((h, i) => (
                                    <div key={i} className="v24-spark-bar" style={{ height: `${h}%`, background: `var(--purple)`, opacity: 0.3 + i * 0.06 }} />
                                ))}
                            </div>
                        </div>

                        <div className="v24-card" style={{ gridColumn: "span 3" }}>
                            <div className="v24-card-label">Universities</div>
                            <div className="v24-bignum" style={{ color: "var(--yellow)" }}><AnimNum target={250} suffix="+" /></div>
                            <div className="v24-bignum-sub">institutions worldwide</div>
                            <div className="v24-trend up" style={{ marginTop: "0.5rem" }}>↑ 40 new this quarter</div>
                        </div>

                        {/* Row 2 */}
                        <div className="v24-card" style={{ gridColumn: "span 6" }}>
                            <div className="v24-card-label">The Socratic Flow</div>
                            <div className="v24-flow">
                                <div className="v24-flow-node" style={{ background: "rgba(59,130,246,0.15)", color: "var(--blue)" }}>Student<br/>Writes Code</div>
                                <div className="v24-flow-arrow">→</div>
                                <div className="v24-flow-node" style={{ background: "rgba(245,158,11,0.15)", color: "var(--yellow)" }}>Tests<br/>Run</div>
                                <div className="v24-flow-arrow">→</div>
                                <div className="v24-flow-node" style={{ background: "rgba(239,68,68,0.15)", color: "var(--red)" }}>Stuck?<br/>Ask Hint</div>
                                <div className="v24-flow-arrow">→</div>
                                <div className="v24-flow-node" style={{ background: "rgba(139,92,246,0.15)", color: "var(--purple)" }}>AI Asks<br/>Question</div>
                                <div className="v24-flow-arrow">→</div>
                                <div className="v24-flow-node" style={{ background: "rgba(16,185,129,0.15)", color: "var(--green)" }}>Student<br/>Understands!</div>
                            </div>
                        </div>

                        <div className="v24-card" style={{ gridColumn: "span 6" }}>
                            <div className="v24-card-label">Language Usage</div>
                            <Bar label="Python" pct={72} color="var(--blue)" delay={400} />
                            <Bar label="JavaScript" pct={48} color="var(--yellow)" delay={600} />
                            <Bar label="C++" pct={31} color="var(--purple)" delay={800} />
                            <Bar label="Java" pct={26} color="var(--green)" delay={1000} />
                        </div>

                        {/* Row 3 */}
                        <div className="v24-card" style={{ gridColumn: "span 4" }}>
                            <div className="v24-card-label">Platform Modules</div>
                            <div className="v24-feat-list">
                                {[
                                    { name: "Socratic AI Hints", color: "var(--blue)", status: "Active" },
                                    { name: "Code Editor", color: "var(--green)", status: "Active" },
                                    { name: "AI Generator", color: "var(--purple)", status: "Active" },
                                    { name: "Analytics", color: "var(--yellow)", status: "Active" },
                                    { name: "Classrooms", color: "var(--cyan)", status: "Active" },
                                ].map(f => (
                                    <div key={f.name} className="v24-feat-item">
                                        <div className="v24-feat-dot" style={{ background: f.color }} />
                                        <div className="v24-feat-name">{f.name}</div>
                                        <div className="v24-feat-status" style={{ background: "rgba(16,185,129,0.15)", color: "var(--green)" }}>{f.status}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="v24-card" style={{ gridColumn: "span 4" }}>
                            <div className="v24-card-label">Weekly Activity</div>
                            <div className="v24-heat">
                                {Array.from({ length: 28 }, (_, i) => {
                                    const intensity = [0.1, 0.25, 0.4, 0.6, 0.75, 0.9][(i * 7 + 3) % 6];
                                    return <div key={i} className="v24-heat-cell" style={{ background: `rgba(59,130,246,${intensity})` }} />
                                })}
                            </div>
                            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--dim)" }}>Brighter = more active sessions</div>
                        </div>

                        <div className="v24-card" style={{ gridColumn: "span 4" }}>
                            <div className="v24-card-label">Key Metrics</div>
                            <div className="v24-tags">
                                <div className="v24-tag" style={{ borderColor: "var(--green)", color: "var(--green)" }}>94% Completion</div>
                                <div className="v24-tag" style={{ borderColor: "var(--blue)", color: "var(--blue)" }}>15K+ Students</div>
                                <div className="v24-tag" style={{ borderColor: "var(--yellow)", color: "var(--yellow)" }}>4.9★ Rating</div>
                                <div className="v24-tag" style={{ borderColor: "var(--purple)", color: "var(--purple)" }}>4 Languages</div>
                                <div className="v24-tag" style={{ borderColor: "var(--cyan)", color: "var(--cyan)" }}>$0 for Students</div>
                                <div className="v24-tag" style={{ borderColor: "var(--pink)", color: "var(--pink)" }}>99.97% Uptime</div>
                            </div>
                        </div>

                        {/* CTA row */}
                        <div className="v24-card v24-cta-card" style={{ gridColumn: "span 12", background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))", borderColor: "rgba(59,130,246,0.2)" }}>
                            <h3>Ready to see these numbers in your classroom?</h3>
                            <p>Join 15,000+ students and 250+ universities. Free for students.</p>
                            <Link href="/register" className="v24-cta-btn">Get Started Free →</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
