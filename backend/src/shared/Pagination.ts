export type PageSizeValue = number | null;
export type PageTokenValue = number | null;

export type PaginatedResponse<T> = {
    results: T[],
    nextPageToken: PageTokenValue,
    prevPageToken: PageTokenValue
}

export class PageToken {
    public readonly value: PageTokenValue;

    private constructor(value: PageTokenValue) {
        this.value = value;
    }

    static create(value: string): PageToken {
        if(!value) {
            return new PageToken(null);
        }
        
        if(value === 'null') {
            return new PageToken(null);
        }
        
        const parsedValue = Number(value);
        
        if(isNaN(parsedValue)) {
            throw new Error('Invalid page token');
        }
        
        if(parsedValue < 0) {
            throw new Error('Invalid page token');
        }
        
        return new PageToken(parsedValue);
    }
}

export class PageSize {
    public readonly value: PageSizeValue;

    private constructor(value: PageSizeValue) {
        this.value = value;
    }

    static create(value: string): PageSize {
        if(!value) {
            return new PageSize(null);
        }
        
        if(value === 'null') {
            return new PageSize(null);
        }
        
        const parsedValue = Number(value);
        
        if(isNaN(parsedValue)) {
            throw new Error('Invalid page size');
        }
        
        if(parsedValue < 0) {
            throw new Error('Invalid page size');
        }
        
        return new PageSize(parsedValue);
    }
}
