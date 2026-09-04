export class CommonError {
    message: string;
    status: number;

    constructor(message: string, status: number) {
        this.message = message;
        this.status = status;
    }
}

export class SuccessResponse<T> {
    value: T;

    constructor(value: T) {
        this.value = value;
    }
}

export type Options = {
    headers?: Headers;
    queries?: Queries;
}
type Headers = {
    [key in string]: string;
}
type Queries = string[];