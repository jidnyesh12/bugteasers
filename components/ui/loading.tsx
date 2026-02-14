export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div
      className={`${sizes[size]} rounded-full border-[var(--border-secondary)] border-t-[var(--accent-primary)] animate-spin`}
    />
  )
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-[var(--text-muted)] animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--bg-tertiary)] rounded-lg animate-pulse ${className}`}
    />
  )
}
