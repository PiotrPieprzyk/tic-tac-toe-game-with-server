import {type ReactElement, useEffect, useState} from "react";
import {PulseDot} from "@/comp/PulseDot/PulseDot.tsx";
import {Button} from "@/comp/Button/Button.tsx";
import {Notice} from "@/comp/Notice/Notice.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {useUserName} from "@/domain/shared/context/UserSessionContext.tsx";
import {useRoomEventsSocket} from "@/domain/shared/context/RoomEventsSocketContext.tsx";
import {useOwnRoomId} from "@/app/Menu/RoomList/useOwnRoomId.ts";
import {useMenuEventBus} from "@/app/Menu/MenuEventBus.ts";

export function RoomListHeader(): ReactElement {
    const [connected, setConnected] = useState(false);
    const roomEventsSocket = useRoomEventsSocket();
    const ownRoomId = useOwnRoomId();
    const menuEventBus = useMenuEventBus();
    const [joinError, setJoinError] = useState<string | null>(null);


    const router = useRouter();
    const currentUserName = useUserName();

    useEffect(() => {
        return roomEventsSocket.subscribe({
            onConnect: () => setConnected(true),
            onDisconnect: () => setConnected(false),
        });
    }, [roomEventsSocket]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const onErrorCallback = ({message}: {message: string}) => {
            clearTimeout(timeout);
            setJoinError(message);
            timeout = setTimeout(() => setJoinError(null), 4000);
        }
        menuEventBus.on('ERROR', onErrorCallback);
        return () => {
            clearTimeout(timeout);
            menuEventBus.off('ERROR', onErrorCallback);
        }
    }, [menuEventBus]);

    return (
        <div className="flex flex-col gap-2.5 border-b border-panel-border-subtle p-4 pb-3">
            <div className="flex items-center justify-between">
                <div className="font-mono text-body text-text-primary">{`User: ${currentUserName ?? 'UNKNOWN'}`}</div>
                <div data-testid="connectionStatus" className="flex items-center gap-1.5 font-mono text-meta text-text-muted">
                    <PulseDot />
                    {connected ? 'LIVE' : 'OFFLINE'}
                </div>
            </div>

            {ownRoomId ? (
                <Button data-testid="returnToRoom" onClick={() => router.push(`#/rooms/${ownRoomId}`)} className="w-full">
                    RETURN_TO_ROOM
                </Button>
            ) : (
                <Button data-testid="createRoom" onClick={() => router.push('#/rooms/create')} className="w-full">
                    CREATE_ROOM
                </Button>
            )}

            {ownRoomId && (
                <Notice tone="muted" data-testid="alreadyInRoomMessage">
                    YOU MUST LEAVE YOUR CURRENT ROOM TO JOIN ANOTHER
                </Notice>
            )}

            {joinError && (
                <Notice tone="danger" data-testid="errorMessage">
                    {joinError}
                </Notice>
            )}
        </div>
    )
}
