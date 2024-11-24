import {UserId} from "./UserId";

export type UserPersistence = {
    id?: string,
    name: string,
    lastActiveDate: number,
}

export interface UserRepositoryI {
    save(persistence: UserPersistence): Promise<void>;
    find(id: UserId): Promise<UserPersistence|undefined>;
    delete(id: UserId): Promise<void>;
}


export class UserRepository {
    static async save(persistence: UserPersistence) {
        //
    }
    static async find(id: UserId): Promise<UserPersistence|undefined> {
        //
    }
    static async delete(id: UserId) {
        //
    }
}
