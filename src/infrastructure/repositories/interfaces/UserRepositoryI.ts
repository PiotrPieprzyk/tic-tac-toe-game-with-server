import {UserId} from "../../../domain/User/UserId";
import {UserPersistence} from "../../../application/User/UserMap";

export interface UserRepositoryI {
    save(persistence: UserPersistence): Promise<void>;
    find(id: UserId): Promise<UserPersistence|undefined>;
    delete(id: UserId): Promise<void>;
    getAll(): Promise<UserPersistence[]>;
}
