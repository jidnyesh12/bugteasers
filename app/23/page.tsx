"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState } from "react"

/* ================================================================
   V23 — VS Code IDE
   The entire page IS a code editor. File tree sidebar, tabs,
   code content that IS marketing copy (written as code/comments),
   terminal panel, activity bar, minimap, status bar.
   Font: JetBrains Mono
   ================================================================ */

const FILES: Record<string, { lang: string; content: string }> = {
    "README.md": { lang: "markdown", content: `# 🧠 CodeGuruAI

> AI-Powered Socratic Coding Tutor for University CS

## What is this?

CodeGuruAI is an AI tutor that **never gives the answer**.
Instead, it asks the precise question that leads you to
understand the solution yourself.

## Why?

Because the struggle IS the learning. Students who
figure it out themselves **actually understand** the code.

## Quick Start

\`\`\`bash
# Students: free forever
open https://codeguruai.com/register

# Instructors: full-featured
open https://codeguruai.com/register?role=instructor
\`\`\`

## Stats

| Metric       | Value    |
|-------------|----------|
| Students    | 15,000+  |
| Universities| 250+     |
| Completion  | 94%      |
| Rating      | 4.9/5    |` },

    "socratic_engine.py": { lang: "python", content: `"""
CodeGuruAI — Socratic AI Engine
================================
The core hint generation system.
"""

class SocraticEngine:
    """
    When a student requests help, this engine:
    1. Analyzes the submitted code
    2. Identifies the specific misconception
    3. Generates a targeted QUESTION
    4. Never reveals the answer
    """

    def generate_hint(self, student_code: str,
                      test_results: list[TestResult],
                      problem: Problem) -> str:
        # Identify the gap in understanding
        misconception = self.analyze(student_code, test_results)

        # Generate a Socratic question
        # that exposes the gap without
        # revealing the solution
        hint = self.ask_question(
            misconception=misconception,
            context=problem,
            style="socratic"
        )

        # NEVER return the answer
        assert not self.reveals_answer(hint)
        return hint

    def analyze(self, code, results):
        """Find what the student misunderstands."""
        # Example: O(n²) when O(n) is possible
        # → misconception: data structure choice
        ...

    def ask_question(self, **kwargs):
        """
        Example output:
        "What data structure gives O(1) lookups?
         How would that change your approach?"
        """
        ...` },

    "demo.py": { lang: "python", content: `# demo.py — A Socratic Session
# =============================
# Watch how CodeGuruAI guides a student

# STEP 1: Student's initial attempt (O(n²))
def two_sum_v1(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]

# ⚠ Result: Time Limit Exceeded on test 4

# STEP 2: Student asks for a hint...

# 🧠 AI HINT:
# "Your approach checks every pair.
#  What data structure would let you
#  look up a value in O(1) time?
#  How would that change your approach?"

# STEP 3: Student's improved solution (O(n))
def two_sum_v2(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i

# ✅ All 5 test cases passed!
# Student discovered hash maps independently.` },

    "features.ts": { lang: "typescript", content: `// features.ts — Platform Capabilities
// ====================================

interface Feature {
  name: string;
  description: string;
  status: "active" | "beta";
}

const FEATURES: Feature[] = [
  {
    name: "Socratic AI Hints",
    description: \`
      AI identifies misconceptions and asks
      targeted questions. Never reveals answers.
      Builds genuine understanding.
    \`,
    status: "active",
  },
  {
    name: "In-Browser Code Editor",
    description: \`
      CodeMirror 6 powered. Syntax highlighting,
      auto-complete. Python, JS, C++, Java.
      Zero setup required.
    \`,
    status: "active",
  },
  {
    name: "AI Problem Generator",
    description: \`
      Set topic + difficulty + constraints.
      AI creates complete unique problems with
      test suites. New every semester.
    \`,
    status: "active",
  },
  {
    name: "Classroom Analytics",
    description: \`
      Real-time dashboards: submissions,
      completion rates, time-to-solve,
      hint dependency patterns.
    \`,
    status: "active",
  },
  {
    name: "Classroom Management",
    description: \`
      Create courses, assign problem sets,
      set deadlines, manage enrollment,
      export grade data.
    \`,
    status: "active",
  },
];

export default FEATURES;` },

    "package.json": { lang: "json", content: `{
  "name": "codeguruai",
  "version": "2.0.26",
  "description": "AI-Powered Socratic Coding Tutor",
  "homepage": "https://codeguruai.com",
  "license": "MIT",
  "author": "CodeGuruAI Team",
  "keywords": [
    "education",
    "AI",
    "socratic-method",
    "coding-tutor",
    "university",
    "CS-education"
  ],
  "stats": {
    "students": "15,000+",
    "universities": "250+",
    "completion_rate": "94%",
    "languages": ["Python", "JavaScript", "C++", "Java"],
    "cost_for_students": "$0.00"
  }
}` },
}

