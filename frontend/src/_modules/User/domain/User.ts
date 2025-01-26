import {UserName} from "./UserName";

export class User {
    public readonly id: string;
    public readonly name: UserName;

    private constructor(props: {
        id: string,
        name: UserName,
    }
    ) {
        this.id = props.id;
        this.name = props.name;
    }

    public static create(props: {
        id: string,
        name: string,
    }): User {
        return new User({
            id: props.id,
            name: UserName.create(props.name),
        });
    }
}
