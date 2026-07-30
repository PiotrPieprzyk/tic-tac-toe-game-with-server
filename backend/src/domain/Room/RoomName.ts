import {ValueObject} from "@/domain/User/UserId";
import {ValidationError} from "@/shared/DomainError";

export class RoomName extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(value: string): RoomName {
        if(!value) {
            throw new ValidationError('Room name is required');
        }

        if (value.length < 3) {
            throw new ValidationError('Room name must be at least 3 characters long');
        }

        if (value.length > 50) {
            throw new ValidationError('Room name must be at most 50 characters long');
        }

        return new RoomName(value);
    }
}
