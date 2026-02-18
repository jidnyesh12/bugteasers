'use client'

import { forwardRef, type InputHTMLAttributes, type ReactNode, useState } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  showPasswordToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', type, showPasswordToggle, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const inputType = showPasswordToggle
      ? showPassword ? 'text' : 'password'
      : type

    return (
      <div>
        {label && (
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-3.5 py-2.5 rounded-xl border
              bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm
              placeholder:text-[var(--text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 focus:border-[var(--accent-primary)]
              transition-colors
              ${icon ? 'pl-10' : ''}
              ${showPasswordToggle ? 'pr-16' : ''}
              ${error
                ? 'border-[var(--error)] focus:ring-[var(--error)]/15 focus:border-[var(--error)]'
                : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
              }
              ${className}
            `}
            {...props}
          />
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer px-1"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-[var(--error)] flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
