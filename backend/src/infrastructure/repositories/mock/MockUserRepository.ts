import {UserId} from "@/domain/User/UserId";
import {UserRepository} from "@/domain/User/UserRepository";
import {MockUserDatabase} from "@/infrastructure/databases/mock/MockUserDatabase";
import {User} from "@/domain/User/User";
import {UserPersistence, UserPersistenceMap} from "@/infrastructure/repositories/mock/UserPersistenceMap";

let userRepository: MockUserRepository;

export class MockUserRepository implements UserRepository {
    private database: MockUserDatabase;

    private constructor() {
        this.database = new MockUserDatabase()
    }

    static create(): MockUserRepository {
        if(!userRepository) {
            userRepository = new MockUserRepository();
        }
        return userRepository;
    }

    async save(user: User): Promise<void> {
        const persistence = UserPersistenceMap.toPersistence(user);
        const id = persistence.id;
        const exits = id ? await this.database.find(id) : false;
        if (exits) {
            await this.database.edit(id, persistence)
            return
        }
        await this.database.save(persistence)
    }

    async find(id: UserId): Promise<User | undefined> {
        const persistence: UserPersistence | undefined = await this.database.find(id.value)
        return persistence ? UserPersistenceMap.toDomain(persistence) : undefined;
    }

    async findByName(name: string): Promise<User | undefined> {
        const persistence: UserPersistence | undefined = await this.database.findBy('name', name)
        return persistence ? UserPersistenceMap.toDomain(persistence) : undefined;
    }

    async delete(id: UserId): Promise<void> {
        await this.database.delete(id.value)
    }

    async getAll(): Promise<User[]> {
        const persistences: UserPersistence[] = await this.database.getAll()
        return persistences.map(UserPersistenceMap.toDomain)
    }
}
