import type {ReactElement} from "react";
import {useParams} from "react-router";
import {EmptyState} from "@/comp/EmptyState/EmptyState.tsx";

export function RoomPage(): ReactElement {
    const {roomId} = useParams<{ roomId: string }>();

    return (
        <div data-testid="roomPage">
            <EmptyState data-testid="roomPagePlaceholder">ROOM_{roomId}_NOT_IMPLEMENTED_YET</EmptyState>
        </div>
    );
}
