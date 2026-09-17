import {ANONYMOUS_USER_ID, useUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import {useEffect, useState} from "react";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";

export const useOwnRoomId = () => {
    const currentUserId = useUserSession();
    const roomAPI = useRoomAPI();

    const [ownRoomId, setOwnRoomId] = useState<string>();

    useEffect(() => {
        if (!currentUserId || currentUserId === ANONYMOUS_USER_ID) {
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

    return ownRoomId;
}