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
      ? showPassword
        ? 'text'
        : 'password'
      : type

    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
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
              w-full px-4 py-3 rounded-xl border-2
              bg-[var(--bg-primary)] text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]
              transition-colors text-sm
              ${icon ? 'pl-10' : ''}
              ${showPasswordToggle ? 'pr-16' : ''}
              ${error ? 'border-[var(--error)]' : 'border-[var(--border-primary)]'}
              ${className}
            `}
            {...props}
          />
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer px-1"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[var(--error)] flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
