export type CommonError = {
    message: string;
    status: number;
}
export type Options = {
    headers?: Headers;
}
type Headers = {
    [key in string]: string;
}

export class API {
    
    static domain = 'http://localhost:3000';
    
    static async handleCommonError(response: Response): Promise<CommonError | null> {
        if ( !(response.status < 200  || 400 <= response.status)) {
            return null;
        }
        
        const json = await response.json();
        const message = json?.error?.message;
        const status = json?.error?.status;
        
        if( message && status ) {
            return {
                message: message,
                status: status
            }
        }
        
        return {
            message: 'Internal Server Error',
            status: 500
        }
    }

    static async post<T>(url: string, body: unknown, options?: Options): Promise<T | CommonError> {
        const response = await fetch(`${API.domain}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            },
            body: JSON.stringify(body)
        });

        const commonError = await API.handleCommonError(response);

        if( commonError ) {
            return Promise.reject(commonError);
        }

        return await response.json()
    }
    
    static async get<T>(url: string, options?: Options): Promise<T | CommonError> {
        const response = await fetch(`${API.domain}${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        });

        const commonError = await API.handleCommonError(response);

        if( commonError ) {
            return Promise.reject(commonError);
        }

        return await response.json()
    }
    
    static async put<T>(url: string, body: unknown, options?: Options): Promise<T | CommonError> {
        const response = await fetch(`${API.domain}${url}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            },
            body: JSON.stringify(body)
        });

        const commonError = await API.handleCommonError(response);

        if( commonError ) {
            return Promise.reject(commonError);
        }

        return await response.json()
    }
    
    static async delete<T>(url: string, options?: Options): Promise<T | CommonError> {
        const response = await fetch(`${API.domain}${url}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        });

        const commonError = await API.handleCommonError(response);

        if( commonError ) {
            return Promise.reject(commonError);
        }

        return await response.json()
    }
}
