export class MockGameDatabase {
    private items: any[] = [];
    
    async save(persistence: any): Promise<void> {
        this.items.push(persistence);
    }
    
    async find(id: any): Promise<any> {
        return this.items.find(item => item.id === id);
    }
    
    async delete(id: any): Promise<void> {
        this.items = this.items.filter(item => item.id !== id);
    }
}
