import {User} from "@/domain/User/User";

export type UserPersistence = {
    id?: string,
    name: string,
    lastActiveDate: number,
}

export class UserPersistenceMap {
    static toPersistence(user: User): UserPersistence {
        return {
            id: user.id.value,
            name: user.name.value,
            lastActiveDate: user.lastActiveDate.toPersistent()
        }
    }

    static toDomain(persistence: UserPersistence): User {
        return User.create({
            id: persistence.id,
            name: persistence.name,
            lastActiveDate: persistence.lastActiveDate,
        });
    }
}
