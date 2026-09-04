import {UserName} from "./UserName";

export type UserRaw = {
    id: string;
    name: string;
}

export type UserProps = {
    id: string;
    name: UserName;
}

export class User {
    public readonly id: string;
    public readonly name: UserName;

    private constructor(props: UserProps) {
        this.id = props.id;
        this.name = props.name;
    }

    public static create(props: UserRaw): User {
        return new User({
            id: props.id,
            name: UserName.create(props.name),
        });
    }
}
