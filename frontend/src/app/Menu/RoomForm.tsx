import type {ReactElement} from "react";
import {useRoomAPI} from "../../infra/api/RoomAPIContext.tsx";
import {useRouter} from "../../infra/service/RouterContext.tsx";

export function RoomForm(): ReactElement {
    useRoomAPI();
    useRouter();

    return (
        <div>
            <h2>Room Form</h2>
        </div>
    );
}
