import type {ReactElement} from "react";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {Button} from "@/comp/Button/Button.tsx";

interface RoomHeaderProps {
    roomId: string;
    roomName: string;
    isHost: boolean;
    renameDisabled: boolean;
}

export function RoomHeader({roomId, roomName, isHost, renameDisabled}: RoomHeaderProps): ReactElement {
    const router = useRouter();

    return (
        <div className="flex items-center justify-between gap-2 border-b border-panel-border-subtle p-4">
            <div className="flex flex-col gap-1">
                <div className={'flex gap-2 items-center'}>
                    <div data-testid="roomName" className="font-mono text-title text-primary">
                        {roomName}
                    </div>
                    {isHost && (
                        <Button
                            data-testid="renameRoom"
                            variant="ghost"
                            size="sm"
                            disabled={renameDisabled}
                            onClick={() => router.push(`#/rooms/${roomId}/rename`)}
                        >
                            RENAME
                        </Button>
                    )}
                </div>

                <div data-testid="roomId" className="font-mono text-meta text-text-faint">
                    {`ID: #${roomId}`}
                </div>
            </div>

        </div>
    );
}
