"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect, useRef } from "react"

/* ================================================================
   V12 — Interactive Terminal
   The entire landing page is a terminal. Content appears as
   typed CLI output. Users can "type" commands to navigate.
   Pure green-on-black CRT aesthetic with scan lines, flicker,
   and command prompt interaction.
   ================================================================ */

const COMMANDS: Record<string, string[]> = {
    help: [
        "╔══════════════════════════════════════════════════════════════╗",
        "║                   CODEGURUAI — HELP                        ║",
        "╠══════════════════════════════════════════════════════════════╣",
        "║  about      — Learn what CodeGuruAI is                     ║",
        "║  features   — View platform features                       ║",
        "║  demo       — See a Socratic hint in action                ║",
        "║  stats      — View platform statistics                     ║",
        "║  philosophy — Our teaching philosophy                      ║",
        "║  start      — Create a free account                        ║",
        "║  signin     — Sign in to your account                      ║",
        "║  clear      — Clear the terminal                           ║",
        "║  help       — Show this help message                       ║",
        "╚══════════════════════════════════════════════════════════════╝",
    ],
    about: [
        "┌─ ABOUT CODEGURUAI ──────────────────────────────────────────┐",
        "│                                                             │",
        "│  CodeGuruAI is an AI-powered coding tutor built for         │",
        "│  university CS classrooms.                                  │",
        "│                                                             │",
        "│  Instead of giving students the answer, our AI uses the     │",
        "│  Socratic method — asking precisely the right question      │",
        "│  to guide students toward the solution themselves.          │",
        "│                                                             │",
        "│  Features:                                                  │",
        "│    → Socratic AI hints (never gives the answer)             │",
        "│    → In-browser code editor & execution                     │",
        "│    → AI-powered problem generation                          │",
        "│    → Classroom management for instructors                   │",
        "│    → Real-time analytics & progress tracking                │",
        "│                                                             │",
        "│  Free for students. Powerful for instructors.               │",
        "│  Type 'start' to create an account.                         │",
        "└─────────────────────────────────────────────────────────────┘",
    ],
    features: [
        "",
        "  ▸ SOCRATIC AI HINTS",
        "    The AI identifies student misconceptions and asks targeted",
        "    questions. It never reveals the answer — it reveals the",
        "    thinking that leads to it.",
        "",
        "  ▸ LIVE CODE EXECUTION",
        "    Full in-browser editor with syntax highlighting, test case",
        "    validation, and side-by-side output. Python, JS, C++, Java.",
        "",
        "  ▸ AI PROBLEM GENERATION",
        "    Generate unique challenges in minutes. Set topic, difficulty,",
        "    and constraints. Complete problems with test cases.",
        "",
        "  ▸ CLASSROOM ANALYTICS",
        "    Track submissions, completion rates, time-to-solve, and",
        "    hint dependency patterns across your entire classroom.",
        "",
        "  ▸ CLASSROOM MANAGEMENT",
        "    Create classrooms, assign problems, set deadlines, manage",
        "    students. Built for how university CS courses work.",
        "",
    ],
    demo: [
        "",
        "  ┌─ STUDENT CODE ────────────────────────────────────────┐",
        "  │  def two_sum(nums, target):                           │",
        "  │      for i in range(len(nums)):           # O(n²)    │",
        "  │          for j in range(i+1, len(nums)):              │",
        "  │              if nums[i] + nums[j] == target:          │",
        "  │                  return [i, j]                        │",
        "  └───────────────────────────────────────────────────────┘",
        "",
        "  ⚠  Test case 4 — Time Limit Exceeded",
        "",
        "  Student requested a hint...",
        "",
        "  ┌─ SOCRATIC AI HINT ───────────────────────────────────┐",
        '  │  "Your current approach checks every pair. What data │',
        '  │   structure would let you look up a value in O(1)    │',
        '  │   time? How would that change your approach?"         │',
        "  └───────────────────────────────────────────────────────┘",
        "",
        "  Student updates code...",
        "",
        "  ┌─ UPDATED CODE ───────────────────────────────────────┐",
        "  │  def two_sum(nums, target):                          │",
        "  │      seen = {}                            # O(n)     │",
        "  │      for i, n in enumerate(nums):                    │",
        "  │          if target - n in seen:                       │",
        "  │              return [seen[target-n], i]               │",
        "  │          seen[n] = i                                  │",
        "  └───────────────────────────────────────────────────────┘",
        "",
        "  ✓ All 5 test cases passed — O(n) time complexity",
        "",
    ],
    stats: [
        "",
        "  ╔════════════════════════════════════════╗",
        "  ║       CODEGURUAI PLATFORM STATS        ║",
        "  ╠════════════╦═══════════════════════════╣",
        "  ║ Students   ║  15,000+                  ║",
        "  ║ Solved     ║  142,000+ problems        ║",
        "  ║ Completion ║  94%                       ║",
        "  ║ Unis       ║  250+                      ║",
        "  ║ Rating     ║  ★★★★★ (4.9/5)            ║",
        "  ║ Languages  ║  Python, JS, C++, Java    ║",
        "  ╚════════════╩═══════════════════════════╝",
        "",
    ],
    philosophy: [
        "",
        '  "Education is the kindling of a flame,',
        '   not the filling of a vessel."',
        "             — Attributed to Socrates",
        "",
        "  We believe the struggle IS the learning.",
        "",
        "  CodeGuruAI protects that productive struggle.",
        "  Students are never handed an answer, but they",
        "  are never truly stuck either.",
        "",
        "  The AI models the Socratic method: asking the",
        "  question that exposes the gap in understanding.",
        "  Students build the reasoning — not just the code.",
        "",
        "  For instructors: see exactly where students",
        "  struggle, in real time. Create unique AI-generated",
        "  problems so no two semesters are the same.",
        "",
    ],
}

