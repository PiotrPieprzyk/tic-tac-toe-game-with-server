import {RoomName} from "./RoomName";
import {Timestamp} from "@/_modules/shared/models/Timestamp";
import {RoomAPIDeletedResponse, RoomAPII, RoomAPIResponse} from "@/_modules/Room/infra/RoomApi";
import {CommonError} from "@/_modules/shared/api/API";
import {User, UserPropsRaw} from "@/_modules/User/domain/User";
import {GameStatus, GameStatusEnum} from "@/_modules/Game/domain/GameStatus";
import {UIError} from "@/_modules/shared/models/UIError";


type RoomProps = {
    id: string;
    name: RoomName;
    hostId: string;
    activeGameId?: string;
    users: User[];
    roomAPI: RoomAPII;
    status: GameStatus
};

type RoomPropsRaw = {
    id: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    users: UserPropsRaw[],
    roomAPI: RoomAPII;
    status: GameStatusEnum
}

export class Room {
    public readonly id: string;
    public readonly name: RoomName;
    public readonly hostId: string;
    public readonly activeGameId: string | undefined;
    public readonly users: User[];
    public readonly roomAPI: RoomAPII;
    public readonly status: GameStatus;
    
    public static MAX_USERS_IN_ROOM = 2;

    private constructor(props: RoomProps) {
        this.id = props.id;
        this.name = props.name;
        this.hostId = props.hostId;
        this.activeGameId = props.activeGameId;
        this.users = props.users;
        this.roomAPI = props.roomAPI;
        this.status = props.status;
    }

    public static create(props: RoomPropsRaw): Room {
        if(!props.hostId) {
            throw new UIError('Host id is required');
        }
        
        if(!props.users || props.users.length === 0) {
            throw new UIError('Room must have at least 1 user');
        }
        
        if(props.users.length > 2) {
            throw new UIError('Room can have at most 2 users');
        }
        
        return new Room({
            id: props.id,
            name: RoomName.create(props.name),
            hostId: props.hostId,
            activeGameId: props.activeGameId ? props.activeGameId: undefined,
            users: props.users.map(u => User.create(u)),
            roomAPI: props.roomAPI,
            status: GameStatus.create(props.status)
        });
    }

    public async userJoinsRoom(userId: string): Promise<RoomAPIResponse|CommonError> {
        if (this.users.some(u => u.id === userId)) {
            throw new UIError('User is already in the room');
        }

        const newRoom = new Room({
            ...this,
            users: [...this.users, userId],
            updatedTimestamp: Timestamp.create()
        })

        return await this.roomAPI.userJoinRoom(newRoom.id, {userId});
    }

    public async userLeavesRoom(userId: string) {
        if (this.users.some(u => u.id !== userId)) {
            throw new UIError('User is not in the room');
        }
        
       await this.roomAPI.userLeaveRoom(this.id, {userId});
    }

    public async hostRemovesPlayerFromRoom(hostId: string, userId: string): Promise<RoomAPIResponse|CommonError> {
        if (this.isCurrentUserHost(hostId)) {
            throw new UIError('Only the host can remove a player from the room');
        }
        
        return await this.roomAPI.updateRoom(this.id, {
            usersIds: this.users.filter(u => u.id !== userId).map(u => u.id)
        });
    }

    public async hostRenamesRoom(hostId: string, newName: string): Promise<RoomAPIResponse|CommonError> {
        if (this.isCurrentUserHost(hostId)) {
            throw new UIError('Only the host can remove a player from the room');
        }
        
        const newRoom = new Room({
            ...this,
            name: RoomName.create(newName),
        });
        
        return await this.roomAPI.updateRoom(this.id, {
            name: newName
        });
    }
    
    public async hostDeletesRoom(hostId: string): Promise<RoomAPIDeletedResponse | CommonError> {
        if (this.isCurrentUserHost(hostId)) {
            throw new UIError('Only the host can remove a player from the room');
        }
        
        return await this.roomAPI.deleteRoom(this.id);
    }
    
    public isCurrentUserHost(userId: string): boolean {
        return this.hostId === userId
    }
    
    public canNewUserJoin(): boolean {
        return this.users.length < 2;
    }
    
    public isCurrentUserInRoom(userId: string): boolean {
        return this.users.some(u => u.id === userId);
    }

}
