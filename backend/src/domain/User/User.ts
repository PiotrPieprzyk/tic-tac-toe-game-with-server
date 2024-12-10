import {Timestamp} from "../../shared/Timestamp";
import {UserId} from "./UserId";
import {UserName} from "./UserName";

export class User {
    public readonly id: UserId;
    public readonly name: UserName;
    public readonly lastActiveDate: Timestamp;

    private constructor(props: {
        id: UserId,
        name: UserName,
        lastActiveDate: Timestamp
    }
    ) {
        this.id = props.id;
        this.name = props.name;
        this.lastActiveDate = props.lastActiveDate;
    }

    public static create(props: {
        id?: string,
        name: string,
        lastActiveDate?: number
    }): User {
        return new User({
            id: UserId.create(props.id),
            name: UserName.create(props.name),
            lastActiveDate: Timestamp.create(props.lastActiveDate)
        });
    }

    public isUserActive(): boolean {
        return this.lastActiveDate.isWithinLastMilliseconds(1000 * 60 * 60 * 24);
    }
}
