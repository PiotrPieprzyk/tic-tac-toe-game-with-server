import {CommonError, type Options, SuccessResponse} from "@/domain/shared/api/APICommon.ts";

export class API {

    static domain = import.meta.env.VITE_API_DOMAIN ?? 'http://127.0.0.1:3000';

    static async parseJsonBody(response: Response): Promise<unknown> {
        const text = await response.text();
        return text ? JSON.parse(text) : undefined;
    }

    static async handleCommonError(response: Response): Promise<CommonError | null> {
        if (response.status < 200 || 400 <= response.status) {
            const json = await response.json();
            const message = json?.error?.message;
            const status = json?.error?.status;
            if (message && status) {
                return new CommonError(message, status);
            }
            return new CommonError('Server error. Please try again', 500);
        } else {
            return null;
        }
    }

    static async post<T>(url: string, body: unknown, options?: Options): Promise<SuccessResponse<T> | CommonError> {
        try {
            const response = await fetch(`${API.domain}${url}`, {
                method: 'POST',
                credentials: 'include',
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

            const json = await API.parseJsonBody(response);

            return new SuccessResponse(json as T);
        } catch (e) {
            console.error(e);
            return new CommonError('Server error. Please try again', 500);
        }
    }

    static async get<T>(url: string, options?: Options): Promise<SuccessResponse<T> | CommonError> {
        try {
            const query = options?.queries ? '?' + options.queries.join(',') : '';
            const response = await fetch(`${API.domain}${url}${query}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers
                }
            });

            const commonError = await API.handleCommonError(response);

            if (commonError) {
                return commonError;
            }

            const json = await API.parseJsonBody(response);

            return new SuccessResponse(json as T);
        } catch (e) {
            console.error(e);
            return new CommonError('Server error. Please try again', 500);
        }

    }

    static async put<T>(url: string, body: unknown, options?: Options): Promise<SuccessResponse<T> | CommonError> {
        try {
            const response = await fetch(`${API.domain}${url}`, {
                method: 'PUT',
                credentials: 'include',
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

            const json = await API.parseJsonBody(response);

            return new SuccessResponse(json as T);
        } catch (e) {
            console.error(e);
            return new CommonError('Server error. Please try again', 500);
        }
    }

    static async delete<T>(url: string, options?: Options): Promise<SuccessResponse<T> | CommonError> {
        try {
            const response = await fetch(`${API.domain}${url}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers
                }
            });

            const commonError = await API.handleCommonError(response);

            if (commonError) {
                return commonError;
            }

            const json = await API.parseJsonBody(response);

            return new SuccessResponse(json as T);
        } catch (e) {
            console.error(e);
            return new CommonError('Server error. Please try again', 500);
        }
    }
}
