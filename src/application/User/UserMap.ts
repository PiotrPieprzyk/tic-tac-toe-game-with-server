import {User} from "../../domain/User/User";

export type UserDTO = {
    id: string,
    name: string,
}

export type UserPersistence = {
    id?: string,
    name: string,
    lastActiveDate: number,
}

export class UserMap {
    static toPersistence(user: User): UserPersistence {
        return {
            id: user.id.value,
            name: user.name,
            lastActiveDate: user.lastActiveDate.toPersistent()
        }
    }
    
    static toDTO(user: User): UserDTO {
        return {
            id: user.id.value,
            name: user.name,
        }
    }
}
