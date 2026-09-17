import type {ReactElement} from "react";
import {useParams} from "react-router";
import {EmptyState} from "@/comp/EmptyState/EmptyState.tsx";
import {TerminalCard} from "@/comp/TerminalCard/TerminalCard.tsx";

export function RoomRenameForm(): ReactElement {
    const {roomId} = useParams<{ roomId: string }>();

    return (
        <TerminalCard titleBarLabel="rename_room.sh" className="w-full max-w-[390px]">
            <div data-testid="roomRenameForm" className="p-6">
                <EmptyState data-testid="roomRenameFormPlaceholder">ROOM_{roomId}_RENAME_NOT_IMPLEMENTED_YET</EmptyState>
            </div>
        </TerminalCard>
    );
}
