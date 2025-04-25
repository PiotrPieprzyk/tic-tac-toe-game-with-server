'use client'
import {redirect} from "next/navigation";
import {useEffect, useRef, useState} from "react";

import {CommonError} from "@/_modules/shared/api/API";
import Button from "@/_modules/shared/components/Button/Button";

import {Room} from "@/_modules/Room/domain/Room";
import {RoomListItem} from "@/_modules/Room/components/RoomListItem";
import {RoomList} from "@/_modules/Room/domain/RoomList";
import {CurrentUser} from "@/_modules/shared/services/CurrentUser";
import {useRouter} from "next/navigation";

export default function Rooms() {
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [hasNextPage, setHasNextPage] = useState<boolean>(true);
    const roomList = new RoomList();
    const user = CurrentUser.getCurrentUser();
    
    if(!user) {
        router.push('/');
        return null;
    }
    
    const appendNextPage = async () => {
        const response = await roomList.appendNextPage();

        if (response instanceof CommonError) {
            // TODO: Display generic error message popup
            console.table([{
                message: response.message,
                status: response.status
            }])
            return;
        }

        setRooms(response);
        setHasNextPage(roomList.paginatedList.hasNextPage());
    }
    
    // Intersection observer for appending next page
    const appendNextPageTriggerRef = useRef<HTMLDivElement>(null);
    const appendNextPageTriggerOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: '0px',
        threshold: 1.0
    }
    const appendNextPageTriggerCallback: IntersectionObserverCallback = async (entries) => {
        if (entries[0].isIntersecting) {
            await appendNextPage();
        }
    }

    useEffect(() => {
        const observer = new IntersectionObserver(appendNextPageTriggerCallback, appendNextPageTriggerOptions);
        
        appendNextPageTriggerRef.current && observer.observe(appendNextPageTriggerRef.current)
        
        return () => {
            observer.disconnect();
        }
    }, [])

    const redirectToCreateRoomPage = () => {
        router.push(`/rooms/create`)
    }

    return (
        <div className={'flex flex-col gap-2 w-full color-text-app'} style={{ minWidth: '300px'}}>
            <div className={'flex justify-between color-app rounded-4 level-1 p-4'}>
                <span className={'text-title'}>Active rooms</span>
                <Button onClick={redirectToCreateRoomPage} className={'px-2 py-1'}>Create room</Button>
            </div>

            {rooms.length > 0 && rooms.map(room => (
                <RoomListItem key={room.id} room={room} userId={user.id}/>
            ))}

            {hasNextPage && (
                <div ref={appendNextPageTriggerRef} className={'color-app rounded-4 level-1 p-4'}>
                    Loading...
                </div>
            )}

            {rooms.length === 0 && (
                <div className={'color-app rounded-4 level-1 p-4 '}>
                    No active rooms. Click the Create room button to create the first room!
                </div>
            )}
        </div>
    )
}
