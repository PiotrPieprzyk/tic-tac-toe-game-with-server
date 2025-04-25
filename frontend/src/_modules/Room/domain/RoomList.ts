import {Room} from "./Room";
import {PaginatedList} from "@/_modules/shared/api/Pagination";
import {RoomAPI, RoomAPIResponseRaw} from "@/_modules/Room/infra/RoomApi";
import {CommonError} from "@/_modules/shared/api/API";


export class RoomList {
    public readonly items: Room[] = [];
    public readonly paginatedList = PaginatedList.create<RoomAPIResponseRaw>({APIUrl: RoomAPI.path});
    private roomAPI = new RoomAPI();
    
    public async appendNextPage(): Promise<Room[] | CommonError> {
        const response = await this.paginatedList.getNextPage();
        
        if(response instanceof CommonError) {
            return response;
        }

        const rooms = response.map(room => Room.create({...room, roomAPI: this.roomAPI}));
        this.items.push(...rooms);
        
        return rooms;
    }
} 
