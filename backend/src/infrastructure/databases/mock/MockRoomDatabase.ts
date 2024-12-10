import {PageSize, PageToken, PaginatedResponse} from "../../../shared/Pagination";

export class MockRoomDatabase {
    private items: any[] = [];

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
    
    async getAll(): Promise<any[]> {
        return this.items;
    }
    
    async getPage<T>(pageToken: PageToken, pageSize: PageSize): Promise<PaginatedResponse<T>> {
        const defaultPageSize = 100;
        const defaultPageToken = 0;
        const token = pageToken.value || defaultPageToken;
        const size = pageSize.value || defaultPageSize;
        
        const results: T[] = this.items.slice(token * size, (token + 1) * size);
        const nextPageToken = (token + 1) * size < this.items.length ? token + 1 : null;
        const prevPageToken = token > 0 ? token - 1 : null;
        
        return {
            results,
            nextPageToken,
            prevPageToken,
        }
    }
    
    async getLength(): Promise<number> {
        return this.items.length;
    }
}
