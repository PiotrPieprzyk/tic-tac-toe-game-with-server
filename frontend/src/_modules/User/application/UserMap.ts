import {User} from "@/_modules/User/domain/User";

export type UserPersistence = {
    id?: string,
    name: string,
}

export class UserMap {
    static toPersistence(user: User): UserPersistence {
        return {
            id: user.id,
            name: user.name.value,
        }
    }
}
