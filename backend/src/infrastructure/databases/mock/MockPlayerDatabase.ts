import {PlayerPersistence} from "../../../application/Game/PlayerMap";

export class MockPlayerDatabase {
    private items: PlayerPersistence[] = [];

    async save(persistence: any): Promise<void> {
        this.items.push(persistence);
    }

    async edit(id: any, persistence: any): Promise<void> {
        const index = this.items.findIndex(item => item.id === id);
        this.items[index] = persistence;
    }

    async find(id: any): Promise<any> {
        return this.items.find(item => item.id === id);
    }

    async delete(id: any): Promise<void> {
        this.items = this.items.filter(item => item.id !== id);
    }
}
