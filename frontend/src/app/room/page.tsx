'use client'

import {useEffect, useState} from "react";
import {RoomAPI} from "@/_modules/Room/infra/RoomApi";


export default function Rooms() {
    const [rooms, setRooms] = useState([])
    
    
    useEffect(() => {
        (async () => {
            const rooms = await RoomAPI.getAll()
            
        })()
    }, [])
    
    return (
        <div>
            <h1>Rooms</h1>


            {rooms.length === 0 ? (
                <div className={'color-app rounded-4 level-1 p-4 color-text-app'}>
                    No active rooms. Click the Create room button to create the first room!
                </div>
            ) : null}
        </div>
    )
}
