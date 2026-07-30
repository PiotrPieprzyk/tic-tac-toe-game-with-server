import {User} from "@/domain/User/User";

export type UserDTO = {
    id: string,
    name: string,
}

export class UserMap {
    static toDTO(user: User): UserDTO {
        return {
            id: user.id.value,
            name: user.name.value,
        }
    }
}
