import {CellRepository} from "@/infrastructure/repositories/interfaces/CellRepository";
import {CellId} from "@/domain/Game/Cell/valueObject/CellId";
import {MockCellDatabase} from "@/infrastructure/databases/mock/MockCellDatabase";
import {CellPersistence} from "@/application/Game/CellMap";
import {GameId} from "@/domain/Game/valueObject/GameId";

type Id = CellId;
type Persistence = CellPersistence;
type Repository = MockCellRepository;
type Database = MockCellDatabase;
const database = MockCellDatabase;
let repository: MockCellRepository;


export class MockCellRepository implements CellRepository {
    private database: Database;

    private constructor() {
        this.database = new database()
    }

    static create(): Repository {
        if(!repository) {
            repository = new MockCellRepository();
        }
        return repository;
    }

    async save(persistence: Persistence): Promise<void> {
        const id = persistence.id;
        const exits = id ? await this.find(CellId.create(id)) : false;
        if (exits) {
            await this.database.edit(id, persistence)
            return
        }
        await this.database.save(persistence)
    }

    async find (id: Id): Promise<Persistence|undefined> {
        return await this.database.find(id.value)
    }

    async findByGameId (gameId: GameId): Promise<Persistence[]|[]> {
        return await this.database.findByGameId(gameId.value)
    }

    async delete (id: Id): Promise<void> {
        await this.database.delete(id.value)
    }
}
