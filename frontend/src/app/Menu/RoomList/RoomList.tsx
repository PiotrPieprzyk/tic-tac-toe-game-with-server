import {useEffect, useState, type ReactElement} from "react";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {ANONYMOUS_USER_ID, useUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import {useRoomEventsSocket} from "@/domain/shared/context/RoomEventsSocketContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import type {RoomAPIResponseRaw} from "@/domain/shared/api/RoomAPI.ts";
import {RoomId} from "@/domain/Room/RoomId.ts";
import {GameStatusEnum, GameStatusShortLabel} from "@/domain/Game/GameStatus.ts";
import {EmptyState} from "@/comp/EmptyState/EmptyState.tsx";
import {RoomListItem} from "@/comp/RoomListItem/RoomListItem.tsx";
import {PaginationAdapter} from "@/app/Menu/RoomList/PaginationAdapter.tsx";
import {useOwnRoomId} from "@/app/Menu/RoomList/useOwnRoomId.ts";
import {useMenuEventBus} from "@/app/Menu/MenuEventBus.ts";

const MAX_PLAYERS = 2;

const STATUS_TONE: Record<GameStatusEnum, 'success' | 'warning' | 'danger'> = {
    [GameStatusEnum.WAITING_FOR_PLAYERS]: 'success',
    [GameStatusEnum.IN_PROGRESS]: 'warning',
    [GameStatusEnum.ENDED]: 'danger',
};

export function RoomList(): ReactElement | null {
    const roomAPI = useRoomAPI();
    const router = useRouter();
    const currentUserId = useUserSession();
    const roomEventsSocket = useRoomEventsSocket();
    const menuEventBus = useMenuEventBus();
    const ownRoomId = useOwnRoomId();
    const isAnonymous = !currentUserId || currentUserId === ANONYMOUS_USER_ID;

    const [rooms, setRooms] = useState<RoomAPIResponseRaw[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageToken, setPageToken] = useState<string | undefined>(undefined);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [prevPageToken, setPrevPageToken] = useState<string | null>(null);
    const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

    useEffect(() => {
        if (isAnonymous) {
            router.push("/");
        }
    }, [isAnonymous, router]);

    useEffect(() => {
        if (isAnonymous) return;
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
    }, [roomAPI, pageToken, isAnonymous]);


    useEffect(() => {
        return roomEventsSocket.subscribe({
            onRoomAdded: (room) =>
                setRooms((current) => [...current, room]),
            onRoomEdited: (room) =>
                setRooms((current) => current.map((r) => (r.id === room.id ? room : r))),
            onRoomDeleted: (roomId) =>
                setRooms((current) => current.filter((r) => r.id !== roomId)),
        });
    }, [roomEventsSocket]);

    if (isAnonymous) {
        return null;
    }

    const visibleRooms = rooms.filter((room) => room.id !== ownRoomId);

    const getHostName = (room: RoomAPIResponseRaw) => {
        try {
            return room.users.find((user) => user.id === room.hostId).name;
        } catch (e) {
            console.log(e);
            return 'UNKNOWN';
        }
    }

    async function handleJoin(room: RoomAPIResponseRaw) {
        setJoiningRoomId(room.id);
        const response = await roomAPI.userJoinRoom(RoomId.create(room.id), {userId: currentUserId});
        if (response instanceof CommonError) {
            menuEventBus.emit('ERROR', {message: "ERR: UNABLE_TO_JOIN — TRY AGAIN"})

            setJoiningRoomId(null);
            return;
        }
        router.push(`#/rooms/${response.value.id}`);
    }

    return (
        <>
            {loading ? (
                <div data-testid="loading"
                     className="px-4 py-8 text-center font-mono text-body text-text-muted">{'> LOADING...'}</div>
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
                            hostname={getHostName(room)}
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
                <PaginationAdapter
                    nextToken={nextPageToken}
                    prevToken={prevPageToken}
                    onTokenChange={(token) => setPageToken(token)}
                />
            )}
        </>
    );
}
