import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-[var(--bg-secondary)]">

      {/* ── Left Panel — Illustration only, no text ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-[var(--accent-primary)] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Subtle geometric bg accents */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/[0.04] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/[0.04] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[480px] h-[480px] rounded-full bg-white/[0.02] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 flex flex-col items-center gap-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/favicon.png" alt="CodeGuruAI" width={40} height={40} className="object-contain" />
            <span className="text-xl font-black text-white tracking-tight">CodeGuruAI</span>
          </Link>

          {/* Original illustration — restored */}
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
            {/* Person silhouette — head */}
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
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[var(--bg-secondary)]">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/favicon.png" alt="CodeGuruAI" width={36} height={36} className="object-contain" />
              <span className="text-lg font-black tracking-tight text-[var(--text-primary)]">
                CodeGuru<span className="text-[var(--accent-primary)]">AI</span>
              </span>
            </Link>
          </div>

          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors mb-4 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to home
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[var(--border-primary)] p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
