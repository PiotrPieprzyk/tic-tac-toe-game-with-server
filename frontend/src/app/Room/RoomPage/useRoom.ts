import {useEffect, useRef, useState} from "react";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";
import {useRoomEventsSocket} from "@/domain/shared/context/RoomEventsSocketContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import type {RoomAPIResponseRaw} from "@/domain/shared/api/RoomAPI.ts";
import {RoomId} from "@/domain/Room/RoomId.ts";
import {GameStatusEnum} from "@/domain/Game/GameStatus.ts";

const LOAD_ERROR = "ERR: UNABLE_TO_LOAD_ROOM";

export function useRoom(roomId: string) {
    const roomAPI = useRoomAPI();
    const roomEventsSocket = useRoomEventsSocket();
    const router = useRouter();

    const [room, setRoom] = useState<RoomAPIResponseRaw | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const previousStatus = useRef<GameStatusEnum | null>(null);

    useEffect(() => {
        let cancelled = false;
        roomAPI.getRoom(RoomId.create(roomId)).then((response) => {
            if (cancelled) return;
            if (response instanceof CommonError) {
                setErrorMessage(LOAD_ERROR);
            } else {
                setRoom(response.value);
                setErrorMessage(null);
                previousStatus.current = response.value.status;
            }
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [roomAPI, roomId]);

    useEffect(() => {
        return roomEventsSocket.subscribe({
            onRoomEdited: (edited) => {
                if (edited.id !== roomId) return;
                setRoom(edited);
                if (previousStatus.current !== GameStatusEnum.IN_PROGRESS && edited.status === GameStatusEnum.IN_PROGRESS) {
                    router.push(`#/games/${edited.activeGameId}`);
                }
                previousStatus.current = edited.status;
            },
            onRoomDeleted: (deletedRoomId) => {
                if (deletedRoomId !== roomId) return;
                router.push('#/rooms');
            },
        });
    }, [roomEventsSocket, roomId, router]);

    return {room, loading, errorMessage, setRoom, setErrorMessage};
}