const BOOT = [
    "BIOS v3.14 — CodeGuruAI Systems Inc.",
    "Checking memory... 16384 MB OK",
    "Loading kernel modules...",
    "Initializing AI subsystem... done",
    "Mounting /dev/socratic... done",
    "Starting CodeGuruAI shell v2.0.26",
    "",
    "Type 'help' for available commands.",
    "",
]

export default function LandingV12() {
    const { user } = useAuth()
    const [lines, setLines] = useState<{ text: string; type: "output" | "input" }[]>([])
    const [input, setInput] = useState("")
    const [booting, setBooting] = useState(true)
    const [cmdHistory, setCmdHistory] = useState<string[]>([])
    const [histIdx, setHistIdx] = useState(-1)
    const termRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Boot sequence
    useEffect(() => {
        let i = 0
        const timer = setInterval(() => {
            if (i < BOOT.length) {
                setLines(l => [...l, { text: BOOT[i], type: "output" }])
                i++
            } else {
                clearInterval(timer)
                setBooting(false)
            }
        }, 120)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => { termRef.current?.scrollTo(0, termRef.current.scrollHeight) }, [lines])
    useEffect(() => { if (!booting) inputRef.current?.focus() }, [booting])

    const exec = (cmd: string) => {
        const c = cmd.trim().toLowerCase()
        setLines(l => [...l, { text: `codeguru@ai:~$ ${cmd}`, type: "input" }])
        setCmdHistory(h => [cmd, ...h])
        setHistIdx(-1)

        if (c === "clear") { setLines([]); return }
        if (c === "start" || c === "register") { window.location.href = "/register"; return }
        if (c === "signin" || c === "login") { window.location.href = "/login"; return }
        if (c === "dashboard" && user) { window.location.href = "/dashboard"; return }

        const output = COMMANDS[c]
        if (output) {
            output.forEach((line, i) => {
                setTimeout(() => setLines(l => [...l, { text: line, type: "output" }]), i * 15)
            })
        } else {
            setLines(l => [...l, { text: `command not found: ${c}. Type 'help' for commands.`, type: "output" }])
        }
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && input.trim()) { exec(input); setInput("") }
        if (e.key === "ArrowUp") { e.preventDefault(); const next = Math.min(histIdx + 1, cmdHistory.length - 1); setHistIdx(next); setInput(cmdHistory[next] || "") }
        if (e.key === "ArrowDown") { e.preventDefault(); const next = Math.max(histIdx - 1, -1); setHistIdx(next); setInput(next >= 0 ? cmdHistory[next] : "") }
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&display=swap');

                .v12-terminal {
                    width: 100vw; height: 100vh; overflow: hidden;
                    background: #0a0a0a; position: relative;
                    font-family: 'Fira Code', 'Courier New', monospace;
                }

                /* CRT effect */
                .v12-terminal::before {
                    content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
                    background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 2px);
                }
                .v12-terminal::after {
                    content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none;
                    background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%);
                }

                .v12-body {
                    position: relative; z-index: 1;
                    height: 100%; overflow-y: auto; padding: 20px 24px;
                    scrollbar-width: thin; scrollbar-color: #1a3a1a #0a0a0a;
                }

                .v12-line { font-size: 14px; line-height: 1.6; min-height: 1.6em; }
                .v12-line.input { color: #33ff33; }
                .v12-line.output { color: #20c020; }

                .v12-prompt {
                    display: flex; align-items: center; gap: 0;
                    font-size: 14px; color: #33ff33;
                }
                .v12-prompt-text { white-space: pre; }
                .v12-input {
                    flex: 1; background: transparent; border: none; outline: none;
                    color: #33ff33; font-family: inherit; font-size: inherit;
                    caret-color: #33ff33;
                }

                @keyframes v12blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
                .v12-cursor {
                    display: inline-block; width: 8px; height: 16px;
                    background: #33ff33; animation: v12blink 1s step-end infinite;
                    vertical-align: text-bottom;
                }

                .v12-quickbar {
                    position: fixed; bottom: 20px; right: 20px; z-index: 10;
                    display: flex; gap: 6px;
                }
                .v12-qbtn {
                    padding: 6px 14px; font-family: 'Fira Code', monospace;
                    font-size: 11px; border: 1px solid #1a3a1a;
                    background: rgba(10,10,10,0.9); color: #20c020;
                    cursor: pointer; border-radius: 4px; text-decoration: none;
                    transition: all 0.15s;
                }
                .v12-qbtn:hover { border-color: #33ff33; background: rgba(20,60,20,0.4); }
            `}</style>

            <div className="v12-terminal" onClick={() => inputRef.current?.focus()}>
                <div className="v12-body" ref={termRef}>
                    {lines.map((l, i) => (
                        <div key={i} className={`v12-line ${l.type}`}>{l.text}</div>
                    ))}
                    {!booting && (
                        <div className="v12-prompt">
                            <span className="v12-prompt-text">codeguru@ai:~$ </span>
                            <input ref={inputRef} className="v12-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} autoFocus spellCheck={false} />
                        </div>
                    )}
                    {booting && <span className="v12-cursor" />}
                </div>

                <div className="v12-quickbar">
                    <button className="v12-qbtn" onClick={() => exec("help")}>help</button>
                    <button className="v12-qbtn" onClick={() => exec("demo")}>demo</button>
                    <button className="v12-qbtn" onClick={() => exec("features")}>features</button>
                    <Link href="/register" className="v12-qbtn" style={{ color: "#33ff33", fontWeight: "bold" }}>start →</Link>
                </div>
            </div>
        </>
    )
}
