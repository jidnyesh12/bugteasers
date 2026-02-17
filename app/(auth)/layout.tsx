import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-[var(--bg-secondary)]">
      {/* Left Panel — Illustration */}
      <div className="hidden lg:flex lg:w-1/2 auth-illustration-panel items-center justify-center p-12 relative">
        <div className="absolute inset-0 pointer-events-none" />
        <div className="relative z-10 text-center max-w-lg">
          {/* SVG Illustration */}
          <div className="mb-8 flex justify-center">
            <svg width="300" height="260" viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-float">
              <rect x="60" y="80" width="200" height="130" rx="12" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.25" strokeWidth="2"/>
              <rect x="75" y="95" width="170" height="100" rx="6" fill="white" fillOpacity="0.08"/>
              <rect x="90" y="110" width="60" height="5" rx="2.5" fill="white" fillOpacity="0.5"/>
              <rect x="90" y="122" width="100" height="5" rx="2.5" fill="white" fillOpacity="0.35"/>
              <rect x="90" y="134" width="80" height="5" rx="2.5" fill="white" fillOpacity="0.5"/>
              <rect x="105" y="146" width="50" height="5" rx="2.5" fill="white" fillOpacity="0.35"/>
              <rect x="105" y="158" width="70" height="5" rx="2.5" fill="white" fillOpacity="0.5"/>
              <circle cx="215" cy="140" r="18" fill="white" fillOpacity="0.2"/>
              <polyline points="207,140 213,146 224,135" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="45" y="210" width="230" height="10" rx="5" fill="white" fillOpacity="0.1"/>
              <circle cx="55" cy="70" r="6" fill="white" fillOpacity="0.15"/>
              <circle cx="265" cy="90" r="4" fill="white" fillOpacity="0.2"/>
              <circle cx="100" cy="55" r="3" fill="white" fillOpacity="0.15"/>
              <circle cx="240" cy="45" r="2" fill="white" fillOpacity="0.12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Learn to Code with AI Guidance
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Get Socratic hints that make you think, not answers that do the thinking for you.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-white">100+</p>
              <p className="text-xs text-white/50">Problems</p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div className="text-center">
              <p className="text-xl font-bold text-white">AI</p>
              <p className="text-xs text-white/50">Hints</p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div className="text-center">
              <p className="text-xl font-bold text-white">Live</p>
              <p className="text-xs text-white/50">Code Runner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form (NO animations, instant render) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                Code<span className="text-[var(--accent-primary)]">Guru</span> <span className="text-sm font-medium text-[var(--text-muted)]">AI</span>
              </span>
            </Link>
          </div>

          {/* Card — no animation */}
          <div className="bg-white rounded-2xl border border-[var(--border-primary)] p-8 shadow-lg">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
