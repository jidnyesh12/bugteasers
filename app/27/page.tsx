"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState } from "react"

/* ================================================================
   V27 — Isometric Pixel City
   CSS-only isometric blocks forming a campus/city.
   Each building represents a feature. Hover reveals info.
   Pixel art aesthetic, low-poly look, grass/road/sky layers.
   Font: Silkscreen + VT323
   ================================================================ */

const BUILDINGS = [
    { id: "ai", label: "Socratic AI", emoji: "🧠", desc: "Asks questions, never gives answers", color: "#6C5CE7", h: 120, x: 15, y: 48 },
    { id: "code", label: "Code Editor", emoji: "⚡", desc: "In-browser IDE — Python, JS, C++, Java", color: "#00B894", h: 100, x: 32, y: 42 },
    { id: "gen", label: "AI Generator", emoji: "🎯", desc: "Unique problems every semester", color: "#0984E3", h: 140, x: 50, y: 38 },
    { id: "analytics", label: "Analytics", emoji: "📊", desc: "Real-time classroom data", color: "#FDCB6E", h: 90, x: 67, y: 44 },
    { id: "class", label: "Classrooms", emoji: "🏫", desc: "Courses, deadlines, enrollment", color: "#E17055", h: 110, x: 82, y: 50 },
]

export default function LandingV27() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [hovered, setHovered] = useState<string | null>(null)

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=VT323&display=swap');

                .v27 {
                    --sky1: #87CEEB; --sky2: #E0F7FA;
                    --grass1: #4CAF50; --grass2: #66BB6A;
                    --road: #455A64; --road-line: #FDD835;
                    --bg: #263238;
                    font-family: 'Silkscreen', monospace;
                    min-height: 100vh; overflow: hidden;
                    background: linear-gradient(180deg, var(--sky1) 0%, var(--sky2) 50%, var(--grass1) 50.1%, var(--grass2) 100%);
                    position: relative; image-rendering: pixelated;
                }

                /* Clouds */
                .v27-cloud {
                    position: absolute; background: white; border-radius: 0;
                    box-shadow: 10px 0 0 white, 20px 0 0 white, 30px 0 0 white,
                                0 10px 0 white, 10px 10px 0 white, 20px 10px 0 white, 30px 10px 0 white, 40px 10px 0 white,
                                -10px 10px 0 white;
                    width: 10px; height: 10px; opacity: 0.7;
                    animation: v27drift linear infinite;
                }
                @keyframes v27drift { 0% { transform: translateX(0); } 100% { transform: translateX(100vw); } }

                /* Nav */
                .v27-nav {
                    position: relative; z-index: 50; display: flex;
                    justify-content: space-between; align-items: center;
                    padding: 1rem 2rem;
                }
                .v27-logo { font-size: 1.2rem; font-weight: 700; color: var(--bg); text-shadow: 1px 1px 0 rgba(255,255,255,0.5); }
                .v27-nav-links { display: flex; gap: 0.5rem; }
                .v27-nav-btn {
                    font-family: 'Silkscreen', monospace; font-size: 0.7rem;
                    padding: 0.5rem 1rem; text-decoration: none;
                    border: 3px solid var(--bg); color: var(--bg);
                    transition: all 0.1s; background: rgba(255,255,255,0.4);
                }
                .v27-nav-btn:hover { background: var(--bg); color: white; }
                .v27-nav-btn.go { background: var(--bg); color: white; }

                /* Title */
                .v27-title {
                    position: relative; z-index: 50; text-align: center;
                    padding: 1rem 0 0;
                }
                .v27-h1 { font-size: 3rem; color: var(--bg); text-shadow: 2px 2px 0 rgba(255,255,255,0.4); margin-bottom: 0.25rem; }
                .v27-sub { font-family: 'VT323', monospace; font-size: 1.25rem; color: rgba(38,50,56,0.7); }

                /* Isometric scene */
                .v27-scene {
                    position: relative; z-index: 10;
                    margin: 2rem auto; max-width: 1100px;
                    height: 450px;
                }

                /* Isometric building */
                .v27-building {
                    position: absolute; cursor: pointer;
                    transition: transform 0.2s;
                }
                .v27-building:hover { transform: translateY(-8px); z-index: 30; }

                .v27-bldg-body { position: relative; }
                .v27-bldg-top {
                    width: 100px; height: 50px;
                    transform: rotate(-45deg) skew(15deg, 15deg);
                    position: absolute; top: 0; left: 0;
                }
                .v27-bldg-front {
                    width: 80px; position: absolute;
                    left: 10px;
                    transform: skewY(-30deg);
                    transform-origin: top left;
                }
                .v27-bldg-side {
                    width: 80px; position: absolute;
                    right: -60px;
                    transform: skewY(30deg);
                    transform-origin: top left;
                    filter: brightness(0.75);
                }

                .v27-bldg-label {
                    position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%);
                    font-size: 0.65rem; color: var(--bg); white-space: nowrap;
                    text-align: center;
                }

                /* Info popup */
                .v27-popup {
                    position: absolute; bottom: calc(100% + 10px); left: 50%;
                    transform: translateX(-50%); background: var(--bg); color: white;
                    padding: 0.75rem 1rem; white-space: nowrap;
                    font-family: 'VT323', monospace; font-size: 1rem;
                    box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
                    z-index: 40;
                }
                .v27-popup::after {
                    content: ''; position: absolute; top: 100%; left: 50%;
                    margin-left: -6px; border: 6px solid transparent;
                    border-top-color: var(--bg);
                }

                /* Road */
                .v27-road {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    height: 40px; background: var(--road); z-index: 5;
                }
                .v27-road-line {
                    position: absolute; top: 50%; left: 0; right: 0;
                    height: 4px;
                    background: repeating-linear-gradient(90deg, var(--road-line) 0px, var(--road-line) 20px, transparent 20px, transparent 40px);
                    transform: translateY(-50%);
                }

                /* Stats houses */
                .v27-stats {
                    position: relative; z-index: 50;
                    display: flex; justify-content: center; gap: 2rem;
                    padding: 2rem; flex-wrap: wrap;
                }
                .v27-stat {
                    background: rgba(38,50,56,0.9); color: white; padding: 1rem 1.5rem;
                    text-align: center; box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
                }
                .v27-stat-val { font-size: 1.5rem; margin-bottom: 0.15rem; }
                .v27-stat-label { font-family: 'VT323', monospace; font-size: 0.9rem; opacity: 0.7; }

                /* CTA */
                .v27-cta {
                    position: relative; z-index: 50; text-align: center;
                    padding: 1rem 2rem 2rem;
                }
                .v27-cta-btn {
                    font-family: 'Silkscreen', monospace; font-size: 0.8rem; font-weight: 700;
                    padding: 0.75rem 2.5rem; background: var(--bg); color: white;
                    text-decoration: none; display: inline-block;
                    box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
                    transition: all 0.1s;
                }
                .v27-cta-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 rgba(0,0,0,0.3); }

                /* Door/window details */
                .v27-window { position: absolute; width: 12px; height: 14px; background: rgba(255,255,255,0.3); }
                .v27-door { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 16px; height: 22px; background: rgba(0,0,0,0.3); }

                @media (max-width: 800px) {
                    .v27-scene { height: 350px; }
                    .v27-h1 { font-size: 1.8rem; }
                }
            `}</style>

            <div className="v27">
                {/* Clouds */}
                <div className="v27-cloud" style={{ top: "5%", left: "-50px", animationDuration: "25s" }} />
                <div className="v27-cloud" style={{ top: "12%", left: "-100px", animationDuration: "35s", animationDelay: "10s" }} />
                <div className="v27-cloud" style={{ top: "8%", left: "-150px", animationDuration: "30s", animationDelay: "5s" }} />

                <nav className="v27-nav">
                    <div className="v27-logo">🏙️ CodeGuruAI Campus</div>
                    <div className="v27-nav-links">
                        {user ? (
                            <Link href={dashboardHref} className="v27-nav-btn go">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v27-nav-btn">Sign In</Link>
                                <Link href="/register" className="v27-nav-btn go">Enroll Free</Link>
                            </>
                        )}
                    </div>
                </nav>

                <div className="v27-title">
                    <h1 className="v27-h1">CodeGuruAI Campus</h1>
                    <p className="v27-sub">Hover each building to explore the platform</p>
                </div>

                <div className="v27-scene">
                    {BUILDINGS.map(b => (
                        <div key={b.id} className="v27-building"
                            style={{ left: `${b.x}%`, top: `${b.y}%` }}
                            onMouseEnter={() => setHovered(b.id)}
                            onMouseLeave={() => setHovered(null)}>
                            <div className="v27-bldg-body">
                                <div className="v27-bldg-front" style={{ height: `${b.h}px`, background: b.color, top: `${50 - b.h}px` }}>
                                    <div className="v27-window" style={{ top: "15%", left: "15%" }} />
                                    <div className="v27-window" style={{ top: "15%", right: "15%" }} />
                                    <div className="v27-window" style={{ top: "45%", left: "15%" }} />
                                    <div className="v27-window" style={{ top: "45%", right: "15%" }} />
                                    <div className="v27-door" />
                                </div>
                                <div className="v27-bldg-side" style={{ height: `${b.h}px`, background: b.color, top: `${50 - b.h + 40}px` }} />
                                <div style={{ position: "absolute", top: `${50 - b.h - 10}px`, left: "30px", fontSize: "2rem" }}>{b.emoji}</div>
                            </div>
                            <div className="v27-bldg-label">{b.label}</div>
                            {hovered === b.id && (
                                <div className="v27-popup" style={{ bottom: `${b.h + 40}px` }}>
                                    {b.emoji} {b.label}: {b.desc}
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="v27-road"><div className="v27-road-line" /></div>
                </div>

                <div className="v27-stats">
                    <div className="v27-stat"><div className="v27-stat-val">15K+</div><div className="v27-stat-label">Students</div></div>
                    <div className="v27-stat"><div className="v27-stat-val">94%</div><div className="v27-stat-label">Completion</div></div>
                    <div className="v27-stat"><div className="v27-stat-val">250+</div><div className="v27-stat-label">Universities</div></div>
                    <div className="v27-stat"><div className="v27-stat-val">4.9★</div><div className="v27-stat-label">Rating</div></div>
                </div>

                <div className="v27-cta">
                    <Link href="/register" className="v27-cta-btn">▸ Enroll Free — Join the Campus</Link>
                </div>
            </div>
        </>
    )
}
