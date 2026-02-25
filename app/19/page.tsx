"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect } from "react"

/* ================================================================
   V19 — Space Mission Control
   NASA-style dashboard with telemetry readouts, orbital display,
   countdown timer, system status panels, mission patches,
   amber/green CRT monitors.
   Font: Chakra Petch + Space Mono
   ================================================================ */

export default function LandingV19() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    // Mission clock
    const [clock, setClock] = useState("00:00:00")
    const [since, setSince] = useState(0)
    useEffect(() => {
        const start = Date.now()
        const t = setInterval(() => {
            const d = Math.floor((Date.now() - start) / 1000)
            setSince(d)
            const h = String(Math.floor(d / 3600)).padStart(2, "0")
            const m = String(Math.floor((d % 3600) / 60)).padStart(2, "0")
            const s = String(d % 60).padStart(2, "0")
            setClock(`${h}:${m}:${s}`)
        }, 1000)
        return () => clearInterval(t)
    }, [])

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap');

                .v19 {
                    --bg: #0C0E12;
                    --panel: #111318;
                    --border: #1E2028;
                    --border2: #2A2D38;
                    --green: #00FF41;
                    --amber: #FFC107;
                    --red: #FF3D3D;
                    --cyan: #00BCD4;
                    --dim: #4A4E5C;
                    --white: #C5C8D4;
                    font-family: 'Space Mono', monospace;
                    background: var(--bg);
                    color: var(--white);
                    min-height: 100vh;
                    padding: 0.75rem;
                    display: grid;
                    grid-template-columns: 280px 1fr 280px;
                    grid-template-rows: auto 1fr auto;
                    gap: 0.5rem;
                    overflow: hidden;
                    height: 100vh;
                }

                .v19-panel {
                    background: var(--panel); border: 1px solid var(--border);
                    border-radius: 2px; overflow: hidden;
                }
                .v19-panel-head {
                    padding: 0.4rem 0.75rem; background: var(--border);
                    font-family: 'Chakra Petch', sans-serif; font-size: 0.6rem;
                    text-transform: uppercase; letter-spacing: 0.15em;
                    color: var(--dim); display: flex; justify-content: space-between;
                    align-items: center;
                }
                .v19-panel-body { padding: 0.75rem; }

                .v19-live { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: v19blink 1.5s ease infinite; }
                @keyframes v19blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

                /* Header bar */
                .v19-header {
                    grid-column: 1 / -1;
                    background: var(--panel); border: 1px solid var(--border);
                    padding: 0.5rem 1rem; display: flex; justify-content: space-between;
                    align-items: center;
                }
                .v19-logo {
                    font-family: 'Chakra Petch', sans-serif; font-size: 1rem; font-weight: 700;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .v19-logo-badge {
                    padding: 0.15rem 0.5rem; background: var(--green); color: var(--bg);
                    font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em;
                    border-radius: 2px;
                }
                .v19-clock { font-size: 1.5rem; color: var(--green); font-weight: 700; letter-spacing: 0.1em; text-shadow: 0 0 10px rgba(0,255,65,0.3); }
                .v19-header-links { display: flex; gap: 0.25rem; }
                .v19-header-btn {
                    font-family: 'Space Mono', monospace; font-size: 0.65rem;
                    padding: 0.35rem 1rem; border: 1px solid var(--border2);
                    color: var(--white); text-decoration: none;
                    transition: all 0.15s; background: transparent;
                }
                .v19-header-btn:hover { border-color: var(--green); color: var(--green); }
                .v19-header-btn.go { border-color: var(--green); color: var(--green); }

                /* Left sidebar */
                .v19-left { display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }

                /* Telemetry readout */
                .v19-readout { display: flex; justify-content: space-between; align-items: baseline; padding: 0.35rem 0; border-bottom: 1px solid var(--border); font-size: 0.7rem; }
                .v19-readout-label { color: var(--dim); }
                .v19-readout-val { font-weight: 700; }
                .v19-val-green { color: var(--green); }
                .v19-val-amber { color: var(--amber); }
                .v19-val-cyan { color: var(--cyan); }

                /* Main center */
                .v19-center { display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }

                /* Mission brief */
                .v19-brief { font-size: 0.78rem; line-height: 1.7; }
                .v19-brief strong { color: var(--green); }
                .v19-brief-h { font-family: 'Chakra Petch', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--green); margin-bottom: 0.5rem; text-shadow: 0 0 20px rgba(0,255,65,0.15); }

                /* Orbit display */
                .v19-orbit {
                    height: 180px; position: relative;
                    border: 1px solid var(--border);
                    background: radial-gradient(circle at center, rgba(0,188,212,0.03) 0%, transparent 70%);
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden;
                }
                .v19-orbit-ring {
                    position: absolute; border: 1px solid rgba(0,255,65,0.1);
                    border-radius: 50%;
                }
                .v19-orbit-r1 { width: 80px; height: 80px; }
                .v19-orbit-r2 { width: 160px; height: 160px; }
                .v19-orbit-r3 { width: 280px; height: 280px; }
                .v19-orbit-dot {
                    position: absolute; width: 8px; height: 8px; border-radius: 50%;
                    background: var(--green); box-shadow: 0 0 10px var(--green);
                    animation: v19orb 8s linear infinite;
                }
                @keyframes v19orb {
                    0% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
                    100% { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
                }
                .v19-orbit-center { width: 12px; height: 12px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 15px var(--cyan); z-index: 1; }
                .v19-orbit-label { position: absolute; bottom: 4px; right: 8px; font-size: 0.55rem; color: var(--dim); }

                /* Module grid */
                .v19-modules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
                .v19-mod {
                    background: var(--bg); border: 1px solid var(--border);
                    padding: 0.75rem; font-size: 0.7rem;
                }
                .v19-mod-name { font-family: 'Chakra Petch', sans-serif; font-size: 0.7rem; font-weight: 700; color: var(--cyan); margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .v19-mod-desc { color: var(--dim); line-height: 1.5; font-size: 0.65rem; }
                .v19-mod-status { margin-top: 0.5rem; display: flex; align-items: center; gap: 0.35rem; font-size: 0.6rem; color: var(--green); }

                /* Right sidebar */
                .v19-right { display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }

                /* System status */
                .v19-sys { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid var(--border); font-size: 0.7rem; }
                .v19-sys-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .v19-sys-label { flex: 1; color: var(--dim); }
                .v19-sys-val { font-weight: 700; font-size: 0.65rem; }

                /* Log */
                .v19-log { font-size: 0.62rem; line-height: 1.8; color: var(--dim); }
                .v19-log-line { display: flex; gap: 0.5rem; }
                .v19-log-time { color: var(--amber); flex-shrink: 0; min-width: 50px; }
                .v19-log-msg { color: var(--white); }

                /* Footer */
                .v19-footer {
                    grid-column: 1 / -1;
                    background: var(--panel); border: 1px solid var(--border);
                    padding: 0.35rem 1rem; display: flex; justify-content: space-between;
                    font-size: 0.6rem; color: var(--dim); align-items: center;
                }

                @media (max-width: 1000px) {
                    .v19 { grid-template-columns: 1fr; height: auto; }
                    .v19-modules { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="v19">
                {/* Header */}
                <div className="v19-header">
                    <div className="v19-logo">
                        <span>◉ CODEGURU</span><span className="v19-logo-badge">MISSION CONTROL</span>
                    </div>
                    <div className="v19-clock">MET {clock}</div>
                    <div className="v19-header-links">
                        {user ? (
                            <Link href={dashboardHref} className="v19-header-btn go">DASHBOARD</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v19-header-btn">LOGIN</Link>
                                <Link href="/register" className="v19-header-btn go">LAUNCH →</Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Left */}
                <div className="v19-left">
                    <div className="v19-panel">
                        <div className="v19-panel-head"><span>TELEMETRY</span><div className="v19-live" /></div>
                        <div className="v19-panel-body">
                            <div className="v19-readout"><span className="v19-readout-label">STUDENTS</span><span className="v19-readout-val v19-val-green">15,247</span></div>
                            <div className="v19-readout"><span className="v19-readout-label">COMPLETION</span><span className="v19-readout-val v19-val-green">94.2%</span></div>
                            <div className="v19-readout"><span className="v19-readout-label">UNIVERSITIES</span><span className="v19-readout-val v19-val-cyan">250+</span></div>
                            <div className="v19-readout"><span className="v19-readout-label">PROBLEMS SOLVED</span><span className="v19-readout-val v19-val-green">142,893</span></div>
                            <div className="v19-readout"><span className="v19-readout-label">HINTS TODAY</span><span className="v19-readout-val v19-val-amber">8,421</span></div>
                            <div className="v19-readout"><span className="v19-readout-label">RATING</span><span className="v19-readout-val v19-val-green">4.9/5.0</span></div>
                            <div className="v19-readout"><span className="v19-readout-label">UPTIME</span><span className="v19-readout-val v19-val-green">99.97%</span></div>
                            <div className="v19-readout"><span className="v19-readout-label">SESSION TIME</span><span className="v19-readout-val v19-val-cyan">{clock}</span></div>
                        </div>
                    </div>

                    <div className="v19-panel">
                        <div className="v19-panel-head"><span>MISSION LOG</span></div>
                        <div className="v19-panel-body v19-log">
                            <div className="v19-log-line"><span className="v19-log-time">T+{since}s</span><span className="v19-log-msg">Visitor connected</span></div>
                            <div className="v19-log-line"><span className="v19-log-time">T+0s</span><span className="v19-log-msg">Mission Control online</span></div>
                            <div className="v19-log-line"><span className="v19-log-time">–1h</span><span className="v19-log-msg">Student solved two_sum (Socratic)</span></div>
                            <div className="v19-log-line"><span className="v19-log-time">–2h</span><span className="v19-log-msg">Instructor created 15 problems</span></div>
                            <div className="v19-log-line"><span className="v19-log-time">–3h</span><span className="v19-log-msg">New classroom: CS201 (Stanford)</span></div>
                            <div className="v19-log-line"><span className="v19-log-time">–5h</span><span className="v19-log-msg">AI hint engine updated v2.3</span></div>
                        </div>
                    </div>
                </div>

                {/* Center */}
                <div className="v19-center">
                    <div className="v19-panel" style={{ flex: "0 0 auto" }}>
                        <div className="v19-panel-head"><span>MISSION BRIEF</span></div>
                        <div className="v19-panel-body">
                            <div className="v19-brief">
                                <div className="v19-brief-h">MISSION: SOCRATIC</div>
                                <p><strong>Objective:</strong> Transform CS education through AI that questions rather than answers. Deploy Socratic AI tutoring to university classrooms worldwide.</p>
                                <p style={{ marginTop: "0.5rem" }}><strong>Method:</strong> When students request help, AI identifies the specific misconception and generates a targeted question. Never reveals the answer. Students build genuine understanding through guided reasoning.</p>
                            </div>
                        </div>
                    </div>

                    <div className="v19-panel" style={{ flex: "0 0 auto" }}>
                        <div className="v19-panel-head"><span>ORBITAL TRACKING</span><span style={{ color: "var(--green)", fontSize: "0.55rem" }}>● LIVE</span></div>
                        <div className="v19-panel-body" style={{ padding: 0 }}>
                            <div className="v19-orbit">
                                <div className="v19-orbit-ring v19-orbit-r1" />
                                <div className="v19-orbit-ring v19-orbit-r2" />
                                <div className="v19-orbit-ring v19-orbit-r3" />
                                <div className="v19-orbit-dot" />
                                <div className="v19-orbit-center" />
                                <div className="v19-orbit-label">ACTIVE SESSIONS: 2,847</div>
                            </div>
                        </div>
                    </div>

                    <div className="v19-panel" style={{ flex: 1 }}>
                        <div className="v19-panel-head"><span>PLATFORM MODULES</span></div>
                        <div className="v19-panel-body">
                            <div className="v19-modules">
                                <div className="v19-mod"><div className="v19-mod-name">Socratic AI</div><div className="v19-mod-desc">Questions that target misconceptions. Never reveals answers.</div><div className="v19-mod-status"><div className="v19-live" /> NOMINAL</div></div>
                                <div className="v19-mod"><div className="v19-mod-name">Code Runner</div><div className="v19-mod-desc">In-browser IDE. Python, JS, C++, Java. Instant tests.</div><div className="v19-mod-status"><div className="v19-live" /> NOMINAL</div></div>
                                <div className="v19-mod"><div className="v19-mod-name">AI Generator</div><div className="v19-mod-desc">Auto-create unique problems. Complete test suites.</div><div className="v19-mod-status"><div className="v19-live" /> NOMINAL</div></div>
                                <div className="v19-mod"><div className="v19-mod-name">Analytics</div><div className="v19-mod-desc">Real-time: submissions, completion, time, hints.</div><div className="v19-mod-status"><div className="v19-live" /> NOMINAL</div></div>
                                <div className="v19-mod"><div className="v19-mod-name">Classrooms</div><div className="v19-mod-desc">Courses, assignments, deadlines, student mgmt.</div><div className="v19-mod-status"><div className="v19-live" /> NOMINAL</div></div>
                                <div className="v19-mod"><div className="v19-mod-name">Integrity</div><div className="v19-mod-desc">AI-unique problems. No answer pools. Anti-cheat.</div><div className="v19-mod-status"><div className="v19-live" /> NOMINAL</div></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div className="v19-right">
                    <div className="v19-panel">
                        <div className="v19-panel-head"><span>SYSTEM STATUS</span></div>
                        <div className="v19-panel-body">
                            <div className="v19-sys"><div className="v19-sys-dot" style={{ background: "var(--green)" }} /><span className="v19-sys-label">AI Engine</span><span className="v19-sys-val" style={{ color: "var(--green)" }}>GO</span></div>
                            <div className="v19-sys"><div className="v19-sys-dot" style={{ background: "var(--green)" }} /><span className="v19-sys-label">Code Sandbox</span><span className="v19-sys-val" style={{ color: "var(--green)" }}>GO</span></div>
                            <div className="v19-sys"><div className="v19-sys-dot" style={{ background: "var(--green)" }} /><span className="v19-sys-label">Database</span><span className="v19-sys-val" style={{ color: "var(--green)" }}>GO</span></div>
                            <div className="v19-sys"><div className="v19-sys-dot" style={{ background: "var(--green)" }} /><span className="v19-sys-label">Auth Service</span><span className="v19-sys-val" style={{ color: "var(--green)" }}>GO</span></div>
                            <div className="v19-sys"><div className="v19-sys-dot" style={{ background: "var(--amber)" }} /><span className="v19-sys-label">CDN Cache</span><span className="v19-sys-val" style={{ color: "var(--amber)" }}>WARM</span></div>
                            <div className="v19-sys"><div className="v19-sys-dot" style={{ background: "var(--green)" }} /><span className="v19-sys-label">WebSocket</span><span className="v19-sys-val" style={{ color: "var(--green)" }}>GO</span></div>
                        </div>
                    </div>

                    <div className="v19-panel">
                        <div className="v19-panel-head"><span>COMMS</span></div>
                        <div className="v19-panel-body" style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.68rem", lineHeight: "1.8", color: "var(--green)" }}>
                            <div style={{ color: "var(--amber)" }}>{"// SOCRATIC HINT LOG"}</div>
                            <div style={{ color: "var(--dim)" }}>STUDENT: two_sum TLE</div>
                            <div>AI: &quot;What data structure gives O(1) lookups?&quot;</div>
                            <div style={{ color: "var(--dim)" }}>STUDENT: Updated → O(n)</div>
                            <div>AI: ✓ All tests passed.</div>
                            <div style={{ marginTop: "0.5rem", color: "var(--dim)" }}>---</div>
                            <div style={{ color: "var(--amber)" }}>{"// MISSION STATUS"}</div>
                            <div>Learning objective achieved.</div>
                            <div>Student understanding: CONFIRMED</div>
                        </div>
                    </div>

                    <div className="v19-panel" style={{ flex: 1 }}>
                        <div className="v19-panel-head"><span>MISSION PATCH</span></div>
                        <div className="v19-panel-body" style={{ textAlign: "center", padding: "1.5rem" }}>
                            <div style={{ width: "120px", height: "120px", borderRadius: "50%", border: "3px solid var(--cyan)", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.25rem" }}>
                                <span style={{ fontSize: "2rem" }}>🧠</span>
                                <span style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: "0.55rem", fontWeight: 700, color: "var(--cyan)", letterSpacing: "0.15em" }}>SOCRATIC</span>
                            </div>
                            <div style={{ fontSize: "0.6rem", color: "var(--dim)", lineHeight: "1.6" }}>
                                MISSION: SOCRATIC<br />
                                EST. 2026 · CODEGURUAI<br />
                                &ldquo;QUESTION EVERYTHING&rdquo;
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="v19-footer">
                    <span>◉ CODEGURUAI MISSION CONTROL — ALL SYSTEMS NOMINAL</span>
                    <span>MET {clock} · {new Date().toISOString().split("T")[0]}</span>
                    <span>FREE FOR STUDENTS · codeguruai.com</span>
                </div>
            </div>
        </>
    )
}
