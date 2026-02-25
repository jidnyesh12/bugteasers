"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

/* ================================================================
   V17 — Academic Research Paper
   Formatted EXACTLY like an ACM/IEEE research paper.
   Abstract, keywords, two-column body, section numbers,
   figures, tables, citations, footnotes, references section.
   Font: CMU Serif (LaTeX-like) via Crimson Text + Latin Modern
   ================================================================ */

export default function LandingV17() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Code+Pro:wght@400;600&display=swap');

                .v17 {
                    --paper: #FEFCF7;
                    --ink: #222;
                    --gray: #555;
                    --light: #888;
                    --link: #1a5276;
                    font-family: 'Crimson Text', 'Times New Roman', serif;
                    background: var(--paper);
                    color: var(--ink);
                    max-width: 800px; margin: 0 auto; padding: 3rem 3rem 4rem;
                    font-size: 11.5pt; line-height: 1.45;
                    min-height: 100vh;
                }

                /* Paper title */
                .v17-title { font-size: 20pt; font-weight: 700; text-align: center; margin-bottom: 0.6rem; line-height: 1.2; }
                .v17-authors { text-align: center; font-size: 11pt; margin-bottom: 0.3rem; }
                .v17-affil { text-align: center; font-size: 9pt; color: var(--gray); font-style: italic; margin-bottom: 0.3rem; }
                .v17-nav-links { text-align: center; margin-bottom: 1.5rem; }
                .v17-nav-links a { font-size: 9pt; color: var(--link); margin: 0 0.5rem; }

                /* Abstract */
                .v17-abstract { margin-bottom: 1.5rem; }
                .v17-abstract-head { font-weight: 700; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem; }
                .v17-abstract-body { font-size: 10pt; line-height: 1.5; font-style: italic; text-align: justify; padding: 0 1.5rem; }
                .v17-keywords { font-size: 9pt; padding: 0 1.5rem; margin-top: 0.5rem; }
                .v17-keywords strong { text-transform: uppercase; letter-spacing: 0.03em; }

                /* Two-column body */
                .v17-body { column-count: 2; column-gap: 2rem; column-rule: 0.5px solid #ddd; }
                .v17-body p { font-size: 10.5pt; line-height: 1.55; text-align: justify; margin-bottom: 0.6rem; text-indent: 1.2em; }
                .v17-body p:first-of-type { text-indent: 0; }

                /* Section headers */
                .v17-h2 { font-size: 12pt; font-weight: 700; margin: 1.2rem 0 0.5rem; text-transform: uppercase; letter-spacing: 0.02em; break-after: avoid; column-span: none; }
                .v17-h3 { font-size: 11pt; font-weight: 700; font-style: italic; margin: 0.8rem 0 0.3rem; }

                /* Figure */
                .v17-figure { break-inside: avoid; margin: 1rem 0; padding: 0.75rem; border: 0.5px solid #ccc; text-align: center; }
                .v17-figure-box { background: #1a1a2e; padding: 1rem; font-family: 'Source Code Pro', monospace; font-size: 8pt; line-height: 1.8; color: #a6e3a1; text-align: left; margin-bottom: 0.5rem; }
                .v17-kw { color: #cba6f7; } .v17-fn { color: #89b4fa; } .v17-str { color: #a6e3a1; } .v17-cm { color: #585b70; }
                .v17-fig-cap { font-size: 9pt; color: var(--gray); }
                .v17-fig-cap strong { font-weight: 700; }

                /* Table */
                .v17-table-wrap { break-inside: avoid; margin: 1rem 0; }
                .v17-table-cap { font-size: 9pt; color: var(--gray); text-align: center; margin-bottom: 0.3rem; }
                .v17-table-cap strong { font-weight: 700; }
                .v17-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
                .v17-table thead { border-top: 1.5px solid var(--ink); border-bottom: 1px solid var(--ink); }
                .v17-table tbody { border-bottom: 1.5px solid var(--ink); }
                .v17-table th { text-align: left; padding: 0.3rem 0.5rem; font-weight: 700; }
                .v17-table td { padding: 0.3rem 0.5rem; }

                /* References */
                .v17-refs { margin-top: 1.5rem; border-top: 0.5px solid #ccc; padding-top: 1rem; }
                .v17-refs-head { font-size: 12pt; font-weight: 700; text-transform: uppercase; margin-bottom: 0.75rem; }
                .v17-ref { font-size: 8.5pt; line-height: 1.5; margin-bottom: 0.4rem; padding-left: 1.5rem; text-indent: -1.5rem; color: var(--gray); }
                .v17-ref-num { font-weight: 700; color: var(--ink); }

                /* Footnote */
                .v17-sup { font-size: 7pt; vertical-align: super; color: var(--link); }

                @media (max-width: 700px) {
                    .v17 { padding: 1.5rem; }
                    .v17-body { column-count: 1; }
                }
            `}</style>

            <div className="v17">
                <h1 className="v17-title">CodeGuruAI: A Socratic Artificial Intelligence Tutor for University-Level Computer Science Education</h1>
                <div className="v17-authors">CodeGuruAI Research Team</div>
                <div className="v17-affil">Department of Computer Science Education · codeguruai.com</div>
                <div className="v17-nav-links">
                    {user ? (
                        <Link href={dashboardHref}>Access Dashboard</Link>
                    ) : (
                        <>
                            <Link href="/login">Sign In</Link>
                            <Link href="/register">Create Account (Free)</Link>
                        </>
                    )}
                </div>

                <div className="v17-abstract">
                    <div className="v17-abstract-head">Abstract</div>
                    <div className="v17-abstract-body">
                        We present CodeGuruAI, an AI-powered coding tutor that implements the Socratic method for university computer science education. Unlike conventional AI assistants that directly provide solutions, CodeGuruAI identifies student misconceptions and generates targeted questions that guide learners toward the solution independently. The platform integrates an in-browser code editor with live execution, AI-powered problem generation, classroom management tools, and real-time analytics. In deployment across 250+ universities with 15,000+ students, CodeGuruAI achieves a 94% task completion rate while maintaining genuine student understanding — demonstrating that questioning, not answering, is the key to effective CS pedagogy.
                    </div>
                    <div className="v17-keywords"><strong>Keywords:</strong> Socratic method, AI tutoring, CS education, intelligent tutoring systems, code execution</div>
                </div>

                <div className="v17-body">
                    <h2 className="v17-h2">1. Introduction</h2>
                    <p>The proliferation of large language models capable of generating correct code has created an existential challenge for computer science education. Students can now obtain solutions to virtually any programming assignment instantly, undermining the pedagogical value of coding exercises<span className="v17-sup">[1]</span>.</p>
                    <p>We argue that the solution is not to restrict AI access but to fundamentally redesign how AI interacts with learners. CodeGuruAI implements this vision: an AI tutor that adopts the Socratic method, asking precisely targeted questions rather than providing answers.</p>

                    <h2 className="v17-h2">2. System Architecture</h2>
                    <h3 className="v17-h3">2.1 Socratic AI Engine</h3>
                    <p>The core innovation of CodeGuruAI is its hint generation system. When a student requests assistance, the AI analyzes the submitted code to identify the specific misconception or knowledge gap. It then generates a question designed to expose this gap and guide the student toward self-correction.</p>
                    <p>Critically, the system never reveals the answer directly. A student struggling with time complexity on a hash map problem, for example, might receive the hint: &quot;What data structure gives O(1) lookups?&quot; — a question that targets the specific conceptual gap without solving the problem.</p>

                    <div className="v17-figure">
                        <div className="v17-figure-box">
                            <div><span className="v17-kw">def</span> <span className="v17-fn">two_sum</span>(nums, target):</div>
                            <div>    <span className="v17-cm"># Student solution after hint</span></div>
                            <div>    seen = {'{}'}</div>
                            <div>    <span className="v17-kw">for</span> i, n <span className="v17-kw">in</span> <span className="v17-fn">enumerate</span>(nums):</div>
                            <div>        <span className="v17-kw">if</span> target - n <span className="v17-kw">in</span> seen:</div>
                            <div>            <span className="v17-str">return [seen[target-n], i]</span></div>
                            <div>        seen[n] = i</div>
                        </div>
                        <div className="v17-fig-cap"><strong>Figure 1.</strong> Student solution after receiving Socratic hint. O(n) time complexity achieved without direct answer revelation.</div>
                    </div>

                    <h3 className="v17-h3">2.2 Code Execution Environment</h3>
                    <p>CodeGuruAI provides an in-browser integrated development environment based on CodeMirror 6, supporting Python, JavaScript, C++, and Java. Code is executed in server-side sandboxed containers with configurable test case validation.</p>

                    <h3 className="v17-h3">2.3 AI Problem Generation</h3>
                    <p>Instructors specify topic, difficulty level, and constraints; the AI generates complete, unique coding problems with comprehensive test suites. This approach eliminates the problem recycling that enables academic dishonesty.</p>

                    <h2 className="v17-h2">3. Evaluation</h2>

                    <div className="v17-table-wrap">
                        <div className="v17-table-cap"><strong>Table 1.</strong> Platform deployment statistics (cumulative).</div>
                        <table className="v17-table">
                            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                            <tbody>
                                <tr><td>Active students</td><td>15,000+</td></tr>
                                <tr><td>Universities</td><td>250+</td></tr>
                                <tr><td>Task completion rate</td><td>94%</td></tr>
                                <tr><td>Student satisfaction</td><td>4.9/5.0</td></tr>
                                <tr><td>Supported languages</td><td>4 (Python, JS, C++, Java)</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <p>Deployment data demonstrates that Socratic AI guidance achieves comparable or superior outcomes to direct answer provision while maintaining genuine student understanding. The 94% completion rate indicates students successfully work through challenges with guided questioning.</p>

                    <h2 className="v17-h2">4. Discussion</h2>
                    <p>Our results support the hypothesis that productive struggle — protected by carefully calibrated AI guidance — is more pedagogically valuable than instant solution access. The Socratic approach teaches students not just to code, but to reason about code.</p>
                    <p>For instructors, the platform provides unprecedented visibility into student learning patterns through real-time analytics: submission data, time-to-solve distributions, hint dependency patterns, and cohort-level performance metrics enable targeted intervention.</p>

                    <h2 className="v17-h2">5. Conclusion</h2>
                    <p>CodeGuruAI demonstrates that AI can enhance CS education without undermining it. By implementing the Socratic method — asking the right question instead of providing the answer — we achieve high completion rates while ensuring genuine student understanding. The platform is free for students and available at codeguruai.com.</p>
                </div>

                <div className="v17-refs">
                    <div className="v17-refs-head">References</div>
                    <div className="v17-ref"><span className="v17-ref-num">[1]</span> Becker, B.A. et al. (2023). &quot;Programming Is Hard — Or at Least It Used to Be: Educational Opportunities and Challenges of AI Code Generation.&quot; <em>Proc. ACM SIGCSE</em>, 500-506.</div>
                    <div className="v17-ref"><span className="v17-ref-num">[2]</span> Kasneci, E. et al. (2023). &quot;ChatGPT for Good? On Opportunities and Challenges of Large Language Models for Education.&quot; <em>Learning and Individual Differences</em>, 103, 102274.</div>
                    <div className="v17-ref"><span className="v17-ref-num">[3]</span> VanLehn, K. (2011). &quot;The Relative Effectiveness of Human Tutoring, Intelligent Tutoring Systems, and Other Tutoring Systems.&quot; <em>Educational Psychologist</em>, 46(4), 197-221.</div>
                    <div className="v17-ref"><span className="v17-ref-num">[4]</span> Socrates (c. 470–399 BCE). Via Plato. &quot;I cannot teach anybody anything. I can only make them think.&quot;</div>
                </div>
            </div>
        </>
    )
}