type FileNode = {
    name: string;
    type: "file" | "folder";
    icon?: string;
    open?: boolean;
    children?: FileNode[];
};

const FILE_TREE: FileNode[] = [
    { name: "CodeGuruAI", type: "folder", open: true, children: [
        { name: "src", type: "folder", open: true, children: [
            { name: "socratic_engine.py", type: "file", icon: "🐍" },
            { name: "features.ts", type: "file", icon: "📘" },
        ]},
        { name: "examples", type: "folder", open: true, children: [
            { name: "demo.py", type: "file", icon: "🐍" },
        ]},
        { name: "README.md", type: "file", icon: "📄" },
        { name: "package.json", type: "file", icon: "📦" },
    ]},
]

export default function LandingV23() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [activeFile, setActiveFile] = useState("README.md")
    const [openTabs, setOpenTabs] = useState(["README.md", "socratic_engine.py", "demo.py"])

    const openFile = (name: string) => {
        if (!openTabs.includes(name)) setOpenTabs([...openTabs, name])
        setActiveFile(name)
    }

    const closeTab = (name: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newTabs = openTabs.filter(t => t !== name)
        setOpenTabs(newTabs)
        if (activeFile === name) setActiveFile(newTabs[newTabs.length - 1] || "README.md")
    }

    const file = FILES[activeFile]
    const lines = file?.content.split("\n") || []

    const renderTree = (items: FileNode[], depth = 0): React.ReactNode => items.map(item => (
        <div key={item.name}>
            <div className={`v23-tree-item ${item.type === "file" && activeFile === item.name ? "active" : ""}`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => item.type === "file" && openFile(item.name)}>
                <span className="v23-tree-icon">{item.type === "folder" ? (item.open ? "▾" : "▸") : (item as {icon?: string}).icon || "📄"}</span>
                <span>{item.name}</span>
            </div>
            {item.type === "folder" && item.open && item.children && renderTree(item.children, depth + 1)}
        </div>
    ))

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

                .v23 {
                    --bg: #1E1E1E; --sidebar: #252526; --actbar: #333333;
                    --editor: #1E1E1E; --tab-active: #1E1E1E; --tab-inactive: #2D2D2D;
                    --border: #3C3C3C; --text: #D4D4D4; --dim: #858585;
                    --blue: #569CD6; --green: #6A9955; --orange: #CE9178;
                    --yellow: #DCDCAA; --purple: #C586C0; --cyan: #4EC9B0;
                    --linenum: #858585; --highlight: #264F78;
                    --statusbar: #007ACC;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    background: var(--bg); color: var(--text);
                    width: 100vw; height: 100vh; display: flex;
                    overflow: hidden; font-size: 13px;
                }

                /* Activity bar */
                .v23-actbar {
                    width: 48px; background: var(--actbar); display: flex;
                    flex-direction: column; align-items: center; padding: 8px 0;
                    gap: 16px; border-right: 1px solid var(--border); flex-shrink: 0;
                }
                .v23-act-icon { font-size: 22px; opacity: 0.5; cursor: pointer; transition: opacity 0.15s; padding: 4px; }
                .v23-act-icon:hover, .v23-act-icon.active { opacity: 1; }
                .v23-act-icon.active { border-left: 2px solid white; }

                /* Sidebar */
                .v23-sidebar {
                    width: 240px; background: var(--sidebar);
                    border-right: 1px solid var(--border); flex-shrink: 0;
                    display: flex; flex-direction: column;
                }
                .v23-sb-header {
                    padding: 8px 16px; font-size: 11px; font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.1em;
                    color: var(--dim); border-bottom: 1px solid var(--border);
                }
                .v23-tree { flex: 1; overflow-y: auto; padding: 4px 0; }
                .v23-tree-item {
                    display: flex; align-items: center; gap: 6px;
                    padding: 3px 12px; cursor: pointer; font-size: 13px;
                    color: var(--text); transition: background 0.08s;
                }
                .v23-tree-item:hover { background: rgba(255,255,255,0.04); }
                .v23-tree-item.active { background: rgba(255,255,255,0.08); }
                .v23-tree-icon { font-size: 12px; width: 16px; text-align: center; }

                /* Editor area */
                .v23-editor-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

                /* Tabs */
                .v23-tabs {
                    display: flex; background: var(--tab-inactive);
                    border-bottom: 1px solid var(--border); flex-shrink: 0;
                    overflow-x: auto;
                }
                .v23-tab {
                    display: flex; align-items: center; gap: 6px;
                    padding: 6px 16px; font-size: 12px; cursor: pointer;
                    border-right: 1px solid var(--border); color: var(--dim);
                    background: var(--tab-inactive); transition: all 0.1s;
                    white-space: nowrap;
                }
                .v23-tab.active { background: var(--tab-active); color: var(--text); border-bottom: 1px solid var(--tab-active); margin-bottom: -1px; }
                .v23-tab-close { font-size: 14px; opacity: 0; transition: opacity 0.1s; margin-left: 4px; }
                .v23-tab:hover .v23-tab-close { opacity: 0.6; }
                .v23-tab-close:hover { opacity: 1 !important; }

                /* Code area */
                .v23-code { flex: 1; overflow-y: auto; padding: 0; font-size: 13px; line-height: 20px; }
                .v23-code-line { display: flex; min-height: 20px; }
                .v23-code-line:hover { background: rgba(255,255,255,0.02); }
                .v23-code-line.hl { background: rgba(38,79,120,0.3); }
                .v23-linenum { width: 50px; text-align: right; padding-right: 16px; color: var(--linenum); user-select: none; flex-shrink: 0; }
                .v23-code-text { flex: 1; white-space: pre-wrap; word-break: break-all; padding-right: 16px; }

                /* Minimap */
                .v23-minimap {
                    width: 60px; background: rgba(30,30,30,0.8); border-left: 1px solid var(--border);
                    overflow: hidden; flex-shrink: 0; position: relative;
                }
                .v23-minimap-line { height: 3px; margin: 1px 4px; border-radius: 1px; opacity: 0.3; }

                /* Terminal */
                .v23-terminal {
                    height: 140px; background: #1A1A1A; border-top: 1px solid var(--border);
                    flex-shrink: 0; display: flex; flex-direction: column;
                }
                .v23-term-header {
                    display: flex; align-items: center; padding: 4px 12px;
                    background: var(--sidebar); border-bottom: 1px solid var(--border);
                    font-size: 11px; color: var(--dim); gap: 16px;
                }
                .v23-term-tab { color: var(--text); font-weight: 500; }
                .v23-term-body { flex: 1; padding: 8px 12px; overflow-y: auto; font-size: 12px; line-height: 1.6; color: var(--green); }

                /* Status bar */
                .v23-statusbar {
                    height: 22px; background: var(--statusbar); display: flex;
                    align-items: center; justify-content: space-between;
                    padding: 0 12px; font-size: 11px; color: white; flex-shrink: 0;
                }
                .v23-sb-left, .v23-sb-right { display: flex; align-items: center; gap: 12px; }
                .v23-sb-item { opacity: 0.85; }
                .v23-sb-link { color: white; text-decoration: none; opacity: 0.85; transition: opacity 0.15s; }
                .v23-sb-link:hover { opacity: 1; }
            `}</style>

            <div className="v23">
                {/* Activity bar */}
                <div className="v23-actbar">
                    <div className="v23-act-icon active" title="Explorer">📁</div>
                    <div className="v23-act-icon" title="Search">🔍</div>
                    <div className="v23-act-icon" title="Source Control">🔀</div>
                    <div className="v23-act-icon" title="Run & Debug">▶️</div>
                    <div className="v23-act-icon" title="Extensions">🧩</div>
                    <div style={{ flex: 1 }} />
                    <div className="v23-act-icon" title="Settings">⚙️</div>
                </div>

                {/* Sidebar */}
                <div className="v23-sidebar">
                    <div className="v23-sb-header">Explorer</div>
                    <div className="v23-tree">{renderTree(FILE_TREE)}</div>
                </div>

                {/* Editor */}
                <div className="v23-editor-area">
                    <div className="v23-tabs">
                        {openTabs.map(t => (
                            <div key={t} className={`v23-tab ${activeFile === t ? "active" : ""}`} onClick={() => setActiveFile(t)}>
                                <span>{t}</span>
                                <span className="v23-tab-close" onClick={(e) => closeTab(t, e)}>×</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                        <div className="v23-code">
                            {lines.map((line, i) => (
                                <div key={i} className="v23-code-line">
                                    <span className="v23-linenum">{i + 1}</span>
                                    <span className="v23-code-text">{line}</span>
                                </div>
                            ))}
                        </div>
                        <div className="v23-minimap">
                            {lines.map((line, i) => (
                                <div key={i} className="v23-minimap-line" style={{
                                    width: `${Math.min(line.length * 0.5, 50)}px`,
                                    background: line.trim().startsWith("#") || line.trim().startsWith("//") ? "var(--green)" : line.trim().startsWith("def ") || line.trim().startsWith("class ") ? "var(--blue)" : "var(--text)"
                                }} />
                            ))}
                        </div>
                    </div>

                    {/* Terminal */}
                    <div className="v23-terminal">
                        <div className="v23-term-header">
                            <span className="v23-term-tab">TERMINAL</span>
                            <span>PROBLEMS</span><span>OUTPUT</span>
                        </div>
                        <div className="v23-term-body">
                            <div style={{ color: "var(--dim)" }}>codeguruai@dev:~/CodeGuruAI$</div>
                            <div>python demo.py</div>
                            <div style={{ color: "#CE9178" }}>Running Socratic demo...</div>
                            <div>🧠 Hint: &quot;What data structure gives O(1) lookups?&quot;</div>
                            <div style={{ color: "#6A9955" }}>✅ All 5 test cases passed!</div>
                            <div style={{ color: "var(--dim)" }}>codeguruai@dev:~/CodeGuruAI$ <span style={{ opacity: 0.5 }}>█</span></div>
                        </div>
                    </div>

                    {/* Status bar */}
                    <div className="v23-statusbar">
                        <div className="v23-sb-left">
                            <span className="v23-sb-item">🔀 main</span>
                            <span className="v23-sb-item">0 ⚠ 0 ✕</span>
                        </div>
                        <div className="v23-sb-right">
                            {user ? (
                                <Link href={dashboardHref} className="v23-sb-link">🚀 Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/register" className="v23-sb-link">🚀 Get Started Free</Link>
                                    <Link href="/login" className="v23-sb-link">Sign In</Link>
                                </>
                            )}
                            <span className="v23-sb-item">UTF-8</span>
                            <span className="v23-sb-item">{file?.lang || "text"}</span>
                            <span className="v23-sb-item">Ln {lines.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
