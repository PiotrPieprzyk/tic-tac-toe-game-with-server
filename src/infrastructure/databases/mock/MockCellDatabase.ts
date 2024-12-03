import {CellPersistence} from "../../../application/Game/CellMap";

export class MockCellDatabase {
    private items: CellPersistence[] = [];

    async save(persistence: any): Promise<void> {
        this.items.push(persistence);
    }

    async find(id: any): Promise<any> {
        return this.items.find(item => item.id === id);
    }
    
    async findByGameId(gameId: any): Promise<any> {
        return this.items.filter(item => item.gameId === gameId);
    }

    async delete(id: any): Promise<void> {
        this.items = this.items.filter(item => item.id !== id);
    }
}