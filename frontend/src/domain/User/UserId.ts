import {ValueObject} from "../shared/models/ValueObject.ts";
import {Guid} from "../shared/models/GUID.ts";

export class UserId extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(value?: string): UserId {
        return new UserId(value ? Guid.createFromValue(value) : Guid.createNewGuid());
    }
}