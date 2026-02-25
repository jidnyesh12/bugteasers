"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState } from "react"

/* ================================================================
   V21 — File System Explorer (macOS Finder)
   The entire landing page IS a file manager. Navigate folders
   to discover product info. Sidebar with favorites, column
   view, breadcrumbs, toolbar, status bar, Quick Look previews.
   Font: SF Mono / system-ui stack
   ================================================================ */

type FSItem = {
    name: string; type: "folder" | "file" | "app"; icon: string;
    size?: string; modified?: string; content?: string;
    children?: FSItem[];
}

const FS: FSItem[] = [
    {
        name: "CodeGuruAI", type: "folder", icon: "📁", children: [
            {
                name: "About", type: "folder", icon: "📁", children: [
                    { name: "README.md", type: "file", icon: "📄", size: "4.2 KB", modified: "Today, 6:30 PM", content: "# CodeGuruAI\n\nAI-powered coding tutor for university CS classrooms.\n\nInstead of giving students the answer, our AI uses the Socratic method — asking precisely the right question to guide students toward the solution themselves.\n\n## Core Philosophy\n\"The productive struggle is where learning happens.\"\n\nStudents are never fully stuck, but they are never handed the answer.\n\n## Quick Start\nFree for students. Visit /register to create an account." },
                    { name: "mission.txt", type: "file", icon: "📝", size: "1.1 KB", modified: "Yesterday", content: "MISSION STATEMENT\n\nTransform computer science education by applying the ancient Socratic method through modern AI.\n\nWe believe:\n→ The struggle IS the learning\n→ Questions > Answers\n→ Understanding > Completion\n→ Every student deserves a patient tutor\n\nCodeGuruAI protects productive struggle." },
                    { name: "team_photo.png", type: "file", icon: "🖼️", size: "2.8 MB", modified: "Jan 15, 2026" },
                ]
            },
            {
                name: "Features", type: "folder", icon: "📁", children: [
                    { name: "socratic-ai.md", type: "file", icon: "🧠", size: "3.1 KB", modified: "Today", content: "# Socratic AI Hints\n\nThe core of CodeGuruAI.\n\nWhen a student requests help, the AI:\n1. Analyzes the submitted code\n2. Identifies the specific misconception\n3. Generates a targeted QUESTION\n4. Never reveals the answer\n\nExample:\nStudent: TLE on two_sum (O(n²) brute force)\nAI Hint: \"What data structure gives O(1) lookups? How would that change your approach?\"\n\nResult: Student discovers hash maps independently." },
                    { name: "code-editor.md", type: "file", icon: "⚡", size: "2.4 KB", modified: "Today", content: "# In-Browser Code Editor\n\nFull IDE in your browser:\n- CodeMirror 6 engine\n- Syntax highlighting\n- Auto-completion\n- Instant test execution\n\nSupported Languages:\n→ Python\n→ JavaScript\n→ C++\n→ Java\n\nNo setup required. Write, run, debug — all in one place." },
                    { name: "ai-generator.md", type: "file", icon: "🎯", size: "1.9 KB", modified: "Feb 20", content: "# AI Problem Generator\n\nInstructors set:\n- Topic (arrays, trees, DP, etc.)\n- Difficulty (easy → hard)\n- Constraints (time/space limits)\n\nAI creates:\n- Complete problem statement\n- Input/output examples\n- Comprehensive test suite\n- Model solution (hidden)\n\nEvery semester gets unique problems.\nNo recycled assignments = no cheating." },
                    { name: "analytics.md", type: "file", icon: "📊", size: "2.1 KB", modified: "Feb 18", content: "# Classroom Analytics\n\nReal-time dashboards:\n- Submission rates\n- Completion percentages\n- Time-to-solve distributions\n- Hint dependency patterns\n- Cohort comparisons\n\n\"I can see which students need help before they fall behind.\" — Prof. Kapoor, IIT Delhi" },
                    { name: "classrooms.md", type: "file", icon: "👥", size: "1.6 KB", modified: "Feb 15", content: "# Classroom Management\n\nBuilt for how university CS courses work:\n- Create courses with sections\n- Assign problem sets\n- Set deadlines\n- Enroll students via invite link\n- Track individual & cohort progress\n- Export grade data" },
                ]
            },
            {
                name: "Demo", type: "folder", icon: "📁", children: [
                    { name: "before.py", type: "file", icon: "🐍", size: "245 B", modified: "Today", content: "# Student's initial solution (O(n²))\n\ndef two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n\n# ⚠ Test case 4 — Time Limit Exceeded\n# Student requested a hint..." },
                    { name: "hint.txt", type: "file", icon: "💡", size: "128 B", modified: "Today", content: "SOCRATIC AI HINT:\n\n\"Your current approach checks every pair.\nWhat data structure would let you look\nup a value in O(1) time?\nHow would that change your approach?\"\n\n— The AI never tells. It only asks." },
                    { name: "after.py", type: "file", icon: "🐍", size: "312 B", modified: "Today", content: "# Student's optimized solution (O(n))\n# After receiving the Socratic hint\n\ndef two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            return [seen[diff], i]\n        seen[n] = i\n\n# ✓ All 5 test cases passed\n# Student understood hash maps!" },
                ]
            },
            {
                name: "Stats", type: "folder", icon: "📁", children: [
                    { name: "metrics.csv", type: "file", icon: "📈", size: "892 B", modified: "Today", content: "metric,value\nactive_students,15000+\nuniversities,250+\ncompletion_rate,94%\nrating,4.9/5.0\nproblems_solved,142000+\nsupported_languages,4\nstudent_cost,$0.00\nuptime,99.97%" },
                ]
            },
            { name: "Get Started.app", type: "app", icon: "🚀", size: "1.2 MB", modified: "Today" },
            { name: "LICENSE.md", type: "file", icon: "📄", size: "1.4 KB", modified: "Jan 1, 2026", content: "MIT License\n\n© 2026 CodeGuruAI\n\nFree for students.\nFull-featured for instructors.\n\ncodeguruai.com" },
        ]
    },
]

