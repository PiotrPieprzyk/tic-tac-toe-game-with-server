import {RoomId} from "@/domain/Room/RoomId";
import {RoomName} from "@/domain/Room/RoomName";
import {UserId} from "@/domain/User/UserId";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {RoomRepositoryI} from "@/infrastructure/repositories/interfaces/RoomRepositoryI";
import {Timestamp} from "@/shared/Timestamp";
import {RoomMap} from "@/application/Room/RoomMap";
import {UserRepositoryI} from "@/infrastructure/repositories/interfaces/UserRepositoryI";
import {HTTPError} from "@/shared/HTTPError";

type RoomProps = {
    id: RoomId;
    name: RoomName;
    hostId: UserId;
    activeGameId?: GameId;
    usersIds: UserId[];
    updatedTimestamp: Timestamp,
    roomRepository: RoomRepositoryI,
    userRepository: UserRepositoryI
};

type RoomPropsRaw = {
    id?: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    usersIds: string[],
    updatedTimestamp?: number,
    roomRepository: RoomRepositoryI,
    userRepository: UserRepositoryI
}

export class Room {
    public readonly id: RoomId;
    public readonly name: RoomName;
    public readonly hostId: UserId;
    public readonly activeGameId: GameId | undefined;
    public readonly usersIds: UserId[];
    public readonly updatedTimestamp: Timestamp;
    public readonly roomRepository: RoomRepositoryI;
    public readonly userRepository: UserRepositoryI;

    private constructor(props: RoomProps) {
        this.id = props.id;
        this.name = props.name;
        this.hostId = props.hostId;
        this.activeGameId = props.activeGameId;
        this.usersIds = props.usersIds;
        this.updatedTimestamp = props.updatedTimestamp;
        this.roomRepository = props.roomRepository;
        this.userRepository = props.userRepository;
    }

    public static create(props: RoomPropsRaw): Room {
        if(!props.hostId) {
            throw new HTTPError(400, 'Host id is required');
        }
        
        if(!props.usersIds || props.usersIds.length === 0) {
            throw new HTTPError(400, 'Room must have at least 1 user');
        }
        
        if(props.usersIds.length > 2) {
            throw new HTTPError(400, 'Room can have at most 2 users');
        }
        
        return new Room({
            id: RoomId.create(props.id),
            name: RoomName.create(props.name),
            hostId: UserId.create(props.hostId),
            activeGameId: props.activeGameId ? GameId.create(props.activeGameId): undefined,
            usersIds: props.usersIds.map(UserId.create),
            updatedTimestamp: Timestamp.create(props.updatedTimestamp),
            roomRepository: props.roomRepository,
            userRepository: props.userRepository
        });
    }

    public async userJoinsRoom(userId: string) {
        const userIdValueObject = UserId.create(userId);
        
        if(!(await this.userRepository.find(userIdValueObject))) { 
            throw new HTTPError(400, 'User does not exist');
        }
        
        if (this.usersIds.some(u => u.exact(userIdValueObject))) {
            throw new HTTPError(400, 'User is already in the room');
        }

        const newRoom = new Room({
            ...this,
            usersIds: [...this.usersIds, userIdValueObject],
            updatedTimestamp: Timestamp.create()
        })

        await this.roomRepository.save(RoomMap.toPersistence(newRoom));
    }

    public async userLeavesRoom(rawUserId: string) {
        const userId = UserId.create(rawUserId);
        if (this.usersIds.length === 1) {
            return await this.roomRepository.delete(this.id);
        }
        
        const newRoom = new Room({
           ...this,
            usersIds: this.usersIds.filter(u => !u.exact(userId)),
            updatedTimestamp: Timestamp.create()
        })
        
        await this.roomRepository.save(RoomMap.toPersistence(newRoom));
    }

    public async hostRemovesPlayerFromRoom(rawHostId: string, rawUserId: string): Promise<void> {
        const hostId = UserId.create(rawHostId);
        
        if (!this.hostId.exact(hostId)) {
            throw new HTTPError(400, 'Only the host can remove a player from the room');
        }
        
        await this.userLeavesRoom(rawUserId);
    }

    public async hostRenamesRoom(rawHostId: string, newName: string): Promise<void> {
        const hostId = UserId.create(rawHostId);
        
        if(!this.hostId.exact(hostId)) {
            throw new HTTPError(400, 'Only the host can rename the room');
        }
        
        const newRoom = new Room({
            ...this,
            name: RoomName.create(newName),
            updatedTimestamp: Timestamp.create()
        });
        
        await this.roomRepository.save(RoomMap.toPersistence(newRoom));
    }
    
    public async hostDeletesRoom(rawHostId: string): Promise<void> {
        const hostId = UserId.create(rawHostId);
        
        if(!this.hostId.exact(hostId)) {
            throw new HTTPError(400, 'Only the host can delete the room');
        }
        
        await this.roomRepository.delete(this.id);
    }

}
