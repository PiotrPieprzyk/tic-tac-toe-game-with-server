import type { HTMLAttributes, ReactNode } from 'react'

export type NoticeTone = 'muted' | 'danger'

export interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  tone?: NoticeTone
  children: ReactNode
}

const toneClasses: Record<NoticeTone, string> = {
  muted: 'text-text-faint',
  danger: 'text-danger',
}

export function Notice({ tone = 'muted', className, children, ...rest }: NoticeProps) {
  return (
    <div
      className={['font-mono text-meta', toneClasses[tone], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {'♦ '}
      {children}
    </div>
  )
}