export default function LandingV21() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [path, setPath] = useState<string[]>(["CodeGuruAI"])
    const [selected, setSelected] = useState<FSItem | null>(null)
    const [preview, setPreview] = useState<FSItem | null>(null)

    const getCurrent = (): FSItem[] => {
        let node = FS[0]
        for (let i = 1; i < path.length; i++) {
            const child = node.children?.find(c => c.name === path[i])
            if (child?.children) node = child; else break
        }
        return node.children || []
    }

    const navigate = (item: FSItem) => {
        if (item.type === "folder") { setPath([...path, item.name]); setSelected(null); setPreview(null) }
        else if (item.name === "Get Started.app") { window.location.href = user ? dashboardHref : "/register" }
        else { setSelected(item); setPreview(item) }
    }

    const goTo = (idx: number) => { setPath(path.slice(0, idx + 1)); setSelected(null); setPreview(null) }
    const items = getCurrent()

    const sidebar = [
        { label: "AirDrop", icon: "📡" },
        { label: "Recents", icon: "🕐" },
        { label: "Applications", icon: "💻" },
        { label: "Desktop", icon: "🖥️" },
        { label: "Documents", icon: "📄" },
        { label: "Downloads", icon: "⬇️" },
    ]

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');

                .v21 {
                    --bg: #1E1E1E; --sidebar: #2B2B2D; --toolbar: #333336;
                    --border: #3D3D40; --text: #E5E5E7; --dim: #8E8E93;
                    --blue: #0A84FF; --select: #0A84FF;
                    --row-hover: rgba(255,255,255,0.04);
                    --row-sel: rgba(10,132,255,0.25);
                    font-family: 'Inter', -apple-system, system-ui, sans-serif;
                    background: var(--bg); color: var(--text);
                    width: 100vw; height: 100vh; display: flex; flex-direction: column;
                    overflow: hidden; font-size: 13px;
                }

                /* Title bar */
                .v21-titlebar {
                    height: 38px; background: var(--toolbar);
                    display: flex; align-items: center; padding: 0 12px;
                    border-bottom: 1px solid var(--border);
                    -webkit-app-region: drag; flex-shrink: 0;
                }
                .v21-dots { display: flex; gap: 6px; }
                .v21-dot { width: 12px; height: 12px; border-radius: 50%; }
                .v21-dot.r { background: #FF5F57; } .v21-dot.y { background: #FBBD2E; } .v21-dot.g { background: #28C840; }
                .v21-tb-title { flex: 1; text-align: center; font-size: 13px; font-weight: 600; color: var(--text); }
                .v21-tb-right { width: 54px; }

                /* Toolbar */
                .v21-toolbar {
                    height: 38px; background: var(--toolbar);
                    display: flex; align-items: center; padding: 0 12px; gap: 8px;
                    border-bottom: 1px solid var(--border); flex-shrink: 0;
                }
                .v21-tb-btn {
                    padding: 4px 8px; background: rgba(255,255,255,0.06);
                    border: 1px solid var(--border); border-radius: 5px;
                    color: var(--dim); font-size: 12px; cursor: pointer;
                    transition: all 0.1s;
                }
                .v21-tb-btn:hover { background: rgba(255,255,255,0.1); color: var(--text); }
                .v21-breadcrumbs { display: flex; align-items: center; gap: 2px; flex: 1; overflow: hidden; }
                .v21-bc { cursor: pointer; color: var(--dim); font-size: 12px; white-space: nowrap; transition: color 0.1s; }
                .v21-bc:hover { color: var(--text); }
                .v21-bc.active { color: var(--text); font-weight: 500; }
                .v21-bc-sep { color: var(--dim); font-size: 10px; margin: 0 2px; }
                .v21-search {
                    width: 180px; background: rgba(255,255,255,0.06); border: 1px solid var(--border);
                    border-radius: 5px; padding: 4px 8px; color: var(--dim); font-size: 12px;
                    outline: none; font-family: inherit;
                }

                /* Body */
                .v21-body { display: flex; flex: 1; overflow: hidden; }

                /* Sidebar */
                .v21-sidebar {
                    width: 180px; background: var(--sidebar); border-right: 1px solid var(--border);
                    padding: 10px 0; flex-shrink: 0; overflow-y: auto;
                }
                .v21-sb-label { font-size: 11px; font-weight: 600; color: var(--dim); padding: 8px 16px 4px; text-transform: uppercase; letter-spacing: 0.05em; }
                .v21-sb-item {
                    display: flex; align-items: center; gap: 8px; padding: 4px 16px;
                    cursor: pointer; font-size: 13px; color: var(--text);
                    transition: background 0.1s; border-radius: 0;
                }
                .v21-sb-item:hover { background: var(--row-hover); }
                .v21-sb-item.active { background: var(--row-sel); }
                .v21-sb-icon { font-size: 14px; }

                /* File list */
                .v21-files { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
                .v21-files-header {
                    display: grid; grid-template-columns: 1fr 100px 140px;
                    padding: 6px 16px; font-size: 11px; font-weight: 600;
                    color: var(--dim); border-bottom: 1px solid var(--border);
                    text-transform: uppercase; letter-spacing: 0.03em; flex-shrink: 0;
                }
                .v21-row {
                    display: grid; grid-template-columns: 1fr 100px 140px;
                    padding: 5px 16px; align-items: center; cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                    transition: background 0.08s;
                }
                .v21-row:hover { background: var(--row-hover); }
                .v21-row.sel { background: var(--row-sel); }
                .v21-row-name { display: flex; align-items: center; gap: 8px; font-size: 13px; }
                .v21-row-icon { font-size: 16px; }
                .v21-row-size { font-size: 12px; color: var(--dim); }
                .v21-row-date { font-size: 12px; color: var(--dim); }

                /* Preview panel */
                .v21-preview {
                    width: 320px; border-left: 1px solid var(--border);
                    background: var(--sidebar); overflow-y: auto; flex-shrink: 0;
                    padding: 20px 16px;
                }
                .v21-prev-icon { text-align: center; font-size: 48px; margin-bottom: 12px; }
                .v21-prev-name { text-align: center; font-size: 14px; font-weight: 600; margin-bottom: 4px; }
                .v21-prev-meta { text-align: center; font-size: 11px; color: var(--dim); margin-bottom: 16px; }
                .v21-prev-content {
                    font-family: 'DM Mono', 'SF Mono', monospace; font-size: 11px;
                    line-height: 1.7; white-space: pre-wrap; color: #b0b0b4;
                    background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px;
                    max-height: 400px; overflow-y: auto;
                }

                /* Status bar */
                .v21-statusbar {
                    height: 24px; background: var(--toolbar);
                    border-top: 1px solid var(--border);
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 16px; font-size: 11px; color: var(--dim); flex-shrink: 0;
                }

                /* Nav links in toolbar */
                .v21-nav-link {
                    padding: 4px 12px; font-size: 11px; text-decoration: none;
                    border-radius: 5px; transition: all 0.1s; font-weight: 500;
                }
                .v21-nav-link.signin { color: var(--blue); }
                .v21-nav-link.signup { background: var(--blue); color: white; }
                .v21-nav-link:hover { opacity: 0.85; }
            `}</style>

            <div className="v21">
                {/* Title bar */}
                <div className="v21-titlebar">
                    <div className="v21-dots"><div className="v21-dot r" /><div className="v21-dot y" /><div className="v21-dot g" /></div>
                    <div className="v21-tb-title">Finder — CodeGuruAI</div>
                    <div className="v21-tb-right" />
                </div>

                {/* Toolbar */}
                <div className="v21-toolbar">
                    <button className="v21-tb-btn" onClick={() => path.length > 1 && goTo(path.length - 2)}>←</button>
                    <button className="v21-tb-btn" onClick={() => goTo(0)}>⌂</button>
                    <div className="v21-breadcrumbs">
                        {path.map((p, i) => (
                            <span key={i} style={{ display: "flex", alignItems: "center" }}>
                                {i > 0 && <span className="v21-bc-sep">›</span>}
                                <span className={`v21-bc ${i === path.length - 1 ? "active" : ""}`} onClick={() => goTo(i)}>{p}</span>
                            </span>
                        ))}
                    </div>
                    <input className="v21-search" placeholder="🔍 Search" readOnly />
                    {user ? (
                        <Link href={dashboardHref} className="v21-nav-link signup">Dashboard</Link>
                    ) : (
                        <>
                            <Link href="/login" className="v21-nav-link signin">Sign In</Link>
                            <Link href="/register" className="v21-nav-link signup">Get Started</Link>
                        </>
                    )}
                </div>

                {/* Body */}
                <div className="v21-body">
                    {/* Sidebar */}
                    <div className="v21-sidebar">
                        <div className="v21-sb-label">Favorites</div>
                        {sidebar.map(s => (
                            <div key={s.label} className="v21-sb-item"><span className="v21-sb-icon">{s.icon}</span>{s.label}</div>
                        ))}
                        <div className="v21-sb-label" style={{ marginTop: "12px" }}>CodeGuruAI</div>
                        <div className="v21-sb-item active" onClick={() => goTo(0)}><span className="v21-sb-icon">📁</span>CodeGuruAI</div>
                        {FS[0].children?.filter(c => c.type === "folder").map(c => (
                            <div key={c.name} className="v21-sb-item" onClick={() => { setPath(["CodeGuruAI", c.name]); setSelected(null); setPreview(null) }}>
                                <span className="v21-sb-icon">{c.icon}</span>{c.name}
                            </div>
                        ))}
                    </div>

                    {/* File list */}
                    <div className="v21-files">
                        <div className="v21-files-header"><span>Name</span><span>Size</span><span>Date Modified</span></div>
                        {items.map(item => (
                            <div key={item.name} className={`v21-row ${selected?.name === item.name ? "sel" : ""}`}
                                onClick={() => { setSelected(item); if (item.content) setPreview(item); else setPreview(null) }}
                                onDoubleClick={() => navigate(item)}>
                                <div className="v21-row-name"><span className="v21-row-icon">{item.icon}</span>{item.name}</div>
                                <div className="v21-row-size">{item.size || "—"}</div>
                                <div className="v21-row-date">{item.modified || "—"}</div>
                            </div>
                        ))}
                    </div>

                    {/* Preview */}
                    {preview && (
                        <div className="v21-preview">
                            <div className="v21-prev-icon">{preview.icon}</div>
                            <div className="v21-prev-name">{preview.name}</div>
                            <div className="v21-prev-meta">{preview.size} · {preview.modified}</div>
                            {preview.content && <div className="v21-prev-content">{preview.content}</div>}
                        </div>
                    )}
                </div>

                {/* Status bar */}
                <div className="v21-statusbar">
                    <span>{items.length} item{items.length !== 1 ? "s" : ""}{path.length > 1 ? ` in ${path[path.length - 1]}` : ""}</span>
                    <span>codeguruai.com · Free for students</span>
                </div>
            </div>
        </>
    )
}
