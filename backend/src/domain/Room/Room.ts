import {RoomId} from "@/domain/Room/RoomId";
import {RoomName} from "@/domain/Room/RoomName";
import {UserId} from "@/domain/User/UserId";
import {UsersIds} from "@/domain/Room/UsersIds";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {Timestamp} from "@/shared/Timestamp";
import {ForbiddenError, ValidationError} from "@/shared/DomainError";

type RoomProps = {
    id: RoomId;
    name: RoomName;
    hostId: UserId;
    activeGameId?: GameId;
    usersIds: UsersIds;
    updatedTimestamp: Timestamp,
};

export type RoomPropsRaw = {
    id?: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    usersIds: string[],
    updatedTimestamp?: number,
}

export class Room {
    public readonly id: RoomId;
    public readonly name: RoomName;
    public readonly hostId: UserId;
    public readonly activeGameId: GameId | undefined;
    public readonly usersIds: UsersIds;
    public readonly updatedTimestamp: Timestamp;

    private constructor(props: RoomProps) {
        this.id = props.id;
        this.name = props.name;
        this.hostId = props.hostId;
        this.activeGameId = props.activeGameId;
        this.usersIds = props.usersIds;
        this.updatedTimestamp = props.updatedTimestamp;
    }

    public static create(props: RoomPropsRaw): Room {
        if(!props.hostId) {
            throw new ValidationError('Host id is required');
        }

        return new Room({
            id: RoomId.create(props.id),
            name: RoomName.create(props.name),
            hostId: UserId.create(props.hostId),
            activeGameId: props.activeGameId ? GameId.create(props.activeGameId): undefined,
            usersIds: UsersIds.create(props.usersIds),
            updatedTimestamp: Timestamp.create(props.updatedTimestamp),
        });
    }

    public static createForHost(props: RoomPropsRaw, hostAlreadyHasRoom: boolean): Room {
        const room = Room.create(props);

        if (hostAlreadyHasRoom) {
            throw new ValidationError('User already created room');
        }

        return room;
    }

    public userJoins(rawUserId: string): Room {
        const userId = UserId.create(rawUserId);

        return new Room({
            ...this,
            usersIds: this.usersIds.add(userId),
            updatedTimestamp: Timestamp.create()
        });
    }

    /** Returns undefined when the room has no users left and should be deleted. */
    public userLeaves(rawUserId: string): Room | undefined {
        const userId = UserId.create(rawUserId);

        if (this.usersIds.values.length === 1) {
            return undefined;
        }

        return new Room({
            ...this,
            usersIds: this.usersIds.remove(userId),
            updatedTimestamp: Timestamp.create()
        });
    }

    public hostRemovesPlayer(rawHostId: string, rawUserId: string): Room | undefined {
        this.assertIsHost(rawHostId, 'Only the host can remove a player from the room');

        return this.userLeaves(rawUserId);
    }

    public hostRenames(rawHostId: string, newName: string): Room {
        this.assertIsHost(rawHostId, 'Only the host can rename the room');

        return new Room({
            ...this,
            name: RoomName.create(newName),
            updatedTimestamp: Timestamp.create()
        });
    }

    public hostEditsRoom(rawHostId: string, updates: { name?: string, usersIds?: string[] }): Room {
        this.assertIsHost(rawHostId, 'Only host can edit room');

        let updatedName = this.name;
        let updatedUsersIds = this.usersIds;

        if (updates.name) {
            updatedName = RoomName.create(updates.name);
        }

        if (updates.usersIds) {
            const keptUserIds = updatedUsersIds.values
                .filter(userId => updates.usersIds!.includes(userId.value))
                .map(userId => userId.value);
            updatedUsersIds = UsersIds.create(keptUserIds);
        }

        return new Room({
            ...this,
            name: updatedName,
            usersIds: updatedUsersIds,
            updatedTimestamp: Timestamp.create()
        });
    }

    public assertHostCanDelete(rawHostId: string): void {
        this.assertIsHost(rawHostId, 'Only the host can delete the room');
    }

    private assertIsHost(rawHostId: string, message: string): void {
        const hostId = UserId.create(rawHostId);

        if (!this.hostId.exact(hostId)) {
            throw new ForbiddenError(message);
        }
    }
}
