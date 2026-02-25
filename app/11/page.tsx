"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useRef, useCallback } from "react"

/* ================================================================
   V11 — Retro OS Desktop (Windows 95 / Classic Mac)
   The landing page IS an operating system. Users interact with
   desktop windows, a taskbar, start menu, and desktop icons.
   Features live inside draggable windows. The "About" is a
   Notepad window, features are in separate windows, etc.
   ================================================================ */

interface WindowState {
    id: string; title: string; x: number; y: number;
    w: number; h: number; z: number; minimized: boolean;
    content: React.ReactNode; icon: string;
}

export default function LandingV11() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [startOpen, setStartOpen] = useState(false)
    const [zCounter, setZCounter] = useState(100)
    const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)

    const [windows, setWindows] = useState<WindowState[]>([
        {
            id: "welcome", title: "Welcome.txt — Notepad", x: 80, y: 40, w: 520, h: 380, z: 10, minimized: false, icon: "📝",
            content: (
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "13px", lineHeight: "1.75", padding: "8px", whiteSpace: "pre-wrap" }}>
{`═══════════════════════════════════
  CODEGURU AI — Welcome
═══════════════════════════════════

Hello! 👋

CodeGuruAI is an AI-powered coding
tutor built for universities.

Instead of giving answers, our AI
asks Socratic questions that guide
students to figure it out themselves.

✦ Socratic AI Hints
✦ Live Code Execution
✦ AI Problem Generation
✦ Classroom Management
✦ Progress Analytics

Double-click the desktop icons to
learn more about each feature.

— The CodeGuruAI Team`}
                </div>
            ),
        },
        {
            id: "code", title: "solution.py — CodeGuru Editor", x: 350, y: 100, w: 560, h: 400, z: 11, minimized: true, icon: "💻",
            content: (
                <div style={{ background: "#1e1e2e", color: "#cdd6f4", fontFamily: "'Courier New', monospace", fontSize: "13px", lineHeight: "2", padding: "12px", height: "100%", overflow: "auto" }}>
                    <div><span style={{ color: "#585b70" }}>1  </span><span style={{ color: "#cba6f7" }}>def</span> <span style={{ color: "#89b4fa" }}>two_sum</span>(nums, target):</div>
                    <div><span style={{ color: "#585b70" }}>2  </span><span style={{ color: "#6c7086" }}>    # Find two indices that sum to target</span></div>
                    <div><span style={{ color: "#585b70" }}>3  </span>    seen = {'{}'}</div>
                    <div><span style={{ color: "#585b70" }}>4  </span><span style={{ color: "#cba6f7" }}>    for</span> i, n <span style={{ color: "#cba6f7" }}>in</span> <span style={{ color: "#89b4fa" }}>enumerate</span>(nums):</div>
                    <div><span style={{ color: "#585b70" }}>5  </span>        diff = target - n</div>
                    <div><span style={{ color: "#585b70" }}>6  </span><span style={{ color: "#cba6f7" }}>        if</span> diff <span style={{ color: "#cba6f7" }}>in</span> seen:</div>
                    <div><span style={{ color: "#585b70" }}>7  </span>            <span style={{ color: "#a6e3a1" }}>return</span> [seen[diff], i]</div>
                    <div><span style={{ color: "#585b70" }}>8  </span>        seen[n] = i</div>
                    <div style={{ marginTop: "16px", borderTop: "1px solid #313244", paddingTop: "8px" }}>
                        <span style={{ color: "#a6e3a1" }}>✓ All 5 test cases passed</span>
                    </div>
                    <div style={{ marginTop: "12px", background: "#313244", padding: "10px", borderRadius: "4px", borderLeft: "3px solid #f9e2af" }}>
                        <div style={{ color: "#f9e2af", fontSize: "11px", fontWeight: "bold", marginBottom: "4px" }}>💡 SOCRATIC HINT</div>
                        <div style={{ color: "#a6adc8", fontStyle: "italic" }}>&ldquo;What data structure gives O(1) lookups?&rdquo;</div>
                    </div>
                </div>
            ),
        },
        {
            id: "features", title: "Features — Help", x: 200, y: 140, w: 480, h: 360, z: 9, minimized: true, icon: "❓",
            content: (
                <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", fontSize: "13px", padding: "12px", lineHeight: "1.7" }}>
                    <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "12px", borderBottom: "1px solid #c0c0c0", paddingBottom: "8px" }}>📚 CodeGuruAI Feature Guide</div>
                    <div style={{ display: "grid", gap: "10px" }}>
                        {[
                            { icon: "🧠", title: "Socratic AI Hints", desc: "AI asks targeted questions — never gives the answer directly. Forces genuine reasoning." },
                            { icon: "⚡", title: "Live Code Execution", desc: "In-browser editor with instant test case feedback. Python, JS, C++, Java." },
                            { icon: "🎯", title: "AI Problem Generation", desc: "Generate unique challenges with AI. Set topic, difficulty, constraints." },
                            { icon: "📊", title: "Classroom Analytics", desc: "Track every student's submissions, time-to-solve, and hint dependency." },
                            { icon: "👥", title: "Classroom Management", desc: "Create classrooms, assign problem sets, manage students and deadlines." },
                        ].map((f, i) => (
                            <div key={i} style={{ display: "flex", gap: "8px", padding: "6px 8px", background: i % 2 === 0 ? "#f0f0f0" : "transparent" }}>
                                <span style={{ fontSize: "18px", flexShrink: 0 }}>{f.icon}</span>
                                <div><strong>{f.title}</strong><br /><span style={{ color: "#555" }}>{f.desc}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: "stats", title: "System Monitor", x: 500, y: 60, w: 340, h: 280, z: 8, minimized: true, icon: "📈",
            content: (
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", padding: "12px", background: "#000", color: "#00ff00", height: "100%", lineHeight: "2" }}>
                    <div>╔══════════════════════════════╗</div>
                    <div>║ CODEGURU SYSTEM MONITOR      ║</div>
                    <div>╠══════════════════════════════╣</div>
                    <div>║ Students Online:    15,247   ║</div>
                    <div>║ Problems Solved:   142,893   ║</div>
                    <div>║ Completion Rate:       94%   ║</div>
                    <div>║ Universities:          250+  ║</div>
                    <div>║ Student Rating:       4.9★   ║</div>
                    <div>║ AI Hints Today:     8,421   ║</div>
                    <div>╠══════════════════════════════╣</div>
                    <div>║ CPU: ████████░░ 78%          ║</div>
                    <div>║ MEM: ██████░░░░ 62%          ║</div>
                    <div>╚══════════════════════════════╝</div>
                </div>
            ),
        },
    ])

    const bringToFront = useCallback((id: string) => {
        setZCounter(z => z + 1)
        setWindows(ws => ws.map(w => w.id === id ? { ...w, z: zCounter + 1 } : w))
    }, [zCounter])

    const toggleMinimize = useCallback((id: string) => {
        setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w))
    }, [])

    const closeWindow = useCallback((id: string) => {
        setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: true } : w))
    }, [])

    const onMouseDown = useCallback((e: React.MouseEvent, id: string) => {
        const w = windows.find(w => w.id === id)
        if (!w) return
        bringToFront(id)
        dragRef.current = { id, offsetX: e.clientX - w.x, offsetY: e.clientY - w.y }
        const onMove = (ev: MouseEvent) => {
            if (!dragRef.current) return
            setWindows(ws => ws.map(w => w.id === dragRef.current!.id ? { ...w, x: ev.clientX - dragRef.current!.offsetX, y: ev.clientY - dragRef.current!.offsetY } : w))
        }
        const onUp = () => { dragRef.current = null; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
        document.addEventListener("mousemove", onMove)
        document.addEventListener("mouseup", onUp)
    }, [windows, bringToFront])

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=VT323&family=Pixelify+Sans:wght@400;600;700&display=swap');

                .v11-desktop {
                    width: 100vw; height: 100vh; overflow: hidden;
                    background: #008080;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='60' fill='%23008080'/%3E%3Crect x='0' y='0' width='30' height='30' fill='%23007070' opacity='0.3'/%3E%3Crect x='30' y='30' width='30' height='30' fill='%23007070' opacity='0.3'/%3E%3C/svg%3E");
                    position: relative;
                    font-family: 'Segoe UI', Tahoma, sans-serif;
                    user-select: none;
                }

                /* Desktop Icons */
                .v11-icons { position: absolute; top: 20px; left: 20px; display: flex; flex-direction: column; gap: 20px; }
                .v11-icon {
                    display: flex; flex-direction: column; align-items: center; gap: 4px;
                    cursor: pointer; padding: 8px; border-radius: 4px; width: 80px; text-align: center;
                }
                .v11-icon:hover { background: rgba(255,255,255,0.15); }
                .v11-icon:active { background: rgba(0,0,128,0.4); }
                .v11-icon-emoji { font-size: 32px; filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.3)); }
                .v11-icon-label { font-size: 11px; color: white; text-shadow: 1px 1px 1px rgba(0,0,0,0.7); font-weight: 500; line-height: 1.3; }

                /* Win95-style window */
                .v11-window {
                    position: absolute;
                    background: #c0c0c0;
                    border: 2px outset #dfdfdf;
                    box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
                    display: flex; flex-direction: column;
                }
                .v11-window.minimized { display: none; }

                .v11-titlebar {
                    background: linear-gradient(90deg, #000080, #1084d0);
                    color: white;
                    padding: 3px 4px;
                    font-size: 12px; font-weight: bold;
                    display: flex; justify-content: space-between; align-items: center;
                    cursor: grab; height: 24px;
                }
                .v11-titlebar:active { cursor: grabbing; }
                .v11-titlebar-text { display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .v11-titlebar-btns { display: flex; gap: 2px; flex-shrink: 0; }
                .v11-tbtn {
                    width: 18px; height: 16px; background: #c0c0c0;
                    border: 1px outset #dfdfdf; font-size: 10px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: black; font-weight: bold; line-height: 1;
                }
                .v11-tbtn:active { border-style: inset; }

                .v11-menubar {
                    background: #c0c0c0; border-bottom: 1px solid #808080;
                    padding: 2px 4px; font-size: 12px;
                    display: flex; gap: 0;
                }
                .v11-menubar span {
                    padding: 1px 6px; cursor: pointer;
                }
                .v11-menubar span:hover { background: #000080; color: white; }

                .v11-window-body {
                    flex: 1; overflow: auto;
                    border: 2px inset #808080;
                    margin: 2px;
                    background: white;
                }

                /* Taskbar */
                .v11-taskbar {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    height: 36px; background: #c0c0c0;
                    border-top: 2px outset #dfdfdf;
                    display: flex; align-items: center; padding: 2px 4px;
                    gap: 4px; z-index: 9999;
                }
                .v11-start-btn {
                    height: 28px; padding: 0 8px;
                    background: #c0c0c0; border: 2px outset #dfdfdf;
                    font-size: 12px; font-weight: bold;
                    display: flex; align-items: center; gap: 4px;
                    cursor: pointer; flex-shrink: 0;
                }
                .v11-start-btn:active, .v11-start-btn.open { border-style: inset; }
                .v11-start-logo { font-size: 16px; }

                .v11-task-item {
                    height: 28px; padding: 0 10px;
                    background: #c0c0c0; border: 2px outset #dfdfdf;
                    font-size: 11px; display: flex; align-items: center; gap: 4px;
                    cursor: pointer; min-width: 120px; max-width: 160px;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .v11-task-item.active { border-style: inset; background: #e0e0e0; }

                .v11-clock {
                    margin-left: auto; padding: 0 12px; height: 28px;
                    border: 2px inset #808080; font-size: 12px;
                    display: flex; align-items: center; gap: 6px;
                    flex-shrink: 0;
                }

                /* Start menu */
                .v11-startmenu {
                    position: absolute; bottom: 38px; left: 2px;
                    width: 240px; background: #c0c0c0;
                    border: 2px outset #dfdfdf;
                    box-shadow: 2px -2px 0 rgba(0,0,0,0.2);
                    z-index: 10000;
                }
                .v11-startmenu-banner {
                    position: absolute; left: 0; top: 0; bottom: 0; width: 28px;
                    background: linear-gradient(to top, #000080, #1084d0);
                    display: flex; align-items: flex-end; justify-content: center; padding-bottom: 8px;
                }
                .v11-startmenu-banner span {
                    color: white; font-weight: bold; font-size: 12px;
                    writing-mode: vertical-lr; transform: rotate(180deg);
                    letter-spacing: 2px;
                }
                .v11-startmenu-items { margin-left: 28px; padding: 4px 0; }
                .v11-startmenu-item {
                    padding: 6px 12px; font-size: 12px;
                    display: flex; align-items: center; gap: 8px;
                    cursor: pointer;
                }
                .v11-startmenu-item:hover { background: #000080; color: white; }
                .v11-startmenu-sep { border-top: 1px solid #808080; border-bottom: 1px solid white; margin: 3px 28px 3px 0; }
                .v11-startmenu-item .emoji { font-size: 18px; width: 24px; text-align: center; }
            `}</style>

            <div className="v11-desktop" onClick={() => startOpen && setStartOpen(false)}>
                {/* Desktop Icons */}
                <div className="v11-icons">
                    {windows.map(w => (
                        <div key={w.id} className="v11-icon" onDoubleClick={() => { toggleMinimize(w.id); bringToFront(w.id) }}>
                            <div className="v11-icon-emoji">{w.icon}</div>
                            <div className="v11-icon-label">{w.title.split(" — ")[0]}</div>
                        </div>
                    ))}
                    <div className="v11-icon" onDoubleClick={() => window.open("/register", "_self")}>
                        <div className="v11-icon-emoji">🚀</div>
                        <div className="v11-icon-label">Get Started</div>
                    </div>
                    {user && (
                        <div className="v11-icon" onDoubleClick={() => window.open(dashboardHref, "_self")}>
                            <div className="v11-icon-emoji">🏠</div>
                            <div className="v11-icon-label">Dashboard</div>
                        </div>
                    )}
                </div>

                {/* Windows */}
                {windows.map(w => (
                    <div key={w.id} className={`v11-window ${w.minimized ? "minimized" : ""}`}
                         style={{ left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z }}
                         onClick={() => bringToFront(w.id)}>
                        <div className="v11-titlebar" onMouseDown={e => onMouseDown(e, w.id)}>
                            <div className="v11-titlebar-text"><span style={{ fontSize: "14px" }}>{w.icon}</span> {w.title}</div>
                            <div className="v11-titlebar-btns">
                                <div className="v11-tbtn" onClick={e => { e.stopPropagation(); toggleMinimize(w.id) }}>_</div>
                                <div className="v11-tbtn">□</div>
                                <div className="v11-tbtn" onClick={e => { e.stopPropagation(); closeWindow(w.id) }}>✕</div>
                            </div>
                        </div>
                        <div className="v11-menubar"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span></div>
                        <div className="v11-window-body">{w.content}</div>
                    </div>
                ))}

                {/* Start Menu */}
                {startOpen && (
                    <div className="v11-startmenu" onClick={e => e.stopPropagation()}>
                        <div className="v11-startmenu-banner"><span>CodeGuruAI</span></div>
                        <div className="v11-startmenu-items">
                            {windows.map(w => (
                                <div key={w.id} className="v11-startmenu-item" onClick={() => { toggleMinimize(w.id); bringToFront(w.id); setStartOpen(false) }}>
                                    <span className="emoji">{w.icon}</span>{w.title.split(" — ")[0]}
                                </div>
                            ))}
                            <div className="v11-startmenu-sep" />
                            <Link href="/register" style={{ textDecoration: "none", color: "inherit" }}><div className="v11-startmenu-item"><span className="emoji">🚀</span>Get Started</div></Link>
                            {user ? (
                                <Link href={dashboardHref} style={{ textDecoration: "none", color: "inherit" }}><div className="v11-startmenu-item"><span className="emoji">🏠</span>Dashboard</div></Link>
                            ) : (
                                <Link href="/login" style={{ textDecoration: "none", color: "inherit" }}><div className="v11-startmenu-item"><span className="emoji">🔑</span>Sign In</div></Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Taskbar */}
                <div className="v11-taskbar" onClick={e => e.stopPropagation()}>
                    <div className={`v11-start-btn ${startOpen ? "open" : ""}`} onClick={() => setStartOpen(!startOpen)}>
                        <span className="v11-start-logo">🪟</span> Start
                    </div>
                    {windows.map(w => (
                        <div key={w.id} className={`v11-task-item ${!w.minimized ? "active" : ""}`}
                             onClick={() => { toggleMinimize(w.id); bringToFront(w.id) }}>
                            <span>{w.icon}</span> {w.title.split(" — ")[0]}
                        </div>
                    ))}
                    <div className="v11-clock">
                        <span>🔊</span>
                        <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                </div>
            </div>
        </>
    )
}
