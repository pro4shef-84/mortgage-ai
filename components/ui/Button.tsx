'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/src/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-amber-500 hover:bg-amber-400 text-slate-900 focus:ring-amber-500',
        secondary: 'bg-slate-800 hover:bg-slate-700 text-white focus:ring-slate-500',
        outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 focus:ring-slate-400',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400',
        danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500',
        success: 'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500',
      },
      size: {
        sm: 'text-sm px-3 py-1.5 min-h-[36px]',
        md: 'text-sm px-4 py-2 min-h-[40px]',
        lg: 'text-base px-6 py-3 min-h-[48px]',
        xl: 'text-lg px-8 py-4 min-h-[56px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
