import {ValueObject} from "./UserId";

export class UserName extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    public static create(value: string): UserName {
        if (value.length < 3) {
            throw new Error('User name must be at least 3 characters long');
        }

        if (value.length > 50) {
            throw new Error('User name must be at most 50 characters long');
        }

        return new UserName(value);
    }
}