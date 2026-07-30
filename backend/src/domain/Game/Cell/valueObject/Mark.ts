import {ValueObject} from "@/domain/User/UserId";
import {ValidationError} from "@/shared/DomainError";

export enum MarkTypes {
    X = 'X',
    O = 'O',
}

export class Mark extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(value: string): Mark {
        if(!value) {
            throw new ValidationError('Mark is required');
        }

        if(!MarkTypes[value as keyof typeof MarkTypes]) {
            throw new ValidationError('Invalid mark type');
        }

        return new Mark(value);
    }
}
