import {API, CommonError} from "@/_modules/shared/api/API";

export type UserAPIResponse = {
    id: string;
    name: string;
}

export type UserAPIAddRequest = {
    name: string
}

export class UserAPI {
    static async addUser(body: UserAPIAddRequest): Promise<UserAPIResponse| CommonError> {
        return await API.post<UserAPIResponse>('/users', body);
    }
}
