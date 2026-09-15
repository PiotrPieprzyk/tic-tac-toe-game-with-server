import type { HTMLAttributes, ReactNode } from 'react'

export interface TerminalCardProps extends HTMLAttributes<HTMLDivElement> {
  titleBarLabel: string
  children: ReactNode
}

export function TerminalCard({ titleBarLabel, className, children, ...rest }: TerminalCardProps) {
  return (
    <div
      className={[
        'border border-panel-border bg-panel-background shadow-[0_0_18px_rgb(0_255_156_/_0.10)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-panel-border-subtle bg-titlebar-background px-2.5">
        <span className="h-1.5 w-1.5 bg-primary" />
        <span className="h-1.5 w-1.5 bg-warning" />
        <span className="h-1.5 w-1.5 bg-danger" />
        <span className="ml-2 font-mono text-tag font-normal text-text-faint">{titleBarLabel}</span>
      </div>
      {children}
    </div>
  )
}
