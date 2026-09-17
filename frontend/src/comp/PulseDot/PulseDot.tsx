import type { HTMLAttributes } from 'react'

export type PulseDotProps = HTMLAttributes<HTMLSpanElement>

export function PulseDot({ className, ...rest }: PulseDotProps) {
  return (
    <span
      className={['inline-block h-1.75 w-1.75 rounded-full bg-primary animate-pulse-dot', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  )
}
