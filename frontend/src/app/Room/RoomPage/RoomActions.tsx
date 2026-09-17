import {useState, type ReactElement} from "react";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {useUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import {RoomId} from "@/domain/Room/RoomId.ts";
import {GameStatusEnum} from "@/domain/Game/GameStatus.ts";
import type {RoomAPIResponseRaw} from "@/domain/shared/api/RoomAPI.ts";
import {Button} from "@/comp/Button/Button.tsx";
import {Notice} from "@/comp/Notice/Notice.tsx";

const GENERIC_ERROR = "SERVER ERR: PLEASE TRY AGAIN";
const MAX_PLAYERS = 2;

interface RoomActionsProps {
    room: RoomAPIResponseRaw;
    isHost: boolean;
    onError: (message: string) => void;
    onStartGameLoadingChange: (loading: boolean) => void;
}

export function RoomActions({room, isHost, onError, onStartGameLoadingChange}: RoomActionsProps): ReactElement {
    const roomAPI = useRoomAPI();
    const router = useRouter();
    const currentUserId = useUserSession();
    const [startingGame, setStartingGame] = useState(false);

    const readyToStart = room.users.length >= MAX_PLAYERS && room.status === GameStatusEnum.WAITING_FOR_PLAYERS;
    const inProgress = room.status === GameStatusEnum.IN_PROGRESS;

    async function handleDelete() {
        const response = await roomAPI.deleteRoom(RoomId.create(room.id));
        if (response instanceof CommonError) {
            onError(GENERIC_ERROR);
            return;
        }
        router.push('#/rooms');
    }

    async function handleStartGame() {
        setStartingGame(true);
        onStartGameLoadingChange(true);
        const response = await roomAPI.startGame(RoomId.create(room.id));
        if (response instanceof CommonError) {
            onError(GENERIC_ERROR);
            setStartingGame(false);
            onStartGameLoadingChange(false);
            return;
        }
        router.push(`#/games/${response.value.id}`);
    }

    async function handleLeave() {
        const response = await roomAPI.userLeaveRoom(RoomId.create(room.id), {userId: currentUserId});
        if (response instanceof CommonError) {
            onError(GENERIC_ERROR);
            return;
        }
        router.push('#/rooms');
    }

    if (inProgress) {
        return (
            <div className="flex flex-col gap-2 p-4">
                <Button data-testid="enterGame" onClick={() => router.push(`#/games/${room.activeGameId}`)} className="w-full">
                    ENTER_GAME
                </Button>
                {!isHost && (
                    <Button data-testid="leaveRoom" variant="danger" onClick={handleLeave} className="w-full">
                        LEAVE_ROOM
                    </Button>
                )}
            </div>
        );
    }

    if (isHost) {
        return (
            <div className="flex flex-col gap-2 p-4">
                <Button
                    data-testid="startGame"
                    disabled={!readyToStart || startingGame}
                    loading={startingGame}
                    loadingText="STARTING"
                    onClick={handleStartGame}
                    className="w-full"
                >
                    START_GAME
                </Button>
                <Button data-testid="deleteRoom" variant="danger" onClick={handleDelete} className="w-full">
                    DELETE_ROOM
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-4">
            {room.users.length >= MAX_PLAYERS && (
                <Notice data-testid="waitingForHostToStart" tone="muted">
                    WAITING_FOR_HOST_TO_START...
                </Notice>
            )}
            <Button data-testid="leaveRoom" variant="danger" onClick={handleLeave} className="w-full">
                LEAVE_ROOM
            </Button>
        </div>
    );
}
