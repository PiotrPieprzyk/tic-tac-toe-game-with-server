import {Room} from "@/_modules/Room/domain/Room";
import {FC} from "react";
import Button from "@/_modules/shared/components/Button/Button";
import {CommonError, SuccessResponse} from "@/_modules/shared/api/API";
import {useRouter} from "next/navigation";
import {CurrentRoom} from "@/_modules/Room/domain/CurrentRoom";
import {RoomAPI} from "@/_modules/Room/infra/RoomApi";

type props = {
    room: Room
    userId: string;
}
const roomAPI = new RoomAPI();

export const RoomListItem: FC<props> = ({room, userId}) => {
    let loading = false;
    const router = useRouter();
    const currentRoom = new CurrentRoom();


    const onUserJoinsRoom = async () => {
        if (loading) return;

        loading = true;
        const response = await room.userJoinsRoom(userId);

        if (response instanceof CommonError) {
            // TODO: Display generic error message popup
            console.table(response)
        }

        if (response instanceof SuccessResponse) {
            currentRoom.setCurrentRoom(Room.create({...response.value, roomAPI}));
            router.push(`/rooms/${room.id}`);
        }

        loading = false;
    }
    
    const onUserJoinsAgain = () => {
        router.push(`/rooms/${room.id}`)
    }
    
    let buttonUI;
    
    if(room.isCurrentUserInRoom(userId)) {
        buttonUI = <Button onClick={onUserJoinsAgain} className={'px-2 py-1'}>Join again</Button>;
    } else if (room.canNewUserJoin()) {
        buttonUI = <Button onClick={onUserJoinsRoom} className={'px-2 py-1'}>Join</Button>;
    } else {
        buttonUI = null;
    }

    return (
        <div className={'color-app rounded-4 level-1 p-4 color-text-app flex flex-col gap-3'}>
            <div className={'flex flex-col'}>
                <div className={'flex items-center justify-between gap-1'}>
                    <span className={'text-title text-bold'}>{room.name.value}</span>
                    <span className={'text-body'}>
                        {room.canNewUserJoin() ?
                            `${room.users.length}/${Room.MAX_USERS_IN_ROOM}` :
                            `Room is full`
                        }
                    </span>
                </div>
                    <span className={'text-body'}>
                        Status: {room.status.toUserFriendlyString()}
                    </span>
            </div>
            {buttonUI}
        </div>
    );
}
