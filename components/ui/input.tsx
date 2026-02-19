'use client'

import * as React from "react"
import { useState } from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
  icon?: React.ReactNode
  showPasswordToggle?: boolean
}

function Input({ label, error, icon, className, type, showPasswordToggle, ...props }: InputProps) {
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
          type={inputType}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            icon && "pl-10",
            showPasswordToggle && "pr-16",
            error && "border-[var(--error)] focus-visible:ring-[var(--error)]/15 focus-visible:border-[var(--error)]",
            className
          )}
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

export { Input }
