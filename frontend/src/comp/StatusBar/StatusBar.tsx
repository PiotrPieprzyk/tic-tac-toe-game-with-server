import type {HTMLAttributes, ReactNode} from 'react'

export type StatusBarTone = 'neutral' | 'success' | 'warning' | 'danger'

export interface StatusBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  tone: StatusBarTone
  children: ReactNode
}

const toneClasses: Record<StatusBarTone, string> = {
  neutral: 'border-panel-border-subtle bg-transparent text-text-muted',
  success: 'border-success-border bg-success-background text-success',
  warning: 'border-warning-border bg-warning-background text-warning',
  danger: 'border-danger-border bg-danger-surface text-danger',
}

export function StatusBar({tone, className, children, ...rest}: StatusBarProps) {
  return (
    <div
      className={[
        'border-y py-2 text-center font-mono text-meta tracking-tag uppercase',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
