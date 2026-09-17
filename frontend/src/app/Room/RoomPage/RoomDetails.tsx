import {useState, type ReactElement} from "react";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";
import {useUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import {RoomId} from "@/domain/Room/RoomId.ts";
import {UserId} from "@/domain/User/UserId.ts";
import {GameStatusEnum} from "@/domain/Game/GameStatus.ts";
import type {RoomAPIResponseRaw} from "@/domain/shared/api/RoomAPI.ts";
import {PlayerSlot} from "@/comp/PlayerSlot/PlayerSlot.tsx";
import {StatusBar} from "@/comp/StatusBar/StatusBar.tsx";
import {Notice} from "@/comp/Notice/Notice.tsx";
import {RoomHeader} from "@/app/Room/RoomPage/RoomHeader.tsx";
import {RoomActions} from "@/app/Room/RoomPage/RoomActions.tsx";

const GENERIC_ERROR = "SERVER ERR: PLEASE TRY AGAIN";

interface RoomDetailsProps {
    room: RoomAPIResponseRaw;
    onRoomChange: (room: RoomAPIResponseRaw) => void;
    onError: (message: string | null) => void;
    errorMessage: string | null;
}

function statusBar(room: RoomAPIResponseRaw): { tone: 'warning' | 'success'; label: string } {
    if (room.status === GameStatusEnum.IN_PROGRESS) {
        return {tone: 'warning', label: 'STATUS: GAME_IN_PROGRESS'};
    }
    if (room.users.length >= 2) {
        return {tone: 'success', label: 'STATUS: READY — 2/2 PLAYERS'};
    }
    return {tone: 'warning', label: 'STATUS: WAITING_FOR_PLAYERS'};
}

export function RoomDetails({room, onRoomChange, onError, errorMessage}: RoomDetailsProps): ReactElement {
    const roomAPI = useRoomAPI();
    const currentUserId = useUserSession();
    const [startingGame, setStartingGame] = useState(false);

    const isHost = currentUserId.value === room.hostId;
    const hostUser = room.users.find((user) => user.id === room.hostId);
    const opponentUser = room.users.find((user) => user.id !== room.hostId);
    const {tone, label} = statusBar(room);

    async function handleRemovePlayer(userId: string) {
        const remainingIds = room.users
            .filter((user) => user.id !== userId)
            .map((user) => UserId.create(user.id));
        const response = await roomAPI.updateRoom(RoomId.create(room.id), {
            usersIds: remainingIds,
        });
        if (response instanceof CommonError) {
            onError(GENERIC_ERROR);
            return;
        }
        onRoomChange(response.value);
    }

    return (
        <>
            <RoomHeader roomId={room.id} roomName={room.name} isHost={isHost} renameDisabled={startingGame}/>
            <StatusBar data-testid="roomStatus" tone={tone}>
                {label}
            </StatusBar>
            <div className="flex gap-3 p-4">
                <PlayerSlot playerName={hostUser?.name} isHost/>
                <PlayerSlot
                    playerName={opponentUser?.name}
                    isYou={!isHost && !!opponentUser && opponentUser.id === currentUserId.value}
                    removable={isHost && !!opponentUser}
                    removeDisabled={startingGame}
                    onRemove={opponentUser ? () => handleRemovePlayer(opponentUser.id) : undefined}
                />
            </div>
            {errorMessage && (
                <Notice data-testid="errorMessage" tone="danger" className="mx-4 mb-2">
                    {errorMessage}
                </Notice>
            )}
            <RoomActions
                room={room}
                isHost={isHost}
                onError={onError}
                onStartGameLoadingChange={setStartingGame}
            />
        </>
    );
}
