"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V13 — The Daily CodeGuru — Newspaper Broadsheet
   The entire page is a newspaper. Multi-column text, masthead,
   datelines, pull quotes, classifieds, weather box, editorial
   columns. Old-timey serif everywhere. Like opening a broadsheet.
   ================================================================ */

export default function LandingV13() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=UnifrakturMaguntia&family=IM+Fell+English:ital@0;1&display=swap');

                .v13 {
                    --paper: #F5F0E8;
                    --ink: #1A1A18;
                    --ink2: #333330;
                    --rule: #1A1A18;
                    --faded: #8A857A;
                    max-width: 1100px; margin: 0 auto; padding: 1.5rem 2rem 4rem;
                    background: var(--paper); color: var(--ink);
                    font-family: 'Libre Baskerville', 'Georgia', serif;
                    min-height: 100vh;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
                }

                /* Masthead */
                .v13-flag { text-align: center; border-bottom: 4px double var(--rule); padding-bottom: 0.5rem; margin-bottom: 0.25rem; }
                .v13-topline { display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--faded); font-style: italic; margin-bottom: 0.35rem; }
                .v13-masthead {
                    font-family: 'UnifrakturMaguntia', cursive;
                    font-size: 4.5rem; letter-spacing: 0.02em;
                    line-height: 1; margin-bottom: 0.15rem;
                }
                .v13-motto { font-style: italic; font-size: 0.78rem; color: var(--faded); margin-bottom: 0.35rem; }
                .v13-dateline { display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: var(--faded); border-top: 1px solid var(--rule); padding-top: 0.35rem; }
                .v13-dateline-links a { color: var(--ink); text-decoration: none; font-weight: 700; margin-left: 1rem; font-size: 0.7rem; }
                .v13-dateline-links a:hover { text-decoration: underline; }

                /* Rules */
                .v13-thick-rule { border: none; border-top: 3px solid var(--rule); margin: 1rem 0 0.75rem; }
                .v13-thin-rule { border: none; border-top: 1px solid var(--rule); margin: 0.75rem 0; }

                /* Main headline */
                .v13-headline {
                    font-family: 'Playfair Display', serif;
                    font-size: 3.25rem; font-weight: 900; line-height: 1.05;
                    text-align: center; letter-spacing: -0.02em;
                    margin-bottom: 0.5rem;
                }
                .v13-subhead {
                    text-align: center; font-style: italic; font-size: 1.15rem;
                    color: var(--ink2); margin-bottom: 0.5rem; line-height: 1.4;
                }
                .v13-byline { text-align: center; font-size: 0.72rem; color: var(--faded); margin-bottom: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; }

                /* Multi-column */
                .v13-cols { column-count: 3; column-gap: 2rem; column-rule: 1px solid var(--rule); }
                .v13-cols p { font-size: 0.88rem; line-height: 1.75; text-align: justify; margin-bottom: 0.85rem; text-indent: 1.5em; }
                .v13-cols p:first-of-type { text-indent: 0; }
                .v13-cols p:first-of-type::first-letter {
                    font-family: 'Playfair Display', serif; font-size: 3.5rem;
                    font-weight: 900; float: left; line-height: 0.8;
                    margin-right: 0.15rem; margin-top: 0.1rem;
                }
                .v13-no-break { break-inside: avoid; }

                /* Pull quote */
                .v13-pullquote {
                    break-inside: avoid; margin: 1.25rem 0; padding: 1rem 0;
                    border-top: 3px solid var(--rule); border-bottom: 3px solid var(--rule);
                    text-align: center;
                }
                .v13-pullquote p {
                    font-family: 'Playfair Display', serif; font-style: italic;
                    font-size: 1.25rem; line-height: 1.4; text-indent: 0 !important;
                    text-align: center;
                }
                .v13-pullquote cite { font-size: 0.72rem; color: var(--faded); font-style: normal; text-transform: uppercase; letter-spacing: 0.1em; }

                /* Secondary headline section */
                .v13-sec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 0.5rem; }
                .v13-sec-grid-item { border-left: 1px solid var(--rule); padding-left: 1.5rem; }
                .v13-sec-grid-item:first-child { border-left: none; padding-left: 0; }
                .v13-sec-head { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 900; margin-bottom: 0.5rem; line-height: 1.15; }
                .v13-sec-text { font-size: 0.82rem; line-height: 1.7; text-align: justify; }
                .v13-sec-text p { margin-bottom: 0.6rem; }

                /* Bottom row */
                .v13-bottom { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 0.5rem; }
                .v13-classifieds { border: 2px solid var(--rule); padding: 1rem 1.25rem; }
                .v13-classifieds-head { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 900; text-align: center; margin-bottom: 0.65rem; border-bottom: 1px solid var(--rule); padding-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.1em; }
                .v13-classified { margin-bottom: 0.85rem; font-size: 0.78rem; line-height: 1.55; }
                .v13-classified strong { font-family: 'Playfair Display', serif; text-transform: uppercase; }

                .v13-weather { border: 2px solid var(--rule); padding: 1rem 1.25rem; text-align: center; }
                .v13-weather-head { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 900; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; }
                .v13-weather-icon { font-size: 3rem; margin-bottom: 0.5rem; }
                .v13-weather-text { font-size: 0.78rem; color: var(--ink2); line-height: 1.55; font-style: italic; }

                /* Footer */
                .v13-footer { margin-top: 1.5rem; border-top: 4px double var(--rule); padding-top: 0.75rem; display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--faded); }

                @media (max-width: 800px) {
                    .v13-cols { column-count: 1; }
                    .v13-sec-grid { grid-template-columns: 1fr; }
                    .v13-bottom { grid-template-columns: 1fr; }
                    .v13-masthead { font-size: 2.5rem; }
                    .v13-headline { font-size: 2rem; }
                }
            `}</style>

            <div className="v13">
                {/* Masthead */}
                <div className="v13-flag">
                    <div className="v13-topline"><span>Vol. MMXXVI, No. 42</span><span>&ldquo;All the Code That&apos;s Fit to Debug&rdquo;</span><span>Est. 2026</span></div>
                    <h1 className="v13-masthead">The Daily CodeGuru</h1>
                    <div className="v13-motto">&ldquo;Illuminating minds through the art of questioning.&rdquo;</div>
                    <div className="v13-dateline">
                        <span>{today}</span>
                        <div className="v13-dateline-links">
                            {user ? (
                                <Link href={dashboardHref}>DASHBOARD</Link>
                            ) : (
                                <>
                                    <Link href="/login">SIGN IN</Link>
                                    <Link href="/register">SUBSCRIBE FREE</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="v13-thick-rule" />

                {/* Main Headline */}
                <h2 className="v13-headline">AI Tutor Transforms CS Education<br />by Asking Questions, Not Giving Answers</h2>
                <p className="v13-subhead">Revolutionary Socratic method applied to coding — students report &ldquo;actually understanding&rdquo; algorithms for the first time.</p>
                <p className="v13-byline">By The CodeGuruAI Editorial Board</p>

                <hr className="v13-thin-rule" />

                {/* Main story - multi-column */}
                <div className="v13-cols">
                    <p>In an era where artificial intelligence can instantly produce the solution to any programming challenge, a small team of educators has built something counter-intuitive: an AI that refuses to give the answer.</p>
                    <p>CodeGuruAI, an AI-powered coding tutor designed for university classrooms, has adopted the ancient Socratic method for the modern age. When a student requests help, the system analyzes their code to identify the specific misconception — then generates a targeted question designed to expose the gap in understanding.</p>
                    <p>&ldquo;The productive struggle is where learning happens,&rdquo; explains the team. &ldquo;Our AI protects that struggle. Students are never fully stuck, but they are never handed the answer.&rdquo;</p>

                    <div className="v13-pullquote">
                        <p>&ldquo;What data structure gives O(1) lookups? How would that change your approach?&rdquo;</p>
                        <cite>— A typical CodeGuruAI Socratic hint</cite>
                    </div>

                    <p>The platform includes a full in-browser code editor supporting Python, JavaScript, C++, and Java, with instant test case feedback. Students write, run, and debug their solutions without leaving the browser.</p>
                    <p>For instructors, the platform offers what many have described as transformative: real-time classroom analytics showing exactly where students succeed and where they struggle. Submission data, time-to-solve breakdowns, and hint dependency patterns are all tracked automatically.</p>
                    <p>Perhaps most notably, CodeGuruAI features an AI-powered problem generator. Instructors set the topic, difficulty, and constraints; the AI creates complete, unique coding challenges with test cases — ensuring that no two semesters recycle the same problem set.</p>
                    <p>With over 15,000 students across 250 universities reporting a 94% completion rate, the platform has demonstrated that questioning — not answering — is the key to genuine CS education. The service is free for students.</p>
                </div>

                <hr className="v13-thick-rule" />

                {/* Secondary stories */}
                <div className="v13-sec-grid">
                    <div className="v13-sec-grid-item">
                        <h3 className="v13-sec-head">For Students: The Tutor That Never Sleeps</h3>
                        <div className="v13-sec-text">
                            <p>Available around the clock, CodeGuruAI&apos;s Socratic hints have been likened to having a patient, expert tutor available at 3 AM during a deadline crunch. Unlike traditional AI assistants that simply produce the answer, the system asks the precise question that reveals the student&apos;s misconception.</p>
                            <p>Students report not only improved grades but a fundamentally different relationship with debugging. &ldquo;I actually understand now,&rdquo; writes one UC Berkeley student. &ldquo;I&apos;m not just copying.&rdquo;</p>
                        </div>
                    </div>
                    <div className="v13-sec-grid-item">
                        <h3 className="v13-sec-head">For Instructors: Analytics That Illuminate</h3>
                        <div className="v13-sec-text">
                            <p>Classroom management tools allow instructors to create courses, assign problem sets with deadlines, and track every submission. The analytics dashboard reveals cohort-level trends: which concepts trip students up, how long they spend on each problem, and when they rely on hints.</p>
                            <p>&ldquo;I can see which students need help before they fall behind,&rdquo; says Prof. Kapoor of IIT Delhi. &ldquo;The dashboard pays for itself.&rdquo;</p>
                        </div>
                    </div>
                </div>

                <hr className="v13-thick-rule" />

                {/* Classifieds + Weather */}
                <div className="v13-bottom">
                    <div className="v13-classifieds">
                        <div className="v13-classifieds-head">Classifieds</div>
                        <div className="v13-classified"><strong>WANTED — CS Instructors.</strong> Tired of students copying from Stack Overflow? CodeGuruAI&apos;s AI-generated problems ensure unique challenges each semester. Free to try. Visit /register.</div>
                        <div className="v13-classified"><strong>FOR SALE — Brute Force Solutions.</strong> No longer needed. Student upgraded to O(n) with help from Socratic AI hints. One owner, gently used nested loops, available immediately.</div>
                        <div className="v13-classified"><strong>HELP WANTED — Teaching Assistants.</strong> Supplement your office hours with AI-powered support. CodeGuruAI never sleeps, never loses patience. /register today.</div>
                        <div className="v13-classified"><strong>ANNOUNCEMENT.</strong> CodeGuruAI now supports Python, JavaScript, C++, and Java. More languages forthcoming. No setup required.</div>
                    </div>
                    <div className="v13-weather">
                        <div className="v13-weather-head">Today&apos;s Forecast</div>
                        <div className="v13-weather-icon">🧠</div>
                        <div className="v13-weather-text">
                            Bright prospects with a 94% chance of completion.<br />
                            Occasional struggles followed by breakthrough clarity.<br />
                            Winds of understanding picking up by evening.
                        </div>
                    </div>
                </div>

                <div className="v13-footer">
                    <span>&copy; 2026 The Daily CodeGuru — AI-Powered Education</span>
                    <span>Free for students · codeguruai.com</span>
                </div>
            </div>
        </>
    )
}
