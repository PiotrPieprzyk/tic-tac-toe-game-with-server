import {GameRepositoryI} from "../interfaces/GameRepositoryI";
import {MockGameDatabase} from "../../databases/mock/MockGameDatabase";
import {GamePersistence} from "../../../application/Game/GameMap";
import {GameId} from "../../../domain/Game/valueObject/GameId";
import {MockUserRepository} from "./MockUserRepository";
import {MockUserDatabase} from "../../databases/mock/MockUserDatabase";
import {UserId} from "../../../domain/User/UserId";

type Id = GameId; 
type Persistence = GamePersistence;
type Repository = MockGameRepository;
type Database = MockGameDatabase;

const database = MockGameDatabase;
let repository: MockGameRepository;

export class MockGameRepository implements GameRepositoryI {
    private database: Database;

    private constructor() {
        this.database = new database()
    }

    static create(): Repository {
        if(!repository) {
            repository = new MockGameRepository();
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
