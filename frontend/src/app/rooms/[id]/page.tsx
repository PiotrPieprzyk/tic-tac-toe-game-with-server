'use client'
import Button from "@/_modules/shared/components/Button/Button";
import {useEffect, useState} from "react";
import {RoomAPI} from "@/_modules/Room/infra/RoomApi";
import {CurrentRoom} from "@/_modules/Room/domain/CurrentRoom";
import {CommonError} from "@/_modules/shared/api/API";
import {Room} from "@/_modules/Room/domain/Room";
import {useParams, useRouter} from "next/navigation";
import Divider from "@/_modules/shared/components/Divider/Divider";
import {CurrentUser} from "@/_modules/shared/services/CurrentUser";
import {GameStatusEnum} from "@/_modules/Game/domain/GameStatus";

const roomAPI = new RoomAPI();
const currentRoom = new CurrentRoom();

export default function PageRoom() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [room, setRoom] = useState<Room | undefined>(currentRoom.getCurrentRoom());
    const [loadingRoom, setLoadingRoom] = useState<boolean>(!room);
    const user = CurrentUser.getCurrentUser();

    if (!user) {
        // TODO: Display generic error message popup
        router.push('/');
        return null;
    }

    useEffect(() => {
        const getRoom = async () => {
            const response = await roomAPI.getRoom(params.id);

            if (response instanceof CommonError) {
                if (response.status === 404) {
                    // TODO: Display generic error message popup
                    router.push('/rooms');
                }
                return;
            }

            setRoom(Room.create({...response.value, roomAPI}));
            setLoadingRoom(false);
        }


        (async () => {
            if (!room) {
                await getRoom();
            }
            
            if (!room) {
                // TODO: Display generic error message popup
                router.push('/rooms');
                return;
            }
            
            if(room.status.value === GameStatusEnum.IN_PROGRESS && room.activeGameId) {
                router.push(`/games/${room.activeGameId}`);
            }
        })();
    }, []);


    const onLeaveRoom = async () => {
        const response = await roomAPI.userLeaveRoom(params.id, {userId: user.id});

        if (response instanceof CommonError) {
            // TODO: Display generic error message popup
            return;
        }

        currentRoom.removeCurrentRoom();
        router.push('/rooms');
    }

    const onStartGame = async () => {
        // TODO: Implement game start
        console.log('Start game');
    }


    const roomUI = room && (
        <div className={'flex flex-col color-app color-text-app p-4 rounded-4 gap-6'}>
            <div className={'w-full text-center'}>
                <h1 className={'text-title text-bold'}> {room.name.value}</h1>
                <span className={'text-body color-text-app'}>Status: {room.status.toUserFriendlyString()}</span>
            </div>

            <Divider/>

            <div className={'color-text-app text-body'}>
                <span>Players:</span>
                <ul className={'list-disc'}>
                    {room.users.map(user => (
                        <li key={user.id}>{user.name.value}</li>
                    ))}
                </ul>
            </div>

            <Divider/>

            <div className={'w-full flex justify-between'}>
                <Button onClick={() => onLeaveRoom()} className={'px-2 py-1'}>Leave game</Button>
                <Button onClick={() => onStartGame()} className={'px-2 py-1'}>Start game</Button>
            </div>
        </div>
    );

    const loadingUI = (
        <div className={'flex flex-col color-app color-text-app p-4 rounded-4 gap-3'}>
            <h1 className={'text-title text-bold'}>Loading room...</h1>
        </div>
    )

    return loadingRoom ? loadingUI : roomUI;
}
