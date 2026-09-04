import {ValueObject} from "../shared/models/ValueObject.ts";
import {Guid} from "../shared/models/GUID.ts";

export class RoomId extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(value?: string): RoomId {
        return new RoomId(value ? Guid.createFromValue(value) : Guid.createNewGuid());
    }
}