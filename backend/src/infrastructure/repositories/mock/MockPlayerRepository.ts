import {CellRepositoryI} from "../interfaces/CellRepositoryI";
import {CellId} from "../../../domain/Game/Cell/valueObject/CellId";
import {MockCellDatabase} from "../../databases/mock/MockCellDatabase";
import {CellPersistence} from "../../../application/Game/CellMap";
import {GameId} from "../../../domain/Game/valueObject/GameId";
import {MockGameRepository} from "./MockGameRepository";
import {GamePersistence} from "../../../application/Game/GameMap";
import {MockGameDatabase} from "../../databases/mock/MockGameDatabase";
import {Cell} from "../../../domain/Game/Cell/Cell";
import {PlayerPersistence} from "../../../application/Game/PlayerMap";
import {PlayerRepositoryI} from "../interfaces/PlayerRepositoryI";
import {MockPlayerDatabase} from "../../databases/mock/MockPlayerDatabase";
import {PlayerId} from "../../../domain/Game/Player/PlayerId";

type Id = PlayerId;
type Persistence = PlayerPersistence;
type Repository = MockPlayerRepository;
type Database = MockPlayerDatabase;
const database = MockPlayerDatabase;
let repository: MockPlayerRepository;


export class MockPlayerRepository implements PlayerRepositoryI {
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
        const exits = id ? await this.find(GameId.create(id)) : false;
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
