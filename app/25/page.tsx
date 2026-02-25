"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V25 — Polaroid Corkboard
   Scattered Polaroid photos and notes pinned to a cork board.
   Push pins, tape, sticky notes, hand-scrawled labels,
   random rotations, hover-to-zoom, layered depth.
   Font: Permanent Marker + Kalam + Inter
   ================================================================ */

const POLAROIDS = [
    { id: 1, title: "Socratic Hints", emoji: "🧠", desc: "AI asks the question — never gives the answer", color: "#ff6b6b", x: 5, y: 8, rotate: -4, pin: "red" },
    { id: 2, title: "Live Code Editor", emoji: "⚡", desc: "Python, JS, C++, Java — right in your browser", color: "#4ecdc4", x: 35, y: 4, rotate: 3, pin: "blue" },
    { id: 3, title: "AI Problems", emoji: "🎯", desc: "Unique challenges every semester — no cheating", color: "#45b7d1", x: 65, y: 6, rotate: -2, pin: "yellow" },
    { id: 4, title: "Analytics", emoji: "📊", desc: "See where students struggle — in real time", color: "#f39c12", x: 10, y: 46, rotate: 5, pin: "green" },
    { id: 5, title: "Classrooms", emoji: "🏫", desc: "Create courses, assign sets, track progress", color: "#9b59b6", x: 42, y: 42, rotate: -3, pin: "red" },
    { id: 6, title: "Integrity", emoji: "🛡️", desc: "AI-unique problems = no answer pools", color: "#e74c3c", x: 72, y: 44, rotate: 2, pin: "blue" },
]

const STICKIES = [
    { text: "15,000+ students!", color: "#fff740", x: 28, y: 32, rotate: -6 },
    { text: "94% completion rate", color: "#ff80ed", x: 58, y: 28, rotate: 4 },
    { text: "250+ universities!", color: "#7afcff", x: 82, y: 26, rotate: -3 },
    { text: "rated 4.9/5 ★★★★★", color: "#ffa07a", x: 4, y: 76, rotate: 7 },
    { text: "FREE for students!", color: "#98fb98", x: 48, y: 72, rotate: -5 },
]

