"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState } from "react"

/* ================================================================
   V30 — Interactive Bookshelf / Library
   The page looks like a wooden bookshelf. Each book spine
   is a section. Click to "pull out" and read contents.
   Library aesthetic, warm wood, leather, reading lamp glow.
   Font: Libre Baskerville + Spectral
   ================================================================ */

const BOOKS = [
    { id: "about", title: "About\nCodeGuruAI", color: "#8B2252", spine: "#6B1A42", width: 52,
      content: { heading: "About CodeGuruAI", body: "CodeGuruAI is an AI-powered coding tutor designed for university computer science classrooms.\n\nInstead of giving students the answer, our Socratic AI identifies the specific misconception in their code and asks a targeted question — guiding them to discover the solution themselves.\n\nThe productive struggle is where real learning happens. Our AI protects that struggle.\n\n\"I cannot teach anybody anything.\nI can only make them think.\"\n— Socrates" }},
    { id: "socratic", title: "Socratic\nHints", color: "#2E4057", spine: "#1E3047", width: 48,
      content: { heading: "🧠 Socratic AI Hints", body: "The heart of CodeGuruAI.\n\nWhen a student asks for help:\n\n1. AI analyzes their submitted code\n2. Identifies the specific misconception\n3. Generates a targeted question\n4. Never reveals the answer\n\nExample Session:\nStudent → two_sum → O(n²) → TLE\nAI → \"What data structure gives O(1) lookups?\"\nStudent → Hash map! → O(n) → ✓ Passed\n\nThe student built genuine understanding." }},
    { id: "editor", title: "Code\nEditor", color: "#1B4332", spine: "#0B3322", width: 42,
      content: { heading: "⚡ In-Browser Code Editor", body: "Write, run, and debug code directly in your browser.\n\nPowered by CodeMirror 6:\n• Syntax highlighting\n• Auto-completion\n• Instant test execution\n• Error highlighting\n\nSupported Languages:\n→ Python\n→ JavaScript\n→ C++\n→ Java\n\nZero setup. No installation. Start coding immediately." }},
    { id: "generator", title: "AI\nGenerator", color: "#4A1942", spine: "#3A0932", width: 55,
      content: { heading: "🎯 AI Problem Generator", body: "Instructors configure:\n• Topic (arrays, trees, DP, graphs...)\n• Difficulty (easy → hard)\n• Constraints (time/space limits)\n\nAI creates:\n• Complete problem statement\n• Input/output examples\n• Comprehensive test suite\n• Model solution (hidden)\n\nEvery semester gets unique problems. No recycled assignments. No answer pools. Academic integrity by design." }},
    { id: "analytics", title: "Class\nAnalytics", color: "#6B3A2A", spine: "#5B2A1A", width: 46,
      content: { heading: "📊 Classroom Analytics", body: "Real-time insight into your classroom:\n\n• Submission rates & patterns\n• Completion percentages\n• Time-to-solve distributions\n• Hint dependency tracking\n• Cohort comparisons\n• Progress over time\n\n\"I can see exactly which concepts trip students up, and intervene before anyone falls behind.\"\n— Prof. Kapoor, IIT Delhi" }},
    { id: "classroom", title: "Classrooms", color: "#1A365D", spine: "#0A264D", width: 50,
      content: { heading: "🏛️ Classroom Management", body: "Built for university CS courses:\n\n• Create courses with sections\n• Assign problem sets\n• Set deadlines with extensions\n• Enroll via invite link\n• Track individual progress\n• Export grade data\n• Manage TAs and co-instructors\n\nEverything you need to run a CS course, without the administrative overhead." }},
    { id: "stats", title: "By the\nNumbers", color: "#744210", spine: "#643210", width: 44,
      content: { heading: "📈 CodeGuruAI by the Numbers", body: "Students:        15,000+\nUniversities:    250+\nCompletion Rate: 94%\nRating:          4.9 / 5.0\nProblems Solved: 142,000+\nLanguages:       4\nStudent Cost:    $0.00\nUptime:          99.97%\n\nFree for every student.\nFull-featured for every instructor." }},
]

