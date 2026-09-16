import type {HTMLAttributes} from 'react'
import {StatusBadge} from '@/comp/StatusBadge/StatusBadge'
import {Button} from '@/comp/Button/Button'

export interface RoomListItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  id: string
  name: string
  statusTone: 'success' | 'warning' | 'danger'
  statusLabel: string
  playerCount: number
  maxPlayers: number
  disabled: boolean
  hostname: string
  joining: boolean
  onJoin: () => void
  className?: string
}

export function RoomListItem({
  name,
  statusTone,
  statusLabel,
  playerCount,
  maxPlayers,
  disabled,
  hostname,
  joining,
  onJoin,
  className,
  ...rest
}: RoomListItemProps) {
  const isFull = playerCount >= maxPlayers

    return (
        <div
            data-testid="roomListItem"
            className={[
                'flex items-center justify-between border-b border-panel-border-faint py-3',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            {...rest}
        >
            <div className={'flex flex-col'}>
                <div data-testid="roomName" className="font-mono text-body text-text-primary">
                    {name}
                </div>
                <span className='font-mono text-meta text-text-faint' data-testid="roomPlayerCount">
                        Host: {hostname} {isFull ? 'ROOM_IS_FULL' : `${playerCount}/${maxPlayers}`}
                </span>
            </div>

            <div className='flex items-center gap-2'>
                <StatusBadge data-testid="roomStatus" tone={statusTone}>
                    {statusLabel}
                </StatusBadge>
                <Button
                    size="sm"
                    data-testid="joinRoom"
                    disabled={disabled}
                    loading={joining}
                    loadingText="JOINING"
                    onClick={onJoin}
                >
                    JOIN
                </Button>
            </div>

        </div>
    )
}
