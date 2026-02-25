"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState } from "react"

/* ================================================================
   V29 — Board Game Path
   The page IS a board game. A snaking path of spaces, dice,
   colored tokens, card decks, score counters. Each space
   on the path represents a step in the learning journey.
   Font: Fredoka + Nunito
   ================================================================ */

const SPACES = [
    { id: 0, label: "START", desc: "Create your free account", color: "#10B981", type: "start" },
    { id: 1, label: "Pick a Problem", desc: "Choose from AI-generated challenges", color: "#3B82F6", type: "blue" },
    { id: 2, label: "Write Code", desc: "In-browser IDE — Python, JS, C++, Java", color: "#3B82F6", type: "blue" },
    { id: 3, label: "Run Tests", desc: "Instant automated test results", color: "#F59E0B", type: "yellow" },
    { id: 4, label: "⭐ BONUS", desc: "First test passing? +50 XP!", color: "#EC4899", type: "star" },
    { id: 5, label: "Stuck? Get Hint", desc: "Ask the Socratic AI for guidance", color: "#8B5CF6", type: "purple" },
    { id: 6, label: "AI Asks Question", desc: "\"What data structure gives O(1) lookups?\"", color: "#8B5CF6", type: "purple" },
    { id: 7, label: "Think...", desc: "The productive struggle IS the learning", color: "#F59E0B", type: "yellow" },
    { id: 8, label: "Eureka! 💡", desc: "Student discovers the insight independently", color: "#10B981", type: "green" },
    { id: 9, label: "All Tests Pass ✓", desc: "Optimized solution accepted!", color: "#10B981", type: "green" },
    { id: 10, label: "⭐ BONUS", desc: "Understanding confirmed — +200 XP!", color: "#EC4899", type: "star" },
    { id: 11, label: "FINISH 🏆", desc: "Real understanding achieved!", color: "#F59E0B", type: "finish" },
]

