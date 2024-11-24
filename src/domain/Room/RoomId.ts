import {Guid} from "../../shared/GUID";
import {ValueObject} from "../User/UserId";

export class RoomId extends ValueObject<string>{
    private constructor(value: string) {
        super(value);
    }

    public static create(value?: string): RoomId {
        return new RoomId(value ? Guid.createFromValue(value) : Guid.createNewGuid());
    }
}
