"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect } from "react"

/* ================================================================
   V22 — Socrates' Agora — Ancient Greek Philosophy Theme
   Marble texture, Greek columns, papyrus scroll panels,
   laurel wreaths, ancient typography, Greek key borders,
   Socratic dialogue format, amphitheater layout.
   Font: Cinzel + EB Garamond
   ================================================================ */

export default function LandingV22() {
    const { user, profile } = useAuth()
    const dashboardHref = profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
    const [dialogState, setDialogState] = useState(0)

    const dialogue = [
        { speaker: "Σωκράτης", text: "Tell me, young student — you have written a solution. But do you truly understand it?" },
        { speaker: "Student", text: "I... I think so. The tests pass, but one gives a Time Limit." },
        { speaker: "Σωκράτης", text: "And what does that tell you about your approach? You check every pair — is there not a swifter path?" },
        { speaker: "Student", text: "A faster data structure? Something that can look up values instantly?" },
        { speaker: "Σωκράτης", text: "Now you begin to see. The question was always within you — I merely helped you find it." },
    ]

    useEffect(() => {
        if (dialogState < dialogue.length - 1) {
            const t = setTimeout(() => setDialogState(s => s + 1), 3500)
            return () => clearTimeout(t)
        }
    }, [dialogState, dialogue.length])

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

                .v22 {
                    --marble: #F4F0E8;
                    --marble2: #EDE8DD;
                    --gold: #C9A84C;
                    --gold2: #A07D2A;
                    --bronze: #8B6914;
                    --ink: #2C2418;
                    --ink2: #4A3F30;
                    --clay: #C4956A;
                    --olive: #6B7C3F;
                    --sky: #B8CDE0;
                    font-family: 'EB Garamond', 'Georgia', serif;
                    background: var(--marble);
                    color: var(--ink);
                    min-height: 100vh;
                    overflow-x: hidden;
                    background-image:
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.4' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
                }

                /* Greek key border */
                .v22-key-border {
                    height: 24px;
                    background:
                        repeating-linear-gradient(90deg,
                            var(--gold) 0px, var(--gold) 8px,
                            transparent 8px, transparent 12px,
                            var(--gold) 12px, var(--gold) 20px,
                            transparent 20px, transparent 24px
                        );
                    opacity: 0.4;
                }

                /* Nav */
                .v22-nav {
                    padding: 1rem 3rem; display: flex; justify-content: space-between;
                    align-items: center; border-bottom: 2px solid var(--gold);
                }
                .v22-nav-brand {
                    font-family: 'Cinzel Decorative', serif; font-size: 1.4rem;
                    font-weight: 700; color: var(--gold2);
                    letter-spacing: 0.05em;
                }
                .v22-nav-links { display: flex; gap: 0.5rem; }
                .v22-nav-link {
                    font-family: 'Cinzel', serif; font-size: 0.75rem;
                    padding: 0.5rem 1.25rem; text-decoration: none;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    border: 1px solid var(--gold); color: var(--gold2);
                    transition: all 0.25s;
                }
                .v22-nav-link:hover { background: var(--gold); color: var(--marble); }
                .v22-nav-link.primary { background: var(--gold); color: var(--marble); }

                /* Hero — temple facade */
                .v22-hero {
                    text-align: center; padding: 5rem 3rem 4rem;
                    position: relative;
                    background: linear-gradient(180deg, rgba(184,205,224,0.15) 0%, transparent 40%);
                }

                /* Columns */
                .v22-columns { display: flex; justify-content: center; gap: 0; position: relative; }
                .v22-column {
                    width: 40px; height: 350px;
                    background: linear-gradient(90deg,
                        rgba(196,149,106,0.15) 0%, rgba(244,240,232,0.5) 20%,
                        rgba(237,232,221,0.6) 50%, rgba(196,149,106,0.15) 100%);
                    border-left: 1px solid rgba(196,149,106,0.2);
                    border-right: 1px solid rgba(196,149,106,0.2);
                    position: relative;
                }
                .v22-column::before {
                    content: ''; position: absolute; top: -15px; left: -8px; right: -8px;
                    height: 15px; background: var(--marble2);
                    border: 1px solid rgba(196,149,106,0.3);
                }
                .v22-column::after {
                    content: ''; position: absolute; bottom: -10px; left: -6px; right: -6px;
                    height: 10px; background: var(--marble2);
                    border: 1px solid rgba(196,149,106,0.3);
                }
                .v22-col-content {
                    position: absolute; left: 50%; top: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px; z-index: 2;
                }

                .v22-laurel { font-size: 2.5rem; margin-bottom: 0.5rem; }
                .v22-h1 {
                    font-family: 'Cinzel Decorative', serif; font-size: 3.5rem;
                    font-weight: 900; color: var(--ink); line-height: 1.15;
                    margin-bottom: 1rem; letter-spacing: 0.03em;
                }
                .v22-h1 .gold { color: var(--gold2); }
                .v22-subtitle {
                    font-size: 1.15rem; font-style: italic; color: var(--ink2);
                    max-width: 500px; margin: 0 auto 1rem; line-height: 1.6;
                }
                .v22-greek { font-size: 0.85rem; color: var(--clay); letter-spacing: 0.2em; margin-bottom: 2rem; }
                .v22-hero-cta { display: flex; justify-content: center; gap: 1rem; }
                .v22-btn {
                    font-family: 'Cinzel', serif; font-size: 0.8rem; font-weight: 700;
                    padding: 0.85rem 2.5rem; letter-spacing: 0.12em;
                    text-transform: uppercase; text-decoration: none; transition: all 0.3s;
                }
                .v22-btn.gold { background: var(--gold); color: var(--marble); border: 2px solid var(--gold); }
                .v22-btn.gold:hover { background: var(--gold2); border-color: var(--gold2); }
                .v22-btn.outline { background: transparent; color: var(--gold2); border: 2px solid var(--gold); }
                .v22-btn.outline:hover { background: rgba(201,168,76,0.1); }

                /* Entablature quote */
                .v22-entablature {
                    background: var(--ink); color: var(--gold); padding: 2rem 3rem;
                    text-align: center; position: relative;
                }
                .v22-entablature::before, .v22-entablature::after {
                    content: ''; position: absolute; left: 0; right: 0; height: 4px;
                    background: repeating-linear-gradient(90deg, var(--gold) 0px, var(--gold) 20px, transparent 20px, transparent 28px);
                }
                .v22-entablature::before { top: 0; }
                .v22-entablature::after { bottom: 0; }
                .v22-quote {
                    font-family: 'Cinzel', serif; font-size: 1.5rem; font-weight: 400;
                    font-style: italic; letter-spacing: 0.03em; line-height: 1.5;
                }
                .v22-quote-attr { font-size: 0.8rem; margin-top: 0.75rem; color: var(--clay); letter-spacing: 0.15em; text-transform: uppercase; }

                /* Dialogue scroll */
                .v22-dialogue {
                    max-width: 800px; margin: 4rem auto; padding: 0 3rem;
                }
                .v22-dialogue-title {
                    font-family: 'Cinzel Decorative', serif; font-size: 1.8rem;
                    text-align: center; margin-bottom: 0.5rem; color: var(--gold2);
                }
                .v22-dialogue-sub { text-align: center; font-style: italic; color: var(--ink2); margin-bottom: 2rem; font-size: 0.95rem; }
                .v22-exchange {
                    display: flex; gap: 1rem; margin-bottom: 1.5rem;
                    opacity: 0; transform: translateY(10px);
                    transition: all 0.6s ease-out;
                }
                .v22-exchange.visible { opacity: 1; transform: translateY(0); }
                .v22-speaker {
                    font-family: 'Cinzel', serif; font-size: 0.75rem;
                    font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.1em; min-width: 100px;
                    text-align: right; padding-top: 0.3rem;
                    color: var(--gold2);
                }
                .v22-speech {
                    flex: 1; font-size: 1.05rem; line-height: 1.7;
                    border-left: 2px solid var(--gold); padding-left: 1rem;
                    color: var(--ink2); font-style: italic;
                }

                /* Papyrus scroll features */
                .v22-scrolls { max-width: 1100px; margin: 0 auto 4rem; padding: 0 3rem; }
                .v22-scrolls-title {
                    font-family: 'Cinzel Decorative', serif; font-size: 1.8rem;
                    text-align: center; margin-bottom: 2.5rem; color: var(--gold2);
                }
                .v22-scroll-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
                .v22-scroll {
                    background: linear-gradient(135deg, #F5EDD8 0%, #EDE3CC 50%, #E8DAC0 100%);
                    border: 1px solid rgba(196,149,106,0.3);
                    padding: 2rem 1.75rem;
                    box-shadow: 2px 3px 10px rgba(0,0,0,0.08);
                    position: relative;
                }
                .v22-scroll::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px;
                    background: linear-gradient(90deg, var(--clay), var(--gold), var(--clay));
                    opacity: 0.4;
                }
                .v22-scroll-icon { font-size: 2rem; margin-bottom: 0.75rem; }
                .v22-scroll-name { font-family: 'Cinzel', serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--ink); }
                .v22-scroll-text { font-size: 0.9rem; line-height: 1.65; color: var(--ink2); }

                /* Amphitheater stats */
                .v22-amp {
                    background: linear-gradient(180deg, var(--marble2) 0%, rgba(184,205,224,0.2) 100%);
                    padding: 4rem 3rem; text-align: center;
                    border-top: 2px solid var(--gold);
                    border-bottom: 2px solid var(--gold);
                }
                .v22-amp-title { font-family: 'Cinzel', serif; font-size: 1rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold2); margin-bottom: 2rem; }
                .v22-amp-grid { display: flex; justify-content: center; gap: 4rem; flex-wrap: wrap; }
                .v22-amp-stat {}
                .v22-amp-val { font-family: 'Cinzel Decorative', serif; font-size: 3rem; font-weight: 900; color: var(--ink); }
                .v22-amp-label { font-size: 0.8rem; color: var(--ink2); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.25rem; }

                /* CTA */
                .v22-cta {
                    text-align: center; padding: 4rem 3rem;
                    background: var(--ink);
                }
                .v22-cta-h2 { font-family: 'Cinzel Decorative', serif; font-size: 2.5rem; color: var(--gold); margin-bottom: 1rem; }
                .v22-cta-sub { font-size: 1rem; color: var(--clay); margin-bottom: 2rem; font-style: italic; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6; margin-bottom: 2rem; }

                .v22-footer {
                    padding: 1rem 3rem; display: flex; justify-content: space-between;
                    font-size: 0.75rem; color: var(--clay);
                    border-top: 1px solid rgba(196,149,106,0.2);
                }

                @media (max-width: 800px) {
                    .v22-h1 { font-size: 2rem; }
                    .v22-scroll-grid { grid-template-columns: 1fr; }
                    .v22-columns { display: none; }
                    .v22-col-content { position: relative; left: auto; top: auto; transform: none; width: auto; }
                }
            `}</style>

            <div className="v22">
                <div className="v22-key-border" />

                <nav className="v22-nav">
                    <div className="v22-nav-brand">CODEGURUAI</div>
                    <div className="v22-nav-links">
                        {user ? (
                            <Link href={dashboardHref} className="v22-nav-link primary">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="v22-nav-link">Enter</Link>
                                <Link href="/register" className="v22-nav-link primary">Begin</Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Hero with columns */}
                <section className="v22-hero">
                    <div className="v22-columns">
                        <div className="v22-column" />
                        <div className="v22-column" style={{ marginLeft: "80px" }} />
                        <div className="v22-col-content">
                            <div className="v22-laurel">🏛️</div>
                            <h1 className="v22-h1">The <span className="gold">Socratic</span><br />Method, Reborn</h1>
                            <p className="v22-subtitle">&ldquo;I cannot teach anybody anything. I can only make them think.&rdquo;</p>
                            <div className="v22-greek">ΓΝΩΘΙ ΣΕΑΥΤΟΝ — KNOW THYSELF</div>
                            <div className="v22-hero-cta">
                                <Link href="/register" className="v22-btn gold">Enter the Academy</Link>
                                <Link href="#dialogue" className="v22-btn outline">Witness a Dialogue</Link>
                            </div>
                        </div>
                        <div className="v22-column" style={{ marginRight: "80px" }} />
                        <div className="v22-column" />
                    </div>
                </section>

                {/* Entablature */}
                <div className="v22-entablature">
                    <div className="v22-quote">&ldquo;Education is the kindling of a flame, not the filling of a vessel.&rdquo;</div>
                    <div className="v22-quote-attr">— Attributed to Socrates</div>
                </div>

                {/* Socratic dialogue */}
                <section className="v22-dialogue" id="dialogue">
                    <h2 className="v22-dialogue-title">A Socratic Dialogue</h2>
                    <p className="v22-dialogue-sub">As it unfolds in the CodeGuruAI Academy</p>
                    {dialogue.map((d, i) => (
                        <div key={i} className={`v22-exchange ${i <= dialogState ? "visible" : ""}`}>
                            <div className="v22-speaker">{d.speaker}</div>
                            <div className="v22-speech">{d.text}</div>
                        </div>
                    ))}
                </section>

                {/* Feature scrolls */}
                <section className="v22-scrolls">
                    <h2 className="v22-scrolls-title">The Instruments of Wisdom</h2>
                    <div className="v22-scroll-grid">
                        <div className="v22-scroll"><div className="v22-scroll-icon">🧠</div><div className="v22-scroll-name">The Oracle of Hints</div><div className="v22-scroll-text">As Socrates guided through questioning, so does our AI — identifying the precise gap in understanding and asking the question that illuminates.</div></div>
                        <div className="v22-scroll"><div className="v22-scroll-icon">⚡</div><div className="v22-scroll-name">The Agora of Code</div><div className="v22-scroll-text">A place of practice and discourse. Write, execute, and test code in the browser — Python, JavaScript, C++, Java — with instant oracular feedback.</div></div>
                        <div className="v22-scroll"><div className="v22-scroll-icon">🎯</div><div className="v22-scroll-name">The Artificer&apos;s Forge</div><div className="v22-scroll-text">Our AI crafts unique challenges each semester. Set the parameters — topic, difficulty, constraints — and receive problems worthy of the Academy.</div></div>
                        <div className="v22-scroll"><div className="v22-scroll-icon">📊</div><div className="v22-scroll-name">The Eye of Athena</div><div className="v22-scroll-text">See what your students see. Real-time analytics reveal who struggles, who thrives, and exactly where understanding breaks down.</div></div>
                        <div className="v22-scroll"><div className="v22-scroll-icon">🏛️</div><div className="v22-scroll-name">The Academy Halls</div><div className="v22-scroll-text">Create classrooms, assign problem sets, set deadlines, and manage your cohort — built for how university education actually works.</div></div>
                        <div className="v22-scroll"><div className="v22-scroll-icon">🛡️</div><div className="v22-scroll-name">The Shield of Integrity</div><div className="v22-scroll-text">AI-unique problems every semester means no answer pools, no recycled sets. Every student must prove their own understanding.</div></div>
                    </div>
                </section>

                {/* Stats amphitheater */}
                <div className="v22-amp">
                    <div className="v22-amp-title">From the Records of the Academy</div>
                    <div className="v22-amp-grid">
                        <div className="v22-amp-stat"><div className="v22-amp-val">XV.M+</div><div className="v22-amp-label">Students</div></div>
                        <div className="v22-amp-stat"><div className="v22-amp-val">XCIV%</div><div className="v22-amp-label">Completion</div></div>
                        <div className="v22-amp-stat"><div className="v22-amp-val">CCL+</div><div className="v22-amp-label">Universities</div></div>
                        <div className="v22-amp-stat"><div className="v22-amp-val">IV.IX★</div><div className="v22-amp-label">Rating</div></div>
                    </div>
                </div>

                {/* CTA */}
                <section className="v22-cta">
                    <h2 className="v22-cta-h2">Enter the Academy</h2>
                    <p className="v22-cta-sub">Free for all students who seek wisdom. Full instruments for instructors who kindle the flame.</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
                        <Link href="/register" className="v22-btn gold">Begin Your Journey</Link>
                        <Link href="/login" className="v22-btn outline">Return</Link>
                    </div>
                </section>

                <footer className="v22-footer">
                    <span>© MMXXVI CodeGuruAI — The Academy of Questioning</span>
                    <span>ΣΩΚΡΑΤΙΚΗ ΜΕΘΟΔΟΣ</span>
                </footer>

                <div className="v22-key-border" />
            </div>
        </>
    )
}
