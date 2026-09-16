import type { HTMLAttributes, ReactNode } from 'react'

export type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'neutral'

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusBadgeTone
  children: ReactNode
}

const toneClasses: Record<StatusBadgeTone, string> = {
  success: 'border-primary text-primary',
  warning: 'border-warning text-warning',
  danger: 'border-danger text-danger',
  neutral: 'border-text-faint text-text-muted',
}

export function StatusBadge({ tone, className, children, ...rest }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-block border px-[5px] py-[2px] font-mono text-tag tracking-tag uppercase',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </span>
  )
}
