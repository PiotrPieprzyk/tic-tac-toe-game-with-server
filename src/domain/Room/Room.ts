import {RoomId} from "./RoomId";
import {RoomName} from "./RoomName";
import {UserId} from "../User/UserId";
import {GameId} from "../Game/valueObject/GameId";
import {RoomRepositoryI} from "./RoomRepository";
import {Timestamp} from "../../shared/Timestamp";
import {RoomMap} from "./RoomMap";
import {UserRepositoryI} from "../User/UserRepository";

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
    updatedTimestamp: number,
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
            throw new Error('Host id is required');
        }
        
        if(!props.usersIds || props.usersIds.length === 0) {
            throw new Error('Room must have at least 1 user');
        }
        
        if(props.usersIds.length > 2) {
            throw new Error('Room can have at most 2 users');
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
            throw new Error('User does not exist');
        }
        
        if (this.usersIds.some(u => u.exact(userIdValueObject))) {
            throw new Error('User is already in the room');
        }

        const newRoom = new Room({
            ...this,
            usersIds: [...this.usersIds, userIdValueObject],
            updatedTimestamp: Timestamp.create()
        })

        await this.roomRepository.save(RoomMap.toPersistence(newRoom));
    }

    public async userLeavesRoom(userId: UserId) {
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

    public async hostRemovesPlayerFromRoom(hostId: UserId, userId: UserId): Promise<void> {
        if (!this.hostId.exact(hostId)) {
            throw new Error('Only the host can remove a player from the room');
        }
        
        await this.userLeavesRoom(userId);
    }

    public async hostRenamesRoom(hostId: UserId, newName: string): Promise<void> {
        if(!this.hostId.exact(hostId)) {
            throw new Error('Only the host can rename the room');
        }
        
        const newRoom = new Room({
            ...this,
            name: RoomName.create(newName),
            updatedTimestamp: Timestamp.create()
        });
        
        await this.roomRepository.save(RoomMap.toPersistence(newRoom));
    }
    
    public async hostDeletesRoom(hostId: UserId): Promise<void> {
        if(!this.hostId.exact(hostId)) {
            throw new Error('Only the host can delete the room');
        }
        
        await this.roomRepository.delete(this.id);
    }

}
