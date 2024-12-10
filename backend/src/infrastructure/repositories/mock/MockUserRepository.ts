import {UserId} from "../../../domain/User/UserId";
import {UserRepositoryI} from "../interfaces/UserRepositoryI";
import {MockUserDatabase} from "../../databases/mock/MockUserDatabase";
import {UserPersistence} from "../../../application/User/UserMap";

type Id = UserId;
type Persistence = UserPersistence;

let userRepository: MockUserRepository;

export class MockUserRepository implements UserRepositoryI {
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

    async save(persistence: Persistence): Promise<void> {
        const id = persistence.id;
        const exits = id ? await this.find(UserId.create(id)) : false;
        if (exits) {
            await this.database.edit(id, persistence)
            return
        }
        await this.database.save(persistence)
    }

    async find(id: Id): Promise<Persistence | undefined> {
        return await this.database.find(id.value)
    }

    async delete(id: Id): Promise<void> {
        await this.database.delete(id.value)
    }

    async getAll(): Promise<Persistence[]> {
        return await this.database.getAll()
    }
}
