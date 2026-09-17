import type {HTMLAttributes} from 'react'
import {StatusBadge} from '@/comp/StatusBadge/StatusBadge'
import {Button} from '@/comp/Button/Button'

export interface PlayerSlotProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  playerName?: string
  isHost?: boolean
  isYou?: boolean
  removable?: boolean
  removeDisabled?: boolean
  onRemove?: () => void
  className?: string
}

export function PlayerSlot({
  playerName,
  isHost = false,
  isYou = false,
  removable = false,
  removeDisabled = false,
  onRemove,
  className,
  ...rest
}: PlayerSlotProps) {
  const isEmpty = !playerName

  return (
    <div
      data-testid="playerSlot"
      className={[
        'flex flex-1 flex-col items-center gap-2 border p-4 text-center',
        isEmpty ? 'border-dashed border-text-faint' : 'border-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {isHost && (
        <StatusBadge data-testid="hostTag" tone="success">
          HOST
        </StatusBadge>
      )}
      {isEmpty ? (
        <div data-testid="emptySlotMessage" className="font-mono text-meta text-text-faint">
          WAITING_FOR_OPPONENT...
        </div>
      ) : (
        <>
          <div data-testid="playerName" className="font-mono text-body text-text-primary">
            {playerName}
          </div>
          {isYou && (
            <StatusBadge data-testid="youTag" tone="neutral">
              YOU
            </StatusBadge>
          )}
          {removable && (
            <Button data-testid="removePlayer" variant="danger" size="sm" disabled={removeDisabled} onClick={onRemove}>
              REMOVE_PLAYER
            </Button>
          )}
        </>
      )}
    </div>
  )
}
