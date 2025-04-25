/**
 * Pagination.ts has been copied from the backend to the frontend.
 * 
 * This decision has been made because:
 * - The frontend should not depend on the backend
 * - This file shouldn't change much
 */
import {API, CommonError} from "@/_modules/shared/api/API";

// noinspection DuplicatedCode
export type PageSizeValue = number | null;
export type PageTokenValue = number | null;

export type PaginatedResponse<T> = {
    results: T[],
    nextPageToken: PageTokenValue,
    prevPageToken: PageTokenValue,
    totalSize: number
}

export type PaginationRequest = {
    pageToken?: PageToken,
    pageSize?: PageSize
}

export class PageToken {
    public readonly value: PageTokenValue;

    private constructor(value: PageTokenValue) {
        this.value = value;
    }

    static create(valueRaw: number | null): PageToken {
        if(!valueRaw) {
            return new PageToken(null);
        }
        
        if(isNaN(valueRaw)) {
            throw new Error('Invalid page token');
        }
        
        if(valueRaw < 0) {
            throw new Error('Invalid page token');
        }
        
        return new PageToken(valueRaw);
    }
}

export class PageSize {
    public readonly value: PageSizeValue;

    private constructor(value: PageSizeValue) {
        this.value = value;
    }

    static create(valueRaw: number | null): PageSize {
        if(!valueRaw) {
            return new PageSize(null);
        }
        
        if(isNaN(valueRaw)) {
            throw new Error('Invalid page size');
        }
        
        if(valueRaw < 0) {
            throw new Error('Invalid page size');
        }
        
        return new PageSize(valueRaw);
    }
}


export type PaginatedListProps = {
    APIUrl: string
    pageSize?: number,
}

export class PaginatedList<T> {
    private pageSize: PageSize;
    private pageToken: PageToken = PageToken.create(null);
    private totalSize: number = 0;
    private readonly APIUrl: string;

    private constructor(APIUrl: string, pageSize: PageSize) {
        this.pageSize = pageSize;
        this.APIUrl = APIUrl;
    }

    static create<T>(props: PaginatedListProps): PaginatedList<T> {
        return new PaginatedList(
            props.APIUrl,
            PageSize.create(props.pageSize ?? 25)
        );
    }
    
    public hasNextPage(): boolean {
        return !!this.pageToken.value;
    }
    
    public getTotalSize(): number {
        return this.totalSize;
    }
    
    public async getNextPage(): Promise<T[] | CommonError> {
        const response = await API.get<PaginatedResponse<T>>(this.APIUrl, {
            queries: [
                `pageSize=${this.pageSize.value}`,
                this.pageToken.value && `pageToken=${this.pageToken.value}`
            ].flatMap(i => i? [i]: [])
        })
        
        if(response instanceof CommonError) {
            return response;
        }
        
        this.setPageToken(response.value.nextPageToken);
        this.totalSize = response.value.totalSize || 0;
        
        return response.value.results;
    }

    private setPageToken(pageTokenRaw: number|null): void {
        this.pageToken = PageToken.create(pageTokenRaw);
    }
    
}


