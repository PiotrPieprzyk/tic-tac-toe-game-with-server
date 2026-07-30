import {ValueObject} from "@/domain/User/UserId";
import {ValidationError} from "@/shared/DomainError";

export class UserName extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    public static create(value: string): UserName {
        if(!value) {
            throw new ValidationError('UserName must be a string');
        }

        if (value.length < 3) {
            throw new ValidationError('User name must be at least 3 characters long');
        }

        if (value.length > 20) {
            throw new ValidationError('User name must be at most 20 characters long');
        }

        return new UserName(value);
    }
}
