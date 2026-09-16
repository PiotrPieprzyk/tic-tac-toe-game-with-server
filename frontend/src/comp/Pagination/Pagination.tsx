import type { HTMLAttributes } from 'react'

export interface PaginationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  pageLabel: string
  onPrev: () => void
  onNext: () => void
  prevDisabled: boolean
  nextDisabled: boolean
}

export function Pagination({ pageLabel, onPrev, onNext, prevDisabled, nextDisabled, className, ...rest }: PaginationProps) {
  return (
    <div
      data-testid="pagination"
      className={[
        'flex items-center justify-between border-t border-panel-border-subtle pt-2.5 font-mono text-meta text-text-muted',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <button
        type="button"
        data-testid="prevPage"
        onClick={onPrev}
        disabled={prevDisabled}
        className={['disabled:cursor-not-allowed', prevDisabled ? 'text-text-faintest' : 'text-primary'].join(' ')}
      >
        {'< PREV'}
      </button>
      <span data-testid="pageIndicator">{pageLabel}</span>
      <button
        type="button"
        data-testid="nextPage"
        onClick={onNext}
        disabled={nextDisabled}
        className={['disabled:cursor-not-allowed', nextDisabled ? 'text-text-faintest' : 'text-primary'].join(' ')}
      >
        {'NEXT >'}
      </button>
    </div>
  )
}
