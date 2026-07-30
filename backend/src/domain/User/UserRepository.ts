import {UserId} from "@/domain/User/UserId";
import {User} from "@/domain/User/User";

export interface UserRepository {
    save(user: User): Promise<void>;
    find(id: UserId): Promise<User | undefined>;
    findByName(name: string): Promise<User | undefined>;
    delete(id: UserId): Promise<void>;
    getAll(): Promise<User[]>;
}
