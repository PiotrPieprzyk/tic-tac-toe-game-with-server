import {ValueObject} from "@/domain/User/UserId";
import {HTTPError} from "@/shared/HTTPError";

export class UserName extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    public static create(value: string): UserName {
        if(!value) {
            throw new HTTPError(400, 'UserName must be a string');
        }

        if (value.length < 3) {
            throw new HTTPError(400, 'User name must be at least 3 characters long');
        }

        if (value.length > 20) {
            throw new HTTPError(400, 'User name must be at most 20 characters long');
        }

        return new UserName(value);
    }
}
