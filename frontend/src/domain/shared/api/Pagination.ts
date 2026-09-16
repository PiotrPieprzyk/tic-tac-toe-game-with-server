export type PaginatedResponse<T> = {
    nextPageToken: string | null;
    prevPageToken?: string | null;
    totalSize?: number;
} & T;