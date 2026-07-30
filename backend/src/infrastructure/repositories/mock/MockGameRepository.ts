import {GameRepository} from "@/domain/Game/GameRepository";
import {MockGameDatabase} from "@/infrastructure/databases/mock/MockGameDatabase";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {Game} from "@/domain/Game/Game";
import {GamePersistence, GamePersistenceMap} from "@/infrastructure/repositories/mock/GamePersistenceMap";
import {MockCellRepository} from "@/infrastructure/repositories/mock/MockCellRepository";
import {CellRepository} from "@/infrastructure/repositories/interfaces/CellRepository";
import {CellMap} from "@/application/Game/CellMap";

let repository: MockGameRepository;

export class MockGameRepository implements GameRepository {
    private database: MockGameDatabase;
    private cellRepository: CellRepository;

    private constructor() {
        this.database = new MockGameDatabase()
        this.cellRepository = MockCellRepository.create();
    }

    static create(): MockGameRepository {
        if(!repository) {
            repository = new MockGameRepository();
        }
        return repository;
    }

    async save(game: Game): Promise<void> {
        const persistence = GamePersistenceMap.toPersistence(game);
        const id = persistence.id;
        const exits = id ? await this.database.find(id) : false;
        if (exits) {
            await this.database.edit(id, persistence)
        } else {
            await this.database.save(persistence)
        }

        await Promise.all(game.cells.map(cell => this.cellRepository.save(CellMap.toPersistence(cell))));
    }

    async find (id: GameId): Promise<Game|undefined> {
        const persistence: GamePersistence | undefined = await this.database.find(id.value)
        if (!persistence) {
            return undefined;
        }

        const cells = await this.cellRepository.findByGameId(id);
        return GamePersistenceMap.toDomain(persistence, cells);
    }

    async delete (id: GameId): Promise<void> {
        await this.database.delete(id.value)
    }
}
