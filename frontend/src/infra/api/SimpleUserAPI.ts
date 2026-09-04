import {API} from "./API.ts";
import type {UserAPI, UserAPIAddRequest, UserAPIResponse, UserAPIResponseRaw} from "../../domain/shared/api/UserAPI.ts";
import type {CommonError} from "../../domain/shared/api/APICommon.ts";

export class SimpleUserAPI implements UserAPI {
    static path = '/users';

    async addUser(body: UserAPIAddRequest): Promise<UserAPIResponse | CommonError> {
        return await API.post<UserAPIResponseRaw>(`${SimpleUserAPI.path}`, body);
    }

}