export default function LandingV29() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [hovered, setHovered] = useState<number | null>(null)
    const [tokenPos, setTokenPos] = useState(0)

    const advanceToken = () => {
        setTokenPos(p => (p < SPACES.length - 1 ? p + 1 : 0))
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap');

                .v29 {
                    --bg: #FFFDF0; --board: #FFF8DC;
                    --brown: #8B4513; --brown2: #A0522D;
                    --green: #10B981; --blue: #3B82F6;
                    --purple: #8B5CF6; --yellow: #F59E0B;
                    --pink: #EC4899; --red: #EF4444;
                    --text: #2D1B0E; --dim: #8B7355;
                    font-family: 'Nunito', sans-serif;
                    min-height: 100vh;
                    background: var(--bg);
                    background-image:
                        radial-gradient(circle at 20% 30%, rgba(251,191,36,0.08) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(59,130,246,0.06) 0%, transparent 50%);
                    color: var(--text);
                }

                /* Nav */
                .v29-nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; }
                .v29-logo { font-family: 'Fredoka', sans-serif; font-size: 1.4rem; font-weight: 700; color: var(--brown); display: flex; align-items: center; gap: 0.5rem; }
                .v29-nav-btns { display: flex; gap: 0.5rem; }
                .v29-nav-btn {
                    font-family: 'Fredoka', sans-serif; font-size: 0.85rem; font-weight: 600;
                    padding: 0.5rem 1.25rem; border-radius: 25px;
                    text-decoration: none; transition: all 0.2s;
                }
                .v29-nav-btn.outline { border: 2px solid var(--brown); color: var(--brown); }
                .v29-nav-btn.solid { background: var(--green); color: white; border: 2px solid var(--green); }
                .v29-nav-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

                .v29-title { text-align: center; padding: 1rem 0 0.5rem; }
                .v29-h1 { font-family: 'Fredoka', sans-serif; font-size: 2.8rem; font-weight: 700; color: var(--brown); margin-bottom: 0.3rem; }
                .v29-h1 span { color: var(--green); }
                .v29-sub { font-size: 1rem; color: var(--dim); }

                /* Board area */
                .v29-board {
                    max-width: 1000px; margin: 1.5rem auto; padding: 2rem;
                    background: var(--board);
                    border: 4px solid var(--brown);
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    position: relative;
                }

                /* Path */
                .v29-path { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
                .v29-space {
                    width: 120px; height: 80px; border-radius: 12px;
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; cursor: pointer;
                    font-family: 'Fredoka', sans-serif; font-weight: 600;
                    font-size: 0.65rem; text-align: center; padding: 0.35rem;
                    position: relative; transition: all 0.2s; border: 3px solid;
                    line-height: 1.3;
                    box-shadow: 0 3px 0 rgba(0,0,0,0.15);
                }
                .v29-space:hover { transform: translateY(-4px); box-shadow: 0 7px 0 rgba(0,0,0,0.1); }
                .v29-space.blue { background: #EBF5FF; border-color: var(--blue); color: var(--blue); }
                .v29-space.green { background: #ECFDF5; border-color: var(--green); color: var(--green); }
                .v29-space.purple { background: #F5F3FF; border-color: var(--purple); color: var(--purple); }
                .v29-space.yellow { background: #FFFBEB; border-color: var(--yellow); color: #92400E; }
                .v29-space.star { background: #FDF2F8; border-color: var(--pink); color: var(--pink); }
                .v29-space.start { background: var(--green); border-color: #059669; color: white; font-size: 0.8rem; }
                .v29-space.finish { background: var(--yellow); border-color: #D97706; color: white; font-size: 0.8rem; }

                /* Token */
                .v29-token {
                    position: absolute; top: -8px; right: -8px;
                    width: 24px; height: 24px; border-radius: 50%;
                    background: var(--red); border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    z-index: 5; transition: all 0.3s;
                    animation: v29bounce 0.5s ease;
                }
                @keyframes v29bounce { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }

                /* Popup */
                .v29-popup {
                    position: absolute; bottom: calc(100% + 8px); left: 50%;
                    transform: translateX(-50%); background: var(--text);
                    color: white; padding: 0.6rem 0.8rem; border-radius: 8px;
                    font-family: 'Nunito', sans-serif; font-size: 0.72rem;
                    font-weight: 600; white-space: nowrap; z-index: 10;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .v29-popup::after {
                    content: ''; position: absolute; top: 100%; left: 50%;
                    margin-left: -5px; border: 5px solid transparent;
                    border-top-color: var(--text);
                }

                /* Arrow connectors */
                .v29-arrow { font-size: 1.25rem; color: var(--dim); display: flex; align-items: center; opacity: 0.5; }

                /* Side panels */
                .v29-sides { display: flex; justify-content: center; gap: 1.5rem; max-width: 1000px; margin: 1.5rem auto; padding: 0 1rem; flex-wrap: wrap; }

                /* Dice */
                .v29-dice-card {
                    background: white; border-radius: 16px; padding: 1.25rem;
                    text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
                    border: 2px solid #F3F0E0; flex: 1; min-width: 180px;
                }
                .v29-dice-card h3 { font-family: 'Fredoka', sans-serif; font-size: 1rem; margin-bottom: 0.75rem; color: var(--brown); }
                .v29-dice {
                    width: 60px; height: 60px; background: white; border: 3px solid var(--text);
                    border-radius: 10px; display: inline-flex; align-items: center;
                    justify-content: center; font-size: 1.5rem; font-weight: 700;
                    cursor: pointer; transition: all 0.2s;
                    box-shadow: 0 3px 0 var(--text);
                }
                .v29-dice:hover { transform: translateY(-2px); box-shadow: 0 5px 0 var(--text); }
                .v29-dice:active { transform: translateY(1px); box-shadow: 0 1px 0 var(--text); }

                /* Score card */
                .v29-score { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; justify-content: center; }
                .v29-score-item { text-align: center; }
                .v29-score-val { font-family: 'Fredoka', sans-serif; font-size: 1.8rem; font-weight: 700; }
                .v29-score-label { font-size: 0.7rem; color: var(--dim); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

                /* Card deck */
                .v29-card-deck {
                    background: white; border-radius: 16px; padding: 1.25rem;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
                    border: 2px solid #F3F0E0; flex: 2; min-width: 250px;
                }
                .v29-card-deck h3 { font-family: 'Fredoka', sans-serif; font-size: 1rem; margin-bottom: 0.75rem; color: var(--brown); }
                .v29-cards { display: flex; gap: 0.5rem; flex-wrap: wrap; }
                .v29-card {
                    padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.72rem;
                    font-weight: 700; border: 2px solid;
                }

                /* CTA */
                .v29-cta { text-align: center; padding: 1.5rem 2rem 2rem; }
                .v29-cta-h { font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: var(--brown); margin-bottom: 0.5rem; }
                .v29-cta-p { color: var(--dim); margin-bottom: 1rem; font-size: 0.9rem; }
                .v29-cta-btn {
                    display: inline-block; font-family: 'Fredoka', sans-serif; font-size: 1rem;
                    font-weight: 700; padding: 0.75rem 2.5rem; background: var(--green);
                    color: white; border-radius: 30px; text-decoration: none;
                    box-shadow: 0 4px 0 #059669; transition: all 0.15s;
                }
                .v29-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #059669; }

                @media (max-width: 700px) { .v29-h1 { font-size: 1.8rem; } }
            `}</style>

            <div className="v29">
                <nav className="v29-nav">
                    <div className="v29-logo">🎲 CodeGuruAI</div>
                    <div className="v29-nav-btns">
                        {user ? (
                            <Link href={dashboardHref} className="v29-nav-btn solid">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v29-nav-btn outline">Sign In</Link>
                                <Link href="/register" className="v29-nav-btn solid">Play Free</Link>
                            </>
                        )}
                    </div>
                </nav>

                <div className="v29-title">
                    <h1 className="v29-h1">The Learning <span>Quest</span> 🏆</h1>
                    <p className="v29-sub">Follow the path — click the dice to advance your token!</p>
                </div>

                <div className="v29-board">
                    <div className="v29-path">
                        {SPACES.map((s, i) => (
                            <span key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <div className={`v29-space ${s.type}`}
                                    onMouseEnter={() => setHovered(s.id)}
                                    onMouseLeave={() => setHovered(null)}
                                    style={{ position: "relative" }}>
                                    {s.label}
                                    {tokenPos === i && <div className="v29-token" />}
                                    {hovered === s.id && <div className="v29-popup">{s.desc}</div>}
                                </div>
                                {i < SPACES.length - 1 && <div className="v29-arrow">→</div>}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="v29-sides">
                    <div className="v29-dice-card">
                        <h3>🎲 Roll to Advance</h3>
                        <div className="v29-dice" onClick={advanceToken}>🎲</div>
                        <div style={{ marginTop: "0.75rem" }}>
                            <div className="v29-score">
                                <div className="v29-score-item"><div className="v29-score-val" style={{ color: "var(--green)" }}>15K+</div><div className="v29-score-label">Players</div></div>
                                <div className="v29-score-item"><div className="v29-score-val" style={{ color: "var(--blue)" }}>94%</div><div className="v29-score-label">Win Rate</div></div>
                            </div>
                        </div>
                    </div>

                    <div className="v29-card-deck">
                        <h3>🃏 Feature Cards</h3>
                        <div className="v29-cards">
                            <div className="v29-card" style={{ borderColor: "var(--purple)", color: "var(--purple)", background: "#F5F3FF" }}>🧠 Socratic Hints</div>
                            <div className="v29-card" style={{ borderColor: "var(--blue)", color: "var(--blue)", background: "#EBF5FF" }}>⚡ Live Code Editor</div>
                            <div className="v29-card" style={{ borderColor: "var(--green)", color: "var(--green)", background: "#ECFDF5" }}>🎯 AI Problems</div>
                            <div className="v29-card" style={{ borderColor: "var(--yellow)", color: "#92400E", background: "#FFFBEB" }}>📊 Analytics</div>
                            <div className="v29-card" style={{ borderColor: "var(--pink)", color: "var(--pink)", background: "#FDF2F8" }}>🏫 Classrooms</div>
                            <div className="v29-card" style={{ borderColor: "var(--red)", color: "var(--red)", background: "#FEF2F2" }}>🛡️ Anti-Cheat</div>
                        </div>
                    </div>

                    <div className="v29-dice-card">
                        <h3>📊 Leaderboard</h3>
                        <div className="v29-score">
                            <div className="v29-score-item"><div className="v29-score-val" style={{ color: "var(--yellow)" }}>250+</div><div className="v29-score-label">Universities</div></div>
                            <div className="v29-score-item"><div className="v29-score-val" style={{ color: "var(--pink)" }}>4.9★</div><div className="v29-score-label">Rating</div></div>
                        </div>
                    </div>
                </div>

                <div className="v29-cta">
                    <div className="v29-cta-h">Ready to start your quest?</div>
                    <div className="v29-cta-p">Free for all students. Full-featured for instructors.</div>
                    <Link href="/register" className="v29-cta-btn">🎮 Start Playing Free →</Link>
                </div>
            </div>
        </>
    )
}
