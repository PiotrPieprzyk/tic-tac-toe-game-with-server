import {ValueObject} from "@/domain/User/UserId";
import {ValidationError} from "@/shared/DomainError";

export class Position extends ValueObject<number>{
    private constructor(value: number) {
        super(value);
    }

    public static create(value: number): Position {
        if(!Number.isInteger(value)) {
            throw new ValidationError('Position must be an integer');
        }

        if(value < 0) {
            throw new ValidationError('Position cannot be less than 0');
        }

        if(8 < value) {
            throw new ValidationError('Position must be less than 9');
        }

        return new Position(value);
    }
}
