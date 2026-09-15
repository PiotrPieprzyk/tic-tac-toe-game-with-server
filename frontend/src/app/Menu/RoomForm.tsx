import type {ReactElement} from "react";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";

export function RoomForm(): ReactElement {
    useRoomAPI();
    useRouter();

    return (
        <div>
            <h2>Room Form</h2>
        </div>
    );
}
