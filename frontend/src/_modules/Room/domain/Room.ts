import {RoomName} from "./RoomName";
import {Timestamp} from "@/_modules/shared/models/Timestamp";
import {RoomAPI, RoomAPIResponse} from "@/_modules/Room/infra/RoomApi";
import {CommonError} from "@/_modules/shared/api/API";

type RoomProps = {
    id: string;
    name: RoomName;
    hostId: string;
    activeGameId?: string;
    usersIds: string[];
};

type RoomPropsRaw = {
    id: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    usersIds: string[],
}

export class Room {
    public readonly id: string;
    public readonly name: RoomName;
    public readonly hostId: string;
    public readonly activeGameId: string | undefined;
    public readonly usersIds: string[];

    private constructor(props: RoomProps) {
        this.id = props.id;
        this.name = props.name;
        this.hostId = props.hostId;
        this.activeGameId = props.activeGameId;
        this.usersIds = props.usersIds;
    }

    public static create(props: RoomPropsRaw): Room {
        if(!props.hostId) {
            throw new Error('Host id is required');
        }
        
        if(!props.usersIds || props.usersIds.length === 0) {
            throw new Error('Room must have at least 1 user');
        }
        
        if(props.usersIds.length > 2) {
            throw new Error('Room can have at most 2 users');
        }
        
        return new Room({
            id: props.id,
            name: RoomName.create(props.name),
            hostId: props.hostId,
            activeGameId: props.activeGameId ? props.activeGameId: undefined,
            usersIds: props.usersIds,
        });
    }

    public async userJoinsRoom(userId: string): Promise<RoomAPIResponse|CommonError> {
        if (this.usersIds.some(u => u === userId)) {
            throw new Error('User is already in the room');
        }

        const newRoom = new Room({
            ...this,
            usersIds: [...this.usersIds, userId],
            updatedTimestamp: Timestamp.create()
        })

        return await RoomAPI.join(newRoom.id, {userId});
    }

    public async userLeavesRoom(userId: string) {
       await RoomAPI.leave(this.id, {userId});
    }

    public async hostRemovesPlayerFromRoom(hostId: string, userId: string): Promise<RoomAPIResponse|CommonError> {
        if (this.isCurrentUserHost(hostId)) {
            throw new Error('Only the host can remove a player from the room');
        }
        
        return await RoomAPI.update(this.id, {
            usersIds: this.usersIds.filter(u => u !== userId)
        });
    }

    public async hostRenamesRoom(hostId: string, newName: string): Promise<RoomAPIResponse|CommonError> {
        if (this.isCurrentUserHost(hostId)) {
            throw new Error('Only the host can remove a player from the room');
        }
        
        const newRoom = new Room({
            ...this,
            name: RoomName.create(newName),
        });
        
        return await RoomAPI.update(this.id, {
            name: newName
        });
    }
    
    public async hostDeletesRoom(hostId: string): Promise<undefined | CommonError> {
        if (this.isCurrentUserHost(hostId)) {
            throw new Error('Only the host can remove a player from the room');
        }
        
        return await RoomAPI.delete(this.id);
    }
    
    public isCurrentUserHost(userId: string): boolean {
        return this.hostId === userId
    }
    
    public canNewUserJoin(): boolean {
        return this.usersIds.length < 2;
    }

}
