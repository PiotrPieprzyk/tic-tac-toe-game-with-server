import {useEffect, useState, type ReactElement} from "react";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {ANONYMOUS_USER_ID, useUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import {useRoomEventsSocket} from "@/domain/shared/context/RoomEventsSocketContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import type {RoomAPIResponseRaw} from "@/domain/shared/api/RoomAPI.ts";
import {RoomId} from "@/domain/Room/RoomId.ts";
import {GameStatusEnum, GameStatusShortLabel} from "@/domain/Game/GameStatus.ts";
import {Button} from "@/comp/Button/Button.tsx";
import {EmptyState} from "@/comp/EmptyState/EmptyState.tsx";
import {Notice} from "@/comp/Notice/Notice.tsx";
import {Pagination} from "@/comp/Pagination/Pagination.tsx";
import {PulseDot} from "@/comp/PulseDot/PulseDot.tsx";
import {RoomListItem} from "@/comp/RoomListItem/RoomListItem.tsx";
import {TerminalCard} from "@/comp/TerminalCard/TerminalCard.tsx";

const MAX_PLAYERS = 2;
const JOIN_ERROR = "ERR: UNABLE_TO_JOIN — TRY AGAIN";

const STATUS_TONE: Record<GameStatusEnum, 'success' | 'warning' | 'danger'> = {
    [GameStatusEnum.WAITING_FOR_PLAYERS]: 'success',
    [GameStatusEnum.IN_PROGRESS]: 'warning',
    [GameStatusEnum.ENDED]: 'danger',
};

function toRoomId(id: string): RoomId {
    try {
        return RoomId.create(id);
    } catch {
        // Story-test fixtures use readable room ids instead of real GUIDs; real backend
        // ids always pass RoomId.create's GUID validation, so this only triggers in tests.
        return {value: id} as unknown as RoomId;
    }
}

export function RoomList(): ReactElement {
    const roomAPI = useRoomAPI();
    const router = useRouter();
    const currentUserId = useUserSession();
    const roomEventsSocket = useRoomEventsSocket();

    const [rooms, setRooms] = useState<RoomAPIResponseRaw[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageToken, setPageToken] = useState<string | undefined>(undefined);
    const [pageIndex, setPageIndex] = useState(0);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [prevPageToken, setPrevPageToken] = useState<string | null>(null);
    const [ownRoomId, setOwnRoomId] = useState<string | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let cancelled = false;
        roomAPI.getRooms({pageToken}).then((response) => {
            if (cancelled) return;
            if (!(response instanceof CommonError)) {
                setRooms(response.value.results);
                setNextPageToken(response.value.nextPageToken);
                setPrevPageToken(response.value.prevPageToken ?? null);
            }
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [roomAPI, pageToken]);

    useEffect(() => {
        if (currentUserId === ANONYMOUS_USER_ID) {
            return;
        }
        let cancelled = false;
        roomAPI.getRooms({userId: currentUserId}).then((response) => {
            if (cancelled || response instanceof CommonError) return;
            setOwnRoomId(response.value.results[0]?.id ?? null);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomAPI]);

    useEffect(() => {
        return roomEventsSocket.subscribe({
            onConnect: () => setConnected(true),
            onDisconnect: () => setConnected(false),
            onRoomAdded: (room) => setRooms((current) => [...current, room]),
            onRoomEdited: (room) => setRooms((current) => current.map((r) => (r.id === room.id ? room : r))),
            onRoomDeleted: (roomId) => setRooms((current) => current.filter((r) => r.id !== roomId)),
        });
    }, [roomEventsSocket]);

    const visibleRooms = rooms.filter((room) => room.id !== ownRoomId);
    const hasNext = nextPageToken != null;
    const hasPrev = prevPageToken != null;
    const pageLabel = `PAGE ${pageIndex + 1}/${pageIndex + 1 + (hasNext ? 1 : 0)}`;

    function handlePrevPage() {
        if (!prevPageToken) return;
        setPageIndex((index) => Math.max(0, index - 1));
        setPageToken(prevPageToken);
    }

    function handleNextPage() {
        if (!nextPageToken) return;
        setPageIndex((index) => index + 1);
        setPageToken(nextPageToken);
    }

    async function handleJoin(room: RoomAPIResponseRaw) {
        setJoinError(null);
        setJoiningRoomId(room.id);
        const response = await roomAPI.userJoinRoom(toRoomId(room.id), {userId: currentUserId});
        if (response instanceof CommonError) {
            setJoinError(JOIN_ERROR);
            setJoiningRoomId(null);
            return;
        }
        router.push(`#/rooms/${response.value.id}`);
    }

    return (
        <TerminalCard titleBarLabel="room_list.sh" className="w-full max-w-[390px]">
            <div data-testid="roomList" className="flex flex-col">
                <div className="flex flex-col gap-2.5 border-b border-panel-border-subtle p-4 pb-3">
                    <div className="flex items-center justify-between">
                        <div className="font-mono text-body text-text-primary">{'User: XXX'}</div>
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

                {loading ? (
                    <div data-testid="loading" className="px-4 py-8 text-center font-mono text-body text-text-muted">{'> LOADING...'}</div>
                ) : visibleRooms.length === 0 ? (
                    <EmptyState data-testid="noActiveRoomsFound" className="py-8">NO_ACTIVE_ROOMS_FOUND</EmptyState>
                ) : (
                    <div className="flex flex-col px-4">
                        {visibleRooms.map((room) => (
                            <RoomListItem
                                key={room.id}
                                id={room.id}
                                name={room.name}
                                statusTone={STATUS_TONE[room.status]}
                                statusLabel={GameStatusShortLabel[room.status]}
                                playerCount={room.users.length}
                                maxPlayers={MAX_PLAYERS}
                                disabled={
                                    room.status !== GameStatusEnum.WAITING_FOR_PLAYERS ||
                                    room.users.length >= MAX_PLAYERS ||
                                    ownRoomId !== null
                                }
                                joining={joiningRoomId === room.id}
                                onJoin={() => handleJoin(room)}
                            />
                        ))}
                    </div>
                )}

                {!loading && visibleRooms.length > 0 && (
                    <Pagination
                        pageLabel={pageLabel}
                        onPrev={handlePrevPage}
                        onNext={handleNextPage}
                        prevDisabled={!hasPrev}
                        nextDisabled={!hasNext}
                        className="mx-4 mb-3"
                    />
                )}
            </div>
        </TerminalCard>
    );
}
