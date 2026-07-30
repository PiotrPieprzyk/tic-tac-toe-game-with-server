import {PlayerRepository} from "@/infrastructure/repositories/interfaces/PlayerRepository";
import {PlayerPersistence} from "@/application/Game/PlayerMap";
import {MockPlayerDatabase} from "@/infrastructure/databases/mock/MockPlayerDatabase";
import {PlayerId} from "@/domain/Game/Player/PlayerId";

type Id = PlayerId;
type Persistence = PlayerPersistence;
type Repository = MockPlayerRepository;
type Database = MockPlayerDatabase;
const database = MockPlayerDatabase;
let repository: MockPlayerRepository;


export class MockPlayerRepository implements PlayerRepository {
    private database: Database;

    private constructor() {
        this.database = new database()
    }

    static create(): Repository {
        if(!repository) {
            repository = new MockPlayerRepository();
        }
        return repository;
    }

    async save(persistence: Persistence): Promise<void> {
        const id = persistence.id;
        const exits = id ? await this.find(PlayerId.create(id)) : false;
        if (exits) {
            await this.database.edit(id, persistence)
            return
        }
        await this.database.save(persistence)
    }

    async find (id: Id): Promise<Persistence|undefined> {
        return await this.database.find(id.value)
    }

    async delete (id: Id): Promise<void> {
        await this.database.delete(id.value)
    }
}
