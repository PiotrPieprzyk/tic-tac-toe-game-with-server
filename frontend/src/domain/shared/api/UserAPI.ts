import type {CommonError, SuccessResponse} from "./APICommon.ts";

export type UserAPIResponseRaw = {
    id: string,
    name: string
}

export type UserAPIResponse = SuccessResponse<UserAPIResponseRaw>

export type UserAPIAddRequest = {
    name: string
}

export interface UserAPI {
    addUser(body: UserAPIAddRequest): Promise<UserAPIResponse | CommonError>;
}