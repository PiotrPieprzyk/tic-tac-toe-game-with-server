import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'danger' | 'ghost'
export type ButtonSize = 'md' | 'sm'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
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

const sizeClasses: Record<ButtonSize, string> = {
  md: 'p-3 text-button tracking-button',
  sm: 'h-4.5 px-1.5 text-tag tracking-button',
}

export function Button({
  variant = 'primary',
  size = 'md',
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
        'inline-flex items-center justify-center gap-1 border font-mono',
        sizeClasses[size],
        'disabled:cursor-not-allowed disabled:border-control-disabled-border disabled:hover:bg-transparent disabled:hover:shadow-none',
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
