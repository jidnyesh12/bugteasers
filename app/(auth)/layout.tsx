import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-[var(--bg-secondary)]">
      {/* Left Panel — Solid coral with animated SVG */}
      <div className="hidden lg:flex lg:w-1/2 auth-illustration-panel items-center justify-center p-12 relative">
        <div className="relative z-10 text-center max-w-lg">
          {/* Animated SVG illustration — Student at desk */}
          <div className="mb-8 flex justify-center">
            <svg width="300" height="260" viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Monitor */}
              <rect x="90" y="40" width="140" height="100" rx="10" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.3" strokeWidth="2"/>
              <rect x="105" y="55" width="110" height="70" rx="4" fill="white" fillOpacity="0.1"/>
              {/* Code lines in monitor */}
              <rect x="115" y="68" width="50" height="4" rx="2" fill="white" fillOpacity="0.6" className="animate-pulse-slow"/>
              <rect x="115" y="78" width="80" height="4" rx="2" fill="#FFE66D" fillOpacity="0.5" className="animate-pulse-slow animate-delay-200"/>
              <rect x="115" y="88" width="60" height="4" rx="2" fill="white" fillOpacity="0.5" className="animate-pulse-slow animate-delay-300"/>
              <rect x="127" y="98" width="40" height="4" rx="2" fill="#4ECDC4" fillOpacity="0.5"/>
              <rect x="127" y="108" width="55" height="4" rx="2" fill="white" fillOpacity="0.4"/>
              {/* Monitor stand */}
              <rect x="148" y="140" width="24" height="15" rx="2" fill="white" fillOpacity="0.15"/>
              <rect x="130" y="155" width="60" height="6" rx="3" fill="white" fillOpacity="0.15"/>
              {/* Keyboard */}
              <rect x="110" y="168" width="100" height="20" rx="6" fill="white" fillOpacity="0.12"/>
              {/* Person silhouette - head */}
              <circle cx="160" cy="210" r="18" fill="white" fillOpacity="0.2" className="animate-float"/>
              {/* Body */}
              <rect x="145" y="228" width="30" height="32" rx="10" fill="white" fillOpacity="0.15"/>
              {/* Floating elements */}
              <circle cx="60" cy="70" r="8" fill="#FFE66D" fillOpacity="0.3" className="animate-float animate-delay-200"/>
              <circle cx="270" cy="90" r="6" fill="#4ECDC4" fillOpacity="0.4" className="animate-float animate-delay-300"/>
              <circle cx="80" cy="180" r="5" fill="white" fillOpacity="0.2" className="animate-float"/>
              {/* Stars */}
              <g className="animate-wiggle" style={{transformOrigin: '260px 50px'}}>
                <path d="M260 42L262 48L268 48L263 52L265 58L260 54L255 58L257 52L252 48L258 48Z" fill="white" fillOpacity="0.3"/>
              </g>
              <g className="animate-wiggle animate-delay-300" style={{transformOrigin: '50px 240px'}}>
                <path d="M50 234L51.5 238L56 238L52.5 241L53.5 245L50 242.5L46.5 245L47.5 241L44 238L48.5 238Z" fill="white" fillOpacity="0.25"/>
              </g>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3">
            Learn to Code with AI Guidance
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Get Socratic hints that make you think, not answers that do the thinking for you.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">100+</p>
              <p className="text-xs text-white/50 font-medium">Problems</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">AI</p>
              <p className="text-xs text-white/50 font-medium">Hints</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">Live</p>
              <p className="text-xs text-white/50 font-medium">Code Runner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center group">
              <img src="/favicon.png" alt="CodeGuruAI" className="h-10 w-10 object-contain" />
              <span className="ml-3 text-xl font-bold text-[var(--text-primary)]">CodeGuruAI</span>
            </Link>
          </div>

          {/* Card — flat, no shadow */}
          <div className="bg-white rounded-2xl border-2 border-[var(--border-primary)] p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