export default function LandingV30() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [openBook, setOpenBook] = useState<string | null>(null)
    const [pulledBook, setPulledBook] = useState<string | null>(null)

    const openBookContent = (id: string) => {
        if (pulledBook === id) { setOpenBook(id) }
        else { setPulledBook(id); setTimeout(() => setOpenBook(id), 400) }
    }

    const closeBook = () => { setOpenBook(null); setTimeout(() => setPulledBook(null), 100) }

    const book = BOOKS.find(b => b.id === openBook)

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&display=swap');

                .v30 {
                    --wall: #3E2723; --wall2: #4E342E;
                    --wood: #5D4037; --wood-light: #795548;
                    --shelf: #6D4C41; --shelf-edge: #4E342E;
                    --paper: #FDF6E3; --ink: #2C2418;
                    --gold: #C9A84C; --lamp: #FFF3C4;
                    font-family: 'Libre Baskerville', serif;
                    min-height: 100vh;
                    background: var(--wall);
                    background-image:
                        repeating-linear-gradient(90deg,
                            rgba(0,0,0,0.03) 0px, transparent 1px, transparent 30px),
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.5' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                    color: var(--paper);
                }

                /* Lamp glow */
                .v30::before {
                    content: ''; position: fixed; top: 0; left: 50%;
                    transform: translateX(-50%); width: 600px; height: 400px;
                    background: radial-gradient(ellipse, rgba(255,243,196,0.08) 0%, transparent 70%);
                    pointer-events: none; z-index: 0;
                }

                /* Nav */
                .v30-nav {
                    position: relative; z-index: 20;
                    display: flex; justify-content: space-between;
                    align-items: center; padding: 1.25rem 2.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .v30-brand {
                    font-size: 1.1rem; font-weight: 700; color: var(--gold);
                    letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem;
                }
                .v30-nav-links { display: flex; gap: 0.5rem; }
                .v30-nav-link {
                    font-size: 0.8rem; padding: 0.4rem 1.25rem;
                    text-decoration: none; color: var(--paper);
                    border: 1px solid rgba(255,255,255,0.15);
                    transition: all 0.2s; letter-spacing: 0.05em;
                }
                .v30-nav-link:hover { border-color: var(--gold); color: var(--gold); }
                .v30-nav-link.gold { border-color: var(--gold); color: var(--gold); }

                /* Title */
                .v30-header {
                    text-align: center; padding: 2rem 2rem 1rem;
                    position: relative; z-index: 10;
                }
                .v30-h1 { font-size: 2.5rem; font-weight: 700; color: var(--gold); margin-bottom: 0.3rem; }
                .v30-sub { font-family: 'Spectral', serif; font-size: 1rem; color: rgba(253,246,227,0.5); font-style: italic; }

                /* Bookshelf */
                .v30-shelf-container { max-width: 900px; margin: 2rem auto; padding: 0 2rem; position: relative; z-index: 10; }
                .v30-shelf {
                    display: flex; align-items: flex-end;
                    padding: 1.5rem 1.5rem 0;
                    background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 30%);
                    min-height: 250px; justify-content: center; gap: 6px;
                    position: relative;
                }
                .v30-shelf-board {
                    position: absolute; bottom: 0; left: -10px; right: -10px;
                    height: 20px; background: var(--shelf);
                    border-radius: 0 0 4px 4px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                }
                .v30-shelf-board::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0;
                    height: 4px; background: linear-gradient(180deg, var(--wood-light), var(--shelf));
                }

                /* Book spine */
                .v30-book {
                    height: 200px; cursor: pointer; display: flex;
                    align-items: center; justify-content: center;
                    writing-mode: vertical-rl; text-orientation: mixed;
                    font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.85);
                    letter-spacing: 0.08em; text-transform: uppercase;
                    border-radius: 2px 4px 4px 2px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative; white-space: pre-line;
                    text-align: center; line-height: 1.4;
                    box-shadow: inset -2px 0 4px rgba(0,0,0,0.2), 2px 0 4px rgba(0,0,0,0.15);
                }
                .v30-book:hover { transform: translateY(-12px); box-shadow: inset -2px 0 4px rgba(0,0,0,0.2), 2px 4px 12px rgba(0,0,0,0.3); }
                .v30-book.pulled { transform: translateY(-20px) rotateZ(-2deg); }

                /* Gold edge detail */
                .v30-book::before {
                    content: ''; position: absolute; top: 4px; bottom: 4px;
                    right: -1px; width: 2px;
                    background: linear-gradient(180deg, transparent, rgba(201,168,76,0.3), transparent);
                }

                /* Book overlay (opened) */
                .v30-overlay {
                    position: fixed; inset: 0; z-index: 100;
                    background: rgba(0,0,0,0.75); display: flex;
                    align-items: center; justify-content: center;
                    padding: 2rem; backdrop-filter: blur(4px);
                    animation: v30fadeIn 0.3s ease;
                }
                @keyframes v30fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .v30-book-open {
                    background: var(--paper); color: var(--ink);
                    max-width: 550px; width: 100%; max-height: 80vh;
                    overflow-y: auto; padding: 3rem;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    position: relative;
                    animation: v30openBook 0.4s cubic-bezier(0.16,1,0.3,1);
                }
                @keyframes v30openBook { from { transform: scale(0.9) rotateY(-10deg); opacity: 0; } to { transform: scale(1) rotateY(0); opacity: 1; } }
                .v30-book-close {
                    position: absolute; top: 1rem; right: 1rem; font-size: 1.5rem;
                    cursor: pointer; color: var(--ink); opacity: 0.4;
                    transition: opacity 0.2s; background: none; border: none;
                    font-family: inherit;
                }
                .v30-book-close:hover { opacity: 1; }
                .v30-book-heading {
                    font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;
                    color: var(--ink); border-bottom: 2px solid var(--gold);
                    padding-bottom: 0.75rem;
                }
                .v30-book-body {
                    font-family: 'Spectral', serif; font-size: 0.95rem;
                    line-height: 1.85; white-space: pre-wrap;
                    color: #3D3425;
                }
                .v30-book-page {
                    position: absolute; bottom: 1rem; right: 1.5rem;
                    font-size: 0.7rem; color: rgba(0,0,0,0.2);
                    font-style: italic;
                }

                /* Instruction */
                .v30-instruction {
                    text-align: center; padding: 1.5rem;
                    font-family: 'Spectral', serif; font-style: italic;
                    color: rgba(253,246,227,0.4); font-size: 0.85rem;
                    position: relative; z-index: 10;
                }

                /* Second shelf — CTA */
                .v30-cta-shelf {
                    max-width: 900px; margin: 1rem auto 0; padding: 0 2rem;
                    position: relative; z-index: 10;
                }
                .v30-cta-area {
                    background: rgba(0,0,0,0.15);
                    padding: 2rem; text-align: center;
                    border: 1px solid rgba(255,255,255,0.05);
                    position: relative;
                }
                .v30-cta-h { font-size: 1.5rem; color: var(--gold); margin-bottom: 0.5rem; }
                .v30-cta-p { font-family: 'Spectral', serif; color: rgba(253,246,227,0.5); font-style: italic; margin-bottom: 1.5rem; font-size: 0.9rem; }
                .v30-cta-btn {
                    font-family: 'Libre Baskerville', serif; font-size: 0.85rem;
                    padding: 0.75rem 2.5rem; border: 2px solid var(--gold);
                    color: var(--gold); text-decoration: none;
                    display: inline-block; transition: all 0.3s;
                    letter-spacing: 0.1em;
                }
                .v30-cta-btn:hover { background: var(--gold); color: var(--wall); }

                .v30-footer {
                    text-align: center; padding: 1.5rem; font-size: 0.7rem;
                    color: rgba(253,246,227,0.2); position: relative; z-index: 10;
                }
            `}</style>

            <div className="v30">
                <nav className="v30-nav">
                    <div className="v30-brand">📚 CodeGuruAI Library</div>
                    <div className="v30-nav-links">
                        {user ? (
                            <Link href={dashboardHref} className="v30-nav-link gold">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v30-nav-link">Enter</Link>
                                <Link href="/register" className="v30-nav-link gold">Join Free</Link>
                            </>
                        )}
                    </div>
                </nav>

                <div className="v30-header">
                    <h1 className="v30-h1">The CodeGuruAI Library</h1>
                    <p className="v30-sub">Pull a book from the shelf to learn more</p>
                </div>

                <div className="v30-shelf-container">
                    <div className="v30-shelf">
                        {BOOKS.map(b => (
                            <div key={b.id}
                                className={`v30-book ${pulledBook === b.id ? "pulled" : ""}`}
                                style={{ width: `${b.width}px`, background: `linear-gradient(90deg, ${b.spine}, ${b.color}, ${b.color}, ${b.spine})` }}
                                onClick={() => openBookContent(b.id)}>
                                {b.title}
                            </div>
                        ))}
                        <div className="v30-shelf-board" />
                    </div>
                </div>

                <div className="v30-instruction">Click any book spine to read its contents ↑</div>

                <div className="v30-cta-shelf">
                    <div className="v30-cta-area">
                        <h2 className="v30-cta-h">Begin Your Chapter</h2>
                        <p className="v30-cta-p">Free for every student. Full bookshelves for instructors.</p>
                        <Link href="/register" className="v30-cta-btn">Open Your Account →</Link>
                    </div>
                    <div style={{ height: "20px", background: "var(--shelf)", marginLeft: "-10px", marginRight: "-10px", borderRadius: "0 0 4px 4px", boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}>
                        <div style={{ height: "4px", background: "linear-gradient(180deg, var(--wood-light), var(--shelf))" }} />
                    </div>
                </div>

                <div className="v30-footer">© 2026 CodeGuruAI · The Library of Socratic Wisdom</div>

                {/* Book overlay */}
                {openBook && book && (
                    <div className="v30-overlay" onClick={closeBook}>
                        <div className="v30-book-open" onClick={e => e.stopPropagation()}>
                            <button className="v30-book-close" onClick={closeBook}>×</button>
                            <h2 className="v30-book-heading">{book.content.heading}</h2>
                            <div className="v30-book-body">{book.content.body}</div>
                            <div className="v30-book-page">codeguruai.com</div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
