import {User} from "./User";

export type UserDTO = {
    id: string,
    name: string,
    lastActiveDate: number
}

export class UserMap {
    static toPersistence(user: User) {
        return {
            id: user.id.value,
            name: user.name,
            lastActiveDate: user.lastActiveDate.value
        }
    }
    
    static toDTO(user: User) {
        return {
            id: user.id.value,
            name: user.name,
            lastActiveDate: user.lastActiveDate.value
        }
    }
}
