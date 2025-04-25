import {Room} from "@/_modules/Room/domain/Room";
import {RoomAPI} from "@/_modules/Room/infra/RoomApi";
import {RoomMap, RoomPersistence} from "@/_modules/Room/application/RoomMap";

export class CurrentRoom {
    private currentRoom: Room | undefined;
    private roomAPI = new RoomAPI();

    constructor() {
        this.tryRestoreCurrentRoom();
    }

    public tryRestoreCurrentRoom(): void {
        const currentRoomRaw = localStorage.getItem('currentRoom') || null;

        if (currentRoomRaw) {
            const currentRoomJSON = JSON.parse(currentRoomRaw) as RoomPersistence;
            
            this.currentRoom = Room.create({
                ...currentRoomJSON,
                roomAPI: this.roomAPI,
            });
        }
    }

    public getCurrentRoom(): Room | undefined {
        return this.currentRoom;
    }

    public setCurrentRoom(room: Room): void {
        this.currentRoom = room;
        const roomJSON = RoomMap.toPersistence(room);
        localStorage.setItem('currentRoom', JSON.stringify(roomJSON));
    }
    
    public removeCurrentRoom(): void {
        this.currentRoom = undefined;
        localStorage.removeItem('currentRoom');
    }
}
