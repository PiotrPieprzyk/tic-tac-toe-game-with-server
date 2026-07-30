import {UserId} from "@/domain/User/UserId";
import {ValidationError} from "@/shared/DomainError";

export class UsersIds {
    public readonly values: UserId[];

    private constructor(values: UserId[]) {
        this.values = values;
    }

    public static create(rawIds: string[]): UsersIds {
        if (!rawIds || rawIds.length === 0) {
            throw new ValidationError('Room must have at least 1 user');
        }

        if (rawIds.length > 2) {
            throw new ValidationError('Room can have at most 2 users');
        }

        return new UsersIds(rawIds.map(UserId.create));
    }

    public add(userId: UserId): UsersIds {
        if (this.values.some(u => u.exact(userId))) {
            throw new ValidationError('User is already in the room');
        }

        return UsersIds.create([...this.values.map(u => u.value), userId.value]);
    }

    public remove(userId: UserId): UsersIds {
        return new UsersIds(this.values.filter(u => !u.exact(userId)));
    }

    public has(userId: UserId): boolean {
        return this.values.some(u => u.exact(userId));
    }
}
