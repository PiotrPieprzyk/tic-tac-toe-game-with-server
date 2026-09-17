import {type ReactElement} from "react";
import {RoomList} from "@/app/Menu/RoomList/RoomList.tsx";
import {RoomListHeader} from "@/app/Menu/RoomList/RoomListHeader.tsx";
import {TerminalCard} from "@/comp/TerminalCard/TerminalCard.tsx";


export function MenuRoomList(): ReactElement {
    return (
        <TerminalCard titleBarLabel="room_list.sh" className="w-full max-w-97.5">
            <div data-testid="roomList" className="flex flex-col">
                <RoomListHeader/>
                <RoomList/>
            </div>
        </TerminalCard>
    );
}
