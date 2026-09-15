import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'danger' | 'ghost'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  loading?: boolean
  loadingText?: ReactNode
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-primary text-primary hover:bg-primary hover:text-primary-text-on-fill hover:shadow-[0_0_20px_rgb(0_255_156_/_0.6)]',
  danger: 'border-danger text-danger hover:bg-danger hover:text-danger-text-on-fill',
  ghost: 'border-text-faint text-text-muted hover:border-text-primary hover:text-text-primary',
}

export function Button({
  variant = 'primary',
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-1 border p-3 font-mono text-button tracking-button',
        'disabled:cursor-not-allowed disabled:border-primary-border disabled:hover:bg-transparent disabled:hover:shadow-none',
        loading ? 'text-text-faint disabled:hover:text-text-faint' : 'disabled:text-text-faintest disabled:hover:text-text-faintest',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <>
          <span>[ {loadingText ?? children}</span>
          <span className="animate-blink-cursor">...</span>
          <span>&nbsp;]</span>
        </>
      ) : (
        <span>[ {children} ]</span>
      )}
    </button>
  )
}
