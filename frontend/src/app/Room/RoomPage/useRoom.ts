import {useEffect, useRef, useState} from "react";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";
import {useRoomEventsSocket} from "@/domain/shared/context/RoomEventsSocketContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {useUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import type {RoomAPIResponseRaw} from "@/domain/shared/api/RoomAPI.ts";
import {RoomId} from "@/domain/Room/RoomId.ts";
import {GameStatusEnum} from "@/domain/Game/GameStatus.ts";

export function useRoom(roomId: string) {
    const roomAPI = useRoomAPI();
    const roomEventsSocket = useRoomEventsSocket();
    const router = useRouter();
    const userId = useUserSession();

    const [room, setRoom] = useState<RoomAPIResponseRaw | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const previousStatus = useRef<GameStatusEnum | null>(null);

    useEffect(() => {
        let cancelled = false;
        roomAPI.getRoom(RoomId.create(roomId)).then((response) => {
            if (cancelled) return;
            if (response instanceof CommonError) {
                router.push('#/rooms');
                return;
            }
            setRoom(response.value);
            setErrorMessage(null);
            previousStatus.current = response.value.status;
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [roomAPI, roomId, router]);

    useEffect(() => {
        return roomEventsSocket.subscribeToRoom(roomId, {
            onRoomEdited: (edited) => {
                if (edited.id !== roomId) return;
                if (!edited.users.some((user) => user.id === userId.value)) {
                    router.push('#/rooms');
                    return;
                }
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
    }, [roomEventsSocket, roomId, router, userId]);

    return {room, loading, errorMessage, setRoom, setErrorMessage};
}
