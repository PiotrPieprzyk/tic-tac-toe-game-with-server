'use client'

import {useEffect, useState} from "react";
import {RoomAPI} from "@/_modules/Room/infra/RoomApi";
import {CommonError, SuccessResponse} from "@/_modules/shared/api/API";
import {PageToken} from "@/_modules/shared/api/Pagination";
import {Room} from "@/_modules/Room/domain/Room";
import {RoomListItem} from "@/_modules/Room/components/RoomListItem";
import Button from "@/_modules/shared/components/Button/Button";
import {redirect} from "next/navigation";

const roomAPI = new RoomAPI();

export default function Rooms() {
    const [rooms, setRooms] = useState<Room[]>([]);
    let nextPageToken: PageToken | null = null;
    let totalSize: number = 0;
    const user = JSON.parse(localStorage.getItem('user') as string).value;

    useEffect(() => {
        (async () => {
            const response = await roomAPI.getRooms();

            if (response instanceof CommonError) {
                // TODO: Display generic error message popup
                console.table([{
                    message: response.message,
                    status: response.status
                }])
                return;
            }

            const rawRooms = response.value.results;
            const rooms = rawRooms.map(room => Room.create({...room, roomAPI: roomAPI}));
            setRooms(rooms);
            if (response.value.nextPageToken) {
                nextPageToken = PageToken.create(response.value.nextPageToken);
            }
            totalSize = response.value.totalSize;
        })()
    }, [])

    const redirectToCreateRoomPage = () => {
        // TODO: Redirect to create room page
        console.log('Redirecting to create room page');
        redirect(`/rooms/create`)
    }

    return (
        <div className={'flex flex-col gap-2 w-full color-text-app'} style={{ minWidth: '300px'}}>
            <div className={'flex justify-between color-app rounded-4 level-1 p-4'}>
                <span className={'text-title'}>Active rooms</span>
                <Button onClick={redirectToCreateRoomPage} className={'px-2 py-1'}>Create room</Button>
            </div>

            {rooms.length > 0 ?
                rooms.map(room => (
                    <RoomListItem key={room.id} room={room} userId={user.id}/>
                )) :
                null
            }

            {rooms.length === 0 ? (
                <div className={'color-app rounded-4 level-1 p-4 '}>
                    No active rooms. Click the Create room button to create the first room!
                </div>
            ) : null}
        </div>
    )
}
