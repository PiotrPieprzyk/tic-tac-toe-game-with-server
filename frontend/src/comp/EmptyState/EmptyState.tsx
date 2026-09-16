import type { HTMLAttributes, ReactNode } from 'react'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function EmptyState({ className, children, ...rest }: EmptyStateProps) {
  return (
    <div
      className={['py-3.5 text-center font-mono text-body text-text-muted', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {'> '}
      {children}
    </div>
  )
}
