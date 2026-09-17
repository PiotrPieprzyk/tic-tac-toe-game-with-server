import type {ReactElement} from "react";
import {useParams} from "react-router";
import {TerminalCard} from "@/comp/TerminalCard/TerminalCard.tsx";
import {EmptyState} from "@/comp/EmptyState/EmptyState.tsx";
import {Notice} from "@/comp/Notice/Notice.tsx";
import {useRoom} from "@/app/Room/RoomPage/useRoom.ts";
import {RoomDetails} from "@/app/Room/RoomPage/RoomDetails.tsx";

export function RoomPage(): ReactElement {
    const {roomId} = useParams<{ roomId: string }>();
    const {room, loading, errorMessage, setRoom, setErrorMessage} = useRoom(roomId!);

    return (
        <TerminalCard titleBarLabel="room.sh" className="w-full max-w-[390px]">
            <div data-testid="roomPage" className="flex flex-col">
                {loading ? (
                    <EmptyState className="p-6">LOADING...</EmptyState>
                ) : room ? (
                    <RoomDetails
                        room={room}
                        onRoomChange={setRoom}
                        onError={setErrorMessage}
                        errorMessage={errorMessage}
                    />
                ) : (
                    <Notice data-testid="errorMessage" tone="danger" className="p-6">
                        {errorMessage}
                    </Notice>
                )}
            </div>
        </TerminalCard>
    );
}