export default function LandingV25() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Kalam:wght@400;700&family=Inter:wght@400;600;700&display=swap');

                .v25 {
                    min-height: 100vh; overflow: hidden;
                    background: #8B6D4A;
                    background-image:
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='1.5' numOctaves='8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E"),
                        linear-gradient(135deg, #8B6D4A, #A07D52, #8B6D4A);
                    font-family: 'Inter', sans-serif;
                    position: relative;
                }

                /* Cork board frame */
                .v25-frame {
                    margin: 1.5rem; min-height: calc(100vh - 3rem);
                    border: 12px solid #4A3525;
                    border-top-color: #5A4535;
                    border-left-color: #5A4535;
                    border-right-color: #3A2515;
                    border-bottom-color: #3A2515;
                    box-shadow: inset 0 0 20px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3);
                    position: relative;
                    background:
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='2' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E"),
                        #C4A265;
                }

                /* Header note */
                .v25-title-card {
                    position: absolute; top: 2%; left: 50%; transform: translateX(-50%) rotate(-1deg);
                    background: white; padding: 1.5rem 3rem; text-align: center;
                    box-shadow: 2px 3px 8px rgba(0,0,0,0.15);
                    z-index: 20;
                }
                .v25-title-card::before {
                    content: '📌'; position: absolute; top: -10px; left: 50%;
                    transform: translateX(-50%); font-size: 1.5rem;
                    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
                }
                .v25-title-main { font-family: 'Permanent Marker', cursive; font-size: 2rem; color: #2C3E50; margin-bottom: 0.3rem; }
                .v25-title-sub { font-family: 'Kalam', cursive; font-size: 1rem; color: #7F8C8D; }

                /* Nav tape */
                .v25-nav {
                    position: absolute; top: 2%; right: 3%; z-index: 20;
                    display: flex; gap: 0.5rem;
                }
                .v25-nav-btn {
                    font-family: 'Kalam', cursive; font-size: 0.9rem;
                    padding: 0.4rem 1rem; text-decoration: none;
                    background: rgba(255,255,255,0.9); color: #2C3E50;
                    border: none; cursor: pointer;
                    box-shadow: 1px 2px 4px rgba(0,0,0,0.15);
                    transform: rotate(1deg); transition: transform 0.15s;
                }
                .v25-nav-btn:hover { transform: rotate(-1deg) scale(1.05); }
                .v25-nav-btn.hot { background: #ff6b6b; color: white; }

                /* Polaroid */
                .v25-polaroid {
                    position: absolute; width: 220px;
                    background: white; padding: 12px 12px 40px;
                    box-shadow: 2px 4px 12px rgba(0,0,0,0.2);
                    cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 5;
                }
                .v25-polaroid:hover { z-index: 30 !important; transform: scale(1.15) rotate(0deg) !important; box-shadow: 4px 8px 24px rgba(0,0,0,0.3); }
                .v25-polaroid-img {
                    width: 100%; aspect-ratio: 1; display: flex;
                    align-items: center; justify-content: center;
                    font-size: 3.5rem;
                }
                .v25-polaroid-label {
                    position: absolute; bottom: 10px; left: 12px; right: 12px;
                    font-family: 'Permanent Marker', cursive; font-size: 0.85rem;
                    color: #333; text-align: center;
                }
                .v25-polaroid-desc {
                    position: absolute; bottom: -40px; left: 0; right: 0;
                    font-family: 'Kalam', cursive; font-size: 0.78rem;
                    color: #555; text-align: center; opacity: 0;
                    transition: opacity 0.3s; pointer-events: none;
                }
                .v25-polaroid:hover .v25-polaroid-desc { opacity: 1; }

                /* Pin */
                .v25-pin {
                    position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
                    width: 16px; height: 16px; border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    z-index: 2;
                }
                .v25-pin.red { background: radial-gradient(circle at 30% 30%, #ff6b6b, #c0392b); }
                .v25-pin.blue { background: radial-gradient(circle at 30% 30%, #74b9ff, #2980b9); }
                .v25-pin.yellow { background: radial-gradient(circle at 30% 30%, #ffd93d, #f39c12); }
                .v25-pin.green { background: radial-gradient(circle at 30% 30%, #6bcf7f, #27ae60); }

                /* Tape strip */
                .v25-tape {
                    position: absolute; width: 80px; height: 20px;
                    background: rgba(255,255,200,0.6); transform: rotate(-5deg);
                    top: -5px; left: 50%; margin-left: -40px; z-index: 3;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                /* Sticky note */
                .v25-sticky {
                    position: absolute; width: 140px; padding: 1rem;
                    font-family: 'Kalam', cursive; font-size: 0.85rem;
                    font-weight: 700; text-align: center; color: #333;
                    box-shadow: 2px 3px 8px rgba(0,0,0,0.15);
                    z-index: 8; line-height: 1.4;
                    transition: transform 0.2s;
                }
                .v25-sticky:hover { transform: scale(1.08) !important; z-index: 25 !important; }
                .v25-sticky::after {
                    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
                    height: 20%; background: linear-gradient(transparent, rgba(0,0,0,0.03));
                }

                /* Demo card */
                .v25-demo {
                    position: absolute; bottom: 5%; left: 5%; width: 350px;
                    background: white; padding: 1.25rem;
                    box-shadow: 3px 4px 12px rgba(0,0,0,0.2);
                    transform: rotate(-2deg); z-index: 10;
                }
                .v25-demo::before { content: ''; position: absolute; top: -5px; left: 30%; width: 80px; height: 20px; background: rgba(255,255,200,0.6); transform: rotate(3deg); }
                .v25-demo-code {
                    font-family: 'DM Mono', 'Courier New', monospace; font-size: 0.72rem;
                    background: #1a1a2e; color: #a6e3a1; padding: 0.75rem;
                    border-radius: 4px; line-height: 1.7; margin-top: 0.5rem;
                }
                .v25-demo-label { font-family: 'Permanent Marker', cursive; font-size: 1rem; color: #2C3E50; }

                /* CTA card */
                .v25-cta-note {
                    position: absolute; bottom: 5%; right: 5%;
                    background: #ff6b6b; color: white;
                    padding: 1.5rem 2rem; text-align: center;
                    box-shadow: 3px 4px 12px rgba(0,0,0,0.2);
                    transform: rotate(3deg); z-index: 10;
                }
                .v25-cta-note::before {
                    content: '📌'; position: absolute; top: -10px; right: 20px;
                    font-size: 1.5rem; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
                }
                .v25-cta-note h3 { font-family: 'Permanent Marker', cursive; font-size: 1.3rem; margin-bottom: 0.3rem; }
                .v25-cta-note p { font-family: 'Kalam', cursive; font-size: 0.85rem; margin-bottom: 0.75rem; opacity: 0.9; }
                .v25-cta-link {
                    display: inline-block; background: white; color: #ff6b6b;
                    font-family: 'Permanent Marker', cursive; font-size: 1rem;
                    padding: 0.5rem 1.5rem; text-decoration: none;
                    box-shadow: 2px 2px 4px rgba(0,0,0,0.15);
                    transition: transform 0.15s;
                }
                .v25-cta-link:hover { transform: scale(1.05); }
            `}</style>

            <div className="v25">
                <div className="v25-frame">
                    {/* Title */}
                    <div className="v25-title-card">
                        <h1 className="v25-title-main">CodeGuruAI</h1>
                        <p className="v25-title-sub">The AI that asks questions, not gives answers</p>
                    </div>

                    {/* Nav */}
                    <div className="v25-nav">
                        {user ? (
                            <Link href={dashboardHref} className="v25-nav-btn hot">Dashboard →</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v25-nav-btn">Sign In</Link>
                                <Link href="/register" className="v25-nav-btn hot">Join Free!</Link>
                            </>
                        )}
                    </div>

                    {/* Polaroids */}
                    {POLAROIDS.map(p => (
                        <div key={p.id} className="v25-polaroid"
                            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotate}deg)` }}>
                            <div className={`v25-pin ${p.pin}`} />
                            <div className="v25-polaroid-img" style={{ background: `${p.color}15` }}>{p.emoji}</div>
                            <div className="v25-polaroid-label">{p.title}</div>
                            <div className="v25-polaroid-desc">{p.desc}</div>
                        </div>
                    ))}

                    {/* Stickies */}
                    {STICKIES.map((s, i) => (
                        <div key={i} className="v25-sticky" style={{ left: `${s.x}%`, top: `${s.y}%`, background: s.color, transform: `rotate(${s.rotate}deg)` }}>
                            {s.text}
                        </div>
                    ))}

                    {/* Demo card */}
                    <div className="v25-demo">
                        <div className="v25-demo-label">📝 How a Socratic Hint Works:</div>
                        <div className="v25-demo-code">
                            Student: two_sum → TLE (O(n²)){"\n"}
                            {"\n"}
                            🧠 AI: &quot;What data structure gives{"\n"}
                               O(1) lookups?&quot;{"\n"}
                            {"\n"}
                            Student: Uses hash map → O(n){"\n"}
                            ✅ All tests passed!
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="v25-cta-note">
                        <h3>Start Learning!</h3>
                        <p>Free forever for students</p>
                        <Link href="/register" className="v25-cta-link">Sign Up Free →</Link>
                    </div>
                </div>
            </div>
        </>
    )
}
