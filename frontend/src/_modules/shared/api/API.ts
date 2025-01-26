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

export class API {

    static domain = 'http://localhost:3000';

    static async handleCommonError(response: Response): Promise<CommonError | null> {
        if (!(response.status < 200 || 400 <= response.status)) {
            return null;
        }

        const json = await response.json();
        const message = json?.error?.message;
        const status = json?.error?.status;

        if (message && status) {
            return new CommonError(message, status);
        }

        return new CommonError('Server error. Please try again', 500);
    }

    static async post<T>(url: string, body: unknown, options?: Options): Promise<SuccessResponse<T> | CommonError> {
        try {
            const response = await fetch(`${API.domain}${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers
                },
                body: JSON.stringify(body)
            });

            const commonError = await API.handleCommonError(response);

            if (commonError) {
                return commonError;
            }

            const json = await response.json();

            return new SuccessResponse(json);
        } catch (e) {
            console.error(e);
            return {
                message: 'Something went wrong. Please try again later',
                status: 500
            }
        }
    }

    static async get<T>(url: string, options?: Options): Promise<SuccessResponse<T> | CommonError> {
        try {
            const query = options?.queries ? '?' + options.queries.join(',') : '';
            const response = await fetch(`${API.domain}${url}${query}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers
                }
            });

            const commonError = await API.handleCommonError(response);

            if (commonError) {
                return commonError;
            }

            const json = await response.json();

            return new SuccessResponse(json);
        } catch (e) {
            console.error(e);
            return {
                message: 'Something went wrong. Please try again later',
                status: 500
            }
        }

    }

    static async put<T>(url: string, body: unknown, options?: Options): Promise<SuccessResponse<T> | CommonError> {
        try {
            const response = await fetch(`${API.domain}${url}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers
                },
                body: JSON.stringify(body)
            });

            const commonError = await API.handleCommonError(response);

            if (commonError) {
                return Promise.reject(commonError);
            }

            const json = await response.json();

            return new SuccessResponse(json);
        } catch (e) {
            console.error(e);
            return {
                message: 'Something went wrong. Please try again later',
                status: 500
            }
        }
    }

    static async delete<T>(url: string, options?: Options): Promise<SuccessResponse<T> | CommonError> {
        try {
            const response = await fetch(`${API.domain}${url}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers
                }
            });

            const commonError = await API.handleCommonError(response);

            if (commonError) {
                return Promise.reject(commonError);
            }

            const json = await response.json();

            return new SuccessResponse(json);
        } catch (e) {
            console.error(e);
            return {
                message: 'Something went wrong. Please try again later',
                status: 500
            }
        }
    }
}
