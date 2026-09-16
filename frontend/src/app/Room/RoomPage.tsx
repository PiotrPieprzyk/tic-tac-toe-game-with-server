import type {ReactElement} from "react";
import {useParams} from "react-router";
import {EmptyState} from "@/comp/EmptyState/EmptyState.tsx";
import {TerminalCard} from "@/comp/TerminalCard/TerminalCard.tsx";

export function RoomPage(): ReactElement {
    const {roomId} = useParams<{ roomId: string }>();

    return (
        <TerminalCard titleBarLabel="room.sh" className="w-full max-w-[390px]">
            <div data-testid="roomPage" className="p-6">
                <EmptyState data-testid="roomPagePlaceholder">ROOM_{roomId}_NOT_IMPLEMENTED_YET</EmptyState>
            </div>
        </TerminalCard>
    );
}